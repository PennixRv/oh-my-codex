# Release readiness: oh-my-codex 0.18.69

## Range

- Previous published npm version / successful release: `v0.18.67`.
- Candidate tag: `v0.18.69`.
- Release focus: publish the tracked tmux status bar plus the aligned setup/uninstall preservation hardening, and carry the CI-only `0.18.68` failure forward as the first publishable candidate without regressing existing OMX lifecycle boundaries.

## Release scope

`0.18.69` carries one new tracked operator-facing surface, two bounded lifecycle fixes, and the release-gate correction required to publish them:

- managed tmux status bar assets now install in user scope and uninstall cleanly
- the tmux status renderer now uses the finalized text labels and tmux 256-color palette
- setup preserves a trusted existing installed marketplace source when rerun from a source checkout
- uninstall preserves official Codex `plugin_hooks` and `goals` feature flags while still removing OMX-managed wrappers
- the shared-ownership uninstall regression now expects preserved `goals = true`, aligning the release gate with the existing uninstall contract
- the release workflow now resolves the latest published ancestor tag for generated release notes, keeping the corrective release compare range anchored at `v0.18.67`

## PR inventory

- No merged PRs in `v0.18.67..v0.18.69`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bump to `0.18.69`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: resolve to `0.18.69`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: sync to `0.18.69`.

## Local validation evidence

- [x] `npm run build`
- [x] `node dist/scripts/run-test-files.js dist/cli/__tests__/setup-hooks-shared-ownership.test.js`
- [x] `node dist/scripts/run-test-files.js dist/cli/__tests__/tmux-status-lifecycle.test.js`
- [x] `node --test dist/tmux-status/__tests__/render.test.js dist/tmux-status/__tests__/install.test.js`
- [x] `node dist/scripts/run-test-files.js dist/cli/__tests__/setup-install-mode.test.js dist/cli/__tests__/uninstall.test.js`
- [x] `npm run verify:native-agents`
- [x] `npm run verify:plugin-bundle`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.69`
- [x] `npm pack --dry-run`
- [x] `git diff --cached --check`
- [x] `node dist/scripts/run-test-files.js dist/verification/__tests__/release-workflow-release-body.test.js dist/scripts/__tests__/generate-release-body.test.js`
- [ ] `node dist/scripts/generate-release-body.js --template RELEASE_BODY.md --out /tmp/RELEASE_BODY.v0.18.69.generated.md --current-tag v0.18.69 --previous-tag v0.18.67 --repo PennixRv/oh-my-codex`

## CI / publication evidence

- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.69`
- [ ] clean uninstall / reinstall from npm
- [ ] published-artifact smoke confirms tmux status assets are installed from the published package, uninstall remains bounded, trusted marketplace source survives setup reruns, and installed uninstall keeps official Codex `plugin_hooks` / `goals` intact

## Known gaps

- The tag workflow remains the authoritative full `npm run test:node` gate; local validation here is focused on the new tmux-status and lifecycle-preservation surfaces, the corrected shared-ownership uninstall expectation, and the release-note compare-base fix for failed unpublished tags.
- `generate-release-body.js` verifies the current tag ref and therefore cannot produce the final compare-aware release body until the local `v0.18.69` tag exists.
- Published-artifact clean reinstall smoke remains deferred until npm publication completes.

## Current readiness verdict

`0.18.69` is the corrected patch release candidate for the tmux-status and lifecycle-preservation line. It carries the same user-facing changes prepared for `0.18.68`, plus the fixed shared-ownership uninstall expectation that blocked the earlier tag before publication. Remaining blockers are the standard version-sync/pack checks, successful `main` CI, the tag-triggered GitHub release workflow, npm publication, and the required clean reinstall smoke against the published artifact.
