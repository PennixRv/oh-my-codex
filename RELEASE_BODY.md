# oh-my-codex-pennix v0.18.49

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release ships a narrow team orchestration contract alignment for the Pennix fork: leader-facing team surfaces now consistently describe the intended boundary-driven operating model, where the leader delegates bounded worker slices, continues the mainline, and consumes worker results at natural prompt/tool boundaries instead of falling into periodic `omx team status` polling.

## Highlights

- Leader-facing team guidance now defaults to the Codex-like mainline posture - delegate bounded worker work, continue the leader thread, and reconcile worker results at prompt/tool boundaries.
- `omx team status` is now described as an explicit snapshot tool - startup verification, blocker diagnosis, reconciliation, checkpoints, and pre-shutdown review stay valid, but blind polling is no longer presented as the default control loop.
- Team runtime/user-visible nudges now steer toward worker-message review first - all-workers-idle and leader nudge text now prefer mailbox/additionalContext review over immediate status-loop behavior.
- Prompt, AGENTS, and skill surfaces are aligned - the installed team skill, plugin mirror, team-orchestrator prompt, and root AGENTS contract now describe the same leader/worker mental model.

## Fixes / compatibility

- `src/cli/team.ts` startup hints now keep `omx team status` visible while reframing it as a snapshot tool rather than a periodic loop instruction.
- `src/scripts/notify-hook/team-leader-nudge.ts` and `src/scripts/notify-hook/team-worker.ts` now emit leader-facing next-step guidance that prefers mailbox review and mainline continuation over polling.
- `skills/team/SKILL.md`, `plugins/oh-my-codex/skills/team/SKILL.md`, `prompts/team-orchestrator.md`, `templates/AGENTS.md`, and `docs/team-coordination-protocol.md` now describe the same boundary-driven leader posture.
- This release is orchestration-contract alignment only; it does not change the underlying async mailbox handoff mechanism or reintroduce visible tmux prompt injection.

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
