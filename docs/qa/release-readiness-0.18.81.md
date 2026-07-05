# Release readiness: oh-my-codex 0.18.81

## Range

- Previous published npm version / successful release: `v0.18.80`.
- Candidate tag: `v0.18.81`.
- Release focus: restore the native GitHub release asset pipeline, normalize non-`Ctx` tmux status metrics to fixed two-decimal formatting, and correct the documented `dev` sync rule so it matches the repo's real branch topology.

## Release scope

`0.18.81` is a bounded tmux-status and release-process recovery release:

- tmux status metrics now keep fixed two-decimal formatting everywhere except the compact `Ctx` token pair (`222.2k/249.3k`)
- the tag-triggered `Release` workflow again builds and attaches cross-platform native assets plus `native-release-manifest.json`
- native release assets are smoke-verified before packed-install smoke and npm publication
- the native release workflow contract test is active again
- `RELEASE_PROTOCOL.md` now documents `fast-forward-or-reconcile` for the `dev` tail step instead of assuming a universal fast-forward

## PR inventory

- No merged PRs in `v0.18.80..v0.18.81`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bump to `0.18.81`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: resolve to `0.18.81`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: sync to `0.18.81`.

## Local validation evidence

- [x] `npm run build`
- [x] `node dist/scripts/run-test-files.js dist/tmux-status/__tests__/render.test.js`
- [x] `node dist/scripts/run-test-files.js dist/verification/__tests__/explore-harness-release-workflow.test.js dist/verification/__tests__/release-workflow-release-body.test.js dist/verification/__tests__/native-release-manifest.test.js`
- [x] `npm run test:node`
- [x] `npm run verify:native-agents`
- [x] `npm run verify:plugin-bundle`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.81`
- [x] `npm pack --dry-run`
- [ ] `git diff --cached --check`
- [ ] `node dist/scripts/generate-release-body.js --template RELEASE_BODY.md --out /tmp/RELEASE_BODY.v0.18.81.generated.md --current-tag v0.18.81 --previous-tag v0.18.80 --repo PennixRv/oh-my-codex`

## CI / publication evidence

- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] GitHub release assets include `native-release-manifest.json` and the native archives
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.81`
- [ ] `dev` is synced to the released `main` via fast-forward or documented reconciliation merge
- [ ] published-artifact smoke confirms the restored native asset path and tmux metric formatting contract

## Known gaps

- The tag-triggered `Release` workflow remains the authoritative native-asset and npm publication gate.
- `generate-release-body.js` verifies the current tag ref and therefore cannot produce the final compare-aware release body until the local `v0.18.81` tag exists and points at the candidate commit.
- Final `dev` sync proof depends on the post-publish branch relationship at the released `main` commit.

## Current readiness verdict

`0.18.81` is staged as a bounded recovery release: the intended scope is limited to tmux numeric formatting, GitHub native release-asset publication, and release-protocol/dev-sync correctness. Remaining work is standard validation, tag workflow publication, npm publication, and post-publish `dev` sync evidence.
