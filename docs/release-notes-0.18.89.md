# oh-my-codex-pennix v0.18.89

## Summary

`0.18.89` makes OMX's managed tmux status bar use concise lowercase telemetry labels and the active Codex session identity.

## Included Changes

- All visible tmux telemetry labels now render in lowercase, with the existing colors, separators, outer gutters, and non-cost field order retained.
- `cost` follows `ctx`, `total`, and `cache` as the last field in the left telemetry group and now renders its numeric USD amount without a `$` prefix.
- `sess` now derives from the active Codex session UUID and displays its first eight-character segment instead of the enclosing AOE/tmux session name.
- Missing or incomplete Codex UUIDs display `?`; an AOE/tmux session name is never used as a fallback.

## Validation

- Targeted tmux renderer test suite
- Full `npm test`
- `npm run lint`
- `npm pack --dry-run`
- `git diff --check`
- `node dist/scripts/check-version-sync.js --tag v0.18.89`

**Full Changelog**: [`v0.18.88...v0.18.89`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.88...v0.18.89)
