# oh-my-codex-pennix v0.18.82

Drafted: 2026-07-09

Patch release for the Pennix fork user-scope plugin-mode boundary and setup-idempotence line.

## Summary

`0.18.82` consolidates the user-scope plugin-mode model and closes the last two setup behaviors that were still mutating real user environments in the wrong way:

- user-scope plugin setup is now the documented default onboarding story
- persistent `AGENTS.md` is reduced to a bootstrap contract instead of carrying large surface-specific guidance
- active role prompts now resolve from the live Codex/plugin surfaces instead of stale repo-local leftovers
- plugin install mode fails closed when packaged plugin metadata is incomplete
- setup no longer rewrites tmux-status renderers to a source checkout path or rewrites existing `hooks = true` configs on current Codex builds where `plugin_hooks` has already been removed

## Included changes

### User-scope plugin mode is now the primary documented install surface

- README and setup guidance now point first to `omx setup --scope user --plugin`.
- New docs make the install/uninstall and surface-ownership model explicit:
  - `docs/user-scope-plugin-mode.md`
  - `docs/codex-surface-boundaries.md`
- Generated plugin-mode guidance now treats `AGENTS.md` as the durable bootstrap contract and keeps the narrower behavior details on the surfaces that actually own them.

### Prompt and bootstrap surfaces are split more cleanly

- `AGENTS.md` is no longer treated as a dumping ground for prompt/skill/hook specifics.
- Role prompts are resolved from the active Codex-home/plugin-delivered prompt sources, which prevents stale repo-local prompt copies from shadowing the live installed role surfaces.
- Plugin-mode `developer_instructions` stays explicitly user-owned by default; setup keeps the bootstrap on `AGENTS.md` unless the user already chose an older managed fragment path.

### Plugin setup is stricter and more idempotent

- Plugin install mode now requires valid packaged marketplace/plugin metadata instead of silently completing a broken install.
- Existing trusted plugin marketplace registrations are preserved without unnecessary config rewrites when they already match the intended installed source.
- `render.sh` for the managed tmux status bar now follows the trusted installed package root even if `omx setup` is launched from a source checkout.
- Codex feature probing now ignores `plugin_hooks` rows that are still listed by name but already marked `removed`, so current Codex builds stay on the supported `hooks` path without rewriting an existing `hooks = true` config.

## Recommended release message

> `v0.18.82` makes user-scope plugin mode the primary OMX install story, shrinks persistent `AGENTS.md` back to a bootstrap contract, resolves active role prompts from the real live Codex/plugin surfaces, and fixes the last two setup regressions that were rewriting tmux-status renderers and existing `hooks = true` configs in real user homes.
