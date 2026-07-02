# Release Notes: oh-my-codex 0.18.63

## Summary

`0.18.63` ships the bounded upstream-integration Wave 4 for the Pennix fork. It fixes proxy env fallback trimming, adds bounded repo-local `.omx` / `.beads` ownership diagnostics and repair to `omx doctor`, and hardens ultragoal final-review blocker reconciliation so only the designated resolver story may cleanly close a review-blocked parent.

## Highlights

- Whitespace-only `https_proxy` / `http_proxy` values no longer mask a valid `ALL_PROXY`; proxy env values are trimmed before fallback selection.
- `omx doctor` now warns on root-owned, owner-mismatched, or non-writable repo-local runtime artifacts and can bounded-repair ownership drift under `--force` when the repo root belongs to the current user.
- Review-blocked ultragoal parents now record their designated resolver, only that resolver may carry the parent through the clean final quality gate path, and forged resolver aggregate reconciliation attempts fail closed.

## Fixes / compatibility notes

- Pennix mailbox-first team behavior remains unchanged; this release does not reintroduce tmux inject reminders, HUD-default changes, or broad planning-gate rewrites.
- The new `omx doctor` ownership repair path is intentionally bounded and skips repos whose root is not owned by the current user.
- Verbose `omx doctor` PostCompact smoke execution now uses a Windows-safe spawn path instead of assuming a shell-quoted POSIX command path.

## Merged PR inventory

- No merged PRs in `v0.18.62..v0.18.63`.
- Candidate changes are direct release-line commits on `main`.

## Validation evidence

- `npm run build`
- `node dist/scripts/run-test-files.js dist/ultragoal/__tests__/artifacts.test.js dist/cli/__tests__/doctor-artifact-ownership.test.js dist/notifications/__tests__/http-client.test.js`
- `npm run verify:native-agents && npm run verify:plugin-bundle`
- `node dist/scripts/check-version-sync.js --tag v0.18.63`

## Full changelog

- Compare: [`v0.18.62...v0.18.63`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.62...v0.18.63)
