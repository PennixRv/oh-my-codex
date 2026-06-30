# Release readiness: oh-my-codex 0.18.52

## Range

- Previous tag: `v0.18.51`.
- Candidate tag: `v0.18.52`.
- Release focus: tighten Team role-routing and native prompt auto-route guidance so Team mode, review/exploration intent, and explicit workflow-selection prose behave consistently.

## Release scope

`0.18.52` is a narrow routing/guidance release:

- Team auto-route now short-circuits to solo when Team mode is disabled
- review-specialist Team launch role selection now stays consistent across staffing summaries and suggested launch commands
- exploration-shaped `check/inspect` prompts no longer fall into Team review by accident
- prose workflow-selection prompts such as `use autopilot to ...` no longer receive Team guidance ahead of the requested workflow
- role-level model/reasoning overrides are now covered through the native-agent generation and Team worker model contract tests included in this release line

## PR inventory

- No merged PRs in `v0.18.51..v0.18.52`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bumped to `0.18.52`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: bumped to `0.18.52`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: synced to `0.18.52`.

## Local validation evidence

- [x] `npm run build`
- [x] `node dist/scripts/run-test-files.js dist/agents/__tests__/native-config.test.js dist/config/__tests__/models.test.js dist/team/__tests__/model-contract.test.js dist/team/__tests__/auto-route.test.js dist/team/__tests__/followup-planner.test.js dist/scripts/__tests__/codex-native-hook.test.js`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.52`
- [x] `npm run verify:native-agents && npm run verify:plugin-bundle`
- [x] `git diff --check`
- [x] `npm pack --dry-run`
- [ ] `node dist/scripts/generate-release-body.js --template RELEASE_BODY.md --out /tmp/RELEASE_BODY.v0.18.52.generated.md --current-tag v0.18.52 --previous-tag v0.18.51 --repo PennixRv/oh-my-codex`

## CI / publication evidence

- [ ] `CI` workflow on `main` for the release candidate commit
- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.52`
- [ ] clean uninstall / reinstall from npm
- [ ] post-install smoke confirms installed Team prompt guidance no longer over-routes disabled/exploration/workflow-selection prompts

## Known gaps

- The authoritative public release gate for npm publication remains the tag-triggered `Release` workflow; local evidence here focuses on the role-routing and native-hook surfaces directly touched by the candidate.
- `generate-release-body.js` verifies the current tag ref and therefore cannot produce the final compare-aware release body until `v0.18.52` exists; the tag-triggered `Release` workflow is the canonical generator for that final output.
- This release intentionally does not change Team runtime lifecycle, mailbox delivery transport, or tmux startup/shutdown semantics.

## Current readiness verdict

Local release prep for `0.18.52` is aligned to the intended routing/guidance fixes. The focused model/routing/native-hook gates are green, and the remaining work is the standard `main` CI run for the candidate commit, the tag-triggered GitHub release workflow, npm publication, a clean reinstall from npm, and a post-install smoke against the published artifact.
