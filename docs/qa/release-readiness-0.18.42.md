# Release readiness: oh-my-codex 0.18.42

## Range

- Previous tag: `v0.18.41`.
- Candidate tag: `v0.18.42`.
- Release focus: ship the verified team/HUD lifecycle fix into the published npm artifact and confirm the fork default of HUD-disabled team startup/shutdown.

## Release scope

`0.18.42` is a narrow lifecycle correctness release:

- team startup no longer auto-creates a HUD pane when repo HUD config is absent or `enabled: false`
- team shutdown no longer restores a standalone HUD pane when HUD is disabled
- tmux/runtime tests are aligned to the fork contract instead of upstream-style auto-HUD assumptions

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bumped to `0.18.42`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: bumped to `0.18.42`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: synced to `0.18.42`.

## Local validation evidence

- [x] `npm run build`
- [x] `node dist/scripts/run-test-files.js dist/team/__tests__/runtime.test.js`
- [x] `node dist/scripts/run-test-files.js dist/team/__tests__/tmux-session.test.js`
- [x] `node dist/scripts/run-test-files.js dist/team/__tests__/tmux-session.test.js dist/team/__tests__/runtime.test.js dist/cli/__tests__/index.test.js`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.42`
- [x] `git diff --check`

## Live smoke evidence

- [x] Installed `0.18.41` live tmux repro captured the bug:
  - repo HUD config contained `"enabled": false`
  - `omx team 1:executor "smoke hud pane proof"` created a third pane running `omx.js hud --watch`
  - persisted team config recorded non-null `hud_pane_id`
- [x] Source-side fix now passes runtime/tmux regression coverage before release

## CI / publication evidence

- [ ] Tag-triggered release workflow
- [ ] GitHub release proof
- [ ] npm proof
- [ ] clean uninstall / reinstall from npm
- [ ] post-install live tmux smoke with no HUD pane

## Current readiness verdict

Local release prep for `0.18.42` is ready to push. The remaining work is the standard tag-triggered GitHub Actions release flow, npm publication, a clean reinstall from npm, and a final live tmux smoke against the published artifact.
