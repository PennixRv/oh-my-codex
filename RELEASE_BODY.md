# oh-my-codex-pennix v0.18.67

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release ships a bounded Pennix follow-up hotfix for clean uninstall/reinstall safety. It fixes the remaining uninstall residue discovered immediately after `0.18.66`: OMX was still leaving managed install-state files behind under `CODEX_HOME/.omx`, and the summary text overstated what had actually been removed.

## Highlights

- `omx uninstall` now removes managed `install-state.json` and `native-agents.json` from `CODEX_HOME/.omx`, so uninstall no longer leaves behind stale installed/setup version markers or native-agent manifests after a clean teardown.
- The new cleanup is intentionally narrow: unrelated `CODEX_HOME/.omx` files are preserved, and the directory is pruned only when those managed install artifacts were the last remaining entries.
- Uninstall summary output now distinguishes managed `CODEX_HOME/.omx` install artifacts from the separate project `.omx/` purge path, and regression coverage locks the precise preservation contract.

## Fixes / compatibility

- The `0.18.66` `developer_instructions` preservation hotfix remains intact; this cut only closes the remaining uninstall residue gap that appeared during published-artifact smoke.
- Team/runtime, mailbox-boundary delivery, HUD behavior, and prior tmux/session fixes remain unchanged in this cut.
- The new regression test covers mixed `CODEX_HOME/.omx` contents, proving that managed install artifacts are removed while unrelated files remain.

## Merged PR inventory

- No merged PRs. `0.18.67` is a direct release-line commit on the Pennix fork.

## Validation

- `npm run build`
- `npm run verify:native-agents && npm run verify:plugin-bundle`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/uninstall.test.js`
- `node dist/scripts/check-version-sync.js --tag v0.18.67`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.66...v0.18.67`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.66...v0.18.67)
