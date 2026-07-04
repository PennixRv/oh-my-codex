# oh-my-codex-pennix v0.18.68

Drafted: 2026-07-04

Patch release for the Pennix fork tmux-status and lifecycle-hardening line.

## Summary

`0.18.68` packages two related operator-facing fixes that were ready together in the working tree:

- OMX now has a tracked tmux status bar install path with bounded lifecycle cleanup and a stable tmux 256-color rendering surface.
- setup no longer tramples an already-trusted installed plugin marketplace source when rerun from a source checkout.
- uninstall no longer strips official Codex `plugin_hooks` / `goals` flags while removing OMX-managed wrappers.

## Included changes

### Managed tmux status bar

- `omx setup` now installs a managed tmux status block into `~/.tmux.conf`.
- The renderer shell wrapper and tmux status config live under `CODEX_HOME/.omx/tmux-status`.
- Even for `--scope project`, the tmux assets remain user-level rather than being duplicated under the project `.codex`.
- `omx uninstall` removes only the OMX-managed tmux block and status assets.

### Text-first status wording and palette

- The status bar now uses text labels instead of mixed icon families:
  - `Model`, `Effort`, `Cost`, `Ctx`, `Cache`
  - `Sess`, `Path`, `Git`
  - time remains keyless
- The default rendering uses restrained tmux 256-color values instead of relying on Nerd Font glyph spacing.
- Team supplements are now rendered in the same label/value style through `Team` and `Wrk`.

### Setup / uninstall preservation fixes

- Setup preserves a trusted existing installed marketplace source instead of silently repointing the local marketplace to the current source checkout.
- Uninstall preserves official Codex `plugin_hooks = true` and `goals = true` while still removing OMX-managed wrappers, plugin registration, and marketplace registration.
- Regression coverage now locks both lifecycle behaviors.

## Recommended release message

Use language that emphasizes the bounded tmux delivery and lifecycle safety:

> `v0.18.68` adds the tracked OMX tmux status bar, switches it to a text-first tmux 256-color layout, preserves trusted marketplace sources during setup, and keeps official Codex `plugin_hooks` / `goals` flags intact on uninstall.
