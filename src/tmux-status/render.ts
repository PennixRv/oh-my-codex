import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { parse as parseToml } from '@iarna/toml';
import {
  readTmuxStatusBarConfig,
  resolveUserLevelTmuxStatusCacheDir,
  type TmuxStatusBarConfig,
  type TmuxStatusTheme,
} from './config.js';
import { resolveTmuxBinaryForPlatform } from '../utils/platform-command.js';

const TMUX_FIELD_SEPARATOR = '\x1f';
const CONTROL_CHARS_RE = /[\u0000-\u001f\u007f-\u009f]/g;

interface TmuxThemePalette {
  model: string;
  metric: string;
  value: string;
  secondary: string;
  separator: string;
  git: string;
  path: string;
  time: string;
}

interface ParsedCodexConfig {
  model?: string;
  modelProvider?: string;
  modelReasoningEffort?: string;
  modelContextWindow?: number;
  providerBaseUrl?: string;
}

interface PaneContext {
  paneId: string;
  sessionName: string;
  currentPath: string;
  currentCommand: string;
  startCommand: string;
}

interface RolloutSnapshot {
  model?: string;
  effort?: string;
  ctxUsed?: number;
  ctxMax?: number;
  inputTokens?: number;
  cachedInputTokens?: number;
}

interface SessionStateSnapshot {
  sessionId?: string;
  nativeSessionId?: string;
}

interface TeamLeaderSupplement {
  kind: 'leader';
  teamName: string;
  workerCount: number;
  activeWorkerCount: number;
}

interface TeamWorkerSupplement {
  kind: 'worker';
  workerName: string;
  workerRole?: string;
  workerState?: string;
  taskSubject?: string;
}

type TeamSupplement = TeamLeaderSupplement | TeamWorkerSupplement;

interface CchSessionSummary {
  sessionId: string;
  model?: string;
  costUsd?: number;
  inputTokens?: number;
  cacheReadInputTokens?: number;
}

export interface TmuxStatusRenderSnapshot {
  visible: boolean;
  model?: string;
  effort?: string;
  costUsd?: number;
  ctxUsed?: number;
  ctxMax?: number;
  cacheRate?: number;
  teamSupplement?: TeamSupplement;
  sessionName: string;
  panePath: string;
  gitBranch?: string;
  gitDirty?: boolean;
  timeLabel: string;
}

const STATUS_LABELS = {
  model: 'Model',
  effort: 'Effort',
  cost: 'Cost',
  context: 'Ctx',
  cache: 'Cache',
  team: 'Team',
  worker: 'Wrk',
  session: 'Sess',
  path: 'Path',
  git: 'Git',
} as const;

const BASE_THEME_PALETTE: Omit<TmuxThemePalette, 'model'> = {
  metric: 'colour245',
  value: 'colour253',
  secondary: 'colour109',
  separator: 'colour240',
  git: 'colour150',
  path: 'colour251',
  time: 'colour247',
};

