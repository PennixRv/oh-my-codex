---
title: "OMX team lifecycle restart smoke failures 2026-06-24"
tags: ["omx", "team", "lifecycle", "dispatch", "shutdown", "resume", "prompt-injection"]
created: 2026-06-24T01:59:16.727Z
updated: 2026-06-24T12:05:00+08:00
sources: []
links: []
category: debugging
confidence: medium
schemaVersion: 1
---

# OMX team lifecycle restart smoke failures 2026-06-24

# OMX team lifecycle restart smoke failures (2026-06-24)

## Scope
Real tmux runtime retry after session restart, using `omx team` directly rather than in-process fanout. Objective was to rerun the full team lifecycle and record issues.

## Findings observed before root-cause analysis

### [Critical] Startup task/prompt delivery failed on default interactive path
Evidence:
- A real team was created in `/tmp/omx-team-smoke` with canonical state under `.omx/state/team/team-lifecycle-restar-6ffbca5f/`.
- Worker pane `%35` and HUD pane `%36` were created.
- `omx team status team-lifecycle-restar-6ffbca5f --json` repeatedly showed `pending=1`, `in_progress=0`, `completed=0`.
- Worker pane remained on the Codex idle screen and never sent ACK / task claim / completion.
- `workers/worker-1/status.json` recorded `{"state":"unknown","reason":"hook_timeout_without_fallback"}`.
- `dispatch/requests.json` contained a `startup-trigger` request with `transport_preference=hook_preferred_with_fallback`, `fallback_allowed=false`, `status=failed`, `last_reason=hook_timeout_without_fallback`.
- `events/events.ndjson` recorded `ready_prompt_timeout`, then `hook_timeout_without_fallback`, then a `team_leader_nudge` with `ack_without_start_evidence`.

### [Major] Resume could not reattach to a still-live but stalled team
Evidence:
- While the stalled team state directory and worker pane still existed, `omx team resume team-lifecycle-restar-6ffbca5f` returned `No resumable team found for team-lifecycle-restar-6ffbca5f`.

### [Major] Forced shutdown reported success but did not complete cleanup
Evidence:
- `omx team shutdown team-lifecycle-restar-6ffbca5f --force --confirm-issues` printed `Team shutdown complete: team-lifecycle-restar-6ffbca5f`.
- After that, tmux panes still included worker `%35` and HUD `%36`.
- A team directory was still observed on disk during the live session; later inspection only confirmed residual runtime artifacts under `.omx/team/team-lifecycle-restar-6ffbca5f/worktrees`. Whether canonical `.omx/state/team/<team>/` was still present at the exact end of shutdown remains less certain than the pane residue.

### [Major, UX/precondition] Default worktree mode refused launch on a dirty leader workspace
Evidence:
- Launching from `/home/penn/devel/oh-my-codex` failed immediately because untracked file `oh-my-codex-pennix-0.18.22.tgz` triggered `leader_workspace_dirty_for_worktrees:...:commit_or_stash_before_omx_team`.

### [Minor] Prompt-mode was not an immediate workaround for Codex workers
Evidence:
- `OMX_TEAM_WORKER_LAUNCH_MODE=prompt omx team ...` in a fresh clone failed with `prompt_mode_codex_requires_tty`.

## Fix status after implementation

### Fixed in local source

#### Startup task/prompt delivery on default interactive Codex path
Status:
- Fixed in source on 2026-06-24.

What changed:
- Interactive Codex/Claude workers no longer rely on a startup-direct pre-injection attempt before the canonical startup dispatch path.
- The default startup path now keeps a single `startup-trigger` request with normal startup evidence gating, and can still use the existing internal direct fallback confirmation path when the hook receipt path alone does not settle startup evidence.
- The fork-local short-circuit that skipped the canonical startup dispatch after a failed `startupDirectOutcome` was removed.

