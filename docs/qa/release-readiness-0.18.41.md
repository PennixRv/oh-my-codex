# Release readiness: oh-my-codex 0.18.41

## Range

- Previous tag: `v0.18.40` (failed release candidate; GitHub release workflow aborted in tests and no npm/GitHub release was created).
- Candidate tag: `v0.18.41`.
- Release focus: republish the hook-review send-path line with a corrected scrollback regression fixture so the tag workflow can complete.

## Release scope

`0.18.41` is a narrow publish fix after the failed `0.18.40` workflow:

- The shared tmux hook-review send path from `0.18.40` remains the user-facing behavior on this branch.
- The `notify-hook` scrollback regression fixture now answers `capture-pane`, matching the real tmux command surface that the hook send path depends on.
- No new fallback or retry behavior is introduced.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bumped to `0.18.41`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: bumped to `0.18.41`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: synced to `0.18.41`.

## Local validation evidence

- [x] `npm run build`
- [x] `node --test dist/hooks/__tests__/notify-hook-team-tmux-guard.test.js`
- [x] `node --test dist/hooks/__tests__/notify-hook-tmux-scrollback.test.js`
- [x] `npm run test:node`
- [x] `npm run smoke:packed-install`
- [x] `packed install smoke: PASS`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.41`
- [x] `git diff --check`

## CI / publication evidence

- [ ] Release-prep GitHub Actions
- [ ] Tag-triggered release workflow
- [ ] GitHub release proof
- [ ] npm proof

## Current readiness verdict

Local release prep for `0.18.41` is ready to push: the version bump is staged, the release-prep regression fixture is fixed, and the local validation gates are green. The remaining work is the standard tag-triggered GitHub Actions release flow plus GitHub release and npm publication proof.
