# oh-my-codex-pennix v0.18.66

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release ships a bounded Pennix hotfix for clean uninstall/reinstall safety. It fixes a real plugin-mode uninstall regression that could delete user-authored `developer_instructions` wholesale, especially when the value used multiline TOML strings around the OMX fragment.

## Highlights

- `omx uninstall` now parses root `developer_instructions` with the TOML parser, so multiline and triple-quoted user instructions are visible to cleanup instead of being skipped by a single-line JSON-only heuristic.
- Uninstall now strips only the managed `notify` key during the generic OMX top-level cleanup pass and removes the OMX `developer_instructions` fragment separately, preserving user-authored text around that fragment.
- Release regression coverage now locks the exact clean reinstall failure we hit in the live environment: multiline custom `developer_instructions` with the current plugin-mode OMX fragment must survive uninstall with only the OMX portion removed.

## Fixes / compatibility

- Pennix plugin-mode setup/append semantics are unchanged; this hotfix is specifically about uninstall preserving user-owned text that setup previously appended the OMX fragment to.
- Team runtime, mailbox-boundary delivery, HUD behavior, and shared-session teardown semantics from `0.18.65` remain unchanged in this cut.
- The new regression test covers the exact multiline-TOML shape observed in the live environment, reducing the chance of another clean-reinstall data-loss regression.

## Merged PR inventory

- No merged PRs. `0.18.66` is a direct release-line commit on the Pennix fork.

## Validation

- `npm run build`
- `npm run verify:native-agents && npm run verify:plugin-bundle`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/uninstall.test.js dist/hooks/__tests__/notify-hook-tmux-scrollback.test.js dist/team/__tests__/runtime.test.js`
- `node dist/scripts/check-version-sync.js --tag v0.18.66`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.65...v0.18.66`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.65...v0.18.66)
