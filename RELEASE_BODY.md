# oh-my-codex-pennix v0.18.83

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release keeps the unpublished `0.18.82` user-scope plugin-mode and setup-fidelity fixes, then narrows the tag-triggered native publication matrix to Linux x86 only so releases no longer depend on macOS, Windows, or hosted ARM runner acquisition.

## Highlights

- README, setup guidance, and new docs keep `omx setup --scope user --plugin` as the preferred onboarding path.
- Persistent `AGENTS.md` stays a bootstrap contract, while detailed behavior remains on the narrower surfaces that actually own it.
- Active role prompts keep resolving from the live Codex/plugin surfaces instead of stale repo-local leftovers.
- Plugin install mode still fails closed when packaged marketplace/plugin metadata is incomplete.
- Setup still preserves trusted installed package roots for tmux-status assets and ignores `plugin_hooks` rows that Codex still lists by name but already marks as `removed`.
- The standard release workflow now publishes only `x86_64-unknown-linux-gnu` and `x86_64-unknown-linux-musl` native assets before continuing to smoke verification and npm publication.

## Fixes / compatibility

- Existing trusted plugin marketplace registrations are preserved without unnecessary config rewrites when they already match the intended installed source.
- Running `omx setup` from a source checkout no longer rewrites `~/.codex/.omx/tmux-status/render.sh` to the transient checkout path when a trusted installed OMX package root is already known.
- Current Codex builds that report `plugin_hooks` only as `removed` now stay on the supported `hooks` path without rewriting an existing `hooks = true` / `goals = true` config.
- The failed `v0.18.82` candidate never published because GitHub could not acquire the hosted `ubuntu-24.04-arm` runner for `aarch64-unknown-linux-gnu`; trimming the release matrix removes that external blocker from the standard publication path.

## Validation

- `npm run build`
- `node dist/scripts/run-test-files.js dist/verification/__tests__/explore-harness-release-workflow.test.js dist/verification/__tests__/release-workflow-release-body.test.js dist/verification/__tests__/native-release-manifest.test.js`
- `npm run verify:native-agents`
- `npm run verify:plugin-bundle`
- `npm pack --dry-run`
- `git diff --check`
- `node dist/scripts/check-version-sync.js --tag v0.18.83`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.81...v0.18.83`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.81...v0.18.83)
