# oh-my-codex-pennix v0.18.53

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release ships two narrow reliability fixes for the Pennix fork: `PostToolUse` dispatch failures are now fail-open at the CLI boundary instead of surfacing as `hook exited with code 1` noise across unrelated sessions, and plugin-cache refresh no longer deletes version-scoped hook paths that active Codex sessions may still be executing from.

## Highlights

- `PostToolUse` hook dispatch failures are now downgraded to non-fatal OMX errors at the native CLI boundary, preserving the hook session instead of returning exit code `1`.
- Plugin-mode setup now preserves historical version-scoped plugin cache directories, so upgrading OMX no longer pulls the hook entrypoint out from under older still-running Codex sessions.
- Same-version plugin cache repair now refreshes the packaged cache in place instead of deleting the cache directory first, shrinking the transient missing-file window for plugin-scoped hook entrypoints.
- The fail-open hook boundary and the plugin-cache lifecycle behavior are now both regression-covered.

## Fixes / compatibility

- `src/scripts/codex-native-hook.ts` now keeps `PostToolUse` top-level dispatch failures non-fatal while recording a fail-open audit trail.
- `src/scripts/__tests__/codex-native-hook.test.ts` now covers the CLI boundary so a forced `PostToolUse` dispatch failure exits cleanly instead of surfacing as hook failure noise.
- `src/cli/setup.ts` now stops invalidating historical version-scoped plugin cache directories just because the packaged version changed.
- `src/cli/plugin-marketplace.ts` now repairs the packaged plugin cache in place instead of deleting the version directory before copying the refreshed hook files back.
- `src/cli/__tests__/plugin-marketplace.test.ts` now covers historical cache preservation and in-place packaged-cache refresh.

## Merged PR inventory

- No merged PRs. `0.18.53` is a direct release-line commit on the Pennix fork.

## Validation

- `npm run build`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/plugin-marketplace.test.js dist/scripts/__tests__/codex-native-hook.test.js dist/cli/__tests__/doctor-warning-copy.test.js`
- `node dist/scripts/check-version-sync.js --tag v0.18.53`
- `git diff --check`
- `npm pack --dry-run`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.52...v0.18.53`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.52...v0.18.53)
