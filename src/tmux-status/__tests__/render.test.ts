import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
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
