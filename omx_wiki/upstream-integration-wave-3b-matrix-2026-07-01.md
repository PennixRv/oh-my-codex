---
title: "Upstream Integration Wave 3B Matrix 2026-07-01"
tags: ["upstream", "integration", "wave-3b", "planning-gate", "ralplan", "ultragoal", "session-ownership", "hooks"]
created: 2026-07-01T16:25:00.000Z
updated: 2026-07-01T16:25:00.000Z
sources: []
links: ["upstream-integration-wave-1-matrix-2026-07-01.md", "upstream-integration-wave-2a-matrix-2026-07-01.md", "upstream-integration-wave-2b-matrix-2026-07-01.md", "upstream-integration-wave-2c-matrix-2026-07-01.md", "upstream-integration-wave-3a-matrix-2026-07-01.md"]
category: architecture
confidence: high
schemaVersion: 1
---

# Upstream Integration Wave 3B Matrix 2026-07-01

## Scope

This bounded wave absorbs the upstream planning-gate and terminal-state correctness cluster while preserving Pennix fork policy:

- `2edfff8a` — preserve PreToolUse planning-guard output
- `da0eb9cb` — keep planning writes blocked
- `7c6faf14` — fail closed on live root planning-pointer conflicts
- `2034191b` — protect planning-gate state writes
- `eae4b398` — planning-guard helper compaction, no behavior change
- `f8b7f5f7` — planning-gate coherence follow-up
- `40db45c7` — ralplan gate fail follow-up
- `10aa1b0d` — ralplan terminal session state
- `a0c83452` — recover ultragoal `get_goal: null` completion loops

Wave 3B keeps Pennix-specific constraints intact:

- mailbox-first leader / worker behavior remains unchanged
- no synthetic leader reminders are reintroduced
- no tmux inject spam is reintroduced
- HUD default remains disabled
- `roleModels` / Pennix role policy remains fork-owned
- planning safety continues to fail closed rather than guessing through session ambiguity

## Decisions

| Upstream commit/theme | Area | Decision | Notes |
| --- | --- | --- | --- |
| `2edfff8a` preserve PreToolUse planning-guard output | hook boundary output stability | `adapt` | Implemented through the current fork hook contract, preserving Pennix `additionalContext` behavior while keeping deny/block semantics intact. |
| `da0eb9cb`, `2034191b`, `f8b7f5f7`, `40db45c7` planning-gate hardening | planning guard / implementation-write blocking | `adapt selectively` | Implemented only where the upstream fixes closed real correctness gaps. Pennix keeps the write-blocking posture for active planning phases and does not relax it just to mirror upstream transport behavior. |
| `7c6faf14` live root pointer conflicts | session ownership / fail-closed safety | `adapt` | Implemented. Conflicting live root session pointers now block planning writes until the authoritative owner session is reconciled. |
| `10aa1b0d` ralplan terminal session state | canonical root + session tombstones | `adapt` | Implemented with Pennix canonical skill-state handling. Terminal root/session ralplan writes now cleanly converge instead of leaving stale planning markers behind. |
| `a0c83452` ultragoal null `get_goal` recovery | goal reconciliation / completion safety | `adapt` | Implemented. `get_goal: null` is treated as “no active goal/null”, and OMX refuses to self-complete or self-block from empty Codex-goal evidence. |
| `eae4b398` planning-guard helper compaction | cleanup only | `reject for now` | No behavior gain for the fork. The useful behavior from its source commits is already adapted without taking the refactor-only churn. |

## Implemented changes

- `src/state/skill-active.ts`
  - exported terminal-skill helpers for reuse by state operations
  - expanded terminal-marker cleanup to remove `terminal_reason`
- `src/state/operations.ts`
  - added explicit ralplan terminalization helpers
  - finalized completed ralplan writes across root and session state
  - synchronized canonical skill-active tombstones after terminal consensus completion
- `src/scripts/codex-native-hook.ts`
  - added live-root session-pointer conflict detection using only real session metadata
  - removed stale terminal-autopilot bypasses that could reopen implementation writes during active planning ambiguity
  - made deep-interview / ralplan PreToolUse guards fail closed when a different live root session still owns planning state
- `src/goal-workflows/codex-goal-snapshot.ts`
  - tightened absent-snapshot wording for `get_goal: null`
  - requires explicit `create_goal` recovery instead of letting OMX infer completion from its own local state
- tests
  - `src/scripts/__tests__/codex-native-hook.test.ts`
  - `src/state/__tests__/operations.test.ts`
  - `src/goal-workflows/__tests__/codex-goal-snapshot.test.ts`
  - `src/cli/__tests__/ultragoal.test.ts`
  - targeted regressions now cover:
    - live root pointer conflicts
    - blocked writes under stale supervised-planning ambiguity
    - full ralplan terminal root/session cleanup
    - ultragoal `get_goal: null` fail-closed recovery

## Findings First

1. The highest-value upstream contribution in this cluster was fail-closed session ownership, not the refactors around it.
   - Planning writes are only trustworthy when the current payload, canonical session pointer, and live process metadata agree.
   - If a different live root session still owns the planning state, allowing implementation writes is the wrong default.
2. Ralplan completion is not complete until both root and session state converge.
   - A terminal root state with stale session planning markers is still operationally broken because later hooks can misread the session-local planning phase.
   - The fix is explicit terminalization, not hoping later reconciliation cleans it up.
3. `get_goal: null` is not harmless missing data.
   - In the current fork workflow, local OMX progress can outlive or diverge from Codex goal state.
   - Treating “null goal” as a soft warning would let models falsely checkpoint completion or blockers from stale local artifacts.
4. The fork should preserve the planning-write block even where upstream later relaxed transport details.
   - Pennix has stronger reasons to keep implementation/write tools blocked during active planning phases because its mailbox-first runtime and custom workflow overlays make accidental cross-phase mutation more costly.

## Validation

- `npm run build`
- `node dist/scripts/run-test-files.js dist/scripts/__tests__/codex-native-hook.test.js dist/state/__tests__/operations.test.js dist/goal-workflows/__tests__/codex-goal-snapshot.test.js dist/cli/__tests__/ultragoal.test.js`

All targeted Wave 3B suites passed when run sequentially after build completion.

## Exit status

Wave 3B is complete and locally validated.

What changed in practical terms:

- active planning writes now fail closed if a different live root session still owns the plan
- completed ralplan consensus writes clean up both root and session skill-state markers instead of leaving stale planning state behind
- ultragoal completion can no longer be inferred from OMX state alone when Codex reports `goal: null`
- planning-gate block output remains explicit and preserved at hook boundaries instead of degrading into ambiguous null behavior

The next bounded upstream wave should target still-missing low-conflict correctness fixes rather than reopening the planning-gate cluster again.
