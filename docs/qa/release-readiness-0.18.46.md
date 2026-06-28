# Release readiness: oh-my-codex 0.18.46

## Range

- Previous tag: `v0.18.45`.
- Candidate tag: `v0.18.46`.
- Release focus: align all currently injected/runtime-visible leader/worker communication wording to the real mailbox boundary handoff behavior already implemented in the Pennix fork.

## Release scope

`0.18.46` is a narrow wording/runtime-surface alignment release:

- installable `team` and `worker` skills now describe worker -> leader updates as real `leader-fixed` mailbox delivery
- plugin-mirrored `team` and `worker` skills now match the same communication contract
- runtime-generated worker instructions and disposable root `AGENTS.md` guidance now explicitly describe leader review as asynchronous `UserPromptSubmit` / `PreToolUse` boundary handling
- internal `leader-fixed` dispatch trigger records now use the same mailbox-boundary wording instead of older review-immediately text
- no core mailbox handoff logic changes are included in this release

## PR inventory

- No merged PRs in `v0.18.45..v0.18.46`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bumped to `0.18.46`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: bumped to `0.18.46`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: synced to `0.18.46`.

## Local validation evidence

- [x] `npm run build`
- [x] `node dist/scripts/run-test-files.js dist/scripts/__tests__/codex-native-hook.test.js --test-name-pattern "leader mailbox handoff"`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.46`
- [x] `git diff --check`
- [x] `npm pack --dry-run`

## CI / publication evidence

- [ ] `CI` workflow on `main` for the release candidate commit
- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.46`
- [ ] clean uninstall / reinstall from npm
- [ ] post-install smoke confirms current installed skills/runtime text describe leader mailbox review via `UserPromptSubmit` / `PreToolUse` boundary context

## Known gaps

- The focused `leader mailbox handoff` native-hook coverage passed, which is the runtime path this release is documenting.
- Re-running some other compiled test entrypoints during release prep still hit pre-existing repository `dist` import / emission gaps unrelated to this wording patch:
  - `dist/team/__tests__/worker-bootstrap.test.js` attempted to import `dist/agents/native-config.js` before that entrypoint was runnable in this environment.
  - `dist/hooks/__tests__/notify-hook-team-dispatch.test.js` hit `ERR_MODULE_NOT_FOUND` for `dist/hooks/session.js`.
  - `dist/hooks/__tests__/team-leader-runtime-regression.test.js` and `dist/team/__tests__/runtime.test.js` were not emitted as runnable files in the checked build output for those direct invocations.
- These are tracked here as existing release-prep caveats, not as regressions introduced by `0.18.46`.

## Current readiness verdict

Local release prep for `0.18.46` is ready for standard CI/CD promotion. The focused mailbox-boundary gate passed, version/build/pack checks passed, and the remaining work is the standard `main` CI run for the candidate commit, the tag-triggered GitHub release workflow, npm publication, a clean reinstall from npm, and a post-install smoke that confirms the installed communication wording matches the intended leader mailbox contract.
