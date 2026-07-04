# Release readiness: oh-my-codex 0.18.71

## Range

- Previous published npm version / successful release: `v0.18.70`.
- Candidate tag: `v0.18.71`.
- Release focus: correct the tracked tmux status bar's live session binding for bare `codex` panes and align remote metric sourcing to that same resolved session.

## Release scope

`0.18.71` is a narrow follow-up to `0.18.70`:

- inspect the current tmux pane pid and prefer the live `codex` process' open rollout file
- stop stale shared `.omx/state/session.json` from overriding the current live rollout session id
- keep `Cost`, `Total`, and `Cache` on the same resolved CCH session
- preserve rollout-sourced `Effort` and current-window `Ctx`

## PR inventory

- No merged PRs in `v0.18.70..v0.18.71`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bump to `0.18.71`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: resolve to `0.18.71`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: sync to `0.18.71`.

## Local validation evidence

- [x] `npm run build`
- [x] `node dist/scripts/run-test-files.js dist/tmux-status/__tests__/render.test.js`
- [x] local dist render against current pane `%12` resolves live session `019f0c5e-9624-7182-b231-c83305f8d02e`
- [x] local dist render with CCH admin token matches current-session CCH `Cost` / `Total` / `Cache` instead of stale shared OMX state
- [x] `git diff --check`

## CI / publication evidence

- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.71`
- [ ] clean uninstall / reinstall from npm
- [ ] published-artifact smoke confirms the installed tmux status bar binds the active bare `codex` pane to the true live session and matches current-session `Cost`, `Ctx`, `Total`, and `Cache`

## Known gaps

- The tag-triggered Release workflow remains the authoritative full package publication gate.
- Published-artifact clean reinstall smoke remains deferred until npm publication completes.

## Current readiness verdict

`0.18.71` is ready for local release gates. The current regression surface is narrow and now covered by focused tests plus a real-pane render against the live current session whose stale shared OMX state previously caused misbinding.
