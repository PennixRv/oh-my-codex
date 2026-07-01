# Release Notes: oh-my-codex 0.18.60

## Summary

`0.18.60` packages the first bounded upstream integration wave into the Pennix fork. The release focuses on setup/config correctness and native-hook compatibility without relaxing the fork's mailbox-first team model: repeated plugin-mode setup no longer duplicates OMX tables, legacy `hooks.json` trust state is migrated out into `config.toml`, native hook CLI output stays Codex-safe while preserving Pennix `PreToolUse` mailbox context, and worker worktree AGENTS files preserve inherited guidance instead of replacing it.

## Highlights

- Repeated plugin-mode setup now converges on one canonical OMX local marketplace table and one canonical first-party MCP server table in `config.toml`.
- Legacy `hooks.json` trust state is migrated into `config.toml [hooks.state]`, and `omx doctor` now flags stale top-level `state` in `hooks.json` as a repair-needed failure.
- Native hook CLI output is hardened so empty or null non-compact hook outputs serialize as parseable `{}`, while `PreToolUse` still carries `hookSpecificOutput.additionalContext` for Pennix mailbox-boundary handoff guidance.
- Worker worktree root `AGENTS.md` now preserves inherited user/project guidance ahead of the runtime overlay, matching the fork's append/composition model instead of discarding prior instructions.

## Fixes / compatibility notes

- The hooks-state migration is intentionally Pennix-specific: trust state belongs in `config.toml [hooks.state]`, not `hooks.json`, because modern Codex rejects stale top-level `state` there.
- The native-hook stdout hardening is intentionally narrow: only the Codex-supported `PreToolUse` fields survive sanitization, including Pennix `hookSpecificOutput.additionalContext`.
- Worker lifecycle behavior remains mailbox-first. This release does not reintroduce tmux inject spam, synthetic leader reminders, or HUD-default changes.
- Existing published `0.18.59` config-repair fixes remain part of the baseline; `0.18.60` layers the upstream wave-1 setup/hook/bootstrap convergence fixes on top.

## Merged PR inventory

- No merged PRs in `v0.18.59..v0.18.60`.
- Candidate changes are direct release-line commits on `main`.

## Validation evidence

- `npm run build`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/plugin-marketplace.test.js dist/config/__tests__/codex-hooks.test.js dist/team/__tests__/worker-bootstrap.test.js dist/cli/__tests__/setup-install-mode.test.js dist/cli/__tests__/doctor-warning-copy.test.js dist/scripts/__tests__/codex-native-hook.test.js`
- published-artifact reinstall smoke pending tag-triggered release publication

## Full changelog

- Compare: [`v0.18.59...v0.18.60`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.59...v0.18.60)
