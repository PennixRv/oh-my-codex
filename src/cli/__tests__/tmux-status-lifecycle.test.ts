import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function runOmx(
  cwd: string,
  argv: string[],
  envOverrides: Record<string, string> = {},
): { status: number | null; stdout: string; stderr: string; error: string } {
  const testDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = join(testDir, '..', '..', '..');
  const omxBin = join(repoRoot, 'dist', 'cli', 'omx.js');
  const resolvedHome = envOverrides.HOME ?? process.env.HOME;
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ...(resolvedHome && !envOverrides.CODEX_HOME
      ? { CODEX_HOME: join(resolvedHome, '.codex') }
      : {}),
    ...envOverrides,
  };
  delete env.OMX_SESSION_ID;
  delete env.OMX_RUN_ID;
  delete env.OMX_ROOT;
  delete env.OMX_STATE_ROOT;
  delete env.TMUX_PANE;
  delete env.TMUX;

  const result = spawnSync(process.execPath, [omxBin, ...argv], {
    cwd,
    encoding: 'utf-8',
    env,
  });
  return {
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error?.message || '',
  };
}

function shouldSkipForSpawnPermissions(err: string): boolean {
  return typeof err === 'string' && /(EPERM|EACCES)/i.test(err);
}

describe('tmux status lifecycle', () => {
  it('installs and removes managed tmux status assets in user scope', async () => {
    const wd = await mkdtemp(join(tmpdir(), 'omx-tmux-status-'));
    try {
      const home = join(wd, 'home');
      await mkdir(home, { recursive: true });
      const tmuxConfigPath = join(home, '.tmux.conf');
      await writeFile(tmuxConfigPath, 'set -g mouse on\n');

      const setup = runOmx(wd, ['setup'], { HOME: home });
      if (shouldSkipForSpawnPermissions(setup.error)) return;
      assert.equal(setup.status, 0, setup.stderr || setup.stdout);

      const assetRoot = join(home, '.codex', '.omx', 'tmux-status');
      const renderScriptPath = join(assetRoot, 'render.sh');
      const tmuxStatusConfPath = join(assetRoot, 'tmux-status.conf');

      assert.equal(existsSync(renderScriptPath), true);
      assert.equal(existsSync(tmuxStatusConfPath), true);

      const renderScript = await readFile(renderScriptPath, 'utf-8');
      assert.match(renderScript, /tmux-status-render\.js/);

      const renderScriptMode = (await stat(renderScriptPath)).mode & 0o777;
      assert.equal(renderScriptMode & 0o111, 0o111);

      const tmuxConfig = await readFile(tmuxConfigPath, 'utf-8');
      assert.match(tmuxConfig, /set -g mouse on/);
      assert.match(tmuxConfig, /OMX managed tmux status start/);
      assert.match(tmuxConfig, /source-file '.*tmux-status\.conf'/);

      const uninstall = runOmx(wd, ['uninstall'], { HOME: home });
      if (shouldSkipForSpawnPermissions(uninstall.error)) return;
      assert.equal(uninstall.status, 0, uninstall.stderr || uninstall.stdout);

      const strippedTmuxConfig = await readFile(tmuxConfigPath, 'utf-8');
      assert.match(strippedTmuxConfig, /set -g mouse on/);
      assert.doesNotMatch(strippedTmuxConfig, /OMX managed tmux status/);
      assert.equal(existsSync(renderScriptPath), false);
      assert.equal(existsSync(tmuxStatusConfPath), false);
    } finally {
      await rm(wd, { recursive: true, force: true });
    }
  });

  it('keeps tmux status assets user-level even for project-scoped setup', async () => {
    const wd = await mkdtemp(join(tmpdir(), 'omx-tmux-project-'));
    try {
      const home = join(wd, 'home');
      await mkdir(home, { recursive: true });

      const setup = runOmx(wd, ['setup', '--scope', 'project'], { HOME: home });
      if (shouldSkipForSpawnPermissions(setup.error)) return;
      assert.equal(setup.status, 0, setup.stderr || setup.stdout);

      assert.equal(
        existsSync(join(home, '.codex', '.omx', 'tmux-status', 'render.sh')),
        true,
      );
      assert.equal(
        existsSync(join(wd, '.codex', '.omx', 'tmux-status', 'render.sh')),
        false,
      );
    } finally {
      await rm(wd, { recursive: true, force: true });
    }
  });
});
