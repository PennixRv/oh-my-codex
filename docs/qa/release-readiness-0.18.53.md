# Release readiness: oh-my-codex 0.18.53

## Range

- Previous tag: `v0.18.52`.
- Candidate tag: `v0.18.53`.
- Release focus: harden the native hook and plugin-cache lifecycle so `PostToolUse` fail-open behavior and plugin-scoped hook entrypoints remain stable across setup refreshes and active older sessions.

## Release scope

`0.18.53` is a narrow native-hook and plugin-cache reliability release:

- `PostToolUse` dispatch failures no longer bubble out as fatal hook exit codes in unrelated sessions
- the global CLI hook now fail-opens at the top level for `PostToolUse` dispatch failures while preserving logs
- plugin-mode setup no longer deletes historical version-scoped plugin cache directories just because the packaged version changed
- same-version plugin cache repair now refreshes the packaged cache in place instead of removing the version directory first
- the published artifact now carries regression tests for both the top-level `PostToolUse` dispatch failure boundary and the plugin-cache lifecycle behavior

## PR inventory

- No merged PRs in `v0.18.52..v0.18.53`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bumped to `0.18.53`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: bumped to `0.18.53`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: synced to `0.18.53`.

## Local validation evidence

- [x] `npm run build`
- [x] `node dist/scripts/run-test-files.js dist/cli/__tests__/plugin-marketplace.test.js dist/scripts/__tests__/codex-native-hook.test.js dist/cli/__tests__/doctor-warning-copy.test.js`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.53`
- [x] `git diff --check`
- [ ] `npm pack --dry-run`
- [ ] `node dist/scripts/generate-release-body.js --template RELEASE_BODY.md --out /tmp/RELEASE_BODY.v0.18.53.generated.md --current-tag v0.18.53 --previous-tag v0.18.52 --repo PennixRv/oh-my-codex`

## CI / publication evidence

- [ ] `CI` workflow on `main` for the release candidate commit
- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.53`
- [ ] clean uninstall / reinstall from npm
- [ ] post-install smoke confirms `PostToolUse` no longer surfaces `hook exited with code 1` for top-level dispatch faults and plugin-scoped hook entrypoints survive published-version refreshes

## Known gaps

- The authoritative public release gate for npm publication remains the tag-triggered `Release` workflow; local evidence here focuses on the native-hook and plugin-cache lifecycle surfaces directly touched by the candidate.
- `generate-release-body.js` verifies the current tag ref and therefore cannot produce the final compare-aware release body until `v0.18.53` exists; the tag-triggered `Release` workflow is the canonical generator for that final output.
- This release intentionally does not change Team runtime lifecycle, mailbox delivery transport, or tmux startup/shutdown semantics beyond keeping plugin-scoped hook entrypoints available for still-running sessions.

## Current readiness verdict

Local release prep for `0.18.53` is aligned to the intended native-hook and plugin-cache reliability fixes. The focused hook/plugin-cache/doctor gates are green, and the remaining work is the standard `main` CI run for the candidate commit, the tag-triggered GitHub release workflow, npm publication, a clean reinstall from npm, and a post-install smoke against the published artifact.
