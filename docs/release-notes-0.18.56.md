# Release Notes: oh-my-codex 0.18.56

## Summary

`0.18.56` finishes the plugin-cache lifecycle follow-up for the Pennix fork. Plugin-mode local marketplace cache now converges on the official stable `local/` cache key, `omx setup` and `omx doctor` stop treating historical version-scoped caches as the current live plugin surface, and explicit successful setup now writes the missing `setup_completed_version` install stamp.

## Highlights

- Plugin-mode OMX cache now materializes to `~/.codex/plugins/cache/oh-my-codex-local/oh-my-codex/local/` instead of version-scoped active cache directories.
- Cached plugin manifests are rewritten to `version = "local"` so current hook entrypoints and current plugin-skill discovery no longer churn with every npm package version bump.
- `omx doctor` now checks the stable `local` plugin cache explicitly for both skills and plugin-scoped native hooks.
- Explicit successful setup now records `setup_completed_version`, which removes the false “automatic setup is incomplete” install-stamp warning after a completed setup refresh.

## Fixes / compatibility notes

- Historical version-scoped cache directories remain preserved as compatibility residue for still-running older sessions; they are no longer mistaken for the active current cache.
- Plugin install-mode autodetection now prefers the stable `local` cache when multiple OMX cache directories exist.
- Regression coverage now includes:
  - stable local cache materialization and in-place refresh
  - doctor validation against stable `local` cache semantics
  - active setup install-stamp completion

## Merged PR inventory

- No merged PRs in `v0.18.55..v0.18.56`.
- Candidate changes are direct release-line commits on `main`.

## Validation evidence

- `npm run build`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/plugin-marketplace.test.js`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/doctor-warning-copy.test.js`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/setup-install-stamp.test.js`
- `node dist/scripts/check-version-sync.js --tag v0.18.56`
- `git diff --check`
- `npm pack --dry-run`

## Full changelog

- Compare: [`v0.18.55...v0.18.56`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.55...v0.18.56)
