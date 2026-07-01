# oh-my-codex-pennix v0.18.59

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release ships the Pennix fork config-repair follow-up: OMX now proactively repairs malformed transient Codex `tui.model_availability_nux` subtables before setup or launch-time config reloads, preventing `invalid type: map, expected u32` failures while keeping user-owned root/provider config intact during plugin-mode setup refreshes.

## Highlights

- OMX now scrubs malformed nested `tui.model_availability_nux` subtables such as `[tui.model_availability_nux.gpt-5]` before Codex reloads config, closing the `invalid type: map, expected u32` failure class seen during `skills/list` and similar config-reload paths.
- The same cleanup now runs inside `omx setup` before plugin-mode legacy cleanup and managed config refresh, so broken transient Codex NUX state cannot survive into a fresh setup merge.
- Plugin-mode setup regression coverage now proves that user-owned root/provider config (`model_provider`, `model_reasoning_summary`, provider tables, and agent caps) survives the repair path unchanged.

## Fixes / compatibility

- `src/config/generator.ts` now treats malformed nested `tui.model_availability_nux.*` subtables as transient Codex NUX state and strips them alongside the normal flat NUX counter table.
- `src/cli/setup.ts` now calls that cleanup before plugin-mode config cleanup and before general managed-config refresh, ensuring setup never merges on top of the malformed transient state.
- New focused regressions cover both the malformed NUX scrubber and the plugin-mode setup preservation contract for user root/provider config.

## Merged PR inventory

- No merged PRs. `0.18.59` is a direct release-line commit on the Pennix fork.

## Validation

- `npm run build`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/setup-install-mode-regression.test.js dist/config/__tests__/generator-root-reasoning-contract.test.js dist/cli/__tests__/index.test.js`
- `node dist/scripts/check-version-sync.js --tag v0.18.59`
- `git diff --check`
- `npm pack --dry-run`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.58...v0.18.59`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.58...v0.18.59)
