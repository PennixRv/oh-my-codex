# oh-my-codex-pennix v0.18.63

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release ships the bounded upstream-integration Wave 4 for the Pennix fork. It fixes proxy env fallback trimming, surfaces repo-local runtime artifact ownership drift through `omx doctor` with bounded repair support, and hardens ultragoal final-review blocker reconciliation so only the designated resolver story may carry a review-blocked parent through the clean final quality gate.

## Highlights

- Whitespace-only `https_proxy` / `http_proxy` values no longer mask a valid `ALL_PROXY`; proxy env values are trimmed before fallback selection.
- `omx doctor` now warns on root-owned, owner-mismatched, or non-writable repo-local `.omx` / `.beads` artifacts and can bounded-repair ownership drift under `--force` when the repo root belongs to the current user.
- Review-blocked ultragoal parents now record their designated resolver, only that resolver may reconcile the parent through the clean final quality gate path, and forged resolver aggregate reconciliation attempts fail closed.

## Fixes / compatibility

- Pennix mailbox-first team behavior remains unchanged; this release does not reintroduce synthetic tmux inject reminders, HUD-default changes, or broad planning-gate rewrites.
- The new `omx doctor` ownership repair is bounded: it only auto-chowns repo-local `.omx` / `.beads` artifacts when the repo root is already owned by the current user.
- Verbose `omx doctor` PostCompact smoke execution now uses a Windows-safe spawn path instead of assuming a shell-quoted POSIX command path.

## Merged PR inventory

- No merged PRs. `0.18.63` is a direct release-line commit on the Pennix fork.

## Validation

- `npm run build`
- `node dist/scripts/run-test-files.js dist/ultragoal/__tests__/artifacts.test.js dist/cli/__tests__/doctor-artifact-ownership.test.js dist/notifications/__tests__/http-client.test.js`
- `npm run verify:native-agents && npm run verify:plugin-bundle`
- `node dist/scripts/check-version-sync.js --tag v0.18.63`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.62...v0.18.63`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.62...v0.18.63)
