# oh-my-codex-pennix v0.18.69

Drafted: 2026-07-04

Patch release for the Pennix fork tmux-status and lifecycle-hardening line.

## Summary

`0.18.69` is the corrected publish candidate for the change set that was prepared as `0.18.68` but failed in the tag workflow before npm publication:

- OMX now has a tracked tmux status bar install path with bounded lifecycle cleanup and a stable tmux 256-color rendering surface.
- setup no longer tramples an already-trusted installed plugin marketplace source when rerun from a source checkout.
- uninstall no longer strips official Codex `plugin_hooks` / `goals` flags while removing OMX-managed wrappers.
- the shared-ownership uninstall regression now expects preserved `goals = true`, matching the current uninstall contract and removing the stale CI-only blocker that stopped `v0.18.68`.

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

### 0.18.68 release-gate correction

- The `v0.18.68` GitHub release workflow failed in `Run tests` and never published to npm.
- The failing assertion still expected uninstall to remove `goals`, even though the shipping uninstall implementation already preserved official Codex `goals = true` for user-hook ownership cases.
- The release workflow now resolves the latest published ancestor tag for generated release notes, so the failed unpublished `v0.18.68` tag cannot shrink the `v0.18.67...v0.18.69` compare range.
- `0.18.69` carries the same product changes as `0.18.68`, plus the corrected shared-ownership uninstall expectation and release-note compare-base fix so the standard tag workflow can publish the intended artifact.

## Recommended release message

Use language that emphasizes the bounded tmux delivery and lifecycle safety:

> `v0.18.69` publishes the tracked OMX tmux status bar and lifecycle-preservation fixes that were prepared for `0.18.68`, plus the CI-gate correction that aligns shared-ownership uninstall coverage with preserved official Codex `goals` support.
