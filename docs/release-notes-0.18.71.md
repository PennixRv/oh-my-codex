# oh-my-codex-pennix v0.18.71

Drafted: 2026-07-04

Patch release for the Pennix fork tmux-status session-identity correction.

## Summary

`0.18.71` fixes the remaining tracked tmux status bar identity bug from `0.18.70`: bare `codex` panes in a directory with stale shared OMX session state could still pick the wrong CCH session for `Cost`, `Total`, and `Cache`.

- Pane-local rollout discovery now prefers the current `codex` process' open rollout file from `/proc/<pane_pid>/fd`.
- Bare `codex` panes no longer let stale shared `.omx/state/session.json` override the live rollout session id.
- `Model` now prefers the resolved CCH session when available, while `Effort` still comes from the current rollout turn context.
- `Total` and `Cache` now prefer the same resolved CCH session stats as `Cost`, keeping those three metrics on one consistent remote session.
- `Ctx` continues to show the current rollout window occupancy from the active pane's live token events.

## Included changes

### Stronger pane-local session resolution

- tmux pane inspection now records `#{pane_pid}` alongside the existing pane metadata.
- For live Codex panes, the status renderer inspects `/proc/<pane_pid>/fd` and prefers any open `rollout-*.jsonl` file as the strongest identity signal.
- When that live rollout exposes a session id, stale shared OMX runtime session files are no longer allowed to override it.

### Consistent metric sourcing

- `Cost`, `Total`, and `Cache` all use the same resolved CCH session when an admin token is available.
- `Model` prefers the resolved CCH session model value first, then rollout/config fallbacks.
- `Effort` remains rollout-driven because current CCH session payloads do not reliably return reasoning effort.

## Recommended release message

> `v0.18.71` fixes the last tracked tmux status identity gap: live Codex panes now bind to their real rollout session before querying CCH, so Cost/Total/Cache stop leaking from stale shared OMX session state.
