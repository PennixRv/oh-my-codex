import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export type TmuxStatusTheme = 'nord' | 'dracula' | 'catppuccin';

export interface TmuxStatusBarConfig {
  enabled: boolean;
  refreshSeconds: number;
  statusLeftLength: number;
  statusRightLength: number;
  theme: TmuxStatusTheme;
  team: {
    showSupplement: boolean;
  };
  cch: {
    baseUrl?: string;
    adminTokenEnvVar: string;
    sessionsCacheSeconds: number;
  };
}

interface OmxConfigFile {
  tmuxStatusBar?: unknown;
}

const DEFAULT_THEME: TmuxStatusTheme = 'nord';
const DEFAULT_REFRESH_SECONDS = 2;
const DEFAULT_STATUS_LEFT_LENGTH = 180;
const DEFAULT_STATUS_RIGHT_LENGTH = 140;
const DEFAULT_CCH_ADMIN_TOKEN_ENV_VAR = 'CCH_ADMIN_TOKEN';
const DEFAULT_CCH_SESSIONS_CACHE_SECONDS = 15;

export const DEFAULT_TMUX_STATUS_BAR_CONFIG: TmuxStatusBarConfig = {
  enabled: true,
  refreshSeconds: DEFAULT_REFRESH_SECONDS,
  statusLeftLength: DEFAULT_STATUS_LEFT_LENGTH,
  statusRightLength: DEFAULT_STATUS_RIGHT_LENGTH,
  theme: DEFAULT_THEME,
  team: {
    showSupplement: true,
  },
  cch: {
    adminTokenEnvVar: DEFAULT_CCH_ADMIN_TOKEN_ENV_VAR,
    sessionsCacheSeconds: DEFAULT_CCH_SESSIONS_CACHE_SECONDS,
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizePositiveInteger(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  if (typeof value !== 'string') return undefined;
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function normalizeTheme(value: unknown): TmuxStatusTheme | undefined {
  return value === 'nord' || value === 'dracula' || value === 'catppuccin'
    ? value
    : undefined;
}

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function readOmxConfigFile(codexHomeDir: string): OmxConfigFile | null {
  const configPath = join(codexHomeDir, '.omx-config.json');
  if (!existsSync(configPath)) return null;
  try {
    const parsed = JSON.parse(readFileSync(configPath, 'utf-8')) as unknown;
    return isRecord(parsed) ? parsed as OmxConfigFile : null;
  } catch {
    return null;
  }
}

export function readTmuxStatusBarConfig(
  codexHomeDir: string,
): TmuxStatusBarConfig {
  const raw = readOmxConfigFile(codexHomeDir)?.tmuxStatusBar;
  if (!isRecord(raw)) {
    return {
      ...DEFAULT_TMUX_STATUS_BAR_CONFIG,
      team: { ...DEFAULT_TMUX_STATUS_BAR_CONFIG.team },
      cch: { ...DEFAULT_TMUX_STATUS_BAR_CONFIG.cch },
    };
  }

  const rawTeam = isRecord(raw.team) ? raw.team : {};
  const rawCch = isRecord(raw.cch) ? raw.cch : {};

  return {
    enabled: typeof raw.enabled === 'boolean'
      ? raw.enabled
      : DEFAULT_TMUX_STATUS_BAR_CONFIG.enabled,
    refreshSeconds:
      normalizePositiveInteger(raw.refreshSeconds)
      ?? DEFAULT_TMUX_STATUS_BAR_CONFIG.refreshSeconds,
    statusLeftLength:
      normalizePositiveInteger(raw.statusLeftLength)
      ?? DEFAULT_TMUX_STATUS_BAR_CONFIG.statusLeftLength,
    statusRightLength:
      normalizePositiveInteger(raw.statusRightLength)
      ?? DEFAULT_TMUX_STATUS_BAR_CONFIG.statusRightLength,
    theme:
      normalizeTheme(raw.theme)
      ?? DEFAULT_TMUX_STATUS_BAR_CONFIG.theme,
    team: {
      showSupplement: typeof rawTeam.showSupplement === 'boolean'
        ? rawTeam.showSupplement
        : DEFAULT_TMUX_STATUS_BAR_CONFIG.team.showSupplement,
    },
    cch: {
      baseUrl:
        normalizeString(rawCch.baseUrl)
        ?? normalizeString(process.env.CCH_BASE_URL)
        ?? normalizeString(process.env.ANTHROPIC_BASE_URL),
      adminTokenEnvVar:
        normalizeString(rawCch.adminTokenEnvVar)
        ?? DEFAULT_TMUX_STATUS_BAR_CONFIG.cch.adminTokenEnvVar,
      sessionsCacheSeconds:
        normalizePositiveInteger(rawCch.sessionsCacheSeconds)
        ?? DEFAULT_TMUX_STATUS_BAR_CONFIG.cch.sessionsCacheSeconds,
    },
  };
}

export function resolveUserLevelCodexHome(
  homeDir: string = homedir(),
): string {
  return join(homeDir, '.codex');
}

export function resolveTmuxStatusAssetRoot(
  codexHomeDir: string,
): string {
  return join(codexHomeDir, '.omx', 'tmux-status');
}

export function resolveUserLevelTmuxStatusCacheDir(
  homeDir: string = homedir(),
): string {
  return join(resolveUserLevelCodexHome(homeDir), '.omx', 'tmux-status', 'cache');
}
