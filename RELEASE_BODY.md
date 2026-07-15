# oh-my-codex-pennix v0.18.88

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

`v0.18.88` gives OMX's managed tmux status bar the same intentional two-column outer gutter as Codex's native footer.

## Fix

- The left tmux renderer prefixes visible OMX telemetry with two spaces, while the right renderer suffixes its session, path, git, and time data with two spaces.
- Non-OMX panes continue to render no left status output, and the change does not modify Codex source or native footer configuration.

## Validation

- `npm test`
- `npm run lint`
- `npm pack --dry-run`
- `git diff --check`
- `node dist/scripts/check-version-sync.js --tag v0.18.88`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.87...v0.18.88`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.87...v0.18.88)
