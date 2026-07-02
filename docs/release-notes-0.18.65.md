# oh-my-codex-pennix v0.18.65

Drafted: 2026-07-02

Patch release for the Pennix fork shared-session shutdown and CI gate hotfix line.

## Summary

`0.18.65` is a narrow follow-up to the failed `0.18.64` release attempt:

- shared-session interactive teardown now uses the persisted tmux socket consistently while deciding which panes belong to the team
- the real-tmux regression coverage now forces that socket-selection path to be exercised deterministically
- the tmux scrollback regression harness now matches the current safe-paste injection protocol instead of failing on missing fake `tmux` subcommands

## Included changes

### Shared-session teardown fix

- `shutdownTeam()` now wraps shared-session worker/HUD pane owner-tag reads in the same persisted tmux socket context already used for pane enumeration and teardown.
- Synthetic-server cleanup no longer silently leaves worker panes behind when the host default tmux socket is absent or unrelated.

### Deterministic regression coverage

- The existing real-tmux shutdown regression now deliberately sets an invalid ambient `TMUX` socket before teardown.
- That makes future regressions in persisted-socket cleanup reproducible both locally and in CI instead of depending on whether the host happens to have a default tmux server.

### Scrollback gate alignment

- The notify-hook tmux scrollback regression harness now implements `set-buffer`, `show-buffer`, `paste-buffer`, and `delete-buffer`.
- This matches the current safe-paste `sendPaneInput()` contract, so the release gate tests the real injection path instead of failing with a fake `send_failed`.

## Recommended release message

Use language that emphasizes bounded correction:

> `v0.18.65` fixes shared-session tmux socket cleanup during team shutdown and realigns the release gate with the current safe-paste injection path.
