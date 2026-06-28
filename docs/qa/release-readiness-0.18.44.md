# Release readiness: oh-my-codex 0.18.44

## Range

- Previous tag: `v0.18.43`.
- Candidate tag: `v0.18.44`.
- Release focus: persist team tmux socket identity so lifecycle operations stay bound to the tmux server that actually owns the team panes.

## Release scope

`0.18.44` is a narrow team lifecycle correctness release:

- interactive team state now persists `tmux_socket_path`
- shutdown, resume, active-team discovery, and scale-down cleanup use the persisted socket when resolving tmux state
- runtime coverage proves synthetic-server worker cleanup preserves the leader pane

## PR inventory

- No merged PRs in `v0.18.43..v0.18.44`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bumped to `0.18.44`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: bumped to `0.18.44`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: synced to `0.18.44`.

## Local validation evidence

- [x] `npm run build`
- [x] `npm run verify:native-agents`
- [x] `npm run verify:plugin-bundle`
- [x] `node --test --test-name-pattern "applyCreatedInteractiveSessionToConfig persists worker pane ids before readiness waits|shutdownTeam uses persisted tmux socket identity for synthetic-server cleanup|shutdownTeam preserves leader exclusion while tearing down the hud pane|shutdownTeam skips prekill and keeps the leader pane alive on shared-session shutdown|shutdownTeam reconciles persisted worker panes with live tmux panes before teardown" dist/team/__tests__/runtime.test.js`
- [x] `node --test --test-name-pattern "initTeamState creates correct directory structure and config.json|initTeamState persists the default lifecycle profile" dist/team/__tests__/state.test.js`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.44`
- [x] `git diff --check`
- [x] `npm pack --dry-run`

## CI / publication evidence

- [ ] `CI` workflow on `main` for the release candidate commit
- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.44`
- [ ] clean uninstall / reinstall from npm
- [ ] post-install live tmux smoke with no unexpected HUD pane
- [ ] post-install non-ambient tmux team shutdown smoke

## Known gaps

- None at release-prep time beyond the pending CI / publication evidence above.

## Current readiness verdict

Local release prep for `0.18.44` is ready to push after the focused lifecycle gates pass. The remaining work is standard `main` CI on the candidate commit, the tag-triggered GitHub release workflow, npm publication, a clean reinstall, and post-publish live tmux smoke against the published artifact.
