import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  extractCodexResumeSessionId,
  extractRolloutSnapshotFromLines,
  normalizeCchManagementBaseUrl,
  resolvePaneSessionId,
  rolloutFileNameCouldMatchSessionId,
  renderTmuxStatusLeft,
  renderTmuxStatusRight,
  type TmuxStatusRenderSnapshot,
} from '../render.js';

function makeSnapshot(
  overrides: Partial<TmuxStatusRenderSnapshot> = {},
): TmuxStatusRenderSnapshot {
  return {
    visible: true,
    model: 'gpt-5.4',
    effort: 'xhigh',
    costUsd: 0.125,
    ctxUsed: 42000,
    ctxMax: 240000,
    totalTokens: 2_878_679,
    cacheRate: 37.5,
    sessionName: 'dev',
    panePath: '/home/example/work/repo',
    gitBranch: 'feature/status-bar',
    gitDirty: true,
    timeLabel: '14:28',
    ...overrides,
  };
}

describe('tmux status left renderer', () => {
  it('renders the fixed model metrics for leader panes', () => {
    const rendered = renderTmuxStatusLeft(
      makeSnapshot({
        teamSupplement: {
          kind: 'leader',
          teamName: 'alpha',
          workerCount: 3,
          activeWorkerCount: 2,
        },
      }),
      'nord',
    );

    assert.match(rendered, /Model/);
    assert.match(rendered, /gpt-5\.4/);
    assert.match(rendered, /Effort/);
    assert.match(rendered, /xhigh/);
    assert.match(rendered, /Cost/);
    assert.match(rendered, /0\.125/);
    assert.doesNotMatch(rendered, /\$0\.125/);
    assert.match(rendered, /Ctx/);
    assert.match(rendered, /42\.0k\/240\.0k 17\.5%/);
    assert.match(rendered, /Total/);
    assert.match(rendered, /2\.9M/);
    assert.ok(rendered.indexOf('Ctx') < rendered.indexOf('Total'));
    assert.ok(rendered.indexOf('Total') < rendered.indexOf('Cache'));
    assert.match(rendered, /Cache/);
    assert.match(rendered, /37\.5%/);
    assert.match(rendered, /Team/);
    assert.match(rendered, /alpha 3\/2/);
  });

  it('renders worker context as a lightweight supplement', () => {
    const rendered = renderTmuxStatusLeft(
      makeSnapshot({
        teamSupplement: {
          kind: 'worker',
          workerName: 'worker-2',
          workerRole: 'executor',
          workerState: 'working',
          taskSubject: 'Patch the tmux status install flow',
        },
      }),
      'dracula',
    );

    assert.match(rendered, /Wrk/);
    assert.match(rendered, /executor\/working/);
    assert.match(rendered, /Patch the tmux status insta/);
    assert.doesNotMatch(rendered, /worker-2/);
  });

  it('returns an empty string when the pane is not OMX-owned', () => {
    assert.equal(
      renderTmuxStatusLeft(
        makeSnapshot({ visible: false }),
        'catppuccin',
      ),
      '',
    );
  });
});

describe('tmux status right renderer', () => {
  it('renders session, path, git, and time', () => {
    const rendered = renderTmuxStatusRight(
      makeSnapshot(),
      'nord',
    );

    assert.match(rendered, /Sess/);
    assert.match(rendered, /dev/);
    assert.match(rendered, /Path/);
    assert.match(rendered, /\/work\/repo/);
    assert.match(rendered, /Git/);
    assert.match(rendered, /feature\/status-bar\*/);
    assert.match(rendered, /14:28/);
    assert.doesNotMatch(rendered, /Time/);
  });
});

