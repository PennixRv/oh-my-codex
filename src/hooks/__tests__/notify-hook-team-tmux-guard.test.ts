import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chmod, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function isolatedChildEnv(fakeBinDir: string): NodeJS.ProcessEnv {
  const tmuxBin = join(fakeBinDir, 'tmux');
  return {
    PATH: `${fakeBinDir}:${process.env.PATH ?? ''}`,
    OMX_TEST_TMUX_BIN: tmuxBin,
    HOME: process.env.HOME,
    TMPDIR: process.env.TMPDIR,
    TEMP: process.env.TEMP,
    TMP: process.env.TMP,
    SystemRoot: process.env.SystemRoot,
    WINDIR: process.env.WINDIR,
  };
}

function runSendPaneInputInChild(params: {
  fakeBinDir: string;
  moduleUrl: string;
  paneTarget: string;
  prompt: string;
  submitKeyPresses: number;
  typePrompt: boolean;
  queueFirstSubmit?: boolean;
}) {
  const payload = JSON.stringify({
    paneTarget: params.paneTarget,
    prompt: params.prompt,
    submitKeyPresses: params.submitKeyPresses,
    tmuxBin: join(params.fakeBinDir, 'tmux'),
    typePrompt: params.typePrompt,
    queueFirstSubmit: params.queueFirstSubmit,
  });
  const script = `
    const input = ${payload};
    process.env.OMX_TEST_TMUX_BIN = input.tmuxBin;
    process.env.PATH = ${JSON.stringify('__CHILD_PATH__')};
    const { sendPaneInput } = await import(${JSON.stringify(params.moduleUrl)});
    const result = await sendPaneInput(input);
    process.stdout.write(JSON.stringify(result));
  `.replace('__CHILD_PATH__', `${params.fakeBinDir}:${process.env.PATH ?? ''}`);
  return spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    encoding: 'utf-8',
    env: isolatedChildEnv(params.fakeBinDir),
  });
}

const SESSION_START_HOOK_REVIEW_CAPTURE = `SessionStart hooks
Turn hooks on or off. Your changes are saved automatically.

[ ] Hook 1
[x] Hook 2

Event     SessionStart
Matcher   startup|resume|clear
Source    User config - ~/.codex/hooks.json
Command   "/usr/bin/node" "/home/penn/.npm-global/lib/node_modules/oh-my-codex-pennix/dist/scripts/codex-native-hook.js"
Timeout   600s
Trust     Trusted

Press space or enter to toggle; esc to go back`;

const HOOKS_OVERVIEW_CAPTURE = `Hooks
Lifecycle hooks from config and enabled plugins.

Event                 Installed   Active      Description
PreToolUse            2           2           Before a tool executes
PermissionRequest     1           1           When permission is requested
PostToolUse           2           2           After a tool executes
PreCompact            1           1           Before context compaction
PostCompact           1           1           After context compaction
SessionStart          2           1           When a new session starts
UserPromptSubmit      2           2           When the user submits a prompt
SubagentStart         0           0           When a subagent is created
SubagentStop          0           0           Right before a subagent ends its turn
Stop                  2           2           Right before Codex ends its turn

Press enter to view hooks; esc to close`;

describe('notify-hook team tmux guard', () => {
  it('dismisses both hook review layers before typing worker text', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'omx-team-tmux-guard-'));
    const fakeBinDir = join(cwd, 'fake-bin');
    const tmuxLogPath = join(cwd, 'tmux.log');

    try {
      await mkdir(fakeBinDir, { recursive: true });
      await writeFile(
        join(fakeBinDir, 'tmux'),
        `#!/usr/bin/env bash
set -eu
echo "$@" >> "${tmuxLogPath}"
state_dir="$(dirname "${tmuxLogPath}")"
stage_file="$state_dir/stage"
case "$1" in
  capture-pane)
    stage=0
    if [ -f "$stage_file" ]; then
      stage=$(cat "$stage_file")
    fi
    if [ "$stage" -ge 2 ]; then
      cat <<'EOF'
How can I help you today?
EOF
    elif [ "$stage" -eq 1 ]; then
      cat <<'EOF'
${HOOKS_OVERVIEW_CAPTURE}
EOF
    else
      cat <<'EOF'
${SESSION_START_HOOK_REVIEW_CAPTURE}
EOF
    fi
    ;;
  send-keys)
    if [ "\${4:-}" = "Escape" ]; then
      stage=0
      if [ -f "$stage_file" ]; then
        stage=$(cat "$stage_file")
      fi
      stage=$((stage + 1))
      printf '%s' "$stage" > "$stage_file"
    fi
    ;;
esac
exit 0
`,
      );
      await chmod(join(fakeBinDir, 'tmux'), 0o755);

      const moduleUrl = new URL('../../../dist/scripts/notify-hook/team-tmux-guard.js', import.meta.url).href;
      const result = runSendPaneInputInChild({
        fakeBinDir,
        moduleUrl,
        paneTarget: '%42',
        prompt: 'hello bridge',
        submitKeyPresses: 2,
        typePrompt: true,
      });

      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.error, undefined);
      assert.match(result.stdout, /"ok":true/);

      const log = await readFile(tmuxLogPath, 'utf-8');
      const lines = log.trim().split('\n').filter(Boolean);
      assert.equal(lines.filter((line) => /send-keys -t %42 Escape/.test(line)).length, 2);
      assert.match(
        lines.join('\n'),
        /capture-pane -t %42 -p\nsend-keys -t %42 Escape\ncapture-pane -t %42 -p\nsend-keys -t %42 Escape\nsend-keys -t %42 -l hello bridge\nsend-keys -t %42 C-m\nsend-keys -t %42 C-m/,
      );
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});
