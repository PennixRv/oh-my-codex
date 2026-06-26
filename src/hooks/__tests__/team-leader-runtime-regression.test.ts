import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chmod, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { drainPendingTeamDispatch } from '../../scripts/notify-hook/team-dispatch.js';

const WATCHER_SCRIPT = new URL('../../../dist/scripts/notify-fallback-watcher.js', import.meta.url).pathname;
const NOTIFY_HOOK_SCRIPT = new URL('../../../dist/scripts/notify-hook.js', import.meta.url).pathname;

async function withTempDir(run: (cwd: string) => Promise<void>): Promise<void> {
  const cwd = await mkdtemp(join(tmpdir(), 'omx-team-leader-regression-'));
  try {
    await run(cwd);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(join(path, '..'), { recursive: true }).catch(() => {});
  await writeFile(path, JSON.stringify(value, null, 2));
}

function buildFakeTmux(tmuxLogPath: string): string {
  return `#!/usr/bin/env bash
set -eu
echo "$@" >> "${tmuxLogPath}"
cmd="$1"
shift || true
if [[ "$cmd" == "capture-pane" ]]; then
  cat <<'EOF'
OpenAI Codex
• Working… (esc to interrupt)
›
EOF
  exit 0
fi
if [[ "$cmd" == "display-message" ]]; then
  target=""
  fmt=""
  while [[ "$#" -gt 0 ]]; do
    case "$1" in
      -t)
        shift
        target="$1"
        ;;
      *)
        fmt="$1"
        ;;
    esac
    shift || true
  done
  if [[ "$fmt" == "#{pane_in_mode}" ]]; then
    echo "0"
    exit 0
  fi
  if [[ "$fmt" == "#{pane_current_command}" ]]; then
    echo "codex"
    exit 0
  fi
  if [[ "$fmt" == "#{pane_id}" ]]; then
    echo "\${target:-%42}"
    exit 0
  fi
  exit 0
fi
if [[ "$cmd" == "list-panes" ]]; then
  echo "%42 12345"
  exit 0
fi
if [[ "$cmd" == "send-keys" ]]; then
  exit 0
fi
exit 0
`;
}

async function readJsonLines(path: string): Promise<Array<Record<string, unknown>>> {
  const raw = await readFile(path, 'utf8').catch(() => '');
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

function buildNotifyEnv(fakeBinDir: string, extraEnv: Record<string, string> = {}) {
  return {
    ...process.env,
    PATH: `${fakeBinDir}:${process.env.PATH || ''}`,
    OMX_TEAM_LEADER_NUDGE_MS: '10000',
    OMX_TEAM_LEADER_STALE_MS: '10000',
    OMX_TEAM_WORKER: '',
    OMX_TEAM_STATE_ROOT: '',
    OMX_TEAM_LEADER_CWD: '',
    OMX_MODEL_INSTRUCTIONS_FILE: '',
    TMUX: '',
    TMUX_PANE: '',
    ...extraEnv,
  };
}

describe('team leader runtime regressions', () => {
  it('fallback watcher no longer recreates team leader nudges', async () => {
    await withTempDir(async (cwd) => {
      const stateDir = join(cwd, '.omx', 'state');
      const teamDir = join(stateDir, 'team', 'dispatch-team');
      const fakeBinDir = join(cwd, 'fake-bin');
      const tmuxLogPath = join(cwd, 'tmux.log');

      await mkdir(join(cwd, '.omx', 'logs'), { recursive: true });
      await mkdir(teamDir, { recursive: true });
      await mkdir(fakeBinDir, { recursive: true });
      await writeFile(join(fakeBinDir, 'tmux'), buildFakeTmux(tmuxLogPath));
      await chmod(join(fakeBinDir, 'tmux'), 0o755);

      await writeFile(join(stateDir, 'team-state.json'), JSON.stringify({
        active: true,
        team_name: 'dispatch-team',
        current_phase: 'team-exec',
      }, null, 2));
      await writeFile(join(stateDir, 'hud-state.json'), JSON.stringify({
        last_turn_at: new Date(Date.now() - 300_000).toISOString(),
        turn_count: 3,
      }, null, 2));
      await writeFile(join(teamDir, 'config.json'), JSON.stringify({
        name: 'dispatch-team',
        tmux_session: 'dispatch-team:0',
        leader_pane_id: '%42',
      }, null, 2));

      const result = spawnSync(
        process.execPath,
        [WATCHER_SCRIPT, '--once', '--cwd', cwd, '--notify-script', NOTIFY_HOOK_SCRIPT],
        {
          encoding: 'utf8',
          env: buildNotifyEnv(fakeBinDir, { OMX_SESSION_ID: 'sess-test' }),
        },
      );
      assert.equal(result.status, 0, result.stderr || result.stdout);

      const tmuxLog = await readFile(tmuxLogPath, 'utf8').catch(() => '');
      assert.doesNotMatch(tmuxLog, /Team dispatch-team: leader stale/);

      const watcherState = JSON.parse(await readFile(join(stateDir, 'notify-fallback-state.json'), 'utf8'));
      assert.equal(watcherState.leader_nudge?.enabled, false);

      const watcherLog = await readJsonLines(join(cwd, '.omx', 'logs', `notify-fallback-${new Date().toISOString().slice(0, 10)}.jsonl`));
      assert.ok(
        watcherLog.some((entry) =>
          entry.type === 'leader_nudge_tick'
          && entry.reason === 'leader_nudge_disabled_for_team_runtime'),
      );

      const deliveryLog = await readJsonLines(join(cwd, '.omx', 'logs', `team-delivery-${new Date().toISOString().slice(0, 10)}.jsonl`));
      assert.ok(
        deliveryLog.every((entry) =>
          !(entry.event === 'nudge_triggered' && entry.source === 'notify_fallback_watcher')),
      );
    });
  });

  it('notify-hook leader mailbox nudge stays non-visible and logs mailbox transport', async () => {
    await withTempDir(async (cwd) => {
      const stateDir = join(cwd, '.omx', 'state');
      const logsDir = join(cwd, '.omx', 'logs');
      const teamName = 'alpha';
      const teamDir = join(stateDir, 'team', teamName);
      const mailboxDir = join(teamDir, 'mailbox');
      const fakeBinDir = join(cwd, 'fake-bin');
      const tmuxLogPath = join(cwd, 'tmux.log');

      await mkdir(logsDir, { recursive: true });
      await mkdir(mailboxDir, { recursive: true });
      await mkdir(fakeBinDir, { recursive: true });
      await writeFile(join(fakeBinDir, 'tmux'), buildFakeTmux(tmuxLogPath));
      await chmod(join(fakeBinDir, 'tmux'), 0o755);

      await writeFile(join(stateDir, 'team-state.json'), JSON.stringify({
        active: true,
        team_name: teamName,
        current_phase: 'team-exec',
      }, null, 2));
      await writeFile(join(teamDir, 'config.json'), JSON.stringify({
        name: teamName,
        tmux_session: 'alpha:0',
        leader_pane_id: '%42',
      }, null, 2));
      await writeFile(join(mailboxDir, 'leader-fixed.json'), JSON.stringify({
        worker: 'leader-fixed',
        messages: [
          {
            message_id: 'm1',
            from_worker: 'worker-1',
            to_worker: 'leader-fixed',
            body: 'ACK',
            created_at: '2026-02-14T00:00:00.000Z',
          },
        ],
      }, null, 2));

      const payload = {
        cwd,
        type: 'agent-turn-complete',
        'thread-id': 'thread-test',
        'turn-id': `turn-${Date.now()}`,
        'input-messages': ['test'],
        'last-assistant-message': 'output',
      };
      const result = spawnSync(process.execPath, [NOTIFY_HOOK_SCRIPT, JSON.stringify(payload)], {
        encoding: 'utf8',
        env: buildNotifyEnv(fakeBinDir),
      });
      assert.equal(result.status, 0, result.stderr || result.stdout);

      const tmuxLog = await readFile(tmuxLogPath, 'utf8');
      assert.doesNotMatch(tmuxLog, /send-keys/, 'leader mailbox nudge should not visibly inject');

      const deliveryLog = await readJsonLines(join(logsDir, `team-delivery-${new Date().toISOString().slice(0, 10)}.jsonl`));
      assert.ok(
        deliveryLog.some((entry) =>
          entry.event === 'nudge_triggered'
          && entry.source === 'notify_hook'
          && entry.team === teamName
          && entry.to_worker === 'leader-fixed'
          && entry.transport === 'mailbox'
          && entry.result === 'suppressed'),
      );
    });
  });

  it('leader mailbox dispatch telemetry records mailbox transport', async () => {
    await withTempDir(async (cwd) => {
      const stateDir = join(cwd, '.omx', 'state');
      const logsDir = join(cwd, '.omx', 'logs');
      const teamName = 'leader-mailbox-dispatch';
      const teamDir = join(stateDir, 'team', teamName);
      const fakeBinDir = join(cwd, 'fake-bin');
      const tmuxLogPath = join(cwd, 'tmux.log');

      await mkdir(logsDir, { recursive: true });
      await mkdir(join(teamDir, 'dispatch'), { recursive: true });
      await mkdir(fakeBinDir, { recursive: true });
      await writeFile(join(fakeBinDir, 'tmux'), buildFakeTmux(tmuxLogPath));
      await chmod(join(fakeBinDir, 'tmux'), 0o755);

      await writeFile(join(teamDir, 'config.json'), JSON.stringify({
        name: teamName,
        tmux_session: 'leader-mailbox-dispatch:0',
        leader_pane_id: '%42',
      }, null, 2));
      await writeFile(join(teamDir, 'dispatch', 'requests.json'), JSON.stringify([
        {
          request_id: 'req-1',
          kind: 'mailbox',
          team_name: teamName,
          to_worker: 'leader-fixed',
          worker_index: 0,
          pane_id: '%42',
          trigger_message: 'Read .omx/state/team/leader-mailbox-dispatch/mailbox/leader-fixed.json; worker-1 sent a new message. Review it and decide the next concrete step.',
          message_id: 'msg-1',
          inbox_correlation_key: 'msg-1',
          transport_preference: 'hook_preferred_with_fallback',
          fallback_allowed: true,
          status: 'pending',
          attempt_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ], null, 2));

      const result = await drainPendingTeamDispatch({
        cwd,
        stateDir,
        logsDir,
        maxPerTick: 5,
      });
      assert.equal(result.processed >= 1, true);

      const deliveryLog = await readJsonLines(join(logsDir, `team-delivery-${new Date().toISOString().slice(0, 10)}.jsonl`));
      assert.ok(
        deliveryLog.some((entry) =>
          entry.event === 'dispatch_result'
          && entry.source === 'notify-hook.team-dispatch'
          && entry.to_worker === 'leader-fixed'
          && entry.transport === 'mailbox'
          && entry.result === 'notified'
          && entry.reason === 'leader_mailbox_notified'),
      );
      assert.equal(existsSync(tmuxLogPath), false, 'leader mailbox dispatch should not touch tmux');
    });
  });
});