const THEMES: Record<TmuxStatusTheme, TmuxThemePalette> = {
  nord: {
    model: 'colour111',
    ...BASE_THEME_PALETTE,
  },
  dracula: {
    model: 'colour147',
    ...BASE_THEME_PALETTE,
  },
  catppuccin: {
    model: 'colour153',
    ...BASE_THEME_PALETTE,
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeTmuxText(value: string): string {
  return value
    .replace(CONTROL_CHARS_RE, '')
    .replace(/#\[/g, '[')
    .trim();
}

function tmuxStyle(color: string, value: string): string {
  return `#[fg=${color}]${value}#[default]`;
}

function tmuxSeparator(theme: TmuxThemePalette): string {
  return tmuxStyle(theme.separator, '|');
}

function renderLabeledSegment(
  theme: TmuxThemePalette,
  key: string,
  value: string,
  valueColor: string = theme.value,
): string {
  return `${tmuxStyle(theme.metric, key)} ${tmuxStyle(valueColor, value)}`;
}

function sanitizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function normalizeNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return '?';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return `${Math.round(value)}`;
}

function formatPercent(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return '?';
  return `${Math.max(0, Math.min(100, value)).toFixed(1).replace(/\.0$/, '')}%`;
}

function formatCostUsd(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return '?';
  const digits = value >= 1 ? 2 : 4;
  return value.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '');
}

function formatContext(used: number | undefined, max: number | undefined): string {
  if (
    used === undefined
    || !Number.isFinite(used)
    || max === undefined
    || !Number.isFinite(max)
    || max <= 0
  ) {
    return '?';
  }
  const pct = formatPercent((used / max) * 100);
  return `${formatCompactNumber(used)}/${formatCompactNumber(max)} ${pct}`;
}

function trimSupplement(value: string, limit: number = 56): string {
  if (value.length <= limit) return value;
  if (limit <= 1) return '…';
  return `${value.slice(0, limit - 1).trimEnd()}…`;
}

function renderTeamSupplement(
  supplement: TeamSupplement | undefined,
  theme: TmuxThemePalette,
): string | null {
  if (!supplement) return null;
  if (supplement.kind === 'leader') {
    const summary = trimSupplement(
      `${supplement.teamName} ${supplement.workerCount}/${supplement.activeWorkerCount}`,
    );
    return renderLabeledSegment(
      theme,
      STATUS_LABELS.team,
      summary,
      theme.secondary,
    );
  }

  const primaryDetails = [
    supplement.workerRole,
    supplement.workerState,
  ].filter((value): value is string => Boolean(value));

  if (primaryDetails.length === 0 && supplement.workerName) {
    primaryDetails.push(supplement.workerName);
  }

  const taskSubject = supplement.taskSubject
    ? trimSupplement(supplement.taskSubject, 28)
    : undefined;
  const detail = [primaryDetails.join('/'), taskSubject]
    .filter((value): value is string => Boolean(value))
    .join(' ');

  if (detail === '') return null;
  return renderLabeledSegment(
    theme,
    STATUS_LABELS.worker,
    trimSupplement(detail),
    theme.secondary,
  );
}

export function renderTmuxStatusLeft(
  snapshot: TmuxStatusRenderSnapshot,
  themeName: TmuxStatusTheme,
): string {
  if (!snapshot.visible) return '';
  const theme = THEMES[themeName];
  const parts = [
    renderLabeledSegment(
      theme,
      STATUS_LABELS.model,
      sanitizeTmuxText(snapshot.model ?? '?'),
      theme.model,
    ),
    renderLabeledSegment(
      theme,
      STATUS_LABELS.effort,
      sanitizeTmuxText(snapshot.effort ?? '?'),
    ),
    renderLabeledSegment(
      theme,
      STATUS_LABELS.cost,
      formatCostUsd(snapshot.costUsd),
    ),
    renderLabeledSegment(
      theme,
      STATUS_LABELS.context,
      formatContext(snapshot.ctxUsed, snapshot.ctxMax),
    ),
    renderLabeledSegment(
      theme,
      STATUS_LABELS.cache,
      formatPercent(snapshot.cacheRate),
    ),
  ];
  const teamSupplement = renderTeamSupplement(snapshot.teamSupplement, theme);
  if (teamSupplement) {
    parts.push(teamSupplement);
  }
  return parts.join(` ${tmuxSeparator(theme)} `);
}

function shortenHomePath(path: string): string {
  const homePath = homedir();
  return path.startsWith(homePath) ? `~${path.slice(homePath.length)}` : path;
}

export function renderTmuxStatusRight(
  snapshot: TmuxStatusRenderSnapshot,
  themeName: TmuxStatusTheme,
): string {
  const theme = THEMES[themeName];
  const pathLabel = sanitizeTmuxText(shortenHomePath(snapshot.panePath || '.'));
  const sessionLabel = sanitizeTmuxText(snapshot.sessionName || '?');
  const parts = [
    renderLabeledSegment(theme, STATUS_LABELS.session, sessionLabel),
    renderLabeledSegment(
      theme,
      STATUS_LABELS.path,
      pathLabel,
      theme.path,
    ),
  ];

  if (snapshot.gitBranch) {
    const dirtySuffix = snapshot.gitDirty ? '*' : '';
    parts.push(
      renderLabeledSegment(
        theme,
        STATUS_LABELS.git,
        sanitizeTmuxText(`${snapshot.gitBranch}${dirtySuffix}`),
        theme.git,
      ),
    );
  }
  parts.push(tmuxStyle(theme.time, snapshot.timeLabel));
  return parts.join(` ${tmuxSeparator(theme)} `);
}

function readCacheKeyPath(cacheDir: string, key: string): string {
  const safeKey = Buffer.from(key).toString('base64url');
  return join(cacheDir, `${safeKey}.json`);
}

async function readFreshJsonCache<T>(
  cacheDir: string,
  key: string,
  ttlSeconds: number,
): Promise<T | null> {
  const cachePath = readCacheKeyPath(cacheDir, key);
  if (!existsSync(cachePath)) return null;
  try {
    const parsed = JSON.parse(await readFile(cachePath, 'utf-8')) as {
      expiresAt?: unknown;
      value?: unknown;
    };
    const expiresAt = normalizeNumber(parsed.expiresAt);
    if (!expiresAt || expiresAt < Date.now()) return null;
    return parsed.value as T;
  } catch {
    return null;
  }
}

async function writeJsonCache(
  cacheDir: string,
  key: string,
  ttlSeconds: number,
  value: unknown,
): Promise<void> {
  const cachePath = readCacheKeyPath(cacheDir, key);
  await mkdir(cacheDir, { recursive: true });
  await writeFile(
    cachePath,
    JSON.stringify(
      {
        expiresAt: Date.now() + (ttlSeconds * 1000),
        value,
      },
      null,
      2,
    ),
  );
}

function parseShellEnvAssignment(command: string, key: string): string | undefined {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = command.match(
    new RegExp(
      `(?:^|\\s)(?:'${escapedKey}=([^']*)'|${escapedKey}=(?:'((?:'\\\\''|[^'])*)'|([^\\s]+)))`,
    ),
  );
  const fallbackMatch = match
    ? null
    : command.match(new RegExp(`(?:^|[\\s'])${escapedKey}=([^'\\s]+)`));
  const raw = match?.[1] ?? match?.[2] ?? match?.[3] ?? fallbackMatch?.[1];
  if (typeof raw !== 'string') return undefined;
  const value = raw.replace(/'\\''/g, '\'').trim();
  return value === '' ? undefined : value;
}

function runTmux(args: string[]): string | null {
  const tmuxBinary = resolveTmuxBinaryForPlatform();
  if (!tmuxBinary) return null;
  const result = spawnSync(tmuxBinary, args, { encoding: 'utf-8' });
  if (result.status !== 0) return null;
  return result.stdout.trim();
}

async function readPaneContext(paneId: string): Promise<PaneContext | null> {
  const output = runTmux([
    'display-message',
    '-p',
    '-t',
    paneId,
    `#{pane_id}${TMUX_FIELD_SEPARATOR}#{session_name}${TMUX_FIELD_SEPARATOR}#{pane_current_path}${TMUX_FIELD_SEPARATOR}#{pane_current_command}${TMUX_FIELD_SEPARATOR}#{pane_start_command}`,
  ]);
  if (!output) return null;
  const [resolvedPaneId, sessionName, currentPath, currentCommand, startCommand] = output
    .split(TMUX_FIELD_SEPARATOR)
    .map((value) => value ?? '');
  if (!resolvedPaneId) return null;
  return {
    paneId: resolvedPaneId,
    sessionName,
    currentPath,
    currentCommand,
    startCommand,
  };
}

async function findNearestAncestorWith(
  startPath: string,
  relativeSegments: string[],
): Promise<string | null> {
  if (!startPath) return null;
  let current = resolve(startPath);
  while (true) {
    const candidate = join(current, ...relativeSegments);
    if (existsSync(candidate)) return current;
    const parent = dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

async function resolveCodexHomeForPane(pane: PaneContext): Promise<string> {
  const command = `${pane.startCommand} ${pane.currentCommand}`;
  const explicit = sanitizeOptionalString(parseShellEnvAssignment(command, 'CODEX_HOME'));
  if (explicit) return resolve(pane.currentPath || process.cwd(), explicit);

  const projectRoot = await findNearestAncestorWith(
    pane.currentPath,
    ['.codex', 'config.toml'],
  );
  if (projectRoot) return join(projectRoot, '.codex');
  return resolve(homedir(), '.codex');
}

async function resolveStateRootForPane(
  pane: PaneContext,
): Promise<string | null> {
  const command = `${pane.startCommand} ${pane.currentCommand}`;
  const explicitTeamStateRoot = sanitizeOptionalString(
    parseShellEnvAssignment(command, 'OMX_TEAM_STATE_ROOT'),
  );
  if (explicitTeamStateRoot) {
    return resolve(pane.currentPath || process.cwd(), explicitTeamStateRoot);
  }

  const explicitRoot = sanitizeOptionalString(
    parseShellEnvAssignment(command, 'OMX_ROOT')
      ?? parseShellEnvAssignment(command, 'OMX_STATE_ROOT'),
  );
  if (explicitRoot) {
    return join(resolve(pane.currentPath || process.cwd(), explicitRoot), '.omx', 'state');
  }

  const projectRoot = await findNearestAncestorWith(
    pane.currentPath,
    ['.omx', 'state', 'session.json'],
  );
  return projectRoot ? join(projectRoot, '.omx', 'state') : null;
}

async function readJsonFile<T>(path: string): Promise<T | null> {
  try {
    if (!existsSync(path)) return null;
    return JSON.parse(await readFile(path, 'utf-8')) as T;
  } catch {
    return null;
  }
}

async function readSessionStateSnapshot(
  stateRoot: string | null,
): Promise<SessionStateSnapshot> {
  if (!stateRoot) return {};
  const parsed = await readJsonFile<Record<string, unknown>>(join(stateRoot, 'session.json'));
  if (!parsed) return {};
  return {
    sessionId: sanitizeOptionalString(parsed.session_id),
    nativeSessionId:
      sanitizeOptionalString(parsed.native_session_id)
      ?? sanitizeOptionalString(parsed.codex_session_id),
  };
}

async function readCodexConfig(
  codexHomeDir: string,
): Promise<ParsedCodexConfig> {
  const configPath = join(codexHomeDir, 'config.toml');
  if (!existsSync(configPath)) return {};
  try {
    const parsed = parseToml(await readFile(configPath, 'utf-8')) as Record<string, unknown>;
    const modelProvider = sanitizeOptionalString(parsed.model_provider);
    const providerBaseUrl = (
      isRecord(parsed.model_providers)
      && modelProvider
      && isRecord(parsed.model_providers[modelProvider])
    )
      ? sanitizeOptionalString(
          (parsed.model_providers[modelProvider] as Record<string, unknown>).base_url,
        )
      : undefined;
    return {
      model: sanitizeOptionalString(parsed.model),
      modelProvider,
      modelReasoningEffort: sanitizeOptionalString(parsed.model_reasoning_effort),
      modelContextWindow: normalizeNumber(parsed.model_context_window),
      providerBaseUrl,
    };
  } catch {
    return {};
  }
}

async function findRolloutPathForSession(
  codexHomeDir: string,
  sessionId: string | undefined,
  cacheDir: string,
): Promise<string | null> {
  if (!sessionId) return null;
  const cacheKey = `rollout-path:${codexHomeDir}:${sessionId}`;
  const cached = await readFreshJsonCache<string>(cacheDir, cacheKey, 30);
  if (cached && existsSync(cached)) return cached;

  const sessionsRoot = join(codexHomeDir, 'sessions');
  if (!existsSync(sessionsRoot)) return null;
  const targetFileName = `rollout-${sessionId}.jsonl`;
  const pending = [sessionsRoot];

  while (pending.length > 0) {
    const current = pending.pop();
    assert(current);
    const dirEntries = await readdir(current, { withFileTypes: true }).catch(() => []);
    for (const entry of dirEntries) {
      const entryPath = join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(entryPath);
        continue;
      }
      if (entry.isFile() && entry.name === targetFileName) {
        await writeJsonCache(cacheDir, cacheKey, 30, entryPath);
        return entryPath;
      }
    }
  }
  return null;
}

function readLastEventPayload(
  lines: string[],
  typeName: string,
): Record<string, unknown> | null {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index]?.trim();
    if (!line) continue;
    try {
      const parsed = JSON.parse(line) as Record<string, unknown>;
      if (parsed.type === typeName && isRecord(parsed.payload)) {
        return parsed.payload;
      }
    } catch {
      continue;
    }
  }
  return null;
}

