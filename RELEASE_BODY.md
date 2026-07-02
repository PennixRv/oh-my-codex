# oh-my-codex-pennix v0.18.65

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release ships a bounded Pennix hotfix for shared-session team shutdown and release-gate stability. It fixes a real tmux socket-selection bug in interactive teardown and aligns the scrollback regression harness with the current safe-paste injection contract so CI reflects real runtime behavior again.

## Highlights

- Shared-session interactive shutdown now reads worker/HUD pane owner tags through the persisted tmux socket identity instead of accidentally falling back to the host default tmux server during synthetic-server cleanup.
- The real-tmux shutdown regression now deliberately poisons the ambient `TMUX` environment so future default-socket regressions fail deterministically in local and CI runs.
- The tmux scrollback notify-hook regression harness now speaks the current `set-buffer` / `show-buffer` / `paste-buffer` / `delete-buffer` path used by safe-paste pane injection, eliminating false `send_failed` release-gate failures.

## Fixes / compatibility

- Pennix mailbox-boundary team behavior is unchanged; this hotfix does not reintroduce tmux reminder injection or alter leader/worker handoff semantics.
- The runtime shutdown fix is scoped to shared-session interactive teardown, specifically the pane-owner tag reads used to decide which panes belong to the team.
- The scrollback change is test-harness alignment only; production safe-paste injection behavior is unchanged.

## Merged PR inventory

- No merged PRs. `0.18.65` is a direct release-line commit on the Pennix fork.

## Validation

- `npm run build`
- `npm run verify:native-agents && npm run verify:plugin-bundle`
- `node dist/scripts/run-test-files.js dist/hooks/__tests__/notify-hook-tmux-scrollback.test.js dist/team/__tests__/runtime.test.js`
- `node dist/scripts/check-version-sync.js --tag v0.18.65`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.64...v0.18.65`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.64...v0.18.65)
