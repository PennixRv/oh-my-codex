# Release readiness: oh-my-codex 0.18.85

## Range

- Last released tag: `v0.18.84`.
- Candidate tag: `v0.18.85`.
- Release focus: plugin-mode hook semantics correction and launch-repair/bootstrap refresh regression closure.

## Release scope

`0.18.85` is a bounded corrective release:

- keeps plugin-mode hook enablement on canonical Codex `hooks`/`codex_hooks`
- removes OMX-managed user-home hook wrappers in plugin mode
- aligns `omx doctor` wording and inference with plugin-cache hook registration
- preserves custom `developer_instructions` and hidden `status_line = []` launch-repair semantics
- auto-refreshes existing OMX-generated plugin-mode `AGENTS.md` defaults
- keeps the Linux x86-only native publication matrix unchanged

## PR inventory

- No merged PRs in `v0.18.84..v0.18.85`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: `0.18.85`.
- Root `Cargo.toml` workspace package version: `0.18.85`.
- Workspace package entries in `Cargo.lock`: `0.18.85`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: `0.18.85`.

## Local validation evidence

- [x] `npm run build`
- [x] `node --test dist/cli/__tests__/setup-install-mode-regression.test.js dist/cli/__tests__/setup-scope.test.js dist/cli/__tests__/doctor-warning-copy.test.js`
- [x] `node --test dist/cli/__tests__/index.test.js dist/config/__tests__/generator-idempotent.test.js dist/config/__tests__/generator-notify.test.js`
- [ ] `npm run verify:native-agents`
- [ ] `npm run verify:plugin-bundle`
- [ ] `npm pack --dry-run`
- [ ] `git diff --check`
- [ ] `node dist/scripts/check-version-sync.js --tag v0.18.85`

## CI / publication evidence

- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] published npm version returns `0.18.85`
- [ ] post-publish packed-install smoke passes
- [ ] `dev` is synced to released `main` via fast-forward or documented reconciliation merge

## Known gaps

- Full publish-gate proof remains an external post-tag concern because npm and GitHub Release publication happen in CI.
- Historical docs still mention older `plugin_hooks` semantics in prior release notes; those are historical records and do not change the current product contract.

## Current readiness verdict

`0.18.85` is locally ready pending the remaining release-gate checks (`verify:native-agents`, `verify:plugin-bundle`, `npm pack --dry-run`, `git diff --check`, and version-sync with the new tag). The behavior-critical plugin-mode/setup/doctor/config-repair regressions are green.
