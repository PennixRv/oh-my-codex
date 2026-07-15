# oh-my-codex-pennix v0.18.90

## Summary

`0.18.90` prevents setup refreshes from discarding user-authored guidance that precedes an otherwise generated AGENTS.md.

## Included Changes

- Setup preserves a user preamble only when the remaining existing prefix exactly matches the regenerated managed prefix.
- Explicit `<!-- USER:OMX:POLICY:* -->` blocks remain preserved without duplication.
- Plugin-mode regression coverage recreates a stale generated AGENTS.md with an unmarked Context Continuity preamble and verifies that a forced refresh preserves it while replacing obsolete model defaults.

## Validation

- Targeted AGENTS helper and setup overwrite test suites
- `npm test`
- `npm run lint`
- `npm pack --dry-run`
- `git diff --check`
- `node dist/scripts/check-version-sync.js --tag v0.18.90`

**Full Changelog**: [`v0.18.89...v0.18.90`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.89...v0.18.90)
