# oh-my-codex-pennix v0.18.60

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release ships the first bounded upstream integration wave on top of the Pennix fork. It hardens repeated plugin-mode setup against duplicated TOML registration blocks, migrates legacy `hooks.json` trust state into `config.toml [hooks.state]`, keeps native hook CLI stdout compatible with Codex while preserving Pennix `PreToolUse` additional context, and restores inherited AGENTS guidance inside worker worktrees without regressing the fork's mailbox-first coordination model.

## Highlights

- Repeated plugin-mode setup now converges on one canonical local marketplace table and one canonical first-party MCP server table instead of accumulating duplicates in `config.toml`.
- Legacy `hooks.json` trust state is now extracted and migrated into `config.toml [hooks.state]`, and `omx doctor` explicitly fails when stale top-level `state` remains in `hooks.json`.
- The native hook CLI now stays schema-safe on empty/null outputs while still preserving `PreToolUse` `hookSpecificOutput.additionalContext` for Pennix mailbox-boundary guidance.
- Worker worktree root `AGENTS.md` now preserves inherited user/project guidance ahead of the disposable runtime overlay, so fork-specific coordination behavior composes with upstream preservation fixes instead of replacing prior guidance.

## Fixes / compatibility

- `src/cli/plugin-marketplace.ts` now strips all repeated OMX plugin marketplace and MCP server tables before rewriting the canonical enabled state.
- `src/config/codex-hooks.ts`, `src/cli/setup.ts`, and `src/cli/doctor.ts` now implement the Pennix-compatible trust-state migration path from legacy `hooks.json` state into `config.toml`.
- `src/scripts/codex-native-hook.ts` now sanitizes `PreToolUse` CLI stdout to the Codex-safe contract without dropping Pennix mailbox `additionalContext`, and empty non-compact hook events now emit parseable `{}` instead of failing closed.
- `src/team/worker-bootstrap.ts` now composes inherited AGENTS guidance with the runtime overlay rather than replacing it in worker worktrees.

## Merged PR inventory

- No merged PRs. `0.18.60` is a direct release-line commit on the Pennix fork.

## Validation

- `npm run build`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/plugin-marketplace.test.js dist/config/__tests__/codex-hooks.test.js dist/team/__tests__/worker-bootstrap.test.js dist/cli/__tests__/setup-install-mode.test.js dist/cli/__tests__/doctor-warning-copy.test.js dist/scripts/__tests__/codex-native-hook.test.js`
- `node dist/scripts/check-version-sync.js --tag v0.18.60`
- `git diff --check`
- `npm pack --dry-run`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.59...v0.18.60`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.59...v0.18.60)
