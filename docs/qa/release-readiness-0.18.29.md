# Release readiness: oh-my-codex 0.18.29

## Scope

- Previous published tag: `v0.18.28`.
- Candidate release tag: `v0.18.29`.
- Release focus: remove the remaining trivial-task completion drift that the real `0.18.28` npm-installed team smoke still exposed.

## Included fixes

- Exact-content single-file tasks now render as truly lightweight worker inboxes: no worker goal-handoff block, no heavyweight fix-loop boilerplate, and a micro verification checklist that matches the task scope.
- Worker completion guidance now treats OMX runtime auto-checkpoint/integration truthfully: when the requested result is already preserved in HEAD, a clean detached worktree is not treated as a failed commit requirement.
- Broad delegation and coordinated-task behavior remain unchanged; this patch narrows only the trivial-task completion contract.

## Root cause summary

- `0.18.28` correctly synthesized `delegation: none` for exact-content file tasks, but the live startup inbox still had two over-broad prompt surfaces:
  - unconditional worker goal-handoff text for any non-empty task list;
  - a `small` verification template that still asked for typecheck/tests plus the universal fix-verify loop.
- The worker bootstrap contract also still made `git add -A && git commit ...` a mandatory pre-completion step even though team runtime can auto-checkpoint and merge worker changes first on detached worktrees.
- In the real smoke, that combination did not break the lifecycle state machine, but it did make the worker spend extra turns re-diagnosing a no-op clean detached-HEAD commit before finally transitioning the task to `completed`.

## Local verification

- [x] `npm run build`
- [x] `npm run lint`
- [x] `node dist/scripts/run-test-files.js dist/team/__tests__/worker-bootstrap.test.js dist/verification/__tests__/verifier.test.js`
- [x] `node dist/scripts/run-test-files.js dist/team/__tests__/delegation-policy.test.js dist/team/__tests__/api-interop.test.js`
- [x] `node --test --test-name-pattern="startTeam persists synthesized delegation plans for broad tasks" dist/team/__tests__/runtime.test.js`
- [x] `npm run verify:plugin-bundle`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.29`
- [x] Local real lifecycle smoke with repo build:
  - `node dist/cli/omx.js team 1:executor "create file NPM_SMOKE_RESULT.txt with exact content NPM_OK and complete the task"`
  - verified worker inbox dropped goal-handoff + fix-loop noise;
  - verified task reached `completed`;
  - verified leader repo contained `NPM_SMOKE_RESULT.txt`;
  - verified `omx team shutdown create-file-npm-smoke-6ffbca5f`.
- [ ] Tag workflow / GitHub release / npm publication
- [ ] npm-installed real team lifecycle smoke after publish

## Verdict

`0.18.29` is the clean publish candidate for the remaining trivial-task lifecycle polish: the state machine and broad-task behavior are unchanged, while the narrow-task worker contract now matches the real runtime semantics and no longer adds avoidable completion drift.