Verification:
- `node --test --test-name-pattern 'single startup dispatch without replay|missing startup evidence as recoverable while preserving a single startup request|ready-prompt timeout without startup evidence|confirmed ready prompt as startup evidence after hook notification|rejects no-evidence startup issues instead of treating live panes as recoverable' dist/team/__tests__/runtime.test.js`
- All targeted startup regressions passed locally on 2026-06-24.

#### Resume could not reattach to a still-live shared-session team
Status:
- Fixed in source on 2026-06-24.

What changed:
- `resumeTeam()` now treats a team as resumable when the persisted worker pane is still live, even if the saved `tmux_session` points at a shared session/window target such as `leader:0` rather than an `omx-team-*` session namespace.

Verification:
- `node --test --test-name-pattern 'resumeTeam reuses shared-session teams when the worker pane is still live' dist/team/__tests__/runtime.test.js`
- Passed locally on 2026-06-24.

#### Forced shutdown reported success but left pane/runtime residue
Status:
- Fixed in source on 2026-06-24.

What changed:
- Interactive shutdown now escalates pane teardown failures instead of silently reporting success.
- Runtime cleanup now removes `.omx/team/<team>/worktrees` when that directory is empty, allowing the team runtime root to be deleted when nothing meaningful remains.
- Follow-up after the failed `v0.18.24` release workflow: shutdown now distinguishes stale/missing pane ids from fatal pane kill failures so best-effort cleanup behavior is preserved for already-dead panes and reconciled shared-session pane drift.

Verification:
- `node --test --test-name-pattern 'shutdownTeam removes the runtime team root|shutdownTeam surfaces pane teardown failures' dist/team/__tests__/runtime.test.js`
- Passed locally on 2026-06-24.

### Confirmed design constraint, not fixed

#### Dirty leader workspace blocks default worktree launch
Status:
- Not a bug in this release scope.

Assessment:
- The `leader_workspace_dirty_for_worktrees:...:commit_or_stash_before_omx_team` failure is the current safety gate from `assertCleanLeaderWorkspaceForWorkerWorktrees(...)`.
- This protects detached worker worktree provisioning from inheriting an ambiguous or partially staged leader state.
- No change was made here.

#### Codex prompt-mode without a TTY
Status:
- Confirmed limitation, not fixed in this release scope.

Assessment:
- `prompt_mode_codex_requires_tty` is an explicit runtime guard, not a newly introduced lifecycle regression.
- Supporting Codex prompt-mode workers without tmux would require a real PTY-backed launch surface or equivalent runtime change; the current repo does not have an existing PTY implementation to reuse.
- This remains intentionally unsupported for now.

Verification:
- `node --test --test-name-pattern 'startTeam rejects codex prompt mode without tmux with an explicit non-tty error' dist/team/__tests__/runtime.test.js`
- Passed locally on 2026-06-24.

## Evidence paths
- `/tmp/omx-team-smoke/.omx/state/team/team-lifecycle-restar-6ffbca5f/startup-timing.json`
- `/tmp/omx-team-smoke/.omx/state/team/team-lifecycle-restar-6ffbca5f/events/events.ndjson`
- `/tmp/omx-team-smoke/.omx/state/team/team-lifecycle-restar-6ffbca5f/dispatch/requests.json`
- `/tmp/omx-team-smoke/.omx/state/team/team-lifecycle-restar-6ffbca5f/workers/worker-1/status.json`
- `/tmp/omx-team-smoke/.omx/state/team/team-lifecycle-restar-6ffbca5f/workers/worker-1/inbox.md`
- `/tmp/omx-team-smoke/.omx/state/team/team-lifecycle-restar-6ffbca5f/monitor-snapshot.json`

## Next analysis questions
1. Why did startup-trigger end up with `fallback_allowed=false` on the default interactive startup path?
2. Why did `resume` reject a team whose pane and state still existed?
3. Why did forced shutdown print success without removing panes/state?
4. Are these three symptoms all downstream of one stale-runtime-state invariant, or separate bugs?

