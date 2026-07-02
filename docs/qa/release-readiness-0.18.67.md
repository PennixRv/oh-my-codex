# Release readiness: oh-my-codex 0.18.67

## Range

- Previous published npm version / successful release: `v0.18.66`.
- Candidate tag: `v0.18.67`.
- Release focus: ship the bounded uninstall-cleanliness follow-up so published-artifact clean teardown no longer leaves managed OMX install-state residue under `CODEX_HOME/.omx`.

## Release scope

`0.18.67` carries one bounded production follow-up plus the aligned regression gate:

- `omx uninstall` now removes managed `install-state.json` and `native-agents.json` from `CODEX_HOME/.omx`
- the cleanup remains narrow and preserves unrelated `CODEX_HOME/.omx` files
- uninstall summary output now distinguishes `CODEX_HOME/.omx` install artifacts from the project `.omx/` purge path
- release regression coverage now locks the mixed-directory preservation contract observed during published-artifact smoke

## PR inventory

- No merged PRs in `v0.18.66..v0.18.67`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bump to `0.18.67`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: resolve to `0.18.67`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: sync to `0.18.67`.

## Local validation evidence

- [x] `npm run build`
- [x] `node dist/scripts/run-test-files.js dist/cli/__tests__/uninstall.test.js`
- [ ] `npm run verify:native-agents`
- [ ] `npm run verify:plugin-bundle`
- [ ] `node dist/scripts/check-version-sync.js --tag v0.18.67`
- [ ] `npm pack --dry-run`
- [ ] `git diff --check`
- [ ] `node dist/scripts/generate-release-body.js --template RELEASE_BODY.md --out /tmp/RELEASE_BODY.v0.18.67.generated.md --current-tag v0.18.67 --previous-tag v0.18.66 --repo PennixRv/oh-my-codex`

## CI / publication evidence

- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.67`
- [ ] clean uninstall / reinstall from npm
- [ ] published-artifact smoke confirms uninstall removes managed `CODEX_HOME/.omx` residue, preserves custom `developer_instructions`, reinstall appends the OMX fragment back, and the installed hook/runtime path remains error-free

## Known gaps

- The tag workflow still runs the full `npm run test:node` lane; local validation here remains focused on the uninstall cleanup follow-up.
- `generate-release-body.js` verifies the current tag ref and therefore cannot produce the final compare-aware release body until the local `v0.18.67` tag exists.
- Published-artifact uninstall/reinstall smoke remains deferred until npm publication completes.

## Current readiness verdict

`0.18.67` is a bounded follow-up to `0.18.66`. The uninstall-preservation fix from `0.18.66` remains intact locally, and this cut closes the remaining managed-residue gap discovered during clean published-artifact smoke. Remaining blockers are the normal version-sync/pack checks, successful tag-triggered CI publication, and the required uninstall/reinstall smoke against the published npm artifact.
