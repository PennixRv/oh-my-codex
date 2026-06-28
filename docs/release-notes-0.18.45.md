# oh-my-codex-pennix v0.18.45

`0.18.45` is a targeted native-hook reliability patch for the Pennix fork. It narrows a noisy global-hook failure mode by making internal OMX `PostToolUse` observation and remediation failures fail open: the hook now logs OMX diagnostics and keeps returning normal Codex output whenever the user-facing `PostToolUse` contract can still proceed.

## Highlights

- **`PostToolUse` internal failures are now fail-open** - runtime lifecycle dispatch failures, transport-remediation/guidance generation failures, and worker success-bridge failures are logged as non-fatal OMX errors instead of exiting the Codex hook with code `1`.
- **Global-hook cross-session noise is reduced** - because OMX installs its native hook through user-global `~/.codex/hooks.json`, one session's internal OMX `PostToolUse` failure no longer surfaces unrelated `PostToolUse hook (failed)` banners in other Codex sessions.
- **The new contract is regression-covered** - active native-hook tests now prove non-fatal runtime dispatch failures, preserved transport-remediation guidance after a dispatch failure, and non-fatal worker bridge failures.

## Fixes / compatibility

- `src/scripts/codex-native-hook.ts` now records non-fatal `PostToolUse` errors in structured hook results and OMX logs while preserving normal hook output when possible.
- The fail-open handling is intentionally limited to `PostToolUse`; `PreToolUse` and `Stop` keep their stricter fail-closed semantics.
- `src/scripts/__tests__/codex-native-hook.test.ts` adds active regression coverage for the new `PostToolUse` fail-open behavior.

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
