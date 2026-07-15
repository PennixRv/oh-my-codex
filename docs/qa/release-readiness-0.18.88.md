# Release Readiness: oh-my-codex 0.18.88

## Range

- Last released tag: `v0.18.87`.
- Candidate release range: `v0.18.87..HEAD`.
- Candidate change is a direct release-line patch on `main`.

## Release Scope

- Add a two-column outer gutter to each visible side of the managed tmux status bar.
- Keep tmux's independent left/right anchoring intact: left receives leading whitespace and right receives trailing whitespace.
- Preserve invisible pane behavior and leave native Codex footer configuration untouched.

## Version and Lockfile Audit

- Root `package.json` and `package-lock.json`: `0.18.88`.
- Root `Cargo.toml` workspace package version: `0.18.88`.
- Workspace package entries in `Cargo.lock`: `0.18.88`.

## Local Validation Evidence

- [x] Full `npm test`
- [x] `npm run lint`
- [x] Targeted tmux status renderer and installer test suites
- [x] `npm pack --dry-run`
- [x] `git diff --check` after final release metadata
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.88`

## Publication Evidence

- [ ] `v0.18.88` tag pushed.
- [ ] Tag-triggered release workflow passed.
- [ ] npm package `oh-my-codex-pennix@0.18.88` is visible.
- [ ] GitHub release exists and is non-draft/non-prerelease.

## Readiness Verdict

The patch is ready for final local release gates and standard tag-triggered publication.
