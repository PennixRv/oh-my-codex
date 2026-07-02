---
title: "Upstream Integration Wave 3C Matrix 2026-07-01"
tags: ["upstream", "integration", "wave-3c", "agents", "auth", "hotswap", "provider-routing", "spark"]
created: 2026-07-01T16:55:00.000Z
updated: 2026-07-01T16:55:00.000Z
sources: []
links: ["upstream-integration-wave-3a-matrix-2026-07-01.md", "upstream-integration-wave-3b-matrix-2026-07-01.md", "omx-role-routing-and-model-mapping-analysis-2026-06-29.md"]
category: architecture
confidence: high
schemaVersion: 1
---

# Upstream Integration Wave 3C Matrix 2026-07-01

## Scope

This bounded wave absorbs two still-missing low-conflict correctness fixes from upstream:

- `0292ac6a` — spark native provider inheritance
- `94698b45` — auth slot isolation and invalid token rotation

Wave 3C keeps Pennix-specific constraints intact:

- `roleModels` remains the primary fork-facing role-model surface
- mailbox-first team behavior is unchanged
- no team inject revival
- no HUD default regression
- no release/publish flow changes are included in this wave

## Decisions

| Upstream commit/theme | Area | Decision | Notes |
| --- | --- | --- | --- |
| `0292ac6a` spark native provider inheritance | native agent TOML generation | `adapt` | Implemented. Default Spark-lane native agents no longer inherit a root `model_provider` that belongs to a different root-model lane. Explicit per-role model overrides still keep provider inheritance when appropriate. |
| `94698b45` auth slot isolation and invalid token rotation | `omx auth add`, `--hotswap` | `adapt` | Implemented. `auth add` now logs in through an isolated temporary `CODEX_HOME` and only installs the slot into the live home when needed. Hotswap now treats invalidated tokens as a rotation-worthy slot failure without requiring a resumable rollout session. |

## Implemented changes

- `src/agents/native-config.ts`
  - added `shouldInheritRootModelProvider(...)`
  - prevented default fast/Spark-lane agents from inheriting the root `model_provider` when they still resolve to the canonical Spark default model
  - preserved provider inheritance for non-fast agents and for fast agents with explicit per-role model overrides
- `src/agents/__tests__/native-config.test.ts`
  - added regression coverage that installs an `explore` native agent under:
    - root `model = gpt-5.5`
    - root `model_provider = OpenAI`
    - Spark default `gpt-5.4-mini`
  - verified the generated Spark-lane agent TOML omits `model_provider`
- `src/cli/auth.ts`
  - `omx auth add` now accepts a bounded allowlist of `codex login` flags:
    - `--device-auth`
    - `--with-api-key`
    - `--with-access-token`
  - login now runs through an isolated temporary `CODEX_HOME`
  - existing live `auth.json` is preserved during slot creation
  - if no live auth exists yet, the newly added slot is installed into the live location
- `src/auth/hotswap.ts`
  - added invalid-token detection for hotswap stderr
  - rotates away from invalidated tokens without requiring a rollout resume session
  - distinguishes “quota detected” from “token invalidated”
  - updated exhausted-slot wording to include invalidated slots
- `src/cli/__tests__/auth.test.ts`
  - added isolated-login coverage for `auth add --device-auth`
  - added project-scope login isolation coverage
  - added invalid-token hotswap rotation coverage
  - updated exhausted-slot wording expectations

## Findings First

1. Root provider inheritance is only correct when the child model still belongs to the same provider lane.
   - A fast/Spark-lane child that resolves to the canonical Spark default model should not blindly inherit a root provider chosen for the frontier lane.
   - Otherwise the generated native agent TOML can describe a model/provider combination that the runtime never intended.
2. `auth add` should not mutate live Codex login state as a side effect of slot capture.
   - Logging into the live `CODEX_HOME` just to save a slot couples slot management to the currently active session/account and can unexpectedly replace the live auth context.
   - Isolated login is the correct boundary: capture first, then install intentionally.
3. Invalidated tokens are operationally different from quota exhaustion.
   - Quota rotation needs a resumable rollout session because the same logical task should continue after a recoverable 429.
   - Invalidated tokens are a broken credential problem, not a rollout continuation problem, so rotation should proceed without requiring resume history.

## Validation

- `npm run build`
- `node dist/scripts/run-test-files.js dist/agents/__tests__/native-config.test.js dist/cli/__tests__/auth.test.js`

All targeted Wave 3C suites passed after the adaptation.

## Exit status

Wave 3C is complete and locally validated.

What changed in practical terms:

- Spark-lane native agents no longer inherit an unrelated root provider by default
- `omx auth add` now captures slots without trampling the live Codex auth home
- hotswap can rotate past invalidated tokens even when there is no rollout session to resume

The next bounded wave should continue from remaining small correctness gaps rather than reopening model-routing or auth isolation again.
