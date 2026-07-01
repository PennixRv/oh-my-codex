# Release readiness: oh-my-codex 0.18.62

## Range

- Previous published tag: `v0.18.61`.
- Candidate tag: `v0.18.62`.
- Release focus: finish plugin-mode uninstall cleanup so OMX plugin-mode setup can be cleanly removed without leaving marketplace/plugin-hook/plugin-cache residue behind.

## Release scope

`0.18.62` carries the uninstall cleanup follow-up for plugin mode:

- strip OMX local plugin registration tables and plugin first-party MCP subtables from `config.toml` during uninstall
- strip plugin-scoped hook trust state keyed by `oh-my-codex@oh-my-codex-local:...`
- treat `plugin_hooks` as OMX-managed uninstall residue and remove it while preserving canonical `hooks = true` only when user hook state still requires it
- remove the full OMX local plugin cache root, including historical version-scoped compatibility caches and the active `local/` cache

## PR inventory

- No merged PRs in `v0.18.61..v0.18.62`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bumped to `0.18.62`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: resolved to `0.18.62`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: synced to `0.18.62`.

## Local validation evidence

- [x] `npm run build`
- [x] `node dist/scripts/run-test-files.js dist/cli/__tests__/uninstall.test.js`
- [x] `node dist/scripts/run-test-files.js dist/cli/__tests__/plugin-marketplace.test.js`
- [x] `npm run verify:plugin-bundle`
- [ ] `node dist/scripts/check-version-sync.js --tag v0.18.62`
- [ ] `node dist/scripts/generate-release-body.js --template RELEASE_BODY.md --out /tmp/RELEASE_BODY.v0.18.62.generated.md --current-tag v0.18.62 --previous-tag v0.18.61 --repo PennixRv/oh-my-codex`

## CI / publication evidence

- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.62`
- [ ] clean uninstall / reinstall from npm
- [ ] published-artifact smoke confirms plugin-mode uninstall removes config/plugin-hook/plugin-cache residue in the installed package

## Known gaps

- `generate-release-body.js` verifies the current tag ref and therefore cannot produce the final compare-aware release body until the annotated `v0.18.62` tag exists locally; rerun it after tagging and before/alongside the release workflow.
- Published-artifact reinstall smoke remains deferred until npm publish completes and the local environment is cleaned and reinstalled from npm.

## Current readiness verdict

The local uninstall cleanup patch has passed build, targeted uninstall regression coverage, plugin marketplace regression coverage, and plugin-bundle verification on `0.18.62`. Remaining work is commit/tag publication, tag-triggered release workflow success, npm publication, and clean uninstall/reinstall smoke against the published package.
