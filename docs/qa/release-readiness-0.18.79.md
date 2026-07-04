# Release readiness: oh-my-codex 0.18.79

## Range

- Previous published npm version / successful release: `v0.18.78`.
- Candidate tag: `v0.18.79`.
- Release focus: align plugin-mode `developer_instructions` behavior with the documented contract so setup preserves user-owned guidance by default and treats the OMX fragment as explicit optional bootstrap.

## Release scope

`0.18.79` is a bounded plugin-mode setup and release-prep follow-up:

- missing root `developer_instructions` is preserved by default in non-interactive plugin setup instead of being auto-populated
- recognized historical OMX-managed plugin/bootstrap guidance is preserved by default and refreshed only when setup is explicitly told to update it
- custom root `developer_instructions` is preserved instead of having the OMX fragment appended automatically
- focused setup regression coverage now locks the explicit add/refresh path and continued preservation of user-owned root `model_reasoning_effort`

## PR inventory

- No merged PRs in `v0.18.78..v0.18.79`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bump to `0.18.79`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: resolve to `0.18.79`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: sync to `0.18.79`.

## Local validation evidence

- [x] `npm run build`
- [x] `npm run test:node`
- [x] `node dist/scripts/run-test-files.js dist/cli/__tests__/setup-agents-overwrite.test.js`
- [x] `node dist/scripts/run-test-files.js dist/cli/__tests__/setup-install-mode.test.js`
- [x] `node dist/scripts/run-test-files.js dist/cli/__tests__/uninstall.test.js`
- [x] `npm run verify:native-agents`
- [x] `npm run verify:plugin-bundle`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.79`
- [x] `npm pack --dry-run`
- [x] `git diff --cached --check`
- [ ] `node dist/scripts/generate-release-body.js --template RELEASE_BODY.md --out /tmp/RELEASE_BODY.v0.18.79.generated.md --current-tag v0.18.79 --previous-tag v0.18.78 --repo PennixRv/oh-my-codex`

## CI / publication evidence

- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.79`
- [ ] clean uninstall / reinstall from npm
- [ ] published-artifact smoke confirms plugin-mode setup preserves custom `developer_instructions` by default and only adds or refreshes OMX bootstrap guidance when explicitly requested

## Known gaps

- The tag-triggered `Release` workflow remains the authoritative full `npm run test:node` and npm publication gate.
- `generate-release-body.js` verifies the current tag ref and therefore cannot produce the final compare-aware release body until the local `v0.18.79` tag exists and points at the candidate commit.
- Global `git diff --check` is currently blocked by an unrelated pre-existing workspace change: `omx_wiki/log.md:157` has a trailing blank line at EOF outside the release-prep files touched here. The staged release commit should still pass `git diff --cached --check`.
- Published-artifact clean reinstall smoke remains deferred until npm publication completes.

## Current readiness verdict

`0.18.79` is ready for focused local release gates around plugin-mode setup guidance ownership. The changed surface is narrow and regression coverage is in place; remaining blockers after local validation are the standard tag-triggered release workflow, GitHub release creation, npm publication, and published-artifact reinstall smoke.
