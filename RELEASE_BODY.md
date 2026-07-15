# oh-my-codex-pennix v0.18.90

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

`v0.18.90` prevents setup refreshes from discarding user-authored guidance that precedes an otherwise generated AGENTS.md.

## Fix

- Setup preserves a prepended user preamble only when the rest of the existing prefix exactly matches the regenerated managed prefix, so stale edits inside OMX-owned guidance are not retained as user policy.
- Explicit user policy blocks remain preserved without duplication, and plugin-mode setup now has regression coverage for an unmarked Context Continuity preamble during forced defaults refresh.

## Validation

- `npm test`
- `npm run lint`
- `npm pack --dry-run`
- `git diff --check`
- `node dist/scripts/check-version-sync.js --tag v0.18.90`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.89...v0.18.90`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.89...v0.18.90)
