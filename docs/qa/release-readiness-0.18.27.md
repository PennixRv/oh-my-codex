# Release readiness: oh-my-codex 0.18.27

## Scope

- Previous tag: `v0.18.26`.
- Candidate release tag: `v0.18.27`.
- Release focus: repair the newly observed trivial-task completion drift from the npm-installed team lifecycle smoke after `0.18.26`.

## Included fixes

- Exact-content single-file tasks now synthesize as narrow/no-delegation work instead of receiving optional subagent delegation guidance.
- Initial worker inbox verification guidance now scales down to the small-task checklist for narrow single-task assignments.
- Broad investigation and coordinated team tasks retain their existing stronger delegation and coordination contracts.

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
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.27`
- [ ] Tag workflow / GitHub release / npm publication
- [ ] npm-installed real team lifecycle smoke after publish

## Verdict

`0.18.27` is a narrow prompt-calibration follow-up to `0.18.26`: it preserves the repaired team lifecycle command contract while removing trivial-task guidance that was still strong enough to delay clean worker completion in the real install-path smoke.
