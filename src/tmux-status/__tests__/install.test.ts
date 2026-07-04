import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  buildManagedTmuxConfBlock,
  buildTmuxStatusConf,
  installManagedTmuxStatusArtifacts,
  resolveTmuxStatusInstallCodexHome,
  shouldSourceLiveTmuxStatusForCurrentProcess,
  stripManagedTmuxConfBlock,
  upsertManagedTmuxConfBlock,
} from '../install.js';
import { DEFAULT_TMUX_STATUS_BAR_CONFIG } from '../config.js';

describe('tmux status managed config block', () => {
  it('upserts the managed block without disturbing surrounding config', () => {
    const existing = [
      'set -g mouse on',
      'set -g status-position top',
      '',
    ].join('\n');

    const updated = upsertManagedTmuxConfBlock(
      existing,
      '/tmp/.codex/.omx/tmux-status/tmux-status.conf',
    );

    assert.match(updated, /set -g mouse on/);
    assert.match(updated, /set -g status-position top/);
    assert.match(updated, new RegExp(buildManagedTmuxConfBlock('/tmp/.codex/.omx/tmux-status/tmux-status.conf')
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

    const secondPass = upsertManagedTmuxConfBlock(
      updated,
      '/tmp/.codex/.omx/tmux-status/tmux-status.conf',
    );
    assert.equal(secondPass, updated);
  });

  it('strips only the managed block', () => {
    const content = [
      'set -g mouse on',
      '',
      buildManagedTmuxConfBlock('/tmp/tmux-status.conf'),
      '',
      'setw -g mode-keys vi',
      '',
    ].join('\n');

    const stripped = stripManagedTmuxConfBlock(content);

    assert.match(stripped, /set -g mouse on/);
    assert.match(stripped, /setw -g mode-keys vi/);
    assert.doesNotMatch(stripped, /OMX managed tmux status/);
  });
});

describe('tmux status asset generation', () => {
  it('renders the tmux status config with focus-aware commands', () => {
    const rendered = buildTmuxStatusConf(
      '/tmp/.codex/.omx/tmux-status/render.sh',
      DEFAULT_TMUX_STATUS_BAR_CONFIG,
    );

    assert.match(rendered, /set-option -g focus-events on/);
    assert.match(rendered, /status-left-length 180/);
    assert.match(rendered, /status-right-length 140/);
    assert.match(rendered, /render\.sh' left '#\{pane_id\}'/);
    assert.match(rendered, /render\.sh' right '#\{pane_id\}'/);
  });

  it('keeps tmux assets user-level for project-scoped setup', () => {
    assert.equal(
      resolveTmuxStatusInstallCodexHome('project', '/repo/.codex', '/home/example'),
      '/home/example/.codex',
    );
    assert.equal(
      resolveTmuxStatusInstallCodexHome('user', '/custom/codex', '/home/example'),
      '/custom/codex',
    );
  });

  it('sources live tmux only for the current real user home inside tmux', () => {
    assert.equal(
      shouldSourceLiveTmuxStatusForCurrentProcess(
        'user',
        '/home/penn/.codex',
        '/home/penn',
        '/home/penn',
        { TMUX: '/tmp/tmux-1000/default,1,0' },
      ),
      true,
    );
    assert.equal(
      shouldSourceLiveTmuxStatusForCurrentProcess(
        'user',
        '/tmp/omx-test/home/.codex',
        '/tmp/omx-test/home',
        '/home/penn',
        { TMUX: '/tmp/tmux-1000/default,1,0' },
      ),
      false,
    );
    assert.equal(
      shouldSourceLiveTmuxStatusForCurrentProcess(
        'user',
        '/home/penn/.codex',
        '/home/penn',
        '/home/penn',
        {},
      ),
      false,
    );
  });

  it('seeds tmux status cache ttl into .omx-config.json when missing', async () => {
    const wd = await mkdtemp(join(tmpdir(), 'omx-tmux-install-'));
    try {
      const home = join(wd, 'home');
      const codexHome = join(home, '.codex');
      await mkdir(codexHome, { recursive: true });
      await writeFile(join(home, '.tmux.conf'), 'set -g mouse on\n');

      const result = await installManagedTmuxStatusArtifacts({
        scope: 'user',
        scopeCodexHomeDir: codexHome,
        packageRoot: wd,
        homeDir: home,
        backupContext: {
          backupRoot: join(wd, 'backups'),
          baseRoot: home,
        },
        summary: {
          updated: 0,
          unchanged: 0,
          backedUp: 0,
          skipped: 0,
          removed: 0,
        },
        options: {},
      });
      assert.equal(result.tmuxConfigPath, join(home, '.tmux.conf'));

      const config = JSON.parse(
        await readFile(join(codexHome, '.omx-config.json'), 'utf-8'),
      ) as {
        tmuxStatusBar?: { cch?: { sessionsCacheSeconds?: number } };
      };
      assert.equal(config.tmuxStatusBar?.cch?.sessionsCacheSeconds, 5);
      const tmuxConfig = await readFile(join(home, '.tmux.conf'), 'utf-8');
      assert.match(tmuxConfig, /OMX managed tmux status start/);
    } finally {
      await rm(wd, { recursive: true, force: true });
    }
  });

  it('preserves an existing tmux status cache ttl in .omx-config.json', async () => {
    const wd = await mkdtemp(join(tmpdir(), 'omx-tmux-install-'));
    try {
      const home = join(wd, 'home');
      const codexHome = join(home, '.codex');
      await mkdir(codexHome, { recursive: true });
      await writeFile(
        join(codexHome, '.omx-config.json'),
        JSON.stringify({
          tmuxStatusBar: {
            cch: {
              sessionsCacheSeconds: 9,
            },
          },
        }, null, 2) + '\n',
      );

      await installManagedTmuxStatusArtifacts({
        scope: 'user',
        scopeCodexHomeDir: codexHome,
        packageRoot: wd,
        homeDir: home,
        backupContext: {
          backupRoot: join(wd, 'backups'),
          baseRoot: home,
        },
        summary: {
          updated: 0,
          unchanged: 0,
          backedUp: 0,
          skipped: 0,
          removed: 0,
        },
        options: {},
      });

      const config = JSON.parse(
        await readFile(join(codexHome, '.omx-config.json'), 'utf-8'),
      ) as {
        tmuxStatusBar?: { cch?: { sessionsCacheSeconds?: number } };
      };
      assert.equal(config.tmuxStatusBar?.cch?.sessionsCacheSeconds, 9);
    } finally {
      await rm(wd, { recursive: true, force: true });
    }
  });
});
