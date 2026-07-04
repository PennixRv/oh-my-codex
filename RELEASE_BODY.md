# oh-my-codex-pennix v0.18.68

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release ships the tracked tmux status bar line plus setup/uninstall lifecycle hardening. It replaces the icon-heavy status wording with a text-first tmux 256-color layout, installs and removes the managed tmux assets in user scope, preserves trusted plugin marketplace sources during setup, and stops uninstall from stripping official Codex `plugin_hooks` / `goals` feature flags.

## Highlights

- New managed tmux status assets install a bounded OMX block into `~/.tmux.conf` and keep the renderer/config under `CODEX_HOME/.omx/tmux-status`, even when `omx setup` runs with `--scope project`.
- The status bar itself now renders `Model`, `Effort`, `Cost`, `Ctx`, `Cache`, `Sess`, `Path`, and `Git` labels with a restrained tmux 256-color palette and a keyless clock, avoiding Nerd Font spacing inconsistencies.
- `omx setup` now preserves an existing trusted installed marketplace source when it is rerun from a source checkout instead of silently repointing the local marketplace to the repo checkout path.
- `omx uninstall` now preserves official Codex `plugin_hooks = true` and `goals = true` feature flags while still removing OMX-managed wrappers and marketplace/plugin registrations.

## Fixes / compatibility

- Existing user Codex config survives setup/uninstall better: trusted marketplace source, `plugin_hooks`, and `goals` are retained instead of being rewritten away by OMX lifecycle commands.
- Managed tmux status assets remain user-scoped, so project-scoped setup does not create repo-local duplicate statusline state.
- Tmux status install/uninstall stays bounded: only the OMX-managed `~/.tmux.conf` block and `CODEX_HOME/.omx/tmux-status` assets are touched.

## Validation

- `npm run build`
- `npm run verify:native-agents && npm run verify:plugin-bundle`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/setup-install-mode.test.js dist/cli/__tests__/uninstall.test.js dist/cli/__tests__/tmux-status-lifecycle.test.js`
- `node --test dist/tmux-status/__tests__/render.test.js dist/tmux-status/__tests__/install.test.js`
- `node dist/scripts/check-version-sync.js --tag v0.18.68`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.67...v0.18.68`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.67...v0.18.68)
