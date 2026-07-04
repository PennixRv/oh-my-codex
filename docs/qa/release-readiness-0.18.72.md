# Release readiness: oh-my-codex 0.18.72

## Range

- Previous published npm version / successful release: `v0.18.71`.
- Candidate tag: `v0.18.72`.
- Release focus: hide the native Codex footer under OMX-managed setup, bind tmux status usage metrics only to active-pane local session evidence, and normalize visible numeric formatting.

## Release scope

`0.18.72` is a narrow follow-up to the existing tmux-status line:

- write OMX-managed `[tui]` `status_line = []` during setup
- replace only OMX-managed `status_line` values and preserve user-owned custom arrays
- prevent bare `codex` panes from inheriting stale usage totals from shared OMX session state
- prefer pane-local rollout/session evidence for active-pane usage telemetry
- normalize `Cost`, compact numbers, and percentages to fixed one-decimal formatting

## PR inventory

- No merged PRs in `v0.18.71..v0.18.72`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bump to `0.18.72`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: resolve to `0.18.72`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: sync to `0.18.72`.

## Local validation evidence

- [x] `npm run build`
- [x] `node --test dist/tmux-status/__tests__/render.test.js`
- [x] `node --test dist/cli/__tests__/setup-native-status-line.test.js`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.72`
- [x] `node dist/scripts/tmux-status-render.js left %17`
- [x] `node dist/scripts/tmux-status-render.js right %17`
- [ ] `node dist/scripts/generate-release-body.js --template RELEASE_BODY.md --out /tmp/RELEASE_BODY.v0.18.72.generated.md --current-tag v0.18.72 --previous-tag v0.18.71 --repo PennixRv/oh-my-codex`
- [x] renderer smoke: `node dist/scripts/tmux-status-render.js left %17`
- [x] renderer smoke: `node dist/scripts/tmux-status-render.js right %17`
- [ ] `git diff --cached --check`

## CI / publication evidence

- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.72`
- [ ] clean uninstall / reinstall from npm
- [ ] published-artifact smoke confirms the native Codex footer is suppressed under OMX-managed setup and active-pane tmux telemetry does not inherit stale session totals

## Known gaps

- The tag-triggered `Release` workflow remains the authoritative full `npm run test:node` and npm publish gate.
- Published-artifact clean reinstall smoke remains deferred until npm publication completes.

## Current readiness verdict

`0.18.72` is ready for focused local release gates. The changed surface is bounded to setup-owned TUI status-line management and tmux-status render/session binding logic; remaining blockers are the standard tag-triggered release workflow, npm publication, and clean reinstall smoke from the published artifact.
