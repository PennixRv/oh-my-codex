# oh-my-codex-pennix v0.18.57

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release ships the Pennix fork mailbox-boundary handoff follow-up: interactive team workers now consume unread leader mailbox messages at native hook prompt/tool boundaries instead of relying on tmux injection fallback, while leader/worker guidance and dispatch telemetry are aligned to the same boundary-driven contract.

## Highlights

- Interactive worker steady-state mailbox delivery now resolves to durable `mailbox_boundary` dispatches, so unread leader messages surface through native-hook `additionalContext` on the next `UserPromptSubmit` or `PreToolUse` boundary instead of being re-injected into tmux panes.
- Worker mailbox dispatch state is now marked notified immediately with explicit `worker_mailbox_boundary_delivery` telemetry, keeping runtime, dispatch logs, and boundary consumption aligned without synthetic reminder writes back into the leader mailbox.
- Worker mailbox trigger copy now tells workers to finish the current step, read the real mailbox file, mark messages delivered, and continue feasible work, matching the intended boundary-driven leader/worker mental model.
- Regression coverage now locks unread leader and worker mailbox context handoff, same-batch dedupe, delivered-message ignore behavior, and interactive worker boundary dispatch semantics.

## Fixes / compatibility

- `src/scripts/codex-native-hook.ts` now resolves unread worker/leader mailbox batches directly from the real mailbox state and attaches them as structured boundary context, deduped per unread-batch signature and session/turn boundary.
- `src/team/runtime.ts`, `src/team/mcp-comm.ts`, and team dispatch state types now formalize `mailbox_boundary` as the interactive worker mailbox transport instead of treating steady-state worker messages as hook-preferred tmux injection work.
- `src/team/worker-bootstrap.ts` and related guidance/tests now describe worker mailbox handling as boundary-delivered asynchronous review rather than visible injection or retry-driven prompting.

## Merged PR inventory

- No merged PRs. `0.18.57` is a direct release-line commit on the Pennix fork.

## Validation

- `npm run build`
- `node dist/scripts/run-test-files.js dist/team/__tests__/delivery-e2e-smoke.test.js dist/team/__tests__/runtime.test.js dist/scripts/__tests__/codex-native-hook.test.js dist/team/__tests__/mcp-comm.test.js dist/team/__tests__/worker-bootstrap.test.js`
- `node dist/scripts/check-version-sync.js --tag v0.18.57`
- `git diff --check`
- `npm pack --dry-run`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.56...v0.18.57`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.56...v0.18.57)
