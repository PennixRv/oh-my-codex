# Release Notes: oh-my-codex 0.18.58

## Summary

`0.18.58` closes two residual user-visible regressions in the Pennix fork startup/setup path: normal OMX launches no longer block on an interactive GitHub star prompt, and fresh user-scope setup now reuses existing trusted plugin-mode Codex config signals instead of incorrectly drifting back to legacy mode after reinstall.

## Highlights

- Normal `omx` startup paths no longer invoke the interactive GitHub star prompt.
- `omx setup` now treats an existing trusted OMX plugin-mode Codex config as a plugin defaulting signal even when the local plugin cache has not been rematerialized yet.
- Setup/install-mode behavior is now closer to `omx doctor`, which was already inferring plugin mode from the same class of config evidence.
- New active regression tests lock both the startup contract and the plugin-config install-mode fallback contract.

## Fixes / compatibility notes

- The non-blocking GitHub support hint printed by `omx setup` for authenticated `gh` users remains unchanged.
- Plugin defaulting is still narrow: setup does not globally flip the hard default to plugin mode. It only prefers plugin when user-scope setup sees trusted OMX plugin-mode evidence in `config.toml`.
- Existing persisted install-mode preferences continue to win over autodetection, and project-scope setup behavior is unchanged.

## Merged PR inventory

- No merged PRs in `v0.18.57..v0.18.58`.
- Candidate changes are direct release-line commits on `main`.

## Validation evidence

- `npm run build`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/launch-startup-contract.test.js dist/cli/__tests__/setup-install-mode-regression.test.js dist/cli/__tests__/star-prompt.test.js dist/cli/__tests__/setup-gh-star.test.js dist/cli/__tests__/windows-popup-loop-contract.test.js`
- published-artifact reinstall smoke pending tag-triggered release publication

## Full changelog

- Compare: [`v0.18.57...v0.18.58`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.57...v0.18.58)
