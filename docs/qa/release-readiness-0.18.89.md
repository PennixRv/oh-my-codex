# Release Readiness: oh-my-codex 0.18.89

## Range

- Last released tag: `v0.18.88`.
- Candidate release range: `v0.18.88..HEAD`.
- Candidate change is a direct release-line patch on `main`.

## Release Scope

- Lowercase the visible managed tmux status labels without changing their colors, separators, outer gutters, or non-cost ordering.
- Move `cost` to the end of the left telemetry group and remove its `$` prefix.
- Render `sess` from the first segment of the complete active Codex UUID, never from the AOE/tmux session name.

## Version and Lockfile Audit

- Root `package.json` and `package-lock.json`: `0.18.89`.
- Root `Cargo.toml` workspace package version: `0.18.89`.
- Workspace package entries in `Cargo.lock`: `0.18.89`.
- Plugin manifest version: `0.18.89`.

## Local Validation Evidence

- [x] Targeted tmux renderer test suite.
- [x] Full `npm test` component chain: build, native-agent verification, plugin-bundle verification, full Node suite, and catalog check.
  - The full Node suite passed with `TMUX_TMPDIR=/tmp/omx-0.18.89-tmux-test-root`, preventing a direct tmux call in unrelated HUD unit tests from attaching to the interactive tmux server.
- [x] `npm run lint`.
- [x] `npm pack --dry-run`.
- [x] `git diff --check` after final release metadata.
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.89`.

## Publication Evidence

- [ ] Annotated tag `v0.18.89` pushed exactly once.
- [ ] Tag-triggered GitHub Release workflow completed successfully.
- [ ] GitHub release is non-draft/non-prerelease with the expected native assets and manifest.
- [ ] npm package `oh-my-codex-pennix@0.18.89` is visible.

## Readiness Verdict

Local validation is pending. Publication must use the one tag-triggered release workflow and must not use a separate manual workflow dispatch.
