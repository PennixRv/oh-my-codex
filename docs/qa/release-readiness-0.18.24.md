# Release readiness: oh-my-codex 0.18.24

Superseded:
- The `v0.18.24` tag-triggered GitHub release workflow failed in `npm run test:node` on two `dist/team/__tests__/runtime.test.js` shutdown regressions.
- The corrected publish candidate is `0.18.25`; see `docs/qa/release-readiness-0.18.25.md`.

## Scope

- Previous tag: `v0.18.23`.
- Candidate release tag: `v0.18.24`.
- Release focus: team startup prompt delivery, shared-session resume, and shutdown cleanup/reporting fixes in the Pennix fork.

## Included fixes

- Interactive Codex/Claude startup now stays on a single evidence-gated canonical startup dispatch path instead of mixing a failed startup-direct pre-injection branch with a second replay path.
- `resumeTeam()` now treats live worker panes as sufficient evidence for shared-session team resumability.
- `shutdownTeam()` now surfaces pane teardown failures and removes otherwise-empty runtime `worktrees/` residue so the runtime team root can be cleaned up.

## Explicit non-goals

- Dirty leader workspace rejection for worktree provisioning remains an intentional safety gate.
- Codex prompt-mode workers without a real TTY remain unsupported in this release.

## Local verification

- [x] `npm run build`
- [x] `npm run lint`
- [x] Targeted startup/lifecycle regressions:
  - `node --test --test-name-pattern 'single startup dispatch without replay|missing startup evidence as recoverable while preserving a single startup request|ready-prompt timeout without startup evidence|confirmed ready prompt as startup evidence after hook notification|rejects no-evidence startup issues instead of treating live panes as recoverable|shutdownTeam removes the runtime team root|shutdownTeam surfaces pane teardown failures|resumeTeam reuses shared-session teams when the worker pane is still live|startTeam rejects codex prompt mode without tmux with an explicit non-tty error' dist/team/__tests__/runtime.test.js`
- [ ] Full compiled runtime test file `dist/team/__tests__/runtime.test.js`
  - Still running during prep; not used as the sole release gate because targeted regressions above already cover the modified paths directly.
- [ ] Tag workflow / GitHub release / npm publication
  - Pending standard GitHub tag-triggered release flow.

## Verdict

Local release prep is ready for the standard GitHub tag-based publish flow for `0.18.24`, with targeted regression evidence covering the modified startup, resume, and shutdown paths directly.
