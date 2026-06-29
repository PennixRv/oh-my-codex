# Release readiness: oh-my-codex 0.18.48

## Range

- Previous tag: `v0.18.47`.
- Candidate tag: `v0.18.48`.
- Release focus: let `omx question` help and usage invocations pass through the native PreToolUse hook while keeping real launches protected.

## Release scope

`0.18.48` is a narrow native-hook correctness release:

- `omx question --help`, `omx question -h`, and `omx question help` are no longer blocked by the native Bash question guard
- live `omx question` launches still require the leader-pane return bridge or the native structured question path
- regression coverage now asserts the help-pass-through behavior alongside the existing allow/block bridge cases
- no runtime mailbox, hook, or team orchestration logic changes are included in this release

## PR inventory

- No merged PRs in `v0.18.47..v0.18.48`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bumped to `0.18.48`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: bumped to `0.18.48`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: synced to `0.18.48`.

## Local validation evidence

- [x] `npm run build`
- [x] `node --test dist/scripts/__tests__/codex-native-hook.test.js --test-name-pattern "does not block Bash omx question help invocations|blocks Bash omx question when no leader-pane return hint is preserved|allows Bash omx question when the command preserves the leader-pane return hint|blocks native/App Bash omx question with bridge-specific outside-tmux guidance"`
- [x] `node --test dist/cli/__tests__/question.test.js`
- [x] `npm run smoke:packed-install`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.48`
- [x] `git diff --check`
- [x] `npm pack --dry-run`

## CI / publication evidence

- [ ] `CI` workflow on `main` for the release candidate commit
- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.48`
- [ ] clean uninstall / reinstall from npm
- [ ] post-install smoke confirms `omx question --help` passes through without triggering the live question block

## Known gaps

- Local validation covered the affected native-hook regression path, the `omx question` CLI contract, and the packed-install smoke.
- The large monorepo-wide `npm test` entrypoint remains intentionally out of scope for this narrow patch release because it rebuilds and runs the entire compiled suite; any remaining unrelated suite instability should be tracked separately from this release candidate.

## Current readiness verdict

Local release prep for `0.18.48` is ready for standard CI/CD promotion. The focused native-hook and question CLI gates passed, version/build/pack checks passed, and the remaining work is the required `main` CI run for the candidate commit, the tag-triggered GitHub release workflow, npm publication, a clean reinstall from npm, and a post-install smoke that confirms the installed `omx question` help surface no longer triggers the live launch guard.
