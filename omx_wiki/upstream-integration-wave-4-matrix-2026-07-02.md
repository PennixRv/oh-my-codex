---
title: "Upstream Integration Wave 4 Matrix 2026-07-02"
tags: ["upstream", "integration", "wave-4", "ultragoal", "doctor", "proxy", "classification"]
created: 2026-07-02T00:00:00.000Z
updated: 2026-07-02T00:00:00.000Z
sources: []
links: ["upstream-integration-wave-1-matrix-2026-07-01.md"]
category: architecture
confidence: high
schemaVersion: 1
---

# Upstream Integration Wave 4 Matrix 2026-07-02

## Scope

This wave closes the remaining small, high-confidence upstream correctness gaps that were still genuinely missing after the earlier bounded Pennix integration work, and records the remaining worthwhile upstream commits into an explicit classification matrix instead of blindly merging all later upstream history.

Wave 4 keeps Pennix-specific constraints intact:

- no reintroduction of synthetic team inject reminders
- no mailbox-first team behavior regression
- no HUD-default-off regression
- no broad planning-gate rewrite imported without a bounded fork decision

## Decisions

| Upstream commit/theme | Area | Decision | Notes |
| --- | --- | --- | --- |
| `69468f3f` trim proxy env fallback values | notification proxy resolution | `adapt` | Implemented. Blank scheme-specific proxy vars no longer suppress valid `ALL_PROXY`, and fallback proxy values are trimmed before use. |
| `8f40e9e1` / `38fd5740` root-owned repo artifact warning in doctor | repo-local `.omx` / `.beads` ownership | `adapt` | Implemented. `omx doctor` now warns on root-owned / owner-mismatched / non-writable repo artifacts and supports bounded repair under `--force`. |
| `2c4f3001` reconcile review-blocked ultragoal resolver | ultragoal final-review blocker reconciliation | `adapt` | Implemented. Review-blocked parent stories now record their designated resolver, only that resolver may close the parent through the clean final quality gate, and forged resolver paths fail closed. |
| `e231e800` passive URL reader | new CLI capability | `defer` | New feature surface, not a small correctness patch. |
| `32d90a79` local session friction report | new CLI/reporting capability | `defer` | Useful, but it is a distinct feature rather than a release-critical correctness fix. |
| late planning-gate / hook hardening batch (`437030a1`, `40db45c7`, `f8b7f5f7`, `7c6faf14`, `2034191b`) | `codex-native-hook` / planning gate | `defer` | High-churn transport/parser rewrites. Current fork already contains many later-equivalent protections and Pennix-specific mailbox/hook adaptations. These need a separate bounded review. |

## Implemented changes

- `src/notifications/http-client.ts`
  - trimmed proxy env values during fallback resolution
- `src/notifications/__tests__/http-client.test.ts`
  - added regression for blank `https_proxy` with trimmed `ALL_PROXY`
- `src/cli/doctor.ts`
  - added repo artifact ownership / writability detection for `.omx` and `.beads`
  - added bounded auto-repair path for `omx doctor --force`
  - made verbose PostCompact smoke invocation Windows-safe
- `src/cli/__tests__/doctor-artifact-ownership.test.ts`
  - added focused ownership / repair coverage
- `src/ultragoal/artifacts.ts`
  - added designated review-blocker resolver metadata
  - distinguished active vs historical `review_blocked` counts
  - allowed only the designated resolver to reconcile a review-blocked parent through the clean final quality gate
  - failed closed for forged/non-designated resolver aggregate completion attempts
- `src/ultragoal/__tests__/artifacts.test.ts`
  - added designated resolver metadata coverage
  - added clean resolver reconciliation coverage
  - added forged resolver fail-closed coverage

## Findings First

1. The remaining worthwhile upstream gaps were smaller than the raw commit log suggested.
   - A large share of later upstream commits were already effectively absorbed by the Pennix fork through equivalent code paths and tests.
   - The truly missing gaps in this wave were three narrow correctness fixes, not another broad merge wave.

2. `review_blocked` ultragoal parents needed explicit designated-resolver ownership.
   - Before this wave, the fork could append a blocker-resolver story but did not structurally tie final reconciliation to that exact resolver.
   - That allowed forged or non-designated resolver paths to risk incorrect aggregate completion behavior.

3. Repo-local state ownership is an operational correctness problem, not just UX copy.
   - Root-owned or foreign-owned `.omx` / `.beads` trees can make the runtime appear flaky when the real issue is filesystem ownership drift.
   - `omx doctor` now surfaces that class of problem directly and can repair it under a bounded condition.

4. Proxy fallback trimming matters in real-world envs.
   - Blank `https_proxy` or `http_proxy` values are common in shell profiles and CI environments.
   - Without trimming, a whitespace-only scheme-specific variable masks a valid `ALL_PROXY` fallback.

## Validation

- `npm run build`
- `node dist/scripts/run-test-files.js dist/ultragoal/__tests__/artifacts.test.js dist/cli/__tests__/doctor-artifact-ownership.test.js dist/notifications/__tests__/http-client.test.js`

Wave 4 is locally validated and ready for standard tag-driven publication.
