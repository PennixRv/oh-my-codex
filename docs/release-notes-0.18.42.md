# oh-my-codex-pennix v0.18.42

`0.18.42` is a targeted HUD lifecycle patch for the Pennix fork. It aligns team-mode HUD behavior with the fork default of `enabled: false`, fixes team shutdown so it no longer restores a standalone HUD when HUD is disabled, and updates the runtime/test contract to match the fork-facing expectation.

## Highlights

- **Team HUD now respects fork defaults** - `omx team` no longer auto-creates a `hud --watch` pane when `.omx/hud-config.json` is absent or explicitly sets `"enabled": false`.
- **Shutdown no longer resurrects HUD** - shared-session shutdown no longer restores a standalone HUD pane behind the user's back when HUD is disabled for the repo.
- **Installed-runtime gap was verified** - local live tmux smoke confirmed that `0.18.41` still created a third HUD pane even with `"enabled": false`; this patch is the release that carries the source-side fix into the npm artifact.

## Fixes / compatibility

- `src/cli/index.ts` now uses `DEFAULT_HUD_CONFIG.enabled` instead of assuming launch-time HUD is on when no hud-config exists.
- `src/team/tmux-session.ts` now gates team HUD creation and standalone HUD restoration on effective HUD config.
- `src/team/runtime.ts` no longer emits a misleading shutdown warning for a HUD restore path that is intentionally disabled by config.
- Team tmux/runtime tests now distinguish between:
  - fork default: HUD disabled
  - explicit opt-in: HUD restore/create remains available when `"enabled": true`

## Validation

- `npm run build`
- `node dist/scripts/run-test-files.js dist/team/__tests__/runtime.test.js`
- `node dist/scripts/run-test-files.js dist/team/__tests__/tmux-session.test.js`
- `node dist/scripts/run-test-files.js dist/team/__tests__/tmux-session.test.js dist/team/__tests__/runtime.test.js dist/cli/__tests__/index.test.js`
- Live tmux smoke on installed `0.18.41` reproducing the bug:
  - repo config contained `"enabled": false`
  - team startup still created a third pane running `omx.js hud --watch`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.41...v0.18.42`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.41...v0.18.42)
