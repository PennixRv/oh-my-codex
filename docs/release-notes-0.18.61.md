# Release Notes: oh-my-codex 0.18.61

## Summary

`0.18.61` is the publishable follow-up to the first bounded upstream integration wave. It keeps the Pennix fork's wave-1 setup/config/native-hook/worker-bootstrap convergence fixes and adds the missing release hardening so future patch bumps do not break GitHub CI with stale explicit-setup version assertions.

## Highlights

- Repeated plugin-mode setup still converges on one canonical OMX local marketplace table and one canonical first-party MCP server table in `config.toml`.
- Legacy `hooks.json` trust state still migrates into `config.toml [hooks.state]`, and `omx doctor` still flags stale top-level `state` in `hooks.json` as a repair-needed failure.
- Native hook CLI output remains Codex-safe on empty or null non-compact outputs, while `PreToolUse` still preserves Pennix mailbox-boundary `hookSpecificOutput.additionalContext`.
- Worker worktree root `AGENTS.md` still preserves inherited user/project guidance ahead of the runtime overlay.
- Explicit setup stamp regression tests now derive expectations from the active package version, which keeps release CI aligned with the actual candidate version instead of a stale pinned patch number.

## Fixes / compatibility notes

- `0.18.60` tag publication failed before npm publish because a setup-install stamp test still asserted `0.18.59`; `0.18.61` carries the same wave-1 runtime changes plus the CI hardening fix.
- Worker lifecycle behavior remains mailbox-first. This release does not reintroduce tmux inject spam, synthetic leader reminders, or HUD-default changes.
- Trust-state migration remains Pennix-specific: managed hook trust state belongs in `config.toml [hooks.state]`, not legacy `hooks.json` top-level `state`.

## Merged PR inventory

- No merged PRs in `v0.18.59..v0.18.61`.
- Candidate changes are direct release-line commits on `main`.

## Validation evidence

- `npm run build`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/setup-install-stamp.test.js dist/cli/__tests__/setup-install-mode.test.js`
- `npm run verify:native-agents && npm run verify:plugin-bundle`
- `npm run test:node`
- `node dist/scripts/check-version-sync.js --tag v0.18.61`
- `npm pack --dry-run`
- `npm run smoke:packed-install`

## Full changelog

- Compare: [`v0.18.59...v0.18.61`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.59...v0.18.61)
