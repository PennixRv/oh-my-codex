# Release readiness: oh-my-codex 0.18.49

## Range

- Previous tag: `v0.18.48`.
- Candidate tag: `v0.18.49`.
- Release focus: align leader-facing team runtime/prompt/skill surfaces to the intended boundary-driven operating model, where the leader delegates bounded worker work, continues the mainline, and consumes worker results at natural prompt/tool boundaries.

## Release scope

`0.18.49` is a narrow orchestration-contract alignment release:

- leader startup hints now keep `omx team status` visible while reframing it as an explicit snapshot tool
- leader-facing idle and nudge wording now prefers mailbox review and mainline continuation over immediate status polling
- the installed `team` skill, plugin-mirrored team skill, `team-orchestrator` prompt, root `AGENTS.md`, and team coordination docs now describe the same boundary-driven leader posture
- no async mailbox handoff logic changes are included in this release

## PR inventory

- No merged PRs in `v0.18.48..v0.18.49`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bumped to `0.18.49`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: bumped to `0.18.49`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: synced to `0.18.49`.

## Local validation evidence

- [x] `npm run build`
- [x] `node dist/scripts/run-test-files.js dist/cli/__tests__/team.test.js dist/hooks/__tests__/notify-hook-all-workers-idle.test.js dist/hooks/__tests__/notify-hook-worker-idle.test.js dist/hooks/__tests__/notify-hook-team-leader-nudge.test.js`
- [x] `node dist/scripts/run-test-files.js dist/hooks/__tests__/prompt-guidance-contract.test.js dist/hooks/__tests__/prompt-guidance-wave-two.test.js dist/hooks/__tests__/prompt-guidance-scenarios.test.js dist/hooks/__tests__/prompt-guidance-catalog.test.js dist/hooks/__tests__/skill-guidance-contract.test.js dist/hooks/__tests__/prompt-guidance-fragments.test.js dist/hooks/__tests__/team-runtime-gating-docs-contract.test.js dist/scripts/__tests__/docs-site-contract.test.js`
- [x] `node dist/scripts/run-test-files.js dist/hooks/__tests__/explore-sparkshell-guidance-contract.test.js dist/hooks/__tests__/prompt-team-routing.test.js`
- [x] `npm run verify:native-agents && npm run verify:plugin-bundle`
- [x] `node dist/scripts/generate-catalog-docs.js --check`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.49`
- [x] `git diff --check`
- [x] `npm pack --dry-run`

## CI / publication evidence

- [ ] `CI` workflow on `main` for the release candidate commit
- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.49`
- [ ] clean uninstall / reinstall from npm
- [ ] post-install smoke confirms installed leader-facing team surfaces no longer encourage periodic `omx team status` polling as the default control loop

## Known gaps

- The directly affected compiled team/hook files for all-workers-idle, worker-idle, and leader-nudge are marked `SKIP` by the current compiled test harness in this environment, so the recorded evidence for those files is build coverage plus the surrounding compiled `team.test.js`/prompt-contract suites and the source-level assertion updates in the touched files.
- This release intentionally changes wording/contract surfaces only; the underlying async mailbox handoff and visible-injection suppression behavior are unchanged and therefore were validated through existing prompt/skill/runtime contract suites rather than a fresh protocol rewrite.
- The large monorepo-wide `npm test` entrypoint remains intentionally out of scope for this narrow patch release because it rebuilds and runs the entire compiled suite; any unrelated suite instability should continue to be tracked separately from this release candidate.

## Current readiness verdict

Local release prep for `0.18.49` is ready for standard CI/CD promotion. The targeted team/prompt contract gates passed, version/build/pack checks passed, and the remaining work is the required `main` CI run for the candidate commit, the tag-triggered GitHub release workflow, npm publication, a clean reinstall from npm, and a post-install smoke that confirms the installed leader-facing team surfaces match the intended Pennix fork behavior.
