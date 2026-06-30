# oh-my-codex-pennix v0.18.52

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release ships a narrow role-routing and native prompt-guidance fix for the Pennix fork: Team auto-route decisions are now more faithful to Team mode, role intent, and explicit workflow-selection prose.

## Highlights

- Disabled Team mode is now respected by native Team auto-route guidance - review-shaped prompts no longer receive Team launch nudges when setup/project Team mode is disabled.
- Review-specialist launch roles are now internally consistent - staffing summaries, preferred launch roles, and suggested `omx team ...` commands all agree on the same reviewer lane.
- Exploration prompts stop falling into Team review by accident - prompts such as `check how we use this SDK today` now stay in solo/exploration guidance instead of being over-escalated to Team review.
- Prose workflow-selection prompts keep their intended workflow choice - prompts like `use autopilot to review this authentication refactor` no longer get Team guidance prepended ahead of the chosen workflow.

## Fixes / compatibility

- `src/team/auto-route.ts` now gates Team auto-route on effective Team enablement, narrows review-intent detection, and propagates the final review launch role consistently.
- `src/team/followup-planner.ts` now exposes the chosen Team launch role directly so reviewer selection and generated launch hints stay aligned.
- `src/scripts/codex-native-hook.ts` now suppresses Team auto-route prompt guidance for prose workflow-selection prompts and only emits Team guidance when the route decision actually resolves to Team.
- Focused regression tests cover `roleModels` overrides, Team auto-route decisions, follow-up staffing alignment, and native hook prompt guidance behavior.

## Merged PR inventory

- No merged PRs. `0.18.52` is a direct release-line commit on the Pennix fork.

## Validation

- `npm run build`
- `node dist/scripts/run-test-files.js dist/agents/__tests__/native-config.test.js dist/config/__tests__/models.test.js dist/team/__tests__/model-contract.test.js dist/team/__tests__/auto-route.test.js dist/team/__tests__/followup-planner.test.js dist/scripts/__tests__/codex-native-hook.test.js`
- `node dist/scripts/check-version-sync.js --tag v0.18.52`
- `git diff --check`
- `npm pack --dry-run`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.51...v0.18.52`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.51...v0.18.52)
