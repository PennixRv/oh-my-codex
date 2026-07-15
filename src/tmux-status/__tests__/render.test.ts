import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  extractCodexResumeSessionId,
  extractRolloutSnapshotFromLines,
  normalizeCchManagementBaseUrl,
  resolvePaneSessionId,
  resolveUsageMetrics,
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
    costUsd: 0.125,
    ctxUsed: 42000,
    ctxMax: 250000,
    totalTokens: 2_878_679,
    cacheRate: 37.5,
    codexSessionId: '019f4ea7-42b0-7aa3-854a-8138f139cc08',
    panePath: '/home/example/work/repo',
    gitBranch: 'feature/status-bar',
    gitDirty: true,
    timeLabel: '14:28',
    ...overrides,
  };
}

describe('tmux status left renderer', () => {
  it('renders the fixed telemetry metrics for leader panes', () => {
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

    assert.match(rendered, /^  /);
    assert.doesNotMatch(rendered, /Model/);
    assert.doesNotMatch(rendered, /Effort/);
    assert.match(rendered, /cost/);
    assert.match(rendered, /0\.13/);
    assert.doesNotMatch(rendered, /\$/);
    assert.match(rendered, /ctx/);
    assert.match(rendered, /208\.0k\/238\.0k 87\.39%/);
    assert.match(rendered, /total/);
    assert.match(rendered, /2\.88M/);
    assert.ok(rendered.indexOf('ctx') < rendered.indexOf('total'));
    assert.ok(rendered.indexOf('total') < rendered.indexOf('cache'));
    assert.ok(rendered.indexOf('cache') < rendered.indexOf('cost'));
    assert.match(rendered, /cache/);
    assert.match(rendered, /37\.50%/);
    assert.match(rendered, /team/);
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

    assert.match(rendered, /wrk/);
    assert.match(rendered, /executor\/working/);
    assert.match(rendered, /Patch the tmux status insta/);
    assert.doesNotMatch(rendered, /worker-2/);
  });

  it('matches the official Codex baseline-normalized context-left semantics', () => {
    const rendered = renderTmuxStatusLeft(
      makeSnapshot({
        ctxUsed: 214_510,
        ctxMax: 275_000,
      }),
      'nord',
    );

    assert.match(rendered, /ctx/);
    assert.match(rendered, /60\.5k\/263\.0k 23\.00%/);
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
  it('renders the Codex session prefix, path, git, and time', () => {
    const rendered = renderTmuxStatusRight(
      makeSnapshot(),
      'nord',
    );

    assert.match(rendered, /  $/);
    assert.match(rendered, /sess/);
    assert.match(rendered, /019f4ea7/);
    assert.match(rendered, /path/);
    assert.match(rendered, /\/work\/repo/);
    assert.match(rendered, /git/);
    assert.match(rendered, /feature\/status-bar\*/);
    assert.match(rendered, /14:28/);
    assert.doesNotMatch(rendered, /Time/);
  });

  it('does not fall back to the tmux or AOE session name', () => {
    const rendered = renderTmuxStatusRight(
      makeSnapshot({
        codexSessionId: undefined,
      }),
      'nord',
    );

    assert.match(rendered, /sess/);
    assert.match(rendered, /\?/);
    assert.doesNotMatch(rendered, /aoe_/);
  });

  it('rejects incomplete Codex session identifiers', () => {
    const rendered = renderTmuxStatusRight(
      makeSnapshot({
        codexSessionId: '019f4ea7',
      }),
      'nord',
    );

    assert.match(rendered, /sess/);
    assert.match(rendered, /\?/);
    assert.doesNotMatch(rendered, /019f4ea7/);
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

  it('reads turn_context and event_msg token_count with rollout telemetry semantics', () => {
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
        payload: {},
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
              total_tokens: 174_139,
            },
            model_context_window: 258_400,
          },
        },
      }),
    ]);

    assert.equal(snapshot.sessionId, '019f20ec-cab5-7e82-bf5f-faee5753c79f');
    assert.equal(snapshot.ctxUsed, 174_139);
    assert.equal(snapshot.ctxMax, 258_400);
    assert.equal(snapshot.inputTokens, 2_862_682);
    assert.equal(snapshot.cachedInputTokens, 2_667_520);
    assert.equal(snapshot.totalTokens, 2_878_679);
  });

  it('falls back to last input tokens when older rollout context totals are missing', () => {
    const snapshot = extractRolloutSnapshotFromLines([
      JSON.stringify({
        type: 'event_msg',
        payload: {
          type: 'token_count',
          info: {
            last_token_usage: {
              input_tokens: 42_000,
            },
            model_context_window: 250_000,
          },
        },
      }),
    ]);

    assert.equal(snapshot.ctxUsed, 42_000);
    assert.equal(snapshot.ctxMax, 250_000);
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

  it('prefers the live rollout session id over a stale pane resume id', () => {
    assert.equal(
      resolvePaneSessionId(
        '019f20ec-cab5-7e82-bf5f-faee5753c79f',
        {
          nativeSessionId: '019ef8bb-c32d-7530-b6af-929f1b6f6deb',
          sessionId: '019ef8bb-c32d-7530-b6af-929f1b6f6deb',
        },
        '019ef8bb-c32d-7530-b6af-929f1b6f6deb',
      ),
      '019ef8bb-c32d-7530-b6af-929f1b6f6deb',
    );
  });

  it('prefers a pane-local rollout session id over stale shared OMX state', () => {
    assert.equal(
      resolvePaneSessionId(
        '019f0c5e-9624-7182-b231-c83305f8d02e',
        {
          nativeSessionId: '019ef8bb-c32d-7530-b6af-929f1b6f6deb',
          sessionId: '019ef8bb-c32d-7530-b6af-929f1b6f6deb',
        },
        '019f0c5e-9624-7182-b231-c83305f8d02e',
      ),
      '019f0c5e-9624-7182-b231-c83305f8d02e',
    );
  });

  it('falls back to the pane resume id when there is no live rollout session id', () => {
    assert.equal(
      resolvePaneSessionId(
        '019f20ec-cab5-7e82-bf5f-faee5753c79f',
        {
          nativeSessionId: '019ef8bb-c32d-7530-b6af-929f1b6f6deb',
          sessionId: '019ef8bb-c32d-7530-b6af-929f1b6f6deb',
        },
        undefined,
      ),
      '019f20ec-cab5-7e82-bf5f-faee5753c79f',
    );
  });

  it('falls back to rollout metadata when there is no resume id', () => {
    assert.equal(
      resolvePaneSessionId(
        undefined,
        {
          nativeSessionId: '019ef8bb-c32d-7530-b6af-929f1b6f6deb',
          sessionId: '019ef8bb-c32d-7530-b6af-929f1b6f6deb',
        },
        '019f0c5e-9624-7182-b231-c83305f8d02e',
      ),
      '019f0c5e-9624-7182-b231-c83305f8d02e',
    );
  });

  it('does not fall back to stale shared OMX state without pane-local session evidence', () => {
    assert.equal(
      resolvePaneSessionId(
        undefined,
        {
          nativeSessionId: '019ef8bb-c32d-7530-b6af-929f1b6f6deb',
          sessionId: '019ef8bb-c32d-7530-b6af-929f1b6f6deb',
        },
        undefined,
      ),
      undefined,
    );
  });
});

