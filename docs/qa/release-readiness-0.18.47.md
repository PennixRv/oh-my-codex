# Release readiness: oh-my-codex 0.18.47

## Range

- Previous tag: `v0.18.46`.
- Candidate tag: `v0.18.47`.
- Release focus: align the installed and injected AGENTS/developer-instruction text surfaces to the real Pennix fork setup contract for legacy versus plugin mode.

## Release scope

`0.18.47` is a narrow wording/setup-surface alignment release:

- persistent `AGENTS.md` now explicitly describes how legacy setup and plugin setup resolve workflow surfaces differently
- plugin-mode AGENTS output now says bundled Pennix OMX workflows come from the registered Codex marketplace/plugin instead of implying all bundled prompt/skill files were copied locally
- plugin-mode `developer_instructions` now state the same contract while still documenting setup-owned native-agent TOMLs and possible user-installed skill roots
- setup install-mode and scope coverage now enforces the updated user-visible wording
- no runtime mailbox, hook, or team orchestration logic changes are included in this release

## PR inventory

- No merged PRs in `v0.18.46..v0.18.47`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bumped to `0.18.47`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: bumped to `0.18.47`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: synced to `0.18.47`.

## Local validation evidence

- [x] `npm run build`
- [x] `node --test dist/cli/__tests__/setup-scope.test.js`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.47`
- [x] `git diff --check`
- [x] `npm pack --dry-run`

## CI / publication evidence

- [ ] `CI` workflow on `main` for the release candidate commit
- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.47`
- [ ] clean uninstall / reinstall from npm
- [ ] post-install smoke confirms installed AGENTS/developer-instruction text no longer implies plugin-mode bundled prompt/skill copies under local `.codex` directories

## Known gaps

- Local validation for this patch was completed with build, version sync, dry-run pack, and the directly affected setup-scope regression path.
- A transient false negative occurred only when the compiled setup-scope test was run in parallel with `npm pack --dry-run`; `prepack` rebuilds `dist`, so the test subprocess can temporarily lose `dist/cli/omx.js`. Running the compiled test serially with `node --test dist/cli/__tests__/setup-scope.test.js` passed cleanly and is the validation evidence recorded here.
- The large monorepo-wide `npm test` entrypoint remains intentionally out of scope for this narrow patch release because it rebuilds and runs the entire compiled suite; any remaining unrelated suite instability should be tracked separately from this release candidate.

## Current readiness verdict

Local release prep for `0.18.47` is ready for standard CI/CD promotion. The focused wording/setup-surface gates passed, version/build/pack checks passed, and the remaining work is the required `main` CI run for the candidate commit, the tag-triggered GitHub release workflow, npm publication, a clean reinstall from npm, and a post-install smoke that confirms the installed text surfaces match the actual Pennix fork behavior.
