# Release Notes: oh-my-codex 0.18.57

## Summary

`0.18.57` finalizes the Pennix fork interactive mailbox-boundary handoff path. Interactive team workers now consume unread leader mailbox messages at native hook boundaries instead of depending on steady-state tmux injection fallback, and the runtime/bootstrap/test contract now matches that design.

## Highlights

- Interactive worker steady-state mailbox delivery now resolves to explicit `mailbox_boundary` dispatch semantics.
- Unread leader and worker mailbox batches now surface through `UserPromptSubmit` and `PreToolUse` native-hook `additionalContext`.
- Worker mailbox trigger text now tells workers to finish the current step, read the real mailbox file, mark delivery, and continue feasible work.
- Delivery telemetry now records `worker_mailbox_boundary_delivery` consistently across runtime and dispatch state.

## Fixes / compatibility notes

- Interactive steady-state mailbox review no longer treats tmux pane injection as the primary worker delivery path.
- Worker mailbox context is deduped by unread batch signature within the same session/turn boundary and delivered messages are ignored.
- Focused regression coverage now locks the leader/worker mailbox boundary contract end-to-end at the JS runtime layer.

## Merged PR inventory

- No merged PRs in `v0.18.56..v0.18.57`.
- Candidate changes are direct release-line commits on `main`.

## Validation evidence

- `npm run build`
- `node dist/scripts/run-test-files.js dist/team/__tests__/delivery-e2e-smoke.test.js dist/team/__tests__/runtime.test.js dist/scripts/__tests__/codex-native-hook.test.js dist/team/__tests__/mcp-comm.test.js dist/team/__tests__/worker-bootstrap.test.js`
- published-artifact reinstall smoke pending tag-triggered release publication

## Full changelog

- Compare: [`v0.18.56...v0.18.57`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.56...v0.18.57)