async function readRolloutSnapshot(
  codexHomeDir: string,
  sessionId: string | undefined,
  cacheDir: string,
): Promise<RolloutSnapshot> {
  const rolloutPath = await findRolloutPathForSession(codexHomeDir, sessionId, cacheDir);
  if (!rolloutPath) return {};
  try {
    const raw = await readFile(rolloutPath, 'utf-8');
    const lines = raw.split(/\r?\n/);
    const turnContext = readLastEventPayload(lines, 'turn_context');
    const tokenCount = readLastEventPayload(lines, 'token_count');
    const tokenInfo = isRecord(tokenCount?.info) ? tokenCount?.info as Record<string, unknown> : {};
    const totalUsage = isRecord(tokenInfo.total_token_usage)
      ? tokenInfo.total_token_usage as Record<string, unknown>
      : {};
    const lastUsage = isRecord(tokenInfo.last_token_usage)
      ? tokenInfo.last_token_usage as Record<string, unknown>
      : {};
    return {
      model:
        sanitizeOptionalString(turnContext?.model)
        ?? sanitizeOptionalString(tokenInfo.model),
      effort:
        sanitizeOptionalString(turnContext?.effort)
        ?? sanitizeOptionalString(turnContext?.reasoning_effort),
      ctxUsed:
        normalizeNumber(totalUsage.input_tokens)
        ?? normalizeNumber(lastUsage.input_tokens),
      ctxMax: normalizeNumber(tokenInfo.model_context_window),
      inputTokens:
        normalizeNumber(totalUsage.input_tokens)
        ?? normalizeNumber(lastUsage.input_tokens),
      cachedInputTokens:
        normalizeNumber(totalUsage.cached_input_tokens)
        ?? normalizeNumber(lastUsage.cached_input_tokens),
    };
  } catch {
    return {};
  }
}

