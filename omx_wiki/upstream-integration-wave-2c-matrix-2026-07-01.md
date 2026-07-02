---
title: "Upstream Integration Wave 2C Matrix 2026-07-01"
tags: ["upstream", "integration", "team", "shutdown", "tmux", "ownership", "hud", "testing"]
created: 2026-07-01T13:52:56.000Z
updated: 2026-07-01T13:52:56.000Z
sources: []
links: ["upstream-integration-wave-1-matrix-2026-07-01.md", "upstream-integration-wave-2a-matrix-2026-07-01.md", "upstream-integration-wave-2b-matrix-2026-07-01.md"]
category: architecture
confidence: high
schemaVersion: 1
---

# Upstream Integration Wave 2C Matrix 2026-07-01

## Scope

This bounded wave handles the previously deferred upstream shutdown / tmux pane-ownership batch:

- `fa7ed16c` — preserve team HUD and worker pane ownership during shutdown in shared tmux sessions

Wave 2C keeps Pennix-specific constraints intact:

- `AGENTS.md` remains the orchestration contract
- mailbox-first leader/worker coordination remains unchanged
- no synthetic leader-mailbox reminder revival
- no tmux inject spam revival
- HUD remains disabled by default
- team shutdown must stay conservative in shared-session environments
- Pennix must not restore standalone HUD panes by default after team shutdown

## Decisions

| Upstream commit/theme | Area | Decision | Notes |
| --- | --- | --- | --- |
| `fa7ed16c` preserve HUD pane ownership on shutdown | shared-session tmux shutdown safety | `adapt` | Implemented with Pennix-specific shutdown semantics. Team state now persists a dedicated `tmux_pane_owner_id`, worker and HUD panes are tagged with that owner id, and shared-session shutdown only tears down panes whose live owner metadata matches the team. Pennix intentionally keeps the no-standalone-HUD-restore behavior. |

## Implemented changes

- `src/team/state.ts`
  - added defaulted `tmux_pane_owner_id` persistence to team config and manifest
  - normalized owner-id round-tripping across legacy reads and manifest sync
- `src/team/state/types.ts`
  - added `tmux_pane_owner_id` to shared team config / manifest contracts
- `src/team/tmux-session.ts`
  - added pane owner tagging via `@omx_team_pane_owner_id`
  - extended `createTeamSession()` to propagate a team-scoped pane owner token
  - upgraded shared-session topology resolution to identify:
    - live team worker panes
    - leader-owned HUD panes
    - leader pane exclusion under shared tmux windows
  - retained Pennix no-inject / mailbox-only constraints
- `src/team/runtime.ts`
  - persisted owner ids into interactive session config
  - filtered shared-session shutdown candidates by live owner metadata
  - failed closed on unreadable owner tags instead of over-killing panes
  - removed the shared-session standalone HUD restore path so Pennix HUD-default-off behavior remains intact
- `src/team/scaling.ts`
  - scale-up now tags newly created worker panes with the same team pane owner id

## Findings First

1. The remaining Wave 2C failures were primarily fixture drift, not runtime regressions.
2. Shared-session shutdown now depends on two concrete runtime signals:
   - worker pane `startCommand` must match a supported worker-launch shape, with startup scripts being the most reliable path
   - pane ownership must be readable through `@omx_team_pane_owner_id`, otherwise shutdown intentionally fails closed
3. HUD reclamation in shared sessions is now owner-aware:
   - a live HUD pane is only reclaimable when it is clearly team-owned
   - stale persisted HUD ids no longer justify killing unrelated HUD panes
4. Pennix intentionally diverges from upstream by not restoring a standalone HUD pane after team HUD teardown.

## Root Cause Of The Test Failures

The last failing Wave 2C shutdown tests were not exposing a real runtime bug.

Two concrete test-fixture problems were masking the intended behavior:

1. Shared-session fixtures still used older pane command shapes such as bare `env OMX_TEAM_INTERNAL_WORKER=... codex`, while the current topology recognizer is stricter and most reliably recognizes:
   - generated worker startup scripts like `exec /bin/sh '.../runtime/worker-N-startup.sh'`
   - supported environment-assignment forms that still demonstrably invoke a worker CLI
2. Several tmux fixture stubs emitted HUD commands containing unescaped `%11` / `%99` inside shell `printf` payloads. In shell `printf`, `%` is a format introducer, so those stubs returned non-zero while pretending to list panes. The runtime then received an empty `list-panes` result and conservatively skipped teardown.

This means the fix here was:

- keep the owner-aware runtime behavior
- update the tests to represent the real supported pane shapes
- correct the shell-stub `%` escaping so the fixtures actually return pane topology

## Validation

- `npm run build`
- `node dist/scripts/run-test-files.js dist/team/__tests__/runtime.test.js`
- `node dist/scripts/run-test-files.js dist/team/__tests__/tmux-session.test.js dist/team/__tests__/runtime.test.js dist/team/__tests__/scaling.test.js`

All targeted suites passed after the owner-aware shutdown adaptation and fixture corrections.

## Exit status

Wave 2C is complete and locally validated.

What changed in practical terms:

- shared-session shutdown now tears down only panes that are both recognizably team-created and owner-matched
- unrelated HUD panes survive stale persisted HUD metadata
- leader panes are preserved in shared-session / native-Windows split-pane shutdown
- Pennix still does not restore standalone HUD panes after team shutdown

The next upstream batches can build on this owner-aware shutdown baseline without revisiting the old “kill by persisted pane id only” behavior.
