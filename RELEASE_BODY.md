# oh-my-codex-pennix v0.18.45

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release ships a targeted native-hook reliability fix for the Pennix fork: internal OMX `PostToolUse` observation and remediation failures are now logged and surfaced as OMX diagnostics instead of failing the global Codex `PostToolUse` hook for every session that shares `~/.codex/hooks.json`.

## Highlights

- `PostToolUse` internal failures are now fail-open - runtime lifecycle dispatch failures, transport-remediation/guidance generation failures, and worker success-bridge failures are logged as non-fatal OMX diagnostics instead of exiting the Codex hook with code `1`.
- Global-hook cross-session noise is reduced - because OMX installs through user-global `~/.codex/hooks.json`, a single session's internal OMX `PostToolUse` failure no longer produces unrelated `PostToolUse hook (failed)` banners across other Codex sessions.
- The fail-open contract is regression-covered - active tests now prove non-fatal runtime dispatch failure handling, preserved transport-remediation guidance after dispatch failure, and non-fatal worker bridge failures.

## Fixes / compatibility

- `src/scripts/codex-native-hook.ts` now records non-fatal `PostToolUse` internal failures and keeps returning normal hook output when the user-facing hook contract can still proceed.
- Only `PostToolUse` received the fail-open handling; `PreToolUse` and `Stop` keep their prior fail-closed behavior.
- `src/scripts/__tests__/codex-native-hook.test.ts` adds active regression coverage for the new `PostToolUse` fail-open contract.

## Merged PR inventory

- No merged PRs. `0.18.45` is a direct release-line commit on the Pennix fork.

## Validation

- `npm run build`
- `node dist/scripts/run-test-files.js dist/scripts/__tests__/codex-native-hook.test.js dist/hooks/extensibility/__tests__/runtime.test.js`
- `node --test dist/scripts/__tests__/codex-native-hook.test.js`
- `node dist/scripts/check-version-sync.js --tag v0.18.45`
- `git diff --check`
- `npm pack --dry-run`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.44...v0.18.45`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.44...v0.18.45)
