# oh-my-codex-pennix v0.18.64

Drafted: 2026-07-02

Patch release for the Pennix fork team/runtime and setup-preservation line.

## Summary

`0.18.64` tightens three operator-facing surfaces that were drifting under repeated real-world OMX use:

- repeated plugin-mode setup now preserves user-owned guidance instead of silently dropping it
- team runtime and worker launch routing are hardened around Gemini startup, exact-role defaults, and mailbox-boundary lifecycle behavior
- auth/session tooling now handles isolated login, invalidated slot rotation, and project runtime transcript discovery more safely

## Included changes

### Setup and install preservation

- Repeated plugin-mode setup preserves the current OMX-managed `developer_instructions` fragment instead of stripping it during legacy-root cleanup.
- Regenerated plugin-mode `AGENTS.md` defaults now preserve user-owned OMX policy blocks.
- Native-agent refresh writes and consults a content-hash manifest so setup only overwrites OMX-managed TOMLs unless `--force` is explicitly used.
- Background update-check refreshes can skip native-agent rewrites entirely.

### Team/runtime hardening

- Gemini prompt-mode workers now receive the startup prompt at launch correctly, including the first worker in a team.
- HUD-disabled team relaunch remains stable across shutdown/relaunch instead of timing out worker readiness.
- Exact-role model pins, inherited leader models, and per-role reasoning defaults now have clearer runtime resolution and diagnostics.
- Pennix mailbox-boundary handoff remains the active contract; no tmux inject reminder path is reintroduced.

### Auth, history, and hook boundary improvements

- `omx auth add` now logs into an isolated temporary `CODEX_HOME` and then imports the resulting `auth.json`, reducing live-auth state bleed.
- `--hotswap` now rotates away from invalidated slots without requiring a resumable rollout session.
- `omx session search` and `resume` now discover project runtime Codex homes and associated madmax boxed-run histories, with an explicit `--codex-home` escape hatch.
- Notification platform config now merges event-level enablement with top-level credentials, and `OMX_DISCORD_MENTION` fills missing mentions without overriding explicit ones.

## Recommended release message

Use language that emphasizes durability rather than novelty:

> `v0.18.64` hardens repeated setup preservation, team worker startup/routing, and auth/session history handling for the Pennix OMX fork.
