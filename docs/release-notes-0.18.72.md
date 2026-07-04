# oh-my-codex-pennix v0.18.72

Drafted: 2026-07-04

Patch release for the Pennix fork tmux-status footer suppression and active-pane identity correction.

## Summary

`0.18.72` fixes the remaining tracked UX gaps in the managed tmux status bar line:

- fresh OMX-managed setup now explicitly hides the native Codex footer with `[tui]` `status_line = []`
- bare `codex` panes without pane-local rollout/session evidence no longer inherit stale usage totals from shared OMX state
- displayed status metrics now use fixed one-decimal formatting and `Cost` includes a dollar sign

## Included changes

### Native footer suppression under managed setup

- `omx setup` now rewrites OMX-managed TUI status lines to `status_line = []`.
- Existing OMX-managed status-line presets are replaced with the hidden value on refresh.
- User-owned custom `status_line` arrays remain untouched.

### Pane-local session binding only

- Usage telemetry now binds only to pane-local rollout/session evidence such as `codex resume <session>` or the live rollout file opened by the pane process.
- Stale shared `.omx/state/session.json` no longer backfills `Cost`, `Ctx`, `Total`, or `Cache` for a fresh pane that has not emitted local rollout telemetry yet.
- When a Codex pane has no pane-local telemetry yet, status usage values render as a clean fresh-session zero state instead of leaking another session's totals.

### Consistent visible formatting

- `Cost` is now rendered as `$...`.
- Compact token counts, context figures, and percentages all use fixed one-decimal formatting.
- Displayed tmux session names strip transient hash suffixes such as `_a768005a` so the right status line stays stable and readable.

## Recommended release message

> `v0.18.72` makes the managed OMX tmux status line behave like one coherent surface: OMX-owned setup now hides Codex's native footer, fresh panes stop inheriting stale usage totals, and displayed telemetry is formatted consistently with fixed one-decimal values.