## Root-cause analysis

This section is finding-first and separates direct evidence from inference.

Historical note:
- The findings below describe the pre-fix failure mode observed in the original smoke run.
- Current local source has already diverged from that failing path: Codex/Claude interactive startup now goes through the canonical startup dispatch path directly, and the canonical startup path allows the bounded internal fallback/evidence-confirmation behavior that was missing in the failing run.

### Ranked synthesis

| Rank | Finding | Confidence | Basis |
| --- | --- | --- | --- |
| 1 | Startup prompt delivery failure is caused by the default interactive startup path explicitly setting `allowFallback: false` on a hook-preferred `startup-trigger` dispatch. | High | Direct code path in `src/team/runtime.ts` plus observed `fallback_allowed=false` / `hook_timeout_without_fallback`. |
| 2 | `resume` fails for some still-live split-pane teams because resumability checks look only for `omx-team-*` tmux sessions, while split-pane startup persists the current shared session/window target such as `leader:0`. | Medium-high | Direct mismatch between `resumeTeam()` and shared-session startup/session discovery code. |
| 3 | Forced shutdown success does not verify pane teardown or complete runtime artifact cleanup; pane kill failures are non-fatal and runtime directory removal is conditional. | Medium-high | CLI prints success after `shutdownTeam()` returns; pane teardown summaries are ignored; `.omx/team/<team>/worktrees` can remain. |

### Finding 1: startup dispatch failure on default interactive path

Evidence:
- `src/team/runtime.ts:3212` to `src/team/runtime.ts:3230` dispatches the startup inbox through `dispatchCriticalInboxInstruction(...)` with `allowFallback: false`.
- `src/team/runtime.ts:4724` to `src/team/runtime.ts:4734` queues that request as `transportPreference: 'hook_preferred_with_fallback'` while persisting `fallbackAllowed: allowFallback`.
- `src/team/runtime.ts:4813` to `src/team/runtime.ts:4824` shows the exact no-fallback branch: when no hook receipt confirms delivery in time, the request is failed with `hook_timeout_without_fallback` or `hook_receipt_failed_without_fallback`, and the direct fallback path is skipped.
- `src/team/runtime.ts:3198` to `src/team/runtime.ts:3231` shows this happens after startup direct trigger did not safely settle delivery.
- The live smoke observation recorded the matching symptoms: worker pane stayed idle, worker status became `unknown/hook_timeout_without_fallback`, and the dispatch request was `startup-trigger` with `fallback_allowed=false`.

Inference:
- The primary bug is not “hook dispatch exists” but “startup path disables fallback on a hook-preferred request.” Once the hook path misses the receipt deadline, no direct `tmux send-keys` recovery is attempted, so the worker never sees the real assignment.
- The remaining unknown is why the hook did not confirm delivery before timeout. The code and preserved observations are enough to explain the failure mode without resolving that sub-cause.

Down-ranked alternatives:
- Dispatch normalization corruption: down-ranked because `fallback_allowed=false` originates at the startup call site, not in storage normalization.
- Worker death/missing pane: down-ranked because the worker pane stayed alive and startup recorded a recoverable no-evidence state rather than a dead-worker terminal state.

### Finding 2: resume/shared-session discovery mismatch

Evidence:
- `src/cli/team.ts:1670` to `src/cli/team.ts:1676` prints `No resumable team found ...` only when `resumeTeam(...)` returns `null`.
- `src/team/runtime.ts:4230` to `src/team/runtime.ts:4282` shows interactive `resumeTeam()` requires the saved `config.tmux_session` base session to appear in `getTeamTmuxSessions(sanitized)`.
- `src/notifications/tmux.ts:158` to `src/notifications/tmux.ts:168` shows `getTeamTmuxSessions()` only returns sessions named `omx-team-<team>` or `omx-team-<team>-...`.
- `src/team/tmux-session.ts:1345` to `src/team/tmux-session.ts:1359` shows split-pane startup captures the current tmux target as `<session_name>:<window_index>`, not an `omx-team-*` session name.
- `src/team/runtime.ts:4300` onward uses broader live-team discovery logic elsewhere, and shared-session activity can still be inferred from pane liveness.