describe('tmux status rollout helpers', () => {
  it('extracts the active thread id from codex resume launch commands', () => {
    assert.equal(
      extractCodexResumeSessionId(
        "exec /usr/bin/zsh -lc 'exec env TERM=xterm-256color codex resume 019f20ec-cab5-7e82-bf5f-faee5753c79f'",
      ),
      '019f20ec-cab5-7e82-bf5f-faee5753c79f',
    );
    assert.equal(
      extractCodexResumeSessionId('codex --resume 019f20ec-7574-7813-9ee9-7ffaef158a50'),
      '019f20ec-7574-7813-9ee9-7ffaef158a50',
    );
    assert.equal(
      extractCodexResumeSessionId('exec env TERM=xterm-256color codex'),
      undefined,
    );
  });

  it('reads turn_context and event_msg token_count with the old status-bar semantics', () => {
    const snapshot = extractRolloutSnapshotFromLines([
      JSON.stringify({
        type: 'session_meta',
        payload: {
          id: '019f20ec-cab5-7e82-bf5f-faee5753c79f',
          cwd: '/home/penn/devel',
        },
      }),
      JSON.stringify({
        type: 'turn_context',
        payload: {
          model: 'gpt-5.4',
          effort: 'xhigh',
        },
      }),
      JSON.stringify({
        type: 'event_msg',
        payload: {
          type: 'token_count',
          info: {
            total_token_usage: {
              input_tokens: 2_862_682,
              cached_input_tokens: 2_667_520,
              output_tokens: 15_997,
              total_tokens: 2_878_679,
            },
            last_token_usage: {
              input_tokens: 169_543,
              cached_input_tokens: 168_320,
            },
            model_context_window: 258_400,
          },
        },
      }),
    ]);

    assert.equal(snapshot.sessionId, '019f20ec-cab5-7e82-bf5f-faee5753c79f');
    assert.equal(snapshot.model, 'gpt-5.4');
    assert.equal(snapshot.effort, 'xhigh');
    assert.equal(snapshot.ctxUsed, 169_543);
    assert.equal(snapshot.ctxMax, 258_400);
    assert.equal(snapshot.inputTokens, 2_862_682);
    assert.equal(snapshot.cachedInputTokens, 2_667_520);
    assert.equal(snapshot.totalTokens, 2_878_679);
  });

  it('normalizes provider base urls before calling CCH management endpoints', () => {
    assert.equal(
      normalizeCchManagementBaseUrl('https://cch.141242.xyz:9999/v1'),
      'https://cch.141242.xyz:9999',
    );
    assert.equal(
      normalizeCchManagementBaseUrl('https://cch.141242.xyz:9999/v1/'),
      'https://cch.141242.xyz:9999',
    );
    assert.equal(
      normalizeCchManagementBaseUrl('https://cch.141242.xyz:9999'),
      'https://cch.141242.xyz:9999',
    );
  });

  it('matches both direct and timestamp-prefixed rollout filenames for a thread id', () => {
    assert.equal(
      rolloutFileNameCouldMatchSessionId(
        'rollout-019f20ec-cab5-7e82-bf5f-faee5753c79f.jsonl',
        '019f20ec-cab5-7e82-bf5f-faee5753c79f',
      ),
      true,
    );
    assert.equal(
      rolloutFileNameCouldMatchSessionId(
        'rollout-2026-07-02T11-43-37-019f20ec-cab5-7e82-bf5f-faee5753c79f.jsonl',
        '019f20ec-cab5-7e82-bf5f-faee5753c79f',
      ),
      true,
    );
    assert.equal(
      rolloutFileNameCouldMatchSessionId(
        'rollout-2026-07-02T11-43-37-019f20ec-7574-7813-9ee9-7ffaef158a50.jsonl',
        '019f20ec-cab5-7e82-bf5f-faee5753c79f',
      ),
      false,
    );
  });

  it('prefers the pane resume id over shared session state and rollout metadata', () => {
    assert.equal(
      resolvePaneSessionId(
        '019f20ec-cab5-7e82-bf5f-faee5753c79f',
        {
          nativeSessionId: '019ef8bb-c32d-7530-b6af-929f1b6f6deb',
          sessionId: '019ef8bb-c32d-7530-b6af-929f1b6f6deb',
        },
        '019ef8bb-c32d-7530-b6af-929f1b6f6deb',
      ),
      '019f20ec-cab5-7e82-bf5f-faee5753c79f',
    );
  });
});