function maybeReadAuthTokenFromObject(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined;
  for (const key of ['access_token', 'accessToken', 'id_token', 'idToken']) {
    const token = sanitizeOptionalString(value[key]);
    if (token) return token;
  }
  for (const nestedValue of Object.values(value)) {
    const token = maybeReadAuthTokenFromObject(nestedValue);
    if (token) return token;
  }
  return undefined;
}

async function readCodexAuthToken(
  codexHomeDir: string,
): Promise<string | undefined> {
  const authPath = join(codexHomeDir, 'auth.json');
  const parsed = await readJsonFile<unknown>(authPath);
  return maybeReadAuthTokenFromObject(parsed);
}

async function fetchJsonWithBearer(
  url: string,
  token: string,
): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`http_${response.status}`);
  }
  return await response.json();
}

function extractSessionItems(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    return value.filter(isRecord);
  }
  if (isRecord(value) && Array.isArray(value.items)) {
    return value.items.filter(isRecord);
  }
  return [];
}

async function readExactCchSession(
  codexHomeDir: string,
  config: TmuxStatusBarConfig,
  codexConfig: ParsedCodexConfig,
  sessionId: string | undefined,
  cacheDir: string,
): Promise<CchSessionSummary | null> {
  if (!sessionId) return null;

  const baseUrl = sanitizeOptionalString(config.cch.baseUrl)
    ?? sanitizeOptionalString(codexConfig.providerBaseUrl);
  if (!baseUrl) return null;

  const adminToken = sanitizeOptionalString(
    process.env[config.cch.adminTokenEnvVar],
  );
  const authToken = await readCodexAuthToken(codexHomeDir);
  const bearerToken = adminToken ?? authToken;
  if (!bearerToken) return null;

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
  const cacheKey = `cch-sessions:${normalizedBaseUrl}:${adminToken ? 'admin' : 'auth'}`;
  const cached = await readFreshJsonCache<Array<Record<string, unknown>>>(
    cacheDir,
    cacheKey,
    config.cch.sessionsCacheSeconds,
  );
  const items = cached ?? await (async () => {
    try {
      const payload = await fetchJsonWithBearer(
        `${normalizedBaseUrl}/api/v1/sessions`,
        bearerToken,
      );
      const extracted = extractSessionItems(payload);
      await writeJsonCache(
        cacheDir,
        cacheKey,
        config.cch.sessionsCacheSeconds,
        extracted,
      );
      return extracted;
    } catch {
      return [];
    }
  })();

  const match = items.find((item) => sanitizeOptionalString(item.sessionId) === sessionId);
  if (!match) return null;
  return {
    sessionId,
    model: sanitizeOptionalString(match.model),
    costUsd: normalizeNumber(match.costUsd),
    inputTokens: normalizeNumber(match.inputTokens),
    cacheReadInputTokens: normalizeNumber(match.cacheReadInputTokens),
  };
}

