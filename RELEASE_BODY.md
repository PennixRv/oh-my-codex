# oh-my-codex-pennix v0.18.55

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release ships the Pennix fork install/config and leader-mailbox boundary follow-up: OMX no longer owns the root `model_reasoning_effort`, npm postinstall no longer auto-runs setup, and leader-directed team mailbox dispatches now consistently land as durable mailbox boundary delivery instead of drifting between pending/deferred and visible-injection semantics.

## Highlights

- Root `model_reasoning_effort` is user-owned again: setup, plugin migration, and uninstall preserve explicit user settings such as `xhigh`, while still cleaning up only the old OMX-managed legacy root `medium` line.
- Global npm postinstall now records version state and prints a manual `omx setup` reminder instead of auto-running setup during install time.
- `leader-fixed` mailbox sends now consistently resolve to `leader_mailbox_boundary_delivery` across runtime and notify-hook dispatch consumers, with no direct leader-pane injection fallback and no synthetic pending/deferred branch when the leader pane is absent.
- Current OMX guidance now matches Codex full-history fork inheritance behavior, preferring narrow `agent_type` routing when needed without falsely requiring OMX to always force `agent_type`, `model`, or `reasoning_effort`.

## Fixes / compatibility

- `src/config/generator.ts`, `src/cli/setup.ts`, and `src/cli/uninstall.ts` now preserve user-owned root reasoning while only stripping the legacy OMX-managed root `medium` block shape.
- `src/scripts/postinstall.ts` now records the install stamp and logs a manual setup reminder instead of invoking setup during postinstall.
- `src/team/runtime.ts`, `src/team/mcp-comm.ts`, and `src/scripts/notify-hook/team-dispatch.ts` now treat `leader-fixed` mailbox traffic as durable boundary delivery all the way through runtime and hook dispatch accounting.
- Installed guidance surfaces in `src/config/generator.ts`, `src/cli/ralph.ts`, and `src/hooks/agents-overlay.ts` now describe conditional `agent_type` routing that respects Codex full-history fork inheritance.

## Merged PR inventory

- No merged PRs. `0.18.55` is a direct release-line commit on the Pennix fork.

## Validation

- `npm run build`
- `node dist/scripts/run-test-files.js dist/config/__tests__/generator-root-reasoning-contract.test.js dist/cli/__tests__/setup-agents-overwrite.test.js dist/cli/__tests__/uninstall.test.js dist/scripts/__tests__/postinstall.test.js dist/team/__tests__/mcp-comm.test.js dist/team/__tests__/runtime.test.js dist/hooks/__tests__/notify-hook-team-dispatch.test.js`
- `npm run test:node`
- `node dist/scripts/check-version-sync.js --tag v0.18.55`
- `git diff --check`
- `npm pack --dry-run`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.54...v0.18.55`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.54...v0.18.55)
