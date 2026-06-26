---
title: OMX tmux inject marker multisource analysis 2026-06-26
tags:
  - omx
  - tmux
  - inject
  - marker
  - dispatch
  - auto-nudge
  - ralph
  - debugging
created: 2026-06-26T00:00:00.000Z
updated: 2026-06-26T00:00:00+08:00
sources: []
links:
  - omx-team-lifecycle-restart-smoke-failures-2026-06-24
category: debugging
confidence: medium
schemaVersion: 1
---

# OMX tmux inject marker multisource analysis 2026-06-26

## Question
Why do tmux logs sometimes show many `[OMX_TMUX_INJECT]` lines even when the fallback watcher was thought to be disabled?

## Ranked synthesis

| Rank | Explanation | Confidence | Basis |
| --- | --- | --- | --- |
| 1 | The marker is not owned by one watcher. It is appended by multiple independent send paths, including auto-nudge, Ralph fallback steering, and dispatch flows that call `sendPaneInput()` or raw `tmux send-keys`. | High | Direct code paths append `DEFAULT_MARKER` or `INJECTION_MARKER` in multiple modules. |
| 2 | A single logical send can still emit multiple `send-keys` lines because `buildSendKeysArgv()` emits repeated `C-m` submits and `sendPaneInput()` may also queue `Tab` before those submits. | High | The submit count is clamped to 1..4 and then iterated. |
| 3 | Some dispatch paths retry when the pane still looks unsent, so one visible prompt can be re-sent within the same logical event. | Medium | `team-dispatch` re-enters `sendPaneInput()` if verification still sees the trigger text. |

## Evidence

- `src/scripts/tmux-hook-engine.ts:335-344` - `buildSendKeysArgv()` creates a literal prompt send plus `pressCount` repeated `C-m` submit commands.
- `src/scripts/notify-hook/team-tmux-guard.ts:131-179` - `sendPaneInput()` sends the prompt once, then iterates over every submit argv entry, and optionally inserts `Tab` before submits.
- `src/scripts/notify-hook/auto-nudge.ts:717-722` - auto-nudge appends `DEFAULT_MARKER` to every nudge prompt before calling `sendPaneInput()`.
- `src/scripts/notify-fallback-watcher.ts:748-760` - Ralph steering appends `DEFAULT_MARKER` and then sends the prompt plus two `C-m` submits.
- `src/scripts/notify-hook/team-dispatch.ts:831-916` - team dispatch sends input, then re-verifies consumption and can re-enter `sendPaneInput()` if the trigger is still visible.
- `src/team/tmux-session.ts:58` - the lower-level send guard uses `[OMX_TMUX_INJECT]` as the injection marker constant.

## Inference

- The repeated marker lines in a tmux log are best explained by overlapping sources, not by a single disabled watcher reappearing.
- The fallback watcher is not the only code path that can emit marker-suffixed `send-keys`. Auto-nudge and Ralph steering do the same thing, and dispatch can retry when the pane still looks unsent.
- If the user sees many marker lines in one session, the likely cause is multiple active send paths plus the per-send multi-submit behavior.

## Unknowns / limits

- This page does not prove which exact watcher was active in the live pane at the moment the user saw the logs.
- To identify the exact runtime source, we would need the tmux or hook logs from that specific run.

## Related

- [[omx-team-lifecycle-restart-smoke-failures-2026-06-24]]
