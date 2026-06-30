# Release readiness: oh-my-codex 0.18.51

## Range

- Previous tag: `v0.18.50`.
- Candidate tag: `v0.18.51`.
- Release focus: make fresh install and plugin setup auto-initialize OMX-owned surfaces without prompts while preserving user-authored `developer_instructions`.

## Release scope

`0.18.51` is a narrow install/setup release:

- global postinstall attempted automatic plugin setup after install bumps at the time of `0.18.51`; newer releases have since moved back to explicit manual setup reminders
- plugin-mode setup automatically appends the OMX developer-instructions fragment instead of replacing user content
- plugin-mode setup no longer prompts for OMX-owned AGENTS defaults
- uninstall now strips only OMX-managed developer-instruction content

## PR inventory

- No merged PRs in `v0.18.50..v0.18.51`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bumped to `0.18.51`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: bumped to `0.18.51`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: synced to `0.18.51`.

## Local validation evidence

- [x] `npm run build`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.51`
- [x] `node dist/scripts/run-test-files.js dist/scripts/__tests__/postinstall.test.js dist/cli/__tests__/setup-agents-overwrite.test.js dist/cli/__tests__/uninstall.test.js dist/cli/__tests__/doctor-warning-copy.test.js`
- [x] `npm run verify:native-agents && npm run verify:plugin-bundle`
- [ ] `npm run test:node`
- [ ] `node dist/scripts/generate-release-body.js --template RELEASE_BODY.md --out /tmp/RELEASE_BODY.v0.18.51.generated.md --current-tag v0.18.51 --previous-tag v0.18.50 --repo PennixRv/oh-my-codex`

## CI / publication evidence

- [ ] `CI` workflow on `main` for the release candidate commit
- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.51`
- [ ] clean uninstall / reinstall from npm
- [ ] post-install smoke confirms the installed setup is usable without OMX-owned prompts

## Known gaps

- Full `node dist/scripts/test-node` validation still needs to be rerun after the version metadata sync to confirm the release candidate stays green end-to-end.
- This release intentionally changes install and plugin bootstrap behavior; runtime mailbox, startup dispatch, and orchestration semantics remain out of scope.

## Current readiness verdict

Local release prep for `0.18.51` is aligned to the install/setup contract changes. The remaining gates are the required `main` CI run for the candidate commit, the tag-triggered GitHub release workflow, npm publication, a clean reinstall from npm, and a post-install smoke that confirms the new auto-setup path works in the installed package.
