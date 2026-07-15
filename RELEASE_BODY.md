# oh-my-codex-pennix v0.18.89

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

`v0.18.89` makes the managed OMX tmux status bar use concise lowercase telemetry labels and the active Codex session identity.

## Fix

- All tmux telemetry labels render in lowercase; `cost` follows `ctx`, `total`, and `cache` as the last left telemetry field without a `$` prefix, while existing colors, separators, and outer gutters remain unchanged.
- `sess` now uses the first segment of the complete active Codex UUID and leaves the value unknown when no complete UUID is available; it never falls back to an AOE/tmux session name.

## Validation

- `npm test`
- `npm run lint`
- `npm pack --dry-run`
- `git diff --check`
- `node dist/scripts/check-version-sync.js --tag v0.18.89`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.88...v0.18.89`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.88...v0.18.89)
