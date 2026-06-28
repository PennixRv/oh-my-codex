# oh-my-codex-pennix v0.18.44

`0.18.44` is a targeted team lifecycle patch for non-ambient tmux servers. It ships the persisted tmux socket identity fix so shutdown, resume, active-team discovery, and scale-down cleanup keep talking to the tmux server that actually owns the team panes, even when the ambient `TMUX` environment is missing or points elsewhere.

## Highlights

- **Team state now preserves tmux server identity** - interactive team startup records `tmux_socket_path` together with the saved tmux target, so later lifecycle commands do not rely on ambient `TMUX` inheritance.
- **Shutdown, resume, and activity checks are deterministic across synthetic tmux servers** - worker liveness checks, pane listings, PID lookup, teardown, shared-session shutdown topology, and active-team detection now run against the persisted tmux socket when one is available.
- **Synthetic-server cleanup is covered by a real regression test** - runtime coverage now proves that forced shutdown on a synthetic tmux server kills only the worker pane and preserves the leader pane.

## Fixes / compatibility

- `src/team/state.ts` and `src/team/state/types.ts` now persist `tmux_socket_path` in config/manifest defaults and round-tripping.
- `src/team/tmux-session.ts` captures `#{socket_path}` during interactive session creation, and `src/team/runtime.ts` stores it on the team config.
- `src/team/runtime.ts` and `src/team/scaling.ts` temporarily bind tmux-dependent lifecycle operations to the persisted socket when present; ambient-session behavior is unchanged when no socket is persisted.
- `src/team/__tests__/runtime.test.ts` and `src/team/__tests__/state.test.ts` add regression coverage for the new persisted-socket contract.

## Merged PR inventory

- No merged PRs. `0.18.44` is a direct release-line commit on the Pennix fork.

## Validation

- `npm run build`
- `npm run verify:native-agents`
- `npm run verify:plugin-bundle`
- `node --test --test-name-pattern "applyCreatedInteractiveSessionToConfig persists worker pane ids before readiness waits|shutdownTeam uses persisted tmux socket identity for synthetic-server cleanup|shutdownTeam preserves leader exclusion while tearing down the hud pane|shutdownTeam skips prekill and keeps the leader pane alive on shared-session shutdown|shutdownTeam reconciles persisted worker panes with live tmux panes before teardown" dist/team/__tests__/runtime.test.js`
- `node --test --test-name-pattern "initTeamState creates correct directory structure and config.json|initTeamState persists the default lifecycle profile" dist/team/__tests__/state.test.js`
- `node dist/scripts/check-version-sync.js --tag v0.18.44`
- `git diff --check`
- `npm pack --dry-run`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.43...v0.18.44`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.43...v0.18.44)
