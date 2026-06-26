# Release readiness: oh-my-codex 0.18.30

## Scope

- Previous published tag: `v0.18.29`.
- Candidate release tag: `v0.18.30`.
- Release focus: fix the fresh-repository team startup regression where plain `omx team` forced detached worktree mode before runtime could detect that the repository had no initial commit, and remove visible leader-side tmux injection from mailbox-driven fallback notifications.

## Included fixes

- Plain `omx team` now passes an explicit worktree mode into runtime only when the operator actually requested `--worktree`.
- Default team worktree selection is again runtime-owned: normal committed repositories keep detached worktrees by default, while unborn repositories fall back cleanly to `workspace_mode: single`.
- Fallback watcher leader nudges now stay telemetry-only instead of recreating visible `send-keys` prompts on the leader pane.
- Leader mailbox dispatch now records mailbox transport and keeps the leader-visible path non-injective when the mailbox is the canonical delivery target.
- An unborn-repository regression test now locks the expected fallback contract so future CLI changes cannot reintroduce the eager `HEAD` dependency.

## Root cause summary

- The runtime already contained safe capability probing in `resolveEffectiveTeamWorktreeMode()`, including a fallback to non-worktree execution when the repository could not support team worktrees.
- The CLI layer overrode that behavior by synthesizing a fake default worktree mode for plain `omx team`, which effectively turned an implicit runtime choice into an explicit forced detached-worktree request.
- In a fresh `git init` repository without an initial commit, that eager forced mode reached git worktree creation early and failed with `fatal: ambiguous argument 'HEAD'`.
- Independently, leader notification flow had a second visibility problem: the fallback watcher and mailbox dispatch code could still emit tmux send-keys prompts for leader-facing nudges instead of staying mailbox-first.
- The fix set is intentionally narrow: preserve runtime-owned default resolution for the no-flag path, keep explicit `--worktree` behavior unchanged, and route leader mailbox activity away from visible tmux injection.

## Local verification

- [x] `npm run build`
- [x] `npm run lint`
- [x] `npm run test:node`
- [x] `npm run verify:native-agents`
- [x] `npm run verify:plugin-bundle`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.30`
- [x] Local source-built smoke in a committed repo:
  - `node dist/cli/omx.js team 1:executor "create file NORMAL_REPO_SMOKE.txt with exact content NORMAL_OK and complete the task"`
  - verify startup uses `workspace_mode: worktree`
  - verify task completes and file exists
- [x] Local source-built smoke in an unborn repo:
  - `node dist/cli/omx.js team 1:executor "create file UNBORN_REPO_SMOKE.txt with exact content UNBORN_OK and complete the task"`
  - verify startup uses `workspace_mode: single`
  - verify team no longer crashes on missing `HEAD`
- [ ] Tag workflow / GitHub release / npm publication
- [ ] npm-installed smoke in both committed and unborn repos after publish

## Verdict

`0.18.30` is the targeted publish candidate for the remaining fresh-repository startup regression and the leader-side visibility cleanup: it preserves the established default detached-worktree lifecycle in normal repos, restores the intended runtime capability probe, removes the eager `HEAD` dependency for plain `omx team` in unborn repositories, and keeps leader mailbox activity off the visible tmux fallback path.
