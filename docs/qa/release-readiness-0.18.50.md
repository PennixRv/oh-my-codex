# Release readiness: oh-my-codex 0.18.50

## Range

- Previous tag: `v0.18.49`.
- Candidate tag: `v0.18.50`.
- Release focus: make startup-shaped top-level `omx team ... --help` invocations short-circuit to help output instead of attempting a real team launch.

## Release scope

`0.18.50` is a narrow team CLI help release:

- top-level `omx team 1:executor "..." --help` now prints team help instead of falling through to team startup
- the deprecated-worktree equivalent now behaves the same way
- new team CLI tests lock both startup-shaped help cases
- no runtime mailbox, startup dispatch, or orchestration behavior changes are included in this release

## PR inventory

- No merged PRs in `v0.18.49..v0.18.50`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bumped to `0.18.50`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: bumped to `0.18.50`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: synced to `0.18.50`.

## Local validation evidence

- [x] `npm run build`
- [x] `node dist/cli/omx.js team 1:executor "ship it" --help`
- [x] `node dist/cli/omx.js team --worktree 1:executor "ship it" --help`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.50`
- [x] `npm run verify:native-agents && npm run verify:plugin-bundle`
- [x] `node dist/scripts/generate-catalog-docs.js --check`
- [x] `git diff --check`
- [x] `npm pack --dry-run`

## CI / publication evidence

- [ ] `CI` workflow on `main` for the release candidate commit
- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.50`
- [ ] clean uninstall / reinstall from npm
- [ ] post-install smoke confirms installed `omx team 1:executor "..." --help` prints help instead of attempting team startup

## Known gaps

- Direct compiled invocation of `dist/cli/__tests__/team.test.js` remains unreliable in this environment as a standalone runner path because the repo’s emitted direct-import surface is not consistently usable for that specific file. For this release, the authoritative local evidence is the built CLI itself plus the source-level regression tests committed with the patch.
- This release intentionally changes only top-level help parsing; all runtime team lifecycle behavior remains unchanged and is therefore out of scope for the release candidate.

## Current readiness verdict

Local release prep for `0.18.50` is ready for standard CI/CD promotion. The built CLI reproducer is fixed, version/build/pack checks are the remaining local gates, and the next steps are the required `main` CI run for the candidate commit, the tag-triggered GitHub release workflow, npm publication, a clean reinstall from npm, and a post-install smoke that confirms installed startup-shaped `omx team ... --help` invocations now short-circuit to help output.
