# Release readiness: oh-my-codex 0.18.25

## Scope

- Previous tag: `v0.18.24`.
- Candidate release tag: `v0.18.25`.
- Release focus: carry forward the team lifecycle fixes prepared in `0.18.24` and correct the CI-discovered shutdown teardown false-positive during runtime release tests.

## Included fixes

- Interactive Codex/Claude startup stays on a single evidence-gated canonical startup dispatch path instead of mixing a failed startup-direct pre-injection branch with a second replay path.
- `resumeTeam()` treats live worker panes as sufficient evidence for shared-session team resumability.
- `shutdownTeam()` still surfaces real pane teardown failures, removes otherwise-empty runtime `worktrees/` residue, and now treats stale/missing pane ids as best-effort teardown instead of fatal shutdown failure.

## Explicit non-goals

- Dirty leader workspace rejection for worktree provisioning remains an intentional safety gate.
- Codex prompt-mode workers without a real TTY remain unsupported in this release.

## 0.18.24 release-gate regression

- The `v0.18.24` GitHub release workflow failed in `Run tests`.
- The only failing compiled file was `dist/team/__tests__/runtime.test.js`.
- The failing tests were:
  - `shutdownTeam applies best-effort teardown even when worker pane is already dead`
  - `shutdownTeam reconciles persisted worker panes with live tmux panes before teardown`
- Root cause:
  - shutdown treated every `kill-pane` failure as fatal after the `0.18.24` hardening, including `missing pane` / stale persisted pane-id cases that older shutdown paths intentionally tolerated.
- Fix:
  - tmux teardown now classifies ignorable missing-pane failures separately from fatal pane-kill failures, and `shutdownTeam()` escalates only fatal teardown failures.

## Local verification

- [x] `npm run build`
- [x] `npm run lint`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.25`
- [x] `npm run verify:native-agents`
- [x] `npm run verify:plugin-bundle`
- [x] Targeted startup/resume/shutdown regressions:
  - `node --test --test-name-pattern 'single startup dispatch without replay|missing startup evidence as recoverable while preserving a single startup request|ready-prompt timeout without startup evidence|confirmed ready prompt as startup evidence after hook notification|rejects no-evidence startup issues instead of treating live panes as recoverable|shutdownTeam removes the runtime team root|shutdownTeam applies best-effort teardown even when worker pane is already dead|shutdownTeam surfaces pane teardown failures instead of reporting success|shutdownTeam reconciles persisted worker panes with live tmux panes before teardown|resumeTeam reuses shared-session teams when the worker pane is still live|startTeam rejects codex prompt mode without tmux with an explicit non-tty error' dist/team/__tests__/runtime.test.js`
- [x] Targeted tmux teardown regressions:
  - `node --test --test-name-pattern 'uses pane-id-direct kill semantics without liveness-gated helper calls|continues best-effort when a pane target is missing' dist/team/__tests__/tmux-session.test.js`
- [ ] Full compiled runtime test file `dist/team/__tests__/runtime.test.js`
  - Rerunning locally after the fix to mirror the exact CI failure surface.
- [ ] Tag workflow / GitHub release / npm publication
  - Pending standard GitHub tag-triggered release flow.

## Verdict

`0.18.25` is the corrected patch release candidate for the team lifecycle train, with explicit evidence for the `0.18.24` CI regression and targeted verification covering the repaired shutdown semantics.