Inference:
- A split-pane team can remain live enough to have worker panes and durable state while still failing `resume`, because `resumeTeam()` is checking the wrong session namespace for this startup mode.
- This is a separate lifecycle bug from startup dispatch, though the startup failure made it easier to observe.

Down-ranked alternatives:
- Intentional non-resumable state after startup failure: down-ranked because startup no-evidence reasons are handled as “still actionable” recoverable states elsewhere in runtime logic.
- Missing config only: possible in general, but weaker here because repeated `status` calls and team artifacts proved the team config/state existed during the smoke.

### Finding 3: shutdown success is weaker than actual cleanup

Evidence:
- `src/cli/team.ts:1698` to `src/cli/team.ts:1722` prints `Team shutdown complete` after `shutdownTeam()` returns, with no post-condition check for pane liveness or artifact deletion.
- `src/team/runtime.ts:3931` to `src/team/runtime.ts:3940` shows `--force` bypasses the graceful ACK flow and proceeds directly to teardown.
- `src/team/runtime.ts:4024` to `src/team/runtime.ts:4089` handles interactive pane teardown.
- `src/team/tmux-session.ts:2337` to `src/team/tmux-session.ts:2341` kills a pane asynchronously but does not inspect success.
- `src/team/tmux-session.ts:2446` to `src/team/tmux-session.ts:2473` records pane kill failures in a summary but does not throw.
- `src/team/runtime.ts:4086` ignores the returned teardown summary.
- `src/team/state.ts:2195` to `src/team/state.ts:2197` shows canonical state cleanup only deletes `resolveTeamStateRoot(cwd)/team/<team>`.
- `src/team/runtime.ts:1693` to `src/team/runtime.ts:1700` removes `.omx/team/<team>` only when that directory is already empty.

Inference:
- Forced shutdown can report success even when `%35` or `%36` survive, because pane kill failures are not escalated.
- The currently confirmed residual on disk is runtime artifact residue under `.omx/team/<team>/worktrees`, not a hard proof that canonical `.omx/state/team/<team>` always survives successful shutdown.
- If canonical state really remained during the live moment, a plausible explanation is cwd/state-root mismatch at shutdown time; that remains an inference, not a confirmed fact from current surviving artifacts.

Down-ranked alternatives:
- `--confirm-issues` itself causing cleanup skip: down-ranked because forced shutdown bypasses the normal gate regardless.
- Filesystem deletion failure in the canonical cleanup path: down-ranked because that path would normally throw and prevent the success message if the same resolved state root were being cleaned.

### Evidence vs inference summary

Evidence:
- Startup dispatch explicitly disables fallback for the default interactive startup path.
- `resumeTeam()` only accepts `omx-team-*` session discovery for interactive teams.
- Shutdown success is printed without post-cleanup verification, and pane teardown failures are non-fatal.
- Runtime artifact cleanup under `.omx/team/<team>` only removes empty directories.

Inference:
- The three observed failures are related but not identical. The startup bug is primary for prompt non-delivery; the resume bug is a shared-session identity mismatch; the shutdown issue is a cleanup-verification and artifact-retention weakness.
- The shutdown observation about canonical state likely mixed a live-session observation with later artifact state. The residue we can still confirm is pane residue plus runtime artifact residue.

### Limits

- The original `/tmp/omx-team-smoke/.omx/state/team/team-lifecycle-restar-6ffbca5f/...` files from the live failure are no longer available, so some shutdown details now rely on the recorded observation plus surviving source analysis.
- The exact reason the hook dispatcher missed startup delivery before timeout remains unresolved in this page; what is resolved is why that timeout became terminal for startup prompt injection.