function computeCacheRate(
  inputTokens: number | undefined,
  cachedInputTokens: number | undefined,
): number | undefined {
  if (
    inputTokens === undefined
    || cachedInputTokens === undefined
    || !Number.isFinite(inputTokens)
    || !Number.isFinite(cachedInputTokens)
  ) {
    return undefined;
  }
  const total = inputTokens + cachedInputTokens;
  if (total <= 0) return undefined;
  return (cachedInputTokens / total) * 100;
}

async function readTeamSupplement(
  stateRoot: string | null,
  paneId: string,
): Promise<TeamSupplement | undefined> {
  if (!stateRoot) return undefined;
  const teamsRoot = join(stateRoot, 'team');
  if (!existsSync(teamsRoot)) return undefined;
  const teamEntries = await readdir(teamsRoot, { withFileTypes: true }).catch(() => []);

  for (const teamEntry of teamEntries) {
    if (!teamEntry.isDirectory()) continue;
    const teamDir = join(teamsRoot, teamEntry.name);
    const manifest = await readJsonFile<Record<string, unknown>>(
      join(teamDir, 'manifest.v2.json'),
    );
    const config = manifest ?? await readJsonFile<Record<string, unknown>>(
      join(teamDir, 'config.json'),
    );
    if (!config) continue;

    const workers = Array.isArray(config.workers)
      ? config.workers.filter(isRecord)
      : [];
    const leaderPaneId = sanitizeOptionalString(config.leader_pane_id);
    if (leaderPaneId === paneId) {
      let activeWorkerCount = 0;
      for (const worker of workers) {
        const workerName = sanitizeOptionalString(worker.name);
        if (!workerName) continue;
        const status = await readJsonFile<Record<string, unknown>>(
          join(teamDir, 'workers', workerName, 'status.json'),
        );
        const state = sanitizeOptionalString(status?.state);
        if (state && state !== 'idle' && state !== 'done' && state !== 'unknown') {
          activeWorkerCount += 1;
        }
      }
      return {
        kind: 'leader',
        teamName:
          sanitizeOptionalString(config.display_name)
          ?? sanitizeOptionalString(config.name)
          ?? teamEntry.name,
        workerCount: workers.length,
        activeWorkerCount,
      };
    }

    for (const worker of workers) {
      const workerPaneId = sanitizeOptionalString(worker.pane_id);
      if (workerPaneId !== paneId) continue;
      const workerName = sanitizeOptionalString(worker.name) ?? 'worker';
      const workerRole = sanitizeOptionalString(worker.role);
      const status = await readJsonFile<Record<string, unknown>>(
        join(teamDir, 'workers', workerName, 'status.json'),
      );
      const taskId =
        sanitizeOptionalString(status?.current_task_id)
        ?? (Array.isArray(worker.assigned_tasks)
          ? sanitizeOptionalString(worker.assigned_tasks[0])
          : undefined);
      const task = taskId
        ? await readJsonFile<Record<string, unknown>>(
            join(teamDir, 'tasks', `task-${taskId}.json`),
          )
        : null;
      return {
        kind: 'worker',
        workerName,
        workerRole,
        workerState: sanitizeOptionalString(status?.state),
        taskSubject:
          sanitizeOptionalString(task?.subject)
          ?? sanitizeOptionalString(task?.description),
      };
    }
  }
  return undefined;
}

