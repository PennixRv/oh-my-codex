---
title: "Upstream Integration Wave 3A Matrix 2026-07-01"
tags: ["upstream", "integration", "wave-3a", "roles", "models", "team", "routing", "diagnostics"]
created: 2026-07-01T15:13:34.000Z
updated: 2026-07-01T15:13:34.000Z
sources: []
links: ["upstream-integration-wave-1-matrix-2026-07-01.md", "upstream-integration-wave-2a-matrix-2026-07-01.md", "upstream-integration-wave-2b-matrix-2026-07-01.md", "upstream-integration-wave-2c-matrix-2026-07-01.md", "omx-role-routing-and-model-mapping-analysis-2026-06-29.md"]
category: architecture
confidence: high
schemaVersion: 1
---

# Upstream Integration Wave 3A Matrix 2026-07-01

## Scope

This bounded wave absorbs the upstream role-model convergence batch while preserving Pennix fork policy:

- `831d818e` — per-agent model overrides
- `0be5f0bd` — startup model-routing diagnostics
- `e0477d96` — preserve exact planner / architect model contracts
- `3a88115d` — exact-role worker CLI resolution during scale-up
- `97df8ca8` — follow-up exact-role scale-up CLI resolver

Wave 3A keeps Pennix-specific constraints intact:

- `roleModels` remains the primary fork-facing config surface
- Pennix role conclusions do not adopt upstream `gpt-5.5` planner / architect defaults
- exact-role protection is preserved so inherited leader frontier models do not silently override protected role defaults
- mailbox-first leader / worker behavior remains unchanged
- no tmux inject spam revival
- HUD default remains disabled

## Decisions

| Upstream commit/theme | Area | Decision | Notes |
| --- | --- | --- | --- |
| `831d818e` per-agent model overrides | `.omx-config.json` model routing | `adapt` | Implemented as a compatibility layer. Pennix keeps `roleModels` authoritative and accepts upstream `agentModels` only as an alias that fills missing model values. |
| `0be5f0bd` startup model-routing diagnostics | team runtime observability | `adapt` | Implemented. Worker startup logging now records requested role defaults, actual resolved model, reasoning source, model source, and inherited parent model state. |
| `e0477d96` exact planner / architect contracts | protected role defaults | `adapt selectively` | Implemented selectively. Pennix keeps the exact-role protection mechanism and explicit-env precedence, but rejects upstream’s policy decision to pin planner / architect to `gpt-5.5`. Current Pennix exact defaults remain fork-owned. |
| `3a88115d` exact-role worker CLI resolution in scale-up | scale-up worker launcher | `adapt` | Implemented. Scale-up now resolves worker CLI from each worker’s final resolved launch args rather than a shared pre-resolution guess. |
| `97df8ca8` follow-up exact-role scale-up CLI resolver | scale-up correctness hardening | `adapt` | Implemented together with the final-args worker CLI path and inherited-model isolation. |

## Implemented changes

- `src/config/models.ts`
  - added `agentModels` compatibility support in `.omx-config.json`
  - kept `roleModels` authoritative while allowing `agentModels` to backfill only missing model values
- `src/team/model-contract.ts`
  - added `OMX_TEAM_WORKER_INHERITED_MODEL` handling
  - added exact-role protection helpers
  - added structured launch diagnostics helpers
  - updated default model resolution to honor:
    - `roleModels.<role>.model`
    - built-in `exactModel`
    - then class/default fallback routing
- `src/team/runtime.ts`
  - isolated inherited leader model transport from explicit worker model overrides
  - logged requested vs actual worker routing with explicit source attribution
  - preserved exact-role model protection against inherited leader frontier models
- `src/team/scaling.ts`
  - resolved each scaled worker CLI from that worker’s final resolved launch args
  - preserved exact-role behavior during scale-up
- `src/team/tmux-session.ts`
  - added per-worker CLI resolution helper based on resolved launch args rather than a shared plan guess
- `src/cli/index.ts`
  - propagated inherited worker model through detached-session bootstrap env so worker runtime resolution can preserve exact-role isolation

## Findings First

1. Upstream’s most valuable contribution in this batch was the mechanism, not the policy conclusion.
   - The useful parts were compatibility for per-role overrides, exact-role protection, launch diagnostics, and scale-up CLI resolution from final launch args.
   - The fork should not inherit upstream’s planner / architect `gpt-5.5` conclusion just because the mechanism arrived in the same commit family.
2. The critical correctness boundary is separating three sources of truth:
   - explicit worker launch args
   - inherited leader model
   - protected role defaults
   Mixing those without source tagging causes silent role drift.
3. Scale-up correctness depends on choosing worker CLI from each worker’s final resolved args, not from a shared pre-resolution guess.
   - Otherwise a worker whose final resolved model points to Codex can still be launched through the wrong provider CLI if the shared plan was derived too early.
4. Compatibility should be additive, not disruptive.
   - Supporting upstream `agentModels` helps convergence and operator familiarity.
   - Keeping `roleModels` authoritative preserves the Pennix fork contract and avoids rewriting existing local configuration guidance.

## Validation

- `npm run build`
- `node dist/scripts/run-test-files.js dist/config/__tests__/models.test.js dist/team/__tests__/model-contract.test.js dist/team/__tests__/runtime.test.js dist/cli/__tests__/index.test.js`
- `node dist/scripts/run-test-files.js dist/team/__tests__/scaling.test.js dist/team/__tests__/tmux-session.test.js`

All targeted Wave 3A suites passed after the adaptation.

## Exit status

Wave 3A is complete and locally validated.

What changed in practical terms:

- Pennix now accepts upstream `agentModels` config as a compatibility alias without surrendering `roleModels` authority
- protected exact-role defaults remain insulated from inherited leader frontier models unless the worker launch explicitly overrides them
- startup logs now explain why a worker launched with a given model / reasoning pair instead of leaving routing opaque
- scale-up worker CLI choice now follows the final resolved worker model rather than a shared early guess

The next upstream batch should focus on a different correctness cluster rather than revisiting role-model convergence again.
