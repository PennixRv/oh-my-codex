# Release readiness: oh-my-codex 0.18.84

## Range

- Last published npm version: `v0.18.81`.
- Prior failed npm publication with GitHub release already created: `v0.18.83`.
- Candidate tag: `v0.18.84`.
- Release focus: corrective publish-gate recovery for the intended `0.18.83` payload.

## Release scope

`0.18.84` is a bounded corrective release:

- preserves the intended user-scope plugin-mode/setup-fidelity payload
- fixes prompt-guidance fragment drift that broke the generated-guidance contract
- fixes the scaling contract test for the current multiline role-prompt shape
- synchronizes plugin bundle metadata and workspace lockfiles to `0.18.84`
- preserves the Linux x86-only native publication matrix introduced in `0.18.83`

## PR inventory

- No merged PRs in `v0.18.83..v0.18.84`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: `0.18.84`.
- Root `Cargo.toml` workspace package version: `0.18.84`.
- Workspace package entries in `Cargo.lock`: `0.18.84`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: `0.18.84`.

## Local validation evidence

- [x] `npm run test:node`
- [x] `npm pack --dry-run`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.84`
- [x] `npm run verify:native-agents`
- [x] `npm run verify:plugin-bundle`
- [ ] `git diff --check`

## CI / publication evidence

- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] published npm version returns `0.18.84`
- [ ] post-publish packed-install smoke passes
- [ ] `dev` is synced to released `main` via fast-forward or documented reconciliation merge

## Known gaps

- `v0.18.83` already exists as a GitHub release, so recovery must happen as a new patch release instead of reusing that tag.
- npm publication proof remains an external post-tag gate.

## Current readiness verdict

`0.18.84` is locally ready as the corrective release for the failed `v0.18.83` publish path. The previously failing publish gate now passes locally, and the versioned metadata required by plugin-bundle/package verification is synchronized to the new patch version.
