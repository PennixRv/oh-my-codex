# Release readiness: oh-my-codex 0.18.26

## Scope

- Previous tag: `v0.18.25`.
- Candidate release tag: `v0.18.26`.
- Release focus: repair the remaining OMX team worker prompt-contract drift after `0.18.25`, specifically the incomplete lifecycle CLI examples, redundant skill-loading bootstrap loop, and stale wait-for-terminal continuation guidance.

## Included fixes

- Worker-facing runtime prompts, inboxes, follow-up assignments, and skills now show executable `omx team api ... --input <json> --json` commands for claim, transition, and release operations.
- Live runtime worker surfaces now treat runtime-generated instructions plus inbox/task state as authoritative and no longer bounce workers through a redundant `load skill -> ACK -> inbox` loop after startup.
- Worker continuation guidance now stays state-first: after ACKs and mailbox replies, workers continue assigned work or the next feasible task and wait on state changes when no task is ready.

## Explicit non-goals

- Dirty leader workspace rejection for worktree provisioning remains an intentional safety gate.
- Codex prompt-mode workers without a real TTY remain unsupported in this release.

## Root cause summary

- `transition-task-status --json` failures were caused by worker-facing instruction surfaces emitting incomplete lifecycle commands that omitted the required `--input` payload even though CLI/API validation required `team_name`, `task_id`, `from`, `to`, and `claim_token`.
- ACK-only stalls were caused by a prompt-contract loop across runtime worker surfaces and the worker skill: runtime bootstrap told workers to load the skill, the skill told workers to return to inbox instructions after ACK, and inbox/bootstrap surfaces could route them back into the same startup sequence.
- Some runtime text still told workers to “wait for the next instruction from the lead,” which conflicted with the state-first design and made terminal nudges look authoritative again.

## Local verification

- [x] `npm run build`
- [x] `npm run lint`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.26`
- [x] `npm run verify:plugin-bundle`
- [x] Worker bootstrap + API interop regressions:
  - `node dist/scripts/run-test-files.js dist/team/__tests__/worker-bootstrap.test.js dist/team/__tests__/api-interop.test.js`
- [x] Full compiled runtime regression file:
  - `node dist/scripts/run-test-files.js dist/team/__tests__/runtime.test.js`
- [x] Compiled recent-bug regression suite:
  - `npm run test:recent-bug-regressions:compiled`
- [x] Real OMX team lifecycle smoke on rebuilt local CLI
  - Ran against temporary git repos with a PATH-prepended wrapper that forces worker panes to execute the rebuilt local `dist/cli/omx.js` instead of the globally installed npm build.
  - First live smoke confirmed the repaired startup/claim/transition path and merged `LIVE_SMOKE_RESULT.txt` back to leader during shutdown.
  - Second live smoke specifically validated the prompt-contract fix:
    - runtime-generated worker inbox renders shell-safe single-quoted `--input '{...}' --json` commands instead of broken `--input "{"..."}"` quoting.
    - live worker sent startup ACK, claimed task `1`, persisted `status: "in_progress"` plus a valid claim token, auto-checkpointed work, successfully called `transition-task-status`, emitted leader integration mail, and leader shutdown completed cleanly.
    - leader repo ended with merged `LIVE_QUOTE_RESULT.txt` containing `QUOTE_OK`.
- [ ] Tag workflow / GitHub release / npm publication
  - Pending standard GitHub tag-triggered release flow.

## Verdict

`0.18.26` is the prompt-contract repair candidate for the team lifecycle train: the runtime behavior remains intact, worker-facing lifecycle commands are executable again, and the remaining ACK/bootstrap wording loop has been removed from the authoritative worker surfaces.
