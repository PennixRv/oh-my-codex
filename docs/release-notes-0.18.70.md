# oh-my-codex-pennix v0.18.70

Drafted: 2026-07-04

Patch release for the Pennix fork tmux-status telemetry line.

## Summary

`0.18.70` tightens the tracked tmux status bar shipped in `0.18.69` so the model telemetry is dynamic and pane-correct:

- `Ctx` now uses the current rollout window (`last_token_usage`) instead of cumulative session input.
- `Total` is added as an independent left-status item after `Ctx`, sourced from rollout `total_token_usage.total_tokens`.
- `Cache` understands modern Codex rollout events where `token_count` appears as an `event_msg` payload.
- CCH cost/cache lookup now uses exact per-session stats from the management API when a CCH admin token is available.
- Pane session binding now prefers the pane launch command's `codex resume <session>` id over shared runtime state and rollout metadata, preventing multiple panes in the same directory from showing the wrong session's cost and token totals.

## Included changes

### Dynamic status metrics

- The left status line renders `Model`, `Effort`, `Cost`, `Ctx`, `Total`, and `Cache`.
- `Ctx` remains a current context-window occupancy metric: `last_token_usage.input_tokens / model_context_window`.
- `Total` represents current session cumulative token usage from rollout `total_token_usage.total_tokens`.
- `Cache` keeps the existing compact percentage presentation but now reads both top-level `token_count` records and nested `event_msg` token events.

### Pane-correct session resolution

- `codex resume <session-id>` in the pane start command is treated as the strongest session identity signal.
- Timestamp-prefixed rollout filenames such as `rollout-2026-07-02T11-43-37-<session>.jsonl` are now matched exactly for the target session.
- Fallback rollout discovery remains bounded and cached, but cache keys include the preferred session id so same-directory panes do not cross-contaminate.

### CCH integration hardening

- CCH management URLs are normalized by stripping provider `/v1` suffixes before calling `/api/v1/...` endpoints.
- Exact stats are requested from `/api/v1/usage-logs/stats?sessionId=<id>` before falling back to the broader sessions list.
- Admin token resolution supports the configured env var, token-file env vars, Codex-home token files, the legacy Claude token file, and then Codex auth as a final fallback.

## Recommended release message

> `v0.18.70` makes the tracked tmux status bar dynamic and pane-correct: Ctx/Total/Cache now come from real rollout token events, CCH Cost uses exact per-session stats, and same-directory Codex panes no longer display another session's telemetry.
