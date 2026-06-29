# oh-my-codex-pennix v0.18.49

`0.18.49` is a narrow team orchestration contract patch for the Pennix fork. It does not change the async mailbox handoff mechanism; it aligns the leader-facing runtime, prompt, skill, and AGENTS surfaces so they consistently describe the intended boundary-driven operating model.

## Highlights

- **Leader-facing team guidance now defaults to mainline-first orchestration** - the canonical guidance now tells leaders to delegate bounded worker slices, continue the mainline, and reconcile worker results at natural prompt/tool boundaries.
- **`omx team status` is demoted from loop advice to explicit snapshot tool** - startup verification, blocker diagnosis, reconciliation, checkpoints, and pre-shutdown review remain valid uses, but periodic polling is no longer presented as the default control flow.
- **Idle/nudge wording now prefers mailbox review over immediate status polling** - all-workers-idle and leader nudge copy now tells the leader to review worker messages first and only reach for `omx team status` when a fresh snapshot is actually needed.
- **Prompt, AGENTS, and skill surfaces now describe the same leader/worker mental model** - the installed `team` skill, plugin-mirrored skill, `team-orchestrator` prompt, root `AGENTS.md`, and team coordination docs are aligned around the same behavior contract.

## Fixes / compatibility

- `src/cli/team.ts` now emits startup hints that keep `omx team status` visible while reframing it as an explicit snapshot tool instead of a polling loop.
- `src/scripts/notify-hook/team-leader-nudge.ts` and `src/scripts/notify-hook/team-worker.ts` now emit next-step guidance that prefers mailbox review and mainline continuation over immediate runtime polling.
- `src/team/runtime.ts` compaction resume guidance now tells the leader to resume from mailbox/task evidence first and use `omx team status` only for fresh snapshots.
- `skills/team/SKILL.md`, `plugins/oh-my-codex/skills/team/SKILL.md`, `prompts/team-orchestrator.md`, `templates/AGENTS.md`, and `docs/team-coordination-protocol.md` now describe the same boundary-driven leader posture.
- This release is contract/text alignment only; it does not change the underlying async mailbox handoff logic in `src/scripts/codex-native-hook.ts` or reintroduce visible tmux prompt injection.

## Merged PR inventory

- No merged PRs. `0.18.49` is a direct release-line commit on the Pennix fork.

## Validation

- `npm run build`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/team.test.js dist/hooks/__tests__/notify-hook-all-workers-idle.test.js dist/hooks/__tests__/notify-hook-worker-idle.test.js dist/hooks/__tests__/notify-hook-team-leader-nudge.test.js`
- `node dist/scripts/run-test-files.js dist/hooks/__tests__/prompt-guidance-contract.test.js dist/hooks/__tests__/prompt-guidance-wave-two.test.js dist/hooks/__tests__/prompt-guidance-scenarios.test.js dist/hooks/__tests__/prompt-guidance-catalog.test.js dist/hooks/__tests__/skill-guidance-contract.test.js dist/hooks/__tests__/prompt-guidance-fragments.test.js dist/hooks/__tests__/team-runtime-gating-docs-contract.test.js dist/scripts/__tests__/docs-site-contract.test.js`
- `node dist/scripts/run-test-files.js dist/hooks/__tests__/explore-sparkshell-guidance-contract.test.js dist/hooks/__tests__/prompt-team-routing.test.js`
- `node dist/scripts/check-version-sync.js --tag v0.18.49`
- `npm run verify:native-agents && npm run verify:plugin-bundle`
- `node dist/scripts/generate-catalog-docs.js --check`
- `git diff --check`
- `npm pack --dry-run`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.48...v0.18.49`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.48...v0.18.49)
