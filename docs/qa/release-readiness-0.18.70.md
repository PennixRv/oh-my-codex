# Release readiness: oh-my-codex 0.18.70

## Range

- Previous published npm version / successful release: `v0.18.69`.
- Candidate tag: `v0.18.70`.
- Release focus: make the tracked tmux status bar display dynamic, pane-correct model telemetry and add a cumulative `Total` token item.

## Release scope

`0.18.70` is a bounded follow-up to the newly tracked tmux status bar:

- parse modern rollout `event_msg` / `token_count` records
- use `last_token_usage` for current context-window occupancy
- add `Total` from rollout `total_token_usage.total_tokens`
- match timestamp-prefixed rollout filenames by session id
- prioritize pane `codex resume <session-id>` over shared state and rollout metadata
- normalize CCH management URLs and prefer exact per-session usage stats
- resolve CCH admin tokens from env and user-level token files before falling back to Codex auth

## PR inventory

- No merged PRs in `v0.18.69..v0.18.70`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bump to `0.18.70`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: resolve to `0.18.70`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: sync to `0.18.70`.

## Local validation evidence

- [x] `npm run build`
- [x] `node dist/scripts/run-test-files.js dist/tmux-status/__tests__/render.test.js`
- [x] real tmux render smoke with CCH admin token across panes `%8`, `%1`, and `%2`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.70`
- [x] `npm run verify:native-agents`
- [x] `npm run verify:plugin-bundle`
- [x] `npm pack --dry-run`
- [x] `git diff --check`

## CI / publication evidence

- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.70`
- [ ] clean uninstall / reinstall from npm
- [ ] published-artifact smoke confirms the installed tmux status bar displays dynamic `Cost`, `Ctx`, `Total`, and `Cache` values for the active Codex pane

## Known gaps

- The tag-triggered Release workflow remains the authoritative full package publication gate.
- Published-artifact clean reinstall smoke remains deferred until npm publication completes.

## Current readiness verdict

`0.18.70` is ready for local release gates. The core regression surface has already passed targeted build/test and live tmux pane rendering with distinct Codex session ids; remaining work is standard version sync, package verification, tag-triggered CI publication, npm proof, and clean reinstall smoke.
