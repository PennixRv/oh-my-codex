# oh-my-codex-pennix v0.18.56

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release ships the Pennix fork plugin-cache lifecycle and install-stamp follow-up: plugin-mode local marketplace cache now converges on the official stable `local/` cache key, `doctor`/`setup` stop mistaking historical version-scoped caches for the live plugin surface, and explicit completed setup writes the missing install completion stamp.

## Highlights

- Plugin-mode packaged OMX cache now materializes to `~/.codex/plugins/cache/oh-my-codex-local/oh-my-codex/local/` and rewrites the cached plugin manifest to `version = "local"`, so live hook entrypoints stop churning with every package version bump.
- `omx setup` now refreshes the active stable `local` cache in place, preserves historical version-scoped compatibility residue for still-running older sessions, and prefers the `local` cache when inferring plugin install mode.
- `omx doctor` now validates the stable local cache path explicitly for both plugin skills and plugin-scoped hooks instead of accepting arbitrary version-scoped cache directories as healthy current state.
- Successful explicit setup now writes `setup_completed_version` into the OMX install stamp, with a dedicated active regression test covering the contract.

## Fixes / compatibility

- `src/cli/plugin-marketplace.ts`, `src/cli/setup.ts`, and `src/cli/doctor.ts` now align plugin-mode local marketplace cache semantics to the stable official `local` cache key while preserving historical version-scoped cache directories as compatibility residue.
- `src/cli/update.ts` and `src/cli/setup.ts` now complete the OMX install stamp by writing `setup_completed_version` after a successful setup refresh.
- The published regression surface now includes active coverage for stable local plugin cache materialization, doctor validation against the `local` cache, and explicit setup install-stamp completion.

## Merged PR inventory

- No merged PRs. `0.18.56` is a direct release-line commit on the Pennix fork.

## Validation

- `npm run build`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/plugin-marketplace.test.js`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/doctor-warning-copy.test.js`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/setup-install-stamp.test.js`
- `node dist/scripts/check-version-sync.js --tag v0.18.56`
- `git diff --check`
- `npm pack --dry-run`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.55...v0.18.56`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.55...v0.18.56)
