# Release Notes: oh-my-codex 0.18.59

## Summary

`0.18.59` fixes a Pennix fork config-repair regression in Codex plugin mode and tightens explicit setup recovery semantics: malformed transient Codex `tui.model_availability_nux` subtables are now scrubbed before setup or launch-time config reloads, and a successful manual `omx setup` now fully converges the install stamp to the active package version instead of leaving a stale postinstall-era `installed_version`.

## Highlights

- OMX now removes malformed nested `tui.model_availability_nux` subtables such as `[tui.model_availability_nux.gpt-5]` before Codex reloads `config.toml`.
- `omx setup` now runs the same cleanup before plugin-mode legacy cleanup and managed-config refresh, so broken transient Codex NUX state cannot survive into a new merge.
- Explicit successful setup now updates both `installed_version` and `setup_completed_version` to the active package version, so running `omx setup` after a skipped npm postinstall clears the install-stamp drift instead of preserving it.
- Plugin-mode setup regression coverage now locks the preservation contract for user-owned root/provider config while the malformed NUX state is being repaired.

## Fixes / compatibility notes

- The repair path is intentionally narrow: it only removes transient Codex `tui.model_availability_nux` tables and malformed nested variants, and leaves unrelated user config intact.
- Existing user-owned root settings such as `model_provider`, `model_reasoning_summary`, `plan_mode_reasoning_effort`, provider tables, and agent caps continue to persist across plugin-mode setup refreshes.
- The install-stamp convergence path is also narrow: it only normalizes the OMX-owned install metadata written after a successful explicit setup and preserves existing channel/source metadata.
- Normal flat `tui.model_availability_nux` counters are still treated as transient Codex state and may be removed during OMX-managed config cleanup.

## Merged PR inventory

- No merged PRs in `v0.18.58..v0.18.59`.
- Candidate changes are direct release-line commits on `main`.

## Validation evidence

- `npm run build`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/setup-install-stamp.test.js dist/cli/__tests__/update.test.js dist/cli/__tests__/setup-install-mode-regression.test.js dist/config/__tests__/generator-root-reasoning-contract.test.js`
- release-publish validation, clean reinstall, and published-artifact smoke pending CI/tag/npm publication

## Full changelog

- Compare: [`v0.18.58...v0.18.59`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.58...v0.18.59)