function isCodexLikePane(
  pane: PaneContext,
  session: SessionStateSnapshot,
  stateRoot: string | null,
): boolean {
  const command = `${pane.startCommand} ${pane.currentCommand}`.toLowerCase();
  if (command.includes('codex')) return true;
  if (session.sessionId || session.nativeSessionId) return true;
  return Boolean(stateRoot);
}

function readGitBranch(path: string): { branch?: string; dirty?: boolean } {
  if (!path) return {};
  const branch = spawnSync(
    'git',
    ['-C', path, 'branch', '--show-current'],
    { encoding: 'utf-8' },
  );
  if (branch.status !== 0) return {};

  const dirty = spawnSync(
    'git',
    ['-C', path, 'status', '--porcelain', '--untracked-files=no'],
    { encoding: 'utf-8' },
  );
  return {
    branch: sanitizeOptionalString(branch.stdout),
    dirty: dirty.status === 0 && sanitizeOptionalString(dirty.stdout) !== undefined,
  };
}

async function buildRenderSnapshot(
  paneId: string,
): Promise<{ snapshot: TmuxStatusRenderSnapshot; config: TmuxStatusBarConfig }> {
  const pane = await readPaneContext(paneId);
  if (!pane) {
    return {
      config: readTmuxStatusBarConfig(resolve(homedir(), '.codex')),
      snapshot: {
        visible: false,
        sessionName: '',
        panePath: '',
        timeLabel: new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
      },
    };
  }

  const codexHomeDir = await resolveCodexHomeForPane(pane);
  const config = readTmuxStatusBarConfig(codexHomeDir);
  const cacheDir = resolveUserLevelTmuxStatusCacheDir();
  const stateRoot = await resolveStateRootForPane(pane);
  const session = await readSessionStateSnapshot(stateRoot);
  const codexConfig = await readCodexConfig(codexHomeDir);
  const exactSessionId = session.nativeSessionId ?? session.sessionId;
  const rollout = await readRolloutSnapshot(codexHomeDir, exactSessionId, cacheDir);
  const cchSession = await readExactCchSession(
    codexHomeDir,
    config,
    codexConfig,
    exactSessionId,
    cacheDir,
  );
  const teamSupplement = config.team.showSupplement
    ? await readTeamSupplement(stateRoot, pane.paneId)
    : undefined;
  const git = readGitBranch(pane.currentPath);
  const localCacheRate = computeCacheRate(
    rollout.inputTokens,
    rollout.cachedInputTokens,
  );
  const remoteCacheRate = computeCacheRate(
    cchSession?.inputTokens,
    cchSession?.cacheReadInputTokens,
  );

  return {
    config,
    snapshot: {
      visible: isCodexLikePane(pane, session, stateRoot) || Boolean(teamSupplement),
      model:
        rollout.model
        ?? codexConfig.model
        ?? cchSession?.model,
      effort:
        rollout.effort
        ?? codexConfig.modelReasoningEffort,
      costUsd: cchSession?.costUsd,
      ctxUsed: rollout.ctxUsed,
      ctxMax: rollout.ctxMax ?? codexConfig.modelContextWindow,
      cacheRate: localCacheRate ?? remoteCacheRate,
      teamSupplement,
      sessionName: pane.sessionName,
      panePath: pane.currentPath,
      gitBranch: git.branch,
      gitDirty: git.dirty,
      timeLabel: new Date().toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    },
  };
}

export async function renderTmuxStatusSide(
  side: 'left' | 'right',
  paneId: string,
): Promise<string> {
  const { config, snapshot } = await buildRenderSnapshot(paneId);
  if (config.enabled === false) return '';
  return side === 'left'
    ? renderTmuxStatusLeft(snapshot, config.theme)
    : renderTmuxStatusRight(snapshot, config.theme);
}
