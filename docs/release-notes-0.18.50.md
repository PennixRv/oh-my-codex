# oh-my-codex-pennix v0.18.50

`0.18.50` is a narrow team CLI help fix for the Pennix fork. It does not change team runtime or orchestration behavior; it makes startup-shaped `omx team ... --help` invocations resolve to top-level help output instead of attempting a real team launch first.

## Highlights

- **Startup-shaped help requests now print help instead of launching a team** - `omx team 1:executor "ship it" --help` now short-circuits to the top-level team help surface.
- **Deprecated worktree-prefixed help requests behave the same way** - `omx team --worktree 1:executor "ship it" --help` now also resolves to help output instead of falling into startup/worktree guards.
- **The fix is locked with new CLI regression coverage** - team CLI tests now cover both startup-shaped help paths alongside the existing `omx team --help` contract.

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
