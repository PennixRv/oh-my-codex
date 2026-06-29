# oh-my-codex-pennix v0.18.51

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release ships a narrow team CLI help fix for the Pennix fork: startup-shaped `omx team ... --help` invocations now short-circuit to top-level team help output instead of trying to launch a real team first.

## Highlights

- Startup-shaped help requests now behave like help requests - `omx team 1:executor "ship it" --help` prints the top-level team usage surface instead of attempting team startup.
- Deprecated worktree-prefixed help requests behave the same way - `omx team --worktree 1:executor "ship it" --help` now also short-circuits to help output.
- The fix is narrow and regression-covered - only top-level help parsing changed, and new team CLI tests lock both startup-shaped help cases.

## Fixes / compatibility

- `src/cli/team.ts` now treats trailing top-level `--help` / `-h` flags as help short-circuits before the default startup path.
- `src/cli/__tests__/team.test.ts` now covers startup-shaped help requests with and without deprecated worktree flags.
- This release does not change team runtime, worker mailbox delivery, startup dispatch, or leader/worker orchestration semantics.

## Merged PR inventory

- No merged PRs. `0.18.50` is a direct release-line commit on the Pennix fork.

## Validation

- `npm run build`
- `node dist/cli/omx.js team 1:executor "ship it" --help`
- `node dist/cli/omx.js team --worktree 1:executor "ship it" --help`
- `node dist/scripts/check-version-sync.js --tag v0.18.50`
- `npm run verify:native-agents && npm run verify:plugin-bundle`
- `node dist/scripts/generate-catalog-docs.js --check`
- `git diff --check`
- `npm pack --dry-run`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.49...v0.18.50`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.49...v0.18.50)
