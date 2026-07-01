# oh-my-codex-pennix v0.18.58

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release ships the Pennix fork startup/setup convergence follow-up: normal OMX launches no longer block on an interactive GitHub star prompt, and fresh user-scope setup now reuses existing plugin-mode Codex config evidence instead of drifting back to legacy mode after a reinstall.

## Highlights

- Normal `omx` startup paths no longer invoke the interactive GitHub star prompt, so launch, HUD startup, and overlay exec do not unexpectedly block or surprise the foreground session.
- The static support hint in `omx setup` remains intact for users who already have authenticated GitHub CLI access, preserving the non-blocking support path without launch-time interruption.
- `omx setup` user-scope install-mode inference now defaults back to plugin mode when the existing Codex config already advertises trusted OMX plugin-mode registration, even before the local plugin cache has been materialized again.
- Regression coverage now locks both contracts: startup source must not call the interactive star prompt, and setup must prefer plugin mode when Codex config already contains valid OMX plugin-mode signals after reinstall.

## Fixes / compatibility

- `src/cli/index.ts` stops calling the interactive star-prompt helper from the normal launch entrypoints, removing a foreground startup interruption while leaving the helper and setup-time support hint available for explicit/non-launch use.
- `src/cli/setup.ts` now infers plugin mode from existing trusted plugin-mode Codex config when user-scope setup lacks both a persisted choice and a materialized plugin cache, aligning setup with the already-shipped `doctor` evidence model.
- New focused tests cover the launch startup contract and the plugin-config fallback regression so future release lines cannot silently reintroduce either user-visible issue.

## Merged PR inventory

- No merged PRs. `0.18.58` is a direct release-line commit on the Pennix fork.

## Validation

- `npm run build`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/launch-startup-contract.test.js dist/cli/__tests__/setup-install-mode-regression.test.js dist/cli/__tests__/star-prompt.test.js dist/cli/__tests__/setup-gh-star.test.js dist/cli/__tests__/windows-popup-loop-contract.test.js`
- `node dist/scripts/check-version-sync.js --tag v0.18.58`
- `git diff --check`
- `npm pack --dry-run`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.57...v0.18.58`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.57...v0.18.58)
