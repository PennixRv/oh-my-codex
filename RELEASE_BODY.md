# oh-my-codex-pennix v0.18.80

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release makes the managed tmux `Ctx` metric mean the same thing as official Codex again. OMX now derives remaining context from the active rollout window's `last_token_usage.total_tokens`, applies the same fixed `12000` token baseline reserve used by the upstream TUI, prefers the live rollout `model_context_window` over stale local config when both exist, and renders the result as official effective-window `remaining/total %` telemetry instead of the older Pennix-specific full-window approximation.

## Highlights

- `Ctx` now uses `last_token_usage.total_tokens` from the active rollout window when available, matching the upstream Codex context-left source instead of using `last_token_usage.input_tokens`.
- The remaining-context percentage now follows the official baseline-normalized formula with the same fixed `12000` token reserve that upstream uses for user-controllable context.
- The visible tmux status text now keeps `remaining/total %`, and the numerator and denominator are the official effective-window values, so the metric no longer mixes an official-looking percentage with a non-official full-window denominator.
- Focused tmux-status regression coverage now locks both the upstream token source selection and the exact `23% left` semantics that motivated the fix.

## Fixes / compatibility

- `Cost`, `Total`, `Cache`, pane-local session binding, and footer suppression behavior are unchanged; this release only narrows the `Ctx` semantic mismatch with official Codex.
- Older rollout records that lack `last_token_usage.total_tokens` still fall back to the last input token count, so historical telemetry does not disappear entirely on pre-alignment traces.
- The tracked tmux status bar remains an OMX-owned surface, but `Ctx` now reports official-style remaining context and official effective-window token totals instead of the earlier Pennix-specific approximation.

## Validation

- `npm run build`
- `node dist/scripts/run-test-files.js dist/tmux-status/__tests__/render.test.js`
- `npm run test:node`
- `npm run verify:native-agents`
- `npm run verify:plugin-bundle`
- `node dist/scripts/check-version-sync.js --tag v0.18.80`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.79...v0.18.80`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.79...v0.18.80)
