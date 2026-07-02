---
title: "Upstream Integration Wave 2B Matrix 2026-07-01"
tags: ["upstream", "integration", "wave-2b", "hud", "tmux", "leader-nudge", "shutdown"]
created: 2026-07-01T13:05:00.000Z
updated: 2026-07-01T13:05:00.000Z
sources: []
links: ["upstream-integration-wave-1-matrix-2026-07-01.md", "upstream-integration-wave-2a-matrix-2026-07-01.md"]
category: architecture
confidence: high
schemaVersion: 1
---

# Upstream Integration Wave 2B Matrix 2026-07-01

## Scope

This bounded wave continues the post-Wave-2A upstream merge track with runtime hardening that directly overlaps Pennix fork pain points:

- `639cd7ff` — pane-scoped standalone HUD stability
- `f592831b` — tmux named-buffer cleanup in team pane input path
- `e28da4b3` — suppress stale leader nudge persistence after shutdown / teardown races

Wave 2B keeps Pennix-specific constraints intact:

- `AGENTS.md` remains the orchestration contract
- leader/worker coordination stays mailbox-first
- no revival of synthetic leader mailbox reminders
- no revival of visible leader-pane inject spam
- shutdown races must not recreate removed team state

## Decisions

| Upstream commit/theme | Area | Decision | Notes |
| --- | --- | --- | --- |
| `639cd7ff` fix standalone pane-scoped HUD stability | HUD reconcile | `adapt` | Implemented. Prompt-submit HUD topology validation is now relative to the current leader pane geometry, not always full-window width. This preserves pane-scoped standalone HUDs when two Codex leaders share one tmux window bottom. |
| `f592831b` tmux buffer cleanup | worker/team tmux input guard | `adapt` | Implemented. `team-tmux-guard` now uses named tmux buffers plus cleanup in `finally`, while preserving Pennix’s hook-review dismissal behavior. |
| `e28da4b3` suppress stale leader nudges after shutdown | leader nudge persistence / teardown races | `adapt selectively` | Implemented selectively. Pennix does not restore upstream’s visible leader injection path, but it now adopts the shutdown-gated persistence model so `leader-attention.json` and global nudge bookkeeping are not recreated after team teardown races. |
| `fa7ed16c` preserve HUD pane ownership on shutdown | team shutdown / tmux topology ownership | `defer` | Not merged in Wave 2B. Upstream change is larger and overlaps Pennix-specific shutdown semantics. Requires a later dedicated pane-owner adaptation wave. |

## Implemented changes

- `src/hud/reconcile.ts`
  - topology checks now compare HUD pane geometry to the emitting leader pane
  - creation chooses `fullWidth` only when the leader itself spans full window width
- `src/hud/__tests__/reconcile.test.ts`
  - added pane-scoped standalone HUD stability regression
  - preserved full-width recreation only for true malformed-topology cases
- `src/scripts/notify-hook/team-tmux-guard.ts`
  - switched typed prompt delivery to named tmux buffers
  - verifies buffer contents before paste
  - cleans named buffers on success and failure
- `src/hooks/__tests__/notify-hook-team-tmux-guard.test.ts`
  - updated happy-path assertions for named-buffer flow
  - added cleanup regressions for `buffer_show_failed` and `buffer_paste_failed`
- `src/scripts/notify-hook/team-leader-nudge.ts`
  - added shutdown-aware persistence gates before writing `leader-attention.json` and `team-leader-nudge.json`
  - added atomic temp-write helpers without recreating removed team directories
  - added focused test seams for teardown-race simulation
  - preserves Pennix’s existing `leader_visible_injection_disabled` behavior
- `src/hooks/__tests__/notify-hook-team-leader-nudge.test.ts`
  - added runnable shutdown-race regressions outside the historical skipped suites

## Validation

- `npm run build`
- `node dist/scripts/run-test-files.js dist/hud/__tests__/reconcile.test.js dist/hooks/__tests__/notify-hook-team-tmux-guard.test.js dist/hooks/__tests__/notify-hook-team-leader-nudge.test.js`

## Exit status

Wave 2B is complete and validated locally. The next remaining upstream runtime candidate from this cluster is the larger `fa7ed16c` shutdown pane-owner work, which should be handled as a separate adaptation wave because it changes team shutdown topology semantics rather than a small local invariant.
