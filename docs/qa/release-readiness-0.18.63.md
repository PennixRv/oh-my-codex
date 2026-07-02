# Release readiness: oh-my-codex 0.18.63

## Range

- Previous published tag: `v0.18.62`.
- Candidate tag: `v0.18.63`.
- Release focus: ship bounded upstream-integration Wave 4 without regressing Pennix mailbox-first runtime behavior.

## Release scope

`0.18.63` carries three narrow correctness adaptations plus the bounded release collateral:

- trim proxy env values so blank scheme-specific vars do not suppress valid `ALL_PROXY` fallback behavior
- surface root-owned, owner-mismatched, or non-writable repo-local `.omx` / `.beads` artifacts in `omx doctor`, plus bounded `--force` repair
- bind review-blocked ultragoal parent reconciliation to the designated resolver story and fail closed for forged resolver aggregate paths
- keep Pennix mailbox-first runtime behavior intact while making verbose PostCompact doctor smoke Windows-safe

## PR inventory

- No merged PRs in `v0.18.62..v0.18.63`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bumped to `0.18.63`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: resolved to `0.18.63`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: synced to `0.18.63`.

## Local validation evidence

- [x] `npm ci`
- [x] `npm run build`
- [x] `npm run test:node`
- [x] `node dist/scripts/run-test-files.js dist/ultragoal/__tests__/artifacts.test.js dist/cli/__tests__/doctor-artifact-ownership.test.js dist/notifications/__tests__/http-client.test.js`
- [x] `npm run verify:native-agents && npm run verify:plugin-bundle`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.63`
- [x] `npm pack --dry-run`
- [x] `git diff --check`
- [ ] `node dist/scripts/generate-release-body.js --template RELEASE_BODY.md --out /tmp/RELEASE_BODY.v0.18.63.generated.md --current-tag v0.18.63 --previous-tag v0.18.62 --repo PennixRv/oh-my-codex`

## CI / publication evidence

- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.63`
- [ ] clean uninstall / reinstall from npm
- [ ] published-artifact smoke confirms proxy fallback trimming, doctor repo-artifact ownership diagnostics, and ultragoal designated-resolver reconciliation in the installed package

## Known gaps

- `generate-release-body.js` verifies the current tag ref and therefore cannot produce the final compare-aware release body until the annotated `v0.18.63` tag exists locally; rerun it after tagging and before/alongside the release workflow.
- Published-artifact reinstall smoke remains deferred until npm publish completes and the local environment is cleaned and reinstalled from npm.

## Current readiness verdict

Release collateral and local validation are aligned to `0.18.63`; publication is now blocked only on tag-triggered GitHub Actions success, npm publication, and a clean uninstall/reinstall smoke against the published package.
