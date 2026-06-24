# Release readiness: oh-my-codex 0.18.28

## Scope

- Previous published tag: `v0.18.26`.
- Candidate release tag: `v0.18.28`.
- Release focus: carry the trivial-task worker prompt-calibration fix with a correctly pointed release tag after the invalid `v0.18.27` attempt was withdrawn.

## Included fixes

- Exact-content single-file tasks now synthesize as narrow/no-delegation work instead of receiving optional subagent delegation guidance.
- Initial worker inbox verification guidance now scales down to the small-task checklist for narrow single-task assignments.
- Broad investigation and coordinated team tasks retain their existing stronger delegation and coordination contracts.

## Release-process note

- The attempted `v0.18.27` release was withdrawn because the tag was mistakenly created from the previous commit while `main` had already advanced.
- Evidence:
  - remote `refs/tags/v0.18.27` pointed to `fa431441` while `origin/main` pointed to `0f1b877f`;
  - the GitHub Release workflow for `v0.18.27` therefore built commit `fa431441`, read `VERSION=0.18.26`, and skipped npm publish as “already published.”
- Corrective action:
  - deleted the incorrect GitHub Release and remote tag;
  - incremented to `0.18.28` instead of reusing the contaminated version number;
  - re-ran the standard tag-triggered release path from the correct commit.

## Root cause summary

- The `0.18.26` prompt-contract fix restored executable lifecycle commands and removed the redundant startup loop, but the worker inbox still applied two over-broad prompt behaviors to trivial tasks:
  - delegation synthesis treated `create file ... with exact content ...` as ordinary implementation work, so the worker still received optional subagent fanout guidance;
  - initial inbox verification guidance always used the standard verification checklist because it rendered against the placeholder text `each assigned task` instead of the concrete single-task description.
- In a real npm-installed team smoke, the worker completed the file creation and claim flow, then drifted into subagent/verification planning instead of promptly finishing the `transition-task-status` completion step.

## Local verification

- [x] `npm run build`
- [x] `npm run lint`
- [x] `node dist/scripts/run-test-files.js dist/team/__tests__/delegation-policy.test.js dist/team/__tests__/worker-bootstrap.test.js dist/team/__tests__/api-interop.test.js`
- [x] `node --test --test-name-pattern="startTeam persists synthesized delegation plans for broad tasks" dist/team/__tests__/runtime.test.js`
- [x] `npm run verify:plugin-bundle`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.28`
- [ ] Tag workflow / GitHub release / npm publication
- [ ] npm-installed real team lifecycle smoke after publish

## Verdict

`0.18.28` is the clean publish candidate for the trivial-task prompt-calibration fix: the runtime/task-state contract is unchanged, the prompt strength for narrow tasks is reduced to match task scope, and the withdrawn `v0.18.27` tag mistake is corrected by a fresh standard CI release from the right commit.
