import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildManagedTmuxConfBlock,
  buildTmuxStatusConf,
  resolveTmuxStatusInstallCodexHome,
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
});
