# Release readiness: oh-my-codex 0.18.56

## Range

- Previous tag: `v0.18.55`.
- Candidate tag: `v0.18.56`.
- Release focus: align plugin-mode local marketplace cache lifecycle to the stable official `local` cache key and complete the missing setup install stamp.

## Release scope

`0.18.56` carries the Pennix fork plugin-cache and install-stamp lifecycle follow-up:

- plugin-mode current OMX cache now converges on the stable `~/.codex/plugins/cache/oh-my-codex-local/oh-my-codex/local/` path
- cached plugin manifests are rewritten to `version = "local"` so current hook entrypoints and plugin-skill discovery stop churning with package version bumps
- `omx setup` refresh and install-mode autodetection now treat the stable `local` cache as current while preserving historical version-scoped compatibility residue
- `omx doctor` now validates the stable `local` cache explicitly for plugin skills and plugin-scoped hooks
- explicit successful setup now writes `setup_completed_version` into the OMX install stamp

## PR inventory

- No merged PRs in `v0.18.55..v0.18.56`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bumped to `0.18.56`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: bumped to `0.18.56`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: synced to `0.18.56`.

## Local validation evidence

- [x] `npm run build`
- [x] `node dist/scripts/run-test-files.js dist/cli/__tests__/plugin-marketplace.test.js`
- [x] `node dist/scripts/run-test-files.js dist/cli/__tests__/doctor-warning-copy.test.js`
- [x] `node dist/scripts/run-test-files.js dist/cli/__tests__/setup-install-stamp.test.js`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.56`
- [x] `git diff --check`
- [x] `npm pack --dry-run`
- [ ] `node dist/scripts/generate-release-body.js --template RELEASE_BODY.md --out /tmp/RELEASE_BODY.v0.18.56.generated.md --current-tag v0.18.56 --previous-tag v0.18.55 --repo PennixRv/oh-my-codex`

## CI / publication evidence

- [ ] `CI` workflow on `main` for the release candidate commit
- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.56`
- [ ] clean uninstall / reinstall from npm
- [ ] published-artifact smoke confirms current plugin-mode cache lands under `.../local/`, install stamp includes `setup_completed_version`, and no new version-scoped hook path is used as the active plugin cache entrypoint

## Known gaps

- `generate-release-body.js` verifies the current tag ref and therefore cannot produce the final compare-aware release body until the annotated `v0.18.56` tag exists locally; rerun it after tagging and before/alongside the release workflow.
- Historical long-lived Codex sessions that already captured removed version-scoped hook entrypoints may still fail until those sessions are restarted or retired; this release stops creating new version-scoped active cache paths but does not rewrite already-running old sessions.

## Current readiness verdict

The local fix set is aligned to the intended plugin-cache/install-stamp lifecycle behavior. Focused plugin cache, doctor, and setup-stamp gates are green. Remaining work is the standard `main` CI run for the candidate commit, the tag-triggered GitHub release workflow, npm publication, a clean uninstall/reinstall from npm, and published-artifact smoke against the new installed package.
