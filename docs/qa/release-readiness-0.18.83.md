# Release readiness: oh-my-codex 0.18.83

## Range

- Previous published npm version / successful release: `v0.18.81`.
- Failed unpublished candidate: `v0.18.82`.
- Candidate tag: `v0.18.83`.
- Release focus: publish the unpublished `0.18.82` plugin-mode/setup-fidelity payload with a Linux x86-only native release matrix.

## Release scope

`0.18.83` is a bounded publication-recovery release:

- preserves the intended `0.18.82` user-scope plugin-mode boundary and setup-idempotence changes
- trims native publication to `x86_64-unknown-linux-gnu` plus `x86_64-unknown-linux-musl`
- removes macOS, Windows, and ARM targets from the standard release workflow for this fork
- aligns cargo-dist config and release-workflow contract coverage to the same target set

## PR inventory

- No merged PRs in `v0.18.81..v0.18.83`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bump to `0.18.83`.
- Root `Cargo.toml` workspace package version and workspace package entries in `Cargo.lock`: resolve to `0.18.83`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: sync to `0.18.83`.

## Local validation evidence

- [ ] `npm run build`
- [ ] `node dist/scripts/run-test-files.js dist/verification/__tests__/explore-harness-release-workflow.test.js dist/verification/__tests__/release-workflow-release-body.test.js dist/verification/__tests__/native-release-manifest.test.js`
- [ ] `npm run verify:native-agents`
- [ ] `npm run verify:plugin-bundle`
- [ ] `npm pack --dry-run`
- [ ] `git diff --check`
- [ ] `node dist/scripts/check-version-sync.js --tag v0.18.83`
- [ ] `node dist/scripts/generate-release-body.js --template RELEASE_BODY.md --out /tmp/RELEASE_BODY.v0.18.83.generated.md --current-tag v0.18.83 --previous-tag v0.18.81 --repo PennixRv/oh-my-codex`

## CI / publication evidence

- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] published npm version returns `0.18.83`
- [ ] post-publish packed-install smoke passes
- [ ] `dev` is synced to released `main` via fast-forward or documented reconciliation merge

## Known gaps

- The failed `v0.18.82` candidate never reached GitHub release publication or npm publication because GitHub could not acquire the hosted `ubuntu-24.04-arm` runner for `Build native (aarch64-unknown-linux-gnu)`.
- Final compare-aware release-body generation still depends on the local `v0.18.83` tag existing on the candidate commit.
- npm publication and GitHub release proof remain external post-tag gates.

## Current readiness verdict

`0.18.83` is staged as a narrow publication-recovery release. The intended runtime payload is still the unpublished `0.18.82` plugin-mode/setup fix set; the new delta is only the Linux x86-only native publication matrix needed to make the standard release path reliable again.
