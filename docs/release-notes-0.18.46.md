# oh-my-codex-pennix v0.18.46

`0.18.46` is a narrow team communication contract patch for the Pennix fork. It does not change the core mailbox handoff logic; it aligns the currently injected/runtime-visible text surfaces so leader and worker sessions are told the same thing about how team communication really works.

## Highlights

- **Current injected team guidance now matches the real mailbox model** - installable `team` / `worker` skills, plugin-mirrored skills, and runtime-generated worker instructions now consistently describe worker -> leader updates as real `leader-fixed` mailbox messages, not visible tmux nudges.
- **Leader boundary behavior is described accurately** - current guidance now says unread leader mailbox messages surface as native-hook `additionalContext` on the next `UserPromptSubmit` or `PreToolUse` boundary.
- **Worker expectations are clearer** - worker-facing runtime text now explicitly says not to wait for immediate visible tmux injection or typed leader replies after sending mailbox updates.
- **Worktree-root runtime instructions and leader trigger records are aligned too** - disposable root `AGENTS.md` guidance and internal `leader-fixed` dispatch trigger text now use the same mailbox-boundary contract instead of older nudge/review-immediately wording.

## Fixes / compatibility

- `skills/team/SKILL.md` and `plugins/oh-my-codex/skills/team/SKILL.md` now describe leader mailbox review through native-hook boundary context instead of older reminder-oriented wording.
- `skills/worker/SKILL.md` and `plugins/oh-my-codex/skills/worker/SKILL.md` now explicitly describe the leader's asynchronous mailbox-review boundaries.
- `src/team/worker-bootstrap.ts` now emits worker runtime instructions, disposable root `AGENTS.md` guidance, and internal `leader-fixed` trigger text that match the real leader mailbox behavior.
- This release is wording/runtime-surface alignment only; it does not change the already-shipped leader mailbox handoff logic in `src/scripts/codex-native-hook.ts`.

## Merged PR inventory

- No merged PRs. `0.18.46` is a direct release-line commit on the Pennix fork.

## Validation

- `npm run build`
- `node dist/scripts/run-test-files.js dist/scripts/__tests__/codex-native-hook.test.js --test-name-pattern "leader mailbox handoff"`
- `node dist/scripts/check-version-sync.js --tag v0.18.46`
- `git diff --check`
- `npm pack --dry-run`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.45...v0.18.46`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.45...v0.18.46)
