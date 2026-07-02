---
title: "Upstream Integration Wave 2A Matrix 2026-07-01"
tags: ["upstream", "integration", "wave-2a", "setup", "developer-instructions", "agents", "plugin"]
created: 2026-07-01T11:48:59.000Z
updated: 2026-07-01T11:48:59.000Z
sources: []
links: ["upstream-integration-wave-1-matrix-2026-07-01.md"]
category: architecture
confidence: high
schemaVersion: 1
---

# Upstream Integration Wave 2A Matrix 2026-07-01

## Scope

This matrix tracks the deferred Wave 2A setup-policy batch from [Wave 1](upstream-integration-wave-1-matrix-2026-07-01.md):

- `5d13d880` — plugin `developer_instructions` prompt policy
- `e9c20905` — preserve custom `developer_instructions` on plugin cleanup
- `e2415f95` — preserve plugin `AGENTS.md` policy blocks

Wave 2A keeps Pennix-specific constraints intact:

- plugin-mode `developer_instructions` remains append-only when user-owned instructions already exist
- current Pennix plugin-mode wording remains authoritative
- `AGENTS.md` stays the primary orchestration contract
- plugin-mode setup must not clobber durable user-owned OMX policy blocks

## Decisions

| Upstream commit/theme | Area | Decision | Notes |
| --- | --- | --- | --- |
| `5d13d880` fix plugin `developer_instructions` prompt policy | plugin setup / `developer_instructions` | `adapt` | Upstream intent is partially covered by the current Pennix classifier and fragment dedupe logic, but raw upstream behavior is not adopted because Pennix intentionally keeps append-only fragment injection for existing custom `developer_instructions`. Active fork coverage lives in `src/cli/__tests__/setup-agents-overwrite.test.ts` (`appends`, `dedupes`, `migrates historical`). |
| `e9c20905` preserve custom `developer_instructions` on plugin cleanup | plugin cleanup / `developer_instructions` | `already present` | Pennix cleanup already preserves user-owned text while stripping only fully managed OMX `developer_instructions` content before reapplying the plugin fragment when appropriate. No Wave 2A code change was required beyond documenting the fork divergence. |
| `e2415f95` preserve plugin `AGENTS.md` policy blocks | plugin `AGENTS.md` refresh | `adapt` | Implemented in Wave 2A. Plugin-mode AGENTS defaults refresh now preserves user-owned `<!-- USER:OMX:POLICY:START --> ... <!-- USER:OMX:POLICY:END -->` blocks during forced regeneration, without changing Pennix worker/runtime overlay semantics. |

## Implemented changes

- Added `extractUserOmxPolicyBlocks()` and `preserveUserOmxPolicyBlocks()` in `src/utils/agents-md.ts`.
- Wired plugin-mode AGENTS defaults refresh in `src/cli/setup.ts` to preserve user policy blocks before overwrite/sync.
- Added focused regression coverage for:
  - helper extraction and dedupe
  - forced plugin defaults refresh preserving user policy blocks
  - existing Pennix plugin `developer_instructions` append/dedupe behavior remaining unchanged

## Validation

- `npm run build`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/setup-agents-overwrite.test.js dist/utils/__tests__/agents-md.test.js`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/setup-install-mode.test.js`
  - only the trust-state regression suite is active there today; it still passes

## Exit status

Wave 2A is ready to continue into the next bounded upstream batch. The remaining work is to choose the next commit family after setup-policy convergence, not to revisit these three commits again unless Pennix decides to drop append-only `developer_instructions` semantics.