describe('tmux status usage metrics resolution', () => {
  it('zeros usage metrics for Codex panes that have no pane-local telemetry yet', () => {
    assert.deepEqual(
      resolveUsageMetrics({
        isCodexPane: true,
        hasPaneLocalTelemetry: false,
        rollout: {
          ctxUsed: 42000,
          ctxMax: 240000,
          totalTokens: 2_878_679,
          inputTokens: 2_862_682,
          cachedInputTokens: 2_667_520,
        },
        cchSession: {
          sessionId: '019ef8bb-c32d-7530-b6af-929f1b6f6deb',
          costUsd: 0.125,
          inputTokens: 2_862_682,
          cacheReadInputTokens: 2_667_520,
          totalTokens: 2_878_679,
        },
        codexConfig: {
          modelContextWindow: 250000,
        },
      }),
      {
        costUsd: 0,
        ctxUsed: 0,
        ctxMax: 250000,
        totalTokens: 0,
        cacheRate: 0,
      },
    );
  });

  it('uses real rollout and CCH metrics once pane-local telemetry exists', () => {
    const metrics = resolveUsageMetrics({
      isCodexPane: true,
      hasPaneLocalTelemetry: true,
      rollout: {
        ctxUsed: 42000,
        ctxMax: 240000,
        totalTokens: 2_878_679,
        inputTokens: 2_862_682,
        cachedInputTokens: 2_667_520,
      },
      cchSession: {
        sessionId: '019f0c5e-9624-7182-b231-c83305f8d02e',
        costUsd: 0.125,
        inputTokens: 2_862_682,
        cacheReadInputTokens: 2_667_520,
        totalTokens: 2_878_679,
      },
      codexConfig: {
        modelContextWindow: 250000,
      },
    });

    assert.deepEqual(
      {
        costUsd: metrics.costUsd,
        ctxUsed: metrics.ctxUsed,
        ctxMax: metrics.ctxMax,
        totalTokens: metrics.totalTokens,
      },
      {
        costUsd: 0.125,
        ctxUsed: 42000,
        ctxMax: 240000,
        totalTokens: 2_878_679,
      },
    );
    assert.ok(metrics.cacheRate !== undefined);
    assert.ok(Math.abs(metrics.cacheRate - 48.23548940888597) < 1e-9);
  });
});
