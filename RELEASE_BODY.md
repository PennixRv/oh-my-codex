# oh-my-codex-pennix v0.18.64

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release ships the Pennix team/runtime and setup-preservation line. It preserves user-owned plugin guidance and native-agent edits across repeated setup runs, hardens worker startup/model-routing and mailbox-boundary runtime behavior, and improves the surrounding auth/session tooling so project runtime Codex history and slot rotation remain durable after reinstall and long-lived use.

## Highlights

- `omx setup` now preserves the active plugin `developer_instructions` fragment, preserves user-owned OMX policy blocks in regenerated `AGENTS.md`, and uses a native-agent install manifest so repeated refreshes overwrite only OMX-managed TOMLs unless forced.
- Team runtime now correctly seeds Gemini startup prompts, keeps HUD-disabled relaunches stable, and exposes clearer exact-role / inherited-model worker launch diagnostics while preserving mailbox-boundary delivery semantics.
- `omx auth add`, `--hotswap`, `session search`, and `resume` now handle isolated login homes, invalidated slots, project runtime Codex homes, and madmax boxed-run transcript history with less state bleed and cleaner operator ergonomics.

## Fixes / compatibility

- Pennix mailbox-first team behavior remains unchanged; this release continues the boundary-driven leader/worker handoff model and does not reintroduce synthetic tmux inject reminders.
- Spark-lane default native agents no longer inherit an incompatible root `model_provider` when they stay on the default Spark model, which prevents custom-provider drift in fast-lane agent generation.
- Event-level notification platform blocks now inherit top-level credentials and `OMX_DISCORD_MENTION` fallback only when those values are missing locally, so explicit mentions and event overrides still win.
- The plugin native-hook launcher now uses a Windows-safe spawn contract for script entrypoints, and the native hook hardens active-goal / native-subagent-capacity guardrails without turning `PostToolUse` into a fatal global failure path.

## Merged PR inventory

- No merged PRs. `0.18.64` is a direct release-line commit on the Pennix fork.

## Validation

- `npm run build`
- `npm run verify:native-agents && npm run verify:plugin-bundle`
- `npm run test:recent-bug-regressions:compiled`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/setup-agents-overwrite.test.js dist/cli/__tests__/auth.test.js dist/cli/__tests__/codex-plugin-layout.test.js dist/cli/__tests__/doctor-warning-copy.test.js dist/cli/__tests__/session-search-help.test.js dist/cli/__tests__/session-search.test.js dist/session-history/__tests__/search.test.js`
- `node dist/scripts/check-version-sync.js --tag v0.18.64`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.63...v0.18.64`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.63...v0.18.64)
