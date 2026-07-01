# Release readiness: oh-my-codex 0.18.59

## Range

- Previous tag: `v0.18.58`.
- Candidate tag: `v0.18.59`.
- Release focus: scrub malformed transient Codex `tui.model_availability_nux` subtables before setup or config reloads so plugin-mode OMX no longer trips `invalid type: map, expected u32`.

## Release scope

`0.18.59` carries a narrow Pennix fork config-repair follow-up:

- `src/config/generator.ts` now treats malformed nested `tui.model_availability_nux.*` subtables as transient Codex NUX state and strips them alongside the normal flat NUX counter table
- `src/cli/setup.ts` now runs that cleanup before plugin-mode legacy cleanup and before managed-config refresh, so setup never merges on top of the malformed transient state
- focused regression coverage now locks both contracts: malformed nested NUX subtables are scrubbed, and plugin-mode setup still preserves user-owned root/provider config while the repair runs

## PR inventory

- No merged PRs in `v0.18.58..v0.18.59`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bumped to `0.18.59`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: resolved to `0.18.59`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: synced to `0.18.59`.

## Local validation evidence

- [x] `npm run build`
- [x] `node dist/scripts/run-test-files.js dist/cli/__tests__/setup-install-mode-regression.test.js dist/config/__tests__/generator-root-reasoning-contract.test.js dist/cli/__tests__/index.test.js`
- [x] `npm run lint`
- [x] `npm run check:no-unused`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.59`
- [x] `git diff --check`
- [x] `npm pack --dry-run`
- [ ] `node dist/scripts/generate-release-body.js --template RELEASE_BODY.md --out /tmp/RELEASE_BODY.v0.18.59.generated.md --current-tag v0.18.59 --previous-tag v0.18.58 --repo PennixRv/oh-my-codex`

Evidence logs live under `.omx/release-0.18.59/logs/`, including:

- `build-final.log`
- `lint.log`
- `no-unused-confirm.log`
- `version-sync-confirm.log`
- `git-diff-check-confirm.log`
- `npm-pack-dry-run-serial.log`
- `targeted-tests-postpack.log`

## CI / publication evidence

- [ ] `CI` workflow on `main` for the release candidate commit
- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.59`
- [ ] clean uninstall / reinstall from npm
- [ ] published-artifact smoke confirms malformed Codex NUX state no longer breaks `config.toml` reloads during OMX plugin-mode setup and ordinary Codex skill discovery

## Known gaps

- `generate-release-body.js` verifies the current tag ref and therefore cannot produce the final compare-aware release body until the annotated `v0.18.59` tag exists locally; rerun it after tagging and before/alongside the release workflow.
- Published-artifact reinstall smoke is intentionally deferred until the GitHub tag workflow publishes npm and the local environment is cleaned and reinstalled from npm.
- Two earlier targeted-test attempts failed only because `npm pack --dry-run` was run concurrently with `dist`-backed tests, and `prepack` rebuilds `dist`. A final strictly serial rerun passed cleanly; this was a local validation orchestration mistake, not a product regression.

## Current readiness verdict

The local fix set is narrowly aligned to the reported `config.toml` reload failure. Focused source changes and regression coverage are prepared; the remaining work is lockfile/version sync confirmation, local release gates, `main` CI on the candidate commit, the tag-triggered GitHub release workflow, npm publication, and clean reinstall smoke against the published package.
