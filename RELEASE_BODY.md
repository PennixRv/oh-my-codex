# oh-my-codex-pennix v0.18.84

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This corrective patch follows the failed `v0.18.83` npm publication. It keeps the intended plugin-mode/setup payload, then fixes the release-gate contract drift that caused `Publish npm Package -> npm run test:node` to fail before npm publication completed.

## Highlights

- The release gate now passes with prompt-guidance fragments and `templates/AGENTS.md` back in sync.
- The scaling contract test now reflects the current multiline role-prompt layout instead of the older single-shape assertion.
- Plugin bundle metadata and workspace lockfiles are fully synchronized to `0.18.84`, including the checked-in plugin manifest used by plugin-bundle SSOT verification.
- The reduced Linux x86-only native publication matrix from `0.18.83` remains unchanged; this patch fixes publish correctness, not target coverage.

## Fixes / compatibility

- `v0.18.83` created a GitHub release, but npm stayed at `0.18.81` because the publish job failed inside `npm run test:node`.
- The failing gate was not native publication or the Linux target matrix. It was checked-in contract drift: prompt-guidance content, a stale scaling assertion, and plugin bundle version metadata.
- The safe recovery path is a new patch release instead of rewriting the existing `v0.18.83` tag or release.

## Validation

- `npm run build`
- `npm run test:node`
- `npm run verify:native-agents`
- `npm run verify:plugin-bundle`
- `npm pack --dry-run`
- `git diff --check`
- `node dist/scripts/check-version-sync.js --tag v0.18.84`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.83...v0.18.84`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.83...v0.18.84)
