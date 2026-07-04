import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { dirname, join } from 'path';
import { chmod, mkdir, readFile, readdir, rm, writeFile } from 'fs/promises';
import { resolveTmuxBinaryForPlatform } from '../utils/platform-command.js';
import {
  readTmuxStatusBarConfig,
  resolveTmuxStatusAssetRoot,
  resolveUserLevelCodexHome,
  type TmuxStatusBarConfig,
} from './config.js';

export const OMX_TMUX_STATUS_MANAGED_BLOCK_START =
  '# >>> OMX managed tmux status start >>>';
export const OMX_TMUX_STATUS_MANAGED_BLOCK_END =
  '# <<< OMX managed tmux status end <<<';
export const OMX_TMUX_STATUS_RENDER_SCRIPT_NAME = 'render.sh';
export const OMX_TMUX_STATUS_CONF_NAME = 'tmux-status.conf';

interface SetupCategorySummaryLike {
  updated: number;
  unchanged: number;
  backedUp: number;
  skipped: number;
  removed: number;
}

interface SetupBackupContextLike {
  backupRoot: string;
  baseRoot: string;
}

interface SyncOptionsLike {
  dryRun?: boolean;
  verbose?: boolean;
}

function shellQuoteSingle(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function compactManagedWhitespace(value: string): string {
  return value
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+/, '')
    .replace(/\n+$/, '\n');
}

export function resolveManagedTmuxConfigPath(
  homeDir: string = homedir(),
): string {
  return join(homeDir, '.tmux.conf');
}

export function resolveTmuxStatusInstallCodexHome(
  scope: 'user' | 'project',
  scopeCodexHomeDir: string,
  homeDir: string = homedir(),
): string {
  return scope === 'user'
    ? scopeCodexHomeDir
    : resolveUserLevelCodexHome(homeDir);
}

export function buildTmuxStatusRenderScript(
  packageRoot: string,
): string {
  const rendererPath = join(packageRoot, 'dist', 'scripts', 'tmux-status-render.js');
  return [
    '#!/usr/bin/env bash',
    'set -euo pipefail',
    `exec node ${shellQuoteSingle(rendererPath)} "$@"`,
    '',
  ].join('\n');
}

function buildTmuxStatusRenderCommand(
  renderScriptPath: string,
  side: 'left' | 'right',
): string {
  return `${shellQuoteSingle(renderScriptPath)} ${side} '#{pane_id}'`;
}

export function buildTmuxStatusConf(
  renderScriptPath: string,
  config: TmuxStatusBarConfig,
): string {
  const leftCommand = buildTmuxStatusRenderCommand(renderScriptPath, 'left');
  const rightCommand = buildTmuxStatusRenderCommand(renderScriptPath, 'right');
  return [
    '# OMX managed tmux status config',
    'set-option -g focus-events on',
    `set-option -g status-interval ${config.refreshSeconds}`,
    `set-option -g status-left-length ${config.statusLeftLength}`,
    `set-option -g status-right-length ${config.statusRightLength}`,
    `set-option -g status-left "#(${leftCommand})"`,
    `set-option -g status-right "#(${rightCommand})"`,
    '',
  ].join('\n');
}

export function buildManagedTmuxConfBlock(
  tmuxStatusConfPath: string,
): string {
  const tmuxStatusConfQuoted = shellQuoteSingle(tmuxStatusConfPath);
  return [
    OMX_TMUX_STATUS_MANAGED_BLOCK_START,
    'set-option -g focus-events on',
    `if-shell "[ -f ${tmuxStatusConfQuoted} ]" "source-file ${tmuxStatusConfQuoted}"`,
    OMX_TMUX_STATUS_MANAGED_BLOCK_END,
  ].join('\n');
}

export function stripManagedTmuxConfBlock(
  existingContent: string,
): string {
  const blockPattern = new RegExp(
    `${escapeRegExp(OMX_TMUX_STATUS_MANAGED_BLOCK_START)}[\\s\\S]*?${escapeRegExp(OMX_TMUX_STATUS_MANAGED_BLOCK_END)}\\n?`,
    'g',
  );
  return compactManagedWhitespace(existingContent.replace(blockPattern, ''));
}

export function upsertManagedTmuxConfBlock(
  existingContent: string,
  tmuxStatusConfPath: string,
): string {
  const stripped = stripManagedTmuxConfBlock(existingContent);
  const next = compactManagedWhitespace(
    `${stripped.trimEnd()}\n\n${buildManagedTmuxConfBlock(tmuxStatusConfPath)}\n`,
  );
  return next;
}

async function ensureBackup(
  destinationPath: string,
  contentChanged: boolean,
  backupContext: SetupBackupContextLike,
  options: SyncOptionsLike,
): Promise<boolean> {
  if (!contentChanged || !existsSync(destinationPath)) return false;

  const relativePath = destinationPath.startsWith(backupContext.baseRoot)
    ? destinationPath.slice(backupContext.baseRoot.length).replace(/^[/]+/, '')
    : destinationPath.replace(/^[/]+/, '');
  const backupPath = join(backupContext.backupRoot, relativePath);

  if (!options.dryRun) {
    await mkdir(dirname(backupPath), { recursive: true });
    await writeFile(backupPath, await readFile(destinationPath, 'utf-8'));
  }
  if (options.verbose) {
    console.log(`  backup ${destinationPath} -> ${backupPath}`);
  }
  return true;
}

