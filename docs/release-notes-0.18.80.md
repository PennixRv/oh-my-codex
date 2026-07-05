# oh-my-codex-pennix v0.18.80

Drafted: 2026-07-05

Patch release for the Pennix fork tmux-status context parity line.

## Summary

`0.18.80` aligns the managed tmux `Ctx` metric back to official Codex semantics:

- active-window context occupancy now comes from `last_token_usage.total_tokens`
- remaining context now uses the same fixed `12000` token baseline reserve as upstream Codex
- the visible status value now keeps numerator/denominator output, but those values are the official effective-window totals rather than the old Pennix-specific raw full-window approximation

## Included changes

### Official context-left source and formula

- `Ctx` now prefers `last_token_usage.total_tokens` from the active rollout window instead of `last_token_usage.input_tokens`.
- Remaining context is now normalized against `model_context_window - 12000`, matching the upstream Codex TUI definition of user-controllable context left.
- This directly fixes the mismatch where official Codex could report `23% context left` while OMX still displayed a higher percentage from raw `input_tokens / model_context_window`.

### Cleaner visible status text

- The tmux status value for `Ctx` now renders as `remaining/effective-window %`.
- This keeps the numerator and denominator visible without reintroducing the old semantic mismatch: both values now come from the official baseline-normalized effective window instead of the raw full model window.
- `Cost`, `Total`, and `Cache` stay unchanged in this release.

### Regression coverage for the parity contract

- The rollout parser test now locks `Ctx` to `last_token_usage.total_tokens` when that field is present.
- A dedicated renderer test now locks the exact `23% left` upstream-style example behind the same baseline-normalized formula.
- Historical rollout logs that lack `last_token_usage.total_tokens` still fall back to the last input token count so older traces remain readable.

## Recommended release message

> `v0.18.80` aligns the managed OMX tmux `Ctx` metric with official Codex: remaining context now comes from `last_token_usage.total_tokens`, uses the same fixed `12000` token baseline reserve, and renders as an official-style `% left` value instead of the older Pennix-specific `remaining/max` approximation.
