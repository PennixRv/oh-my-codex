# oh-my-codex-pennix v0.18.82

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release makes user-scope plugin mode the primary OMX install story, shrinks persistent `AGENTS.md` back to a bootstrap contract, resolves active role prompts from the real live Codex/plugin surfaces, hardens packaged-plugin validation, and fixes the two remaining setup regressions that were still mutating real user homes.

## Highlights

- README, setup guidance, and new docs now make `omx setup --scope user --plugin` the preferred onboarding path.
- Persistent `AGENTS.md` is now treated as a bootstrap contract, while detailed behavior stays on the narrower surfaces that actually own it.
- Active role prompts now resolve from the live Codex/plugin surfaces instead of stale repo-local leftovers.
- Plugin install mode now fails closed when packaged marketplace/plugin metadata is incomplete.
- Setup now preserves trusted installed package roots for tmux-status assets and ignores `plugin_hooks` rows that Codex still lists by name but already marks as `removed`.

## Fixes / compatibility

- Existing trusted plugin marketplace registrations are preserved without unnecessary config rewrites when they already match the intended installed source.
- Running `omx setup` from a source checkout no longer rewrites `~/.codex/.omx/tmux-status/render.sh` to the transient checkout path when a trusted installed OMX package root is already known.
- Current Codex builds that report `plugin_hooks` only as `removed` now stay on the supported `hooks` path without rewriting an existing `hooks = true` / `goals = true` config.
- Legacy setup and project-scope prompt copies remain available as compatibility paths; this release changes the default story and ownership model, not the existence of those escape hatches.

## Validation

- `npm run build`
- `node --test dist/config/__tests__/codex-feature-flags.test.js`
- `node --test dist/cli/__tests__/setup-install-mode.test.js`
- `node --test dist/cli/__tests__/tmux-status-lifecycle.test.js`
- `node --test dist/cli/__tests__/uninstall.test.js`
- `npm run verify:native-agents`
- `npm run verify:plugin-bundle`
- `node dist/scripts/generate-catalog-docs.js --check`
- `npm pack --dry-run`
- `node dist/scripts/check-version-sync.js --tag v0.18.82`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.81...v0.18.82`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.81...v0.18.82)