async function syncManagedContent(
  content: string,
  dstPath: string,
  summary: SetupCategorySummaryLike,
  backupContext: SetupBackupContextLike,
  options: SyncOptionsLike,
  verboseLabel: string,
): Promise<void> {
  const destinationExists = existsSync(dstPath);
  const existing = destinationExists
    ? await readFile(dstPath, 'utf-8')
    : null;
  const changed = existing !== content;

  if (!changed) {
    summary.unchanged += 1;
    return;
  }

  if (await ensureBackup(dstPath, destinationExists, backupContext, options)) {
    summary.backedUp += 1;
  }

  if (!options.dryRun) {
    await mkdir(dirname(dstPath), { recursive: true });
    await writeFile(dstPath, content);
  }

  summary.updated += 1;
  if (options.verbose) {
    console.log(
      `  ${options.dryRun ? 'would update' : 'updated'} ${verboseLabel}`,
    );
  }
}

function sourceLiveTmuxStatusConfig(tmuxStatusConfPath: string): void {
  const tmuxBinary = resolveTmuxBinaryForPlatform();
  if (!tmuxBinary) return;
  try {
    execFileSync(tmuxBinary, ['source-file', tmuxStatusConfPath], {
      encoding: 'utf-8',
      stdio: 'ignore',
    });
  } catch {
    // Best effort only. Future tmux launches still load the managed block.
  }
}

export interface InstallTmuxStatusOptions {
  scope: 'user' | 'project';
  scopeCodexHomeDir: string;
  packageRoot: string;
  backupContext: SetupBackupContextLike;
  summary: SetupCategorySummaryLike;
  options: SyncOptionsLike;
}

export interface InstallTmuxStatusResult {
  assetRoot: string;
  renderScriptPath: string;
  tmuxStatusConfPath: string;
  tmuxConfigPath: string;
}

export async function installManagedTmuxStatusArtifacts(
  input: InstallTmuxStatusOptions,
): Promise<InstallTmuxStatusResult> {
  const installCodexHome = resolveTmuxStatusInstallCodexHome(
    input.scope,
    input.scopeCodexHomeDir,
  );
  const assetRoot = resolveTmuxStatusAssetRoot(installCodexHome);
  const renderScriptPath = join(assetRoot, OMX_TMUX_STATUS_RENDER_SCRIPT_NAME);
  const tmuxStatusConfPath = join(assetRoot, OMX_TMUX_STATUS_CONF_NAME);
  const tmuxConfigPath = resolveManagedTmuxConfigPath();
  const config = readTmuxStatusBarConfig(installCodexHome);

  await syncManagedContent(
    buildTmuxStatusRenderScript(input.packageRoot),
    renderScriptPath,
    input.summary,
    input.backupContext,
    input.options,
    `tmux status renderer ${renderScriptPath}`,
  );
  if (!input.options.dryRun && existsSync(renderScriptPath)) {
    await chmod(renderScriptPath, 0o755).catch(() => undefined);
  }
  await syncManagedContent(
    buildTmuxStatusConf(renderScriptPath, config),
    tmuxStatusConfPath,
    input.summary,
    input.backupContext,
    input.options,
    `tmux status config ${tmuxStatusConfPath}`,
  );

  const existingTmuxConfig = existsSync(tmuxConfigPath)
    ? await readFile(tmuxConfigPath, 'utf-8')
    : '';
  await syncManagedContent(
    upsertManagedTmuxConfBlock(existingTmuxConfig, tmuxStatusConfPath),
    tmuxConfigPath,
    input.summary,
    input.backupContext,
    input.options,
    `tmux managed block ${tmuxConfigPath}`,
  );

  if (!input.options.dryRun) {
    sourceLiveTmuxStatusConfig(tmuxStatusConfPath);
  }

  return {
    assetRoot,
    renderScriptPath,
    tmuxStatusConfPath,
    tmuxConfigPath,
  };
}

async function removeIfExists(
  path: string,
  options: SyncOptionsLike,
): Promise<boolean> {
  if (!existsSync(path)) return false;
  if (!options.dryRun) {
    await rm(path, { recursive: true, force: true });
  }
  return true;
}

export interface RemoveTmuxStatusResult {
  assetEntriesRemoved: number;
  tmuxConfigCleaned: boolean;
}

export async function removeManagedTmuxStatusArtifacts(
  scope: 'user' | 'project',
  scopeCodexHomeDir: string,
  options: SyncOptionsLike,
): Promise<RemoveTmuxStatusResult> {
  const installCodexHome = resolveTmuxStatusInstallCodexHome(
    scope,
    scopeCodexHomeDir,
  );
  const assetRoot = resolveTmuxStatusAssetRoot(installCodexHome);
  const tmuxConfigPath = resolveManagedTmuxConfigPath();

  let assetEntriesRemoved = 0;
  if (await removeIfExists(join(assetRoot, OMX_TMUX_STATUS_RENDER_SCRIPT_NAME), options)) {
    assetEntriesRemoved += 1;
  }
  if (await removeIfExists(join(assetRoot, OMX_TMUX_STATUS_CONF_NAME), options)) {
    assetEntriesRemoved += 1;
  }

  if (!options.dryRun && existsSync(assetRoot)) {
    try {
      const remaining = await readdir(assetRoot);
      if (remaining.length === 0) {
        await rm(assetRoot, { recursive: true, force: true });
      }
    } catch {
      // Ignore best-effort cleanup failures.
    }
  }

  let tmuxConfigCleaned = false;
  if (existsSync(tmuxConfigPath)) {
    const existing = await readFile(tmuxConfigPath, 'utf-8');
    const next = stripManagedTmuxConfBlock(existing);
    if (next !== existing) {
      tmuxConfigCleaned = true;
      if (!options.dryRun) {
        await writeFile(tmuxConfigPath, next);
      }
    }
  }

  return {
    assetEntriesRemoved,
    tmuxConfigCleaned,
  };
}
