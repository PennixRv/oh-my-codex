# Release readiness: oh-my-codex 0.18.57

## Range

- Previous tag: `v0.18.56`.
- Candidate tag: `v0.18.57`.
- Release focus: finalize boundary-delivered leader/worker mailbox handoff for interactive team workers and remove the remaining steady-state tmux injection assumptions from the runtime/test contract.

## Release scope

`0.18.57` carries the Pennix fork mailbox-boundary handoff follow-up:

- interactive worker steady-state mailbox delivery now uses explicit `mailbox_boundary` dispatch semantics
- unread leader/worker mailbox batches now surface through native-hook boundary `additionalContext` instead of tmux reinjection fallback
- worker mailbox trigger text and bootstrap guidance now reflect “finish current step, then read the real mailbox” behavior
- dispatch/runtime telemetry now records boundary mailbox delivery explicitly for worker mailbox flows

## PR inventory

- No merged PRs in `v0.18.56..v0.18.57`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bumped to `0.18.57`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: bumped to `0.18.57`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: synced to `0.18.57`.

## Local validation evidence

- [x] `npm run build`
- [x] `node dist/scripts/run-test-files.js dist/team/__tests__/delivery-e2e-smoke.test.js dist/team/__tests__/runtime.test.js dist/scripts/__tests__/codex-native-hook.test.js dist/team/__tests__/mcp-comm.test.js dist/team/__tests__/worker-bootstrap.test.js`
- [ ] `node dist/scripts/check-version-sync.js --tag v0.18.57`
- [ ] `git diff --check`
- [ ] `npm pack --dry-run`
- [ ] `node dist/scripts/generate-release-body.js --template RELEASE_BODY.md --out /tmp/RELEASE_BODY.v0.18.57.generated.md --current-tag v0.18.57 --previous-tag v0.18.56 --repo PennixRv/oh-my-codex`

## CI / publication evidence

- [ ] `CI` workflow on `main` for the release candidate commit
- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.57`
- [ ] clean uninstall / reinstall from npm
- [ ] published-artifact smoke confirms interactive worker mailbox review is boundary-delivered, no steady-state tmux reinjection is required, and installed hook/runtime assets resolve from the published package

## Known gaps

- `generate-release-body.js` verifies the current tag ref and therefore cannot produce the final compare-aware release body until the annotated `v0.18.57` tag exists locally; rerun it after tagging and before/alongside the release workflow.
- Full published-artifact smoke is intentionally deferred until the GitHub tag workflow publishes npm and the local environment is cleaned and reinstalled from npm.

## Current readiness verdict

The local fix set is aligned to the intended boundary-driven leader/worker mailbox contract. Focused hook/runtime/bootstrap regressions are green. Remaining work is the standard `main` CI run for the candidate commit, the tag-triggered GitHub release workflow, npm publication, a clean uninstall/reinstall from npm, and published-artifact smoke against the installed package.
