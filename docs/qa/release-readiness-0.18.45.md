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

- [x] `npm run build`
- [x] `node dist/scripts/run-test-files.js dist/scripts/__tests__/codex-native-hook.test.js dist/hooks/extensibility/__tests__/runtime.test.js`
- [x] `node --test dist/scripts/__tests__/codex-native-hook.test.js`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.45`
- [x] `git diff --check`
- [x] `npm pack --dry-run`
- [x] post-release workflow follow-up: `node --test dist/verification/__tests__/release-workflow-release-body.test.js`

## CI / publication evidence

- [x] `CI` workflow on `main` for the release candidate commit: run `28323359815` (`success`)
- [x] tag-triggered `Release` workflow: run `28323625393` (`success`)
- [x] GitHub release exists and is non-draft/non-prerelease: <https://github.com/PennixRv/oh-my-codex/releases/tag/v0.18.45>
- [x] `npm view oh-my-codex-pennix version` returns `0.18.45`
- [x] clean uninstall / reinstall from npm: `omx uninstall --keep-config --purge`, `npm uninstall -g oh-my-codex-pennix`, `npm install -g oh-my-codex-pennix@0.18.45`, `omx setup --scope user --force`
- [x] post-install `PostToolUse` smoke confirms internal transport/runtime bridge failures fail open instead of surfacing cross-session `hook exited with code 1` noise

## Known gaps

- Runtime release goal is closed.
- Post-release workflow follow-up remains on `main`: the original `release.yml` generated GitHub release notes without `--previous-tag`, so the compare link in the live `v0.18.45` release body had to be manually corrected after publish.

## Post-release follow-up

- Live GitHub release notes for `v0.18.45` were manually corrected after publication so the changelog points at the proper compare range instead of a self-referential tag link.
- Repository follow-up adds automatic previous-tag detection to `.github/workflows/release.yml`.
- Regression coverage now checks that the release workflow passes `--previous-tag` to `dist/scripts/generate-release-body.js`.

## Current readiness verdict

`0.18.45` is released, published, and reinstalled from npm with the native-hook fail-open fix validated in the installed package. The only remaining work is to merge the release-workflow follow-up on `main` and run CI so future tags generate the correct GitHub release compare range automatically.
