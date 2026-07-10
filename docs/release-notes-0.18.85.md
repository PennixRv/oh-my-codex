# oh-my-codex-pennix v0.18.85

Drafted: 2026-07-10

Patch release for the Pennix fork plugin-mode hook semantics correction line.

## Summary

`0.18.85` finishes the plugin-mode cleanup that `0.18.84` still left in a partially inconsistent state:

- plugin setup no longer revives `plugin_hooks = true` in user config
- plugin setup no longer manages OMX hook wrappers from the user Codex home
- plugin-mode diagnostics now describe plugin-cache hook registration directly
- launch-time config repair no longer strips custom `developer_instructions` or reintroduces a visible native status line
- existing OMX-generated plugin-mode `AGENTS.md` defaults now refresh cleanly

This is a semantics-correction release, not a target-matrix or packaging-shape change.

## Included changes

### Plugin-mode hook behavior now matches the intended contract

- Plugin-mode setup now writes canonical Codex hook enablement through `hooks = true` or legacy `codex_hooks = true`, depending on the installed Codex feature probe.
- OMX-managed `~/.codex/hooks.json` wrappers are always removed in plugin mode instead of being retained as a fallback runtime surface.
- Windows plugin-mode cleanup now also removes the stale managed native-hook shim when present.
- `omx doctor` now reports plugin-cache hook registration explicitly and validates the same plugin-cache surface that setup maintains.

### Launch repair preserves user-facing config semantics

- Launch-time repair now preserves custom `developer_instructions` when config repair is needed.
- Launch-time repair now preserves OMX’s hidden-native-footer contract by keeping `status_line = []` semantics instead of restoring visible default status segments.
- Focused config-repair regressions lock both behaviors.

### OMX-generated plugin bootstrap refresh is now idempotent

- Existing OMX-generated plugin-mode `AGENTS.md` files are refreshed automatically without a manual overwrite prompt.
- User OMX policy blocks continue to be preserved during the refresh path.
- Active project session overlays are still protected from in-place overwrite while the session is live.

### Validation and regression coverage updated

- Focused `setup`, `doctor`, `scope`, and config-repair regressions now use canonical `hooks`-flag semantics instead of historical `plugin_hooks` assumptions.
- The doctor copy suite now matches the real plugin-cache hook wording and user-owned residue behavior.

## Native release scope remains unchanged

- Native publication remains limited to:
  - `x86_64-unknown-linux-gnu`
  - `x86_64-unknown-linux-musl`
- No macOS, Windows, or ARM release targets are added in this patch release.

## Recommended release message

> `v0.18.85` corrects the remaining plugin-mode hook semantics: OMX plugin mode now keeps canonical Codex hook flags on `hooks`, uses plugin-cache hook assets without injecting user-home hook wrappers, preserves custom `developer_instructions` and hidden status-line repair semantics, and auto-refreshes existing OMX-generated plugin bootstrap files cleanly.
