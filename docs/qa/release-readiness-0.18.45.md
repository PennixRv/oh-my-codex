# Release readiness: oh-my-codex 0.18.45

## Range

- Previous tag: `v0.18.44`.
- Candidate tag: `v0.18.45`.
- Release focus: make internal OMX `PostToolUse` failures fail open so global native hooks stop surfacing unrelated `hook exited with code 1` noise across shared Codex environments.

## Release scope

`0.18.45` is a narrow native-hook correctness release:

- `PostToolUse` runtime lifecycle dispatch failures are logged as non-fatal OMX diagnostics instead of failing the hook
- `PostToolUse` transport-remediation/guidance generation failures are logged non-fatally and do not mask otherwise recoverable hook output
- worker `PostToolUse` success-bridge failures are logged non-fatally
- regression coverage proves the fail-open contract without relaxing `PreToolUse` or `Stop`

## PR inventory

- No merged PRs in `v0.18.44..v0.18.45`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bumped to `0.18.45`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: bumped to `0.18.45`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: synced to `0.18.45`.

## Local validation evidence

- [ ] `npm run build`
- [ ] `node dist/scripts/run-test-files.js dist/scripts/__tests__/codex-native-hook.test.js dist/hooks/extensibility/__tests__/runtime.test.js`
- [ ] `node --test dist/scripts/__tests__/codex-native-hook.test.js`
- [ ] `node dist/scripts/check-version-sync.js --tag v0.18.45`
- [ ] `git diff --check`
- [ ] `npm pack --dry-run`

## CI / publication evidence

- [ ] `CI` workflow on `main` for the release candidate commit
- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.45`
- [ ] clean uninstall / reinstall from npm
- [ ] post-install multi-session `PostToolUse` smoke without cross-session `hook exited with code 1` noise

## Known gaps

- None at release-prep time beyond the pending CI / publication evidence above.

## Current readiness verdict

Local release prep for `0.18.45` is ready once the focused native-hook gates pass. Remaining work is standard `main` CI on the candidate commit, the tag-triggered GitHub release workflow, npm publication, a clean reinstall from npm, and a post-publish multi-session smoke that confirms internal OMX `PostToolUse` failures no longer leak noisy fatal hook banners across other Codex sessions.
