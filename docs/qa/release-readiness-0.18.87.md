# Release Readiness: oh-my-codex 0.18.87

## Range

- Last released tag: `v0.18.86`.
- Candidate release range: `v0.18.86..HEAD`.
- Candidate change is a direct release-line patch on `main`.

## Release Scope

- Make the doctor model-context recommendation provider-aware.
- Preserve the generic no-provider setup recommendation.
- Suppress false warnings for explicit provider routes such as `cch` without rewriting user configuration.

## Version and Lockfile Audit

- Root `package.json` and `package-lock.json`: `0.18.87`.
- Root `Cargo.toml` workspace package version: `0.18.87`.
- Workspace package entries in `Cargo.lock`: `0.18.87`.

## Local Validation Evidence

- [x] Full `npm test`
- [x] `npm run lint`
- [x] Targeted `doctor-context-window-warning` regression suite
- [x] Source CLI smoke against explicit `cch` configuration
- [x] `npm pack --dry-run`
- [x] `git diff --check` after final release metadata
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.87`

## Publication Evidence

- [ ] `v0.18.87` tag pushed.
- [ ] Tag-triggered release workflow passed.
- [ ] npm package `oh-my-codex-pennix@0.18.87` is visible.
- [ ] GitHub release exists and is non-draft/non-prerelease.

## Readiness Verdict

The patch is ready for remaining local release gates and standard tag-triggered publication.
