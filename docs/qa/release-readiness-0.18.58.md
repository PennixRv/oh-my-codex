# Release readiness: oh-my-codex 0.18.58

## Range

- Previous tag: `v0.18.57`.
- Candidate tag: `v0.18.58`.
- Release focus: remove the residual launch-time star prompt interruption and make fresh user-scope setup converge back to plugin mode when existing Codex config already advertises trusted OMX plugin-mode registration.

## Release scope

`0.18.58` carries a narrow Pennix fork startup/setup convergence fix:

- launch entrypoints no longer invoke the interactive GitHub star prompt
- user-scope setup now infers plugin mode from existing trusted OMX plugin-mode Codex config when plugin cache materialization has not happened yet
- the setup-side inference now aligns with the same class of plugin-mode config evidence already used by `omx doctor`
- focused regression coverage now locks both the launch contract and the install-mode fallback contract

## PR inventory

- No merged PRs in `v0.18.57..v0.18.58`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bumped to `0.18.58`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: bumped to `0.18.58`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: synced to `0.18.58`.

## Local validation evidence

- [x] `npm run build`
- [x] `node dist/scripts/run-test-files.js dist/cli/__tests__/launch-startup-contract.test.js dist/cli/__tests__/setup-install-mode-regression.test.js dist/cli/__tests__/star-prompt.test.js dist/cli/__tests__/setup-gh-star.test.js dist/cli/__tests__/windows-popup-loop-contract.test.js`
- [ ] `node dist/scripts/check-version-sync.js --tag v0.18.58`
- [ ] `git diff --check`
- [ ] `npm pack --dry-run`
- [ ] `node dist/scripts/generate-release-body.js --template RELEASE_BODY.md --out /tmp/RELEASE_BODY.v0.18.58.generated.md --current-tag v0.18.58 --previous-tag v0.18.57 --repo PennixRv/oh-my-codex`

## CI / publication evidence

- [ ] `CI` workflow on `main` for the release candidate commit
- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.58`
- [ ] clean uninstall / reinstall from npm
- [ ] published-artifact smoke confirms launch paths no longer block on the interactive star prompt and fresh `omx setup --force` converges to plugin mode without requiring a follow-up `--plugin`

## Known gaps

- `generate-release-body.js` verifies the current tag ref and therefore cannot produce the final compare-aware release body until the annotated `v0.18.58` tag exists locally; rerun it after tagging and before/alongside the release workflow.
- Full published-artifact smoke is intentionally deferred until the GitHub tag workflow publishes npm and the local environment is cleaned and reinstalled from npm.

## Current readiness verdict

The local fix set is narrowly aligned to the startup/setup regressions reported from the installed package. Focused startup/setup/support-hint regression coverage is green. Remaining work is the standard `main` CI run for the candidate commit, the tag-triggered GitHub release workflow, npm publication, a clean uninstall/reinstall from npm, and published-artifact smoke against the installed package.
