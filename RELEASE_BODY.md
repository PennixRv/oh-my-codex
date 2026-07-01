# oh-my-codex-pennix v0.18.62

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release fixes the remaining plugin-mode uninstall residue in the Pennix fork. `omx uninstall` now removes OMX-managed plugin registrations, plugin-scoped hook trust state, plugin-only feature flags, and the entire OMX local plugin cache root so a clean uninstall no longer leaves plugin-mode wiring behind.

## Highlights

- `omx uninstall` now strips OMX local plugin registration tables from `config.toml`, including first-party MCP subtables under `plugins."oh-my-codex@oh-my-codex-local"`.
- Plugin-scoped hook trust state keyed by `oh-my-codex@oh-my-codex-local:...` is now removed alongside the managed trust-state block during uninstall.
- Plugin-mode feature residue now cleans up correctly: `plugin_hooks = true` is treated as OMX-managed uninstall state and removed unless user-owned hook state still requires canonical `hooks = true`.
- Default uninstall now removes the full OMX plugin cache root under `~/.codex/plugins/cache/oh-my-codex-local/oh-my-codex/`, including historical version-scoped compatibility caches as well as the active `local/` cache.

## Fixes / compatibility

- User-owned `hooks.state` entries, unrelated marketplaces, and non-OMX hook trust state remain preserved.
- The uninstall behavior aligns with clean-removal expectations for plugin mode without changing setup/runtime compatibility behavior for still-installed OMX environments.
- Historical version-scoped plugin caches remain preserved during normal setup refresh for running older sessions, but uninstall now removes them because cleanup semantics should fully remove OMX-owned plugin residue.

## Merged PR inventory

- No merged PRs. `0.18.62` is a direct release-line commit on the Pennix fork.

## Validation

- `npm run build`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/uninstall.test.js`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/plugin-marketplace.test.js`
- `npm run verify:plugin-bundle`
- `node dist/scripts/check-version-sync.js --tag v0.18.62`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.61...v0.18.62`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.61...v0.18.62)
