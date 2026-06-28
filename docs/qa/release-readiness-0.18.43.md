# Release readiness: oh-my-codex 0.18.43

## Range

- Previous tag: `v0.18.42`.
- Candidate tag: `v0.18.43`.
- Release focus: unblock the standard release workflow after the `v0.18.42` tag failed in CLI detached-launch regressions, then publish and validate the fixed npm artifact.

## Release scope

`0.18.43` is a narrow release-pipeline hotfix:

- detached tmux finalize/attach no longer depends on HUD pane creation
- HUD-specific CLI regression tests explicitly opt in to HUD instead of relying on an obsolete default
- fork runtime semantics remain HUD-disabled by default

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bumped to `0.18.43`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: bumped to `0.18.43`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: synced to `0.18.43`.

## Local validation evidence

- [x] `npm run build`
- [x] `node dist/scripts/run-test-files.js dist/cli/__tests__/launch-fallback.test.js`
- [x] `node dist/scripts/run-test-files.js dist/cli/__tests__/index.test.js dist/cli/__tests__/launch-fallback.test.js`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.43`
- [x] `git diff --check`

## Publication blocker that this release fixes

- [x] `v0.18.42` tag workflow failed in `Run tests`.
- [x] Failing file: `dist/cli/__tests__/launch-fallback.test.js`.
- [x] Root causes fixed for `0.18.43`:
  - tests assumed HUD auto-enabled behavior that no longer matches the fork default
  - detached tmux finalize/attach was gated behind HUD-pane creation and could be skipped entirely when HUD was disabled

## CI / publication evidence

- [ ] Tag-triggered release workflow
- [ ] GitHub release proof
- [ ] npm proof
- [ ] clean uninstall / reinstall from npm
- [ ] post-install live tmux smoke with no unexpected HUD pane

## Current readiness verdict

Local release prep for `0.18.43` is ready to push. The remaining work is the standard tag-triggered GitHub Actions release flow, npm publication, a clean reinstall from npm, and final tmux smoke against the published artifact.
