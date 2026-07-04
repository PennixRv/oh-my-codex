# oh-my-codex-pennix v0.18.72

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release tightens the managed tmux status line so fresh Codex panes show only OMX-owned status surfaces and the displayed telemetry stays bound to the real active pane session. It hides the native Codex footer when OMX owns the status line, prevents stale shared OMX session state from leaking into fresh bare `codex` panes, and normalizes the visible numeric formatting to fixed one-decimal values.

## Highlights

- `omx setup` now writes an explicit OMX-managed `[tui]` `status_line = []` so the native Codex footer is hidden whenever OMX owns the status-line surface, while preserving user-authored custom `status_line` arrays.
- The tmux status renderer now uses pane-local rollout/session evidence only for usage telemetry, so a brand-new `codex` pane no longer inherits old `Cost`, `Ctx`, `Total`, or `Cache` values from shared `.omx/state/session.json`.
- Active-pane identity now prefers the current pane process' live rollout file descriptor and trims transient tmux hash suffixes from the displayed session label.
- Visible numeric values are normalized to a fixed one-decimal presentation: `Cost` is rendered as `$...`, compact token counts keep one decimal, and percentages no longer mix trimmed and untrimmed formats.

## Fixes / compatibility

- Existing user Codex config remains protected: OMX rewrites only OMX-managed status-line entries and leaves user-owned custom `status_line` arrays intact.
- Fresh or splash-screen `codex` panes now display clean zero-state telemetry until pane-local rollout/session evidence exists, instead of showing stale usage totals from another pane.
- The managed tmux bar and the hidden native footer now agree on one surface model: OMX owns the tmux bar, Codex's default footer stays suppressed unless the user deliberately customizes it.

## Validation

- `npm run build`
- `node --test dist/tmux-status/__tests__/render.test.js`
- `node --test dist/cli/__tests__/setup-native-status-line.test.js`
- `node dist/scripts/check-version-sync.js --tag v0.18.72`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.71...v0.18.72`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.71...v0.18.72)
