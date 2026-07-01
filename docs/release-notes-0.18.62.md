# Release Notes: oh-my-codex 0.18.62

## Summary

`0.18.62` closes the remaining plugin-mode uninstall cleanup gap in the Pennix fork. It keeps plugin-mode setup/runtime behavior unchanged while making `omx uninstall` actually remove OMX-owned plugin registrations, trust-state residue, feature flags, and plugin cache directories.

## Highlights

- `omx uninstall` now removes OMX plugin-mode registration tables from `config.toml`, including plugin first-party MCP enablement subtables.
- Plugin-scoped hook trust entries under `config.toml [hooks.state]` are now removed during uninstall, instead of surviving as stale trusted plugin hook state.
- `plugin_hooks = true` is now treated as OMX-managed plugin-mode feature residue and is removed during uninstall, while user-owned hook usage still preserves canonical `hooks = true` when needed.
- The full OMX plugin cache root under `~/.codex/plugins/cache/oh-my-codex-local/oh-my-codex/` is now removed during uninstall, including historical version-scoped compatibility caches and the active `local/` cache.

## Fixes / compatibility notes

- This is an uninstall-only cleanup fix. It does not change Pennix mailbox-first runtime behavior, plugin-mode setup semantics, HUD defaults, or developer-instructions append behavior.
- Historical version-scoped caches still remain intentionally preserved during normal plugin-cache refresh for older live sessions, but uninstall now removes them because uninstall should leave no OMX-owned plugin residue behind.
- User-owned hook trust state and unrelated marketplace entries remain preserved.

## Merged PR inventory

- No merged PRs in `v0.18.61..v0.18.62`.
- Candidate changes are direct release-line commits on `main`.

## Validation evidence

- `npm run build`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/uninstall.test.js`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/plugin-marketplace.test.js`
- `npm run verify:plugin-bundle`
- `node dist/scripts/check-version-sync.js --tag v0.18.62`

## Full changelog

- Compare: [`v0.18.61...v0.18.62`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.61...v0.18.62)
