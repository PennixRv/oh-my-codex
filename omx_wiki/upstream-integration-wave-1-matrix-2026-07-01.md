---
title: "Upstream Integration Wave 1 Matrix 2026-07-01"
tags: ["upstream", "integration", "wave-1", "hooks", "setup", "agents", "team"]
created: 2026-07-01T08:00:03.000Z
updated: 2026-07-01T08:00:03.000Z
sources: []
links: []
category: architecture
confidence: high
schemaVersion: 1
---

# Upstream Integration Wave 1 Matrix 2026-07-01

## Scope

This matrix tracks the first bounded Pennix fork integration wave against `upstream/main` after divergence from `v0.18.12` (`29d03f493095899104f2c47ece39b166c5b14568`).

Decision rubric:

- `integrate`: take upstream behavior directly or near-directly
- `adapt`: take the fix intent but preserve Pennix-specific behavior
- `defer`: postpone to a later wave
- `reject`: do not merge because it conflicts with fork policy

## Wave 1 Decisions

| Upstream commit/theme | Area | Decision | Notes |
| --- | --- | --- | --- |
| `4c972a87` fix setup plugin config dedupe | plugin marketplace / config TOML | `integrate` | Safe and directly relevant. Prevents repeated `[plugins."oh-my-codex@oh-my-codex-local"]` and MCP server tables across repeated setup runs. |
| `43483f47` fix hooks json state compatibility | hooks.json / setup / doctor | `adapt` | Pennix already moved trust state to `config.toml [hooks.state]`. We still need explicit extraction, migration, and doctor detection for legacy top-level `state` in `hooks.json`. |
| `3ce7bd4d` fix PreToolUse native hook stdout schema | native hook CLI | `adapt` | Upstream stdout hardening is needed, but Pennix relies on `hookSpecificOutput.additionalContext` on `PreToolUse`. Apply schema-safe sanitization only where malformed output would otherwise break Codex. |
| `4c55444e` keep native hooks successful on null output | native hook CLI | `integrate` | Low risk. Preserve empty-success behavior for hook events with no payload rather than exiting non-zero. |
| `4072f1c5` preserve AGENTS guidance in worker worktrees | team worker bootstrap | `adapt` | Required, but keep Pennix worker runtime protocol text and mailbox-boundary semantics. Preserve inherited AGENTS guidance while still layering the runtime overlay last. |
| `76b01687`, `3e394380` doctor plugin mode inference | doctor | `already present` | Current fork already includes plugin-mode inference wording and tests. No action needed in wave 1 beyond regression coverage. |
| `5d13d880`, `e9c20905`, `e2415f95` setup developer instructions / AGENTS policy | plugin setup / prompt policy | `defer` | Pennix already carries fork-specific prompt and AGENTS behavior. Revisit as a dedicated wave to avoid clobbering append-only developer instructions policy. |
| `fa7ed16c` preserve HUD pane ownership on shutdown | HUD / tmux | `defer` | Relevant but outside the current bounded wave. Evaluate after hook and team lifecycle regressions are fully stable. |
| new product surfaces (`vscode-extension`, `docs/url-reader.md`, `geobench`) | product surface | `defer` | Include in broader integration inventory, but not needed for first-wave correctness repairs. |

## Pennix-specific constraints preserved in wave 1

- Keep mailbox-first leader/worker communication.
- Do not reintroduce synthetic leader mailbox reminders or tmux inject spam.
- Keep plugin-mode Pennix wording and local marketplace/cache behavior.
- Keep HUD default disabled.
- Keep developer instructions append-only when user content already exists.
- Keep worker runtime instructions aligned with the mailbox-boundary handoff model.

## Exit criteria for wave 1

- Repeated `omx setup` does not duplicate plugin TOML tables.
- Legacy `hooks.json` top-level trust state is migrated out of `hooks.json`.
- `omx doctor` flags legacy `hooks.json` top-level `state` when present.
- Worker worktree `AGENTS.md` preserves inherited user/project guidance and appends the runtime overlay.
- Native hook CLI does not fail closed merely because a hook event legitimately returns no stdout payload.
