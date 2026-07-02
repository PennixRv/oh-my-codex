# Release readiness: oh-my-codex 0.18.66

## Range

- Previous published npm version / successful release: `v0.18.65`.
- Candidate tag: `v0.18.66`.
- Release focus: ship the bounded uninstall-preservation hotfix so clean reinstall flows do not drop user-authored `developer_instructions`.

## Release scope

`0.18.66` carries one production hotfix line plus the aligned regression gate:

- plugin-mode uninstall now parses root `developer_instructions` with the TOML parser, so multiline/triple-quoted user content can be preserved
- uninstall now strips only the managed `notify` key in the generic OMX top-level cleanup pass and removes the OMX `developer_instructions` fragment separately
- release regression coverage now includes the exact multiline custom `developer_instructions` shape observed in the live environment, while retaining the `0.18.65` tmux scrollback and shared-session teardown gates

## PR inventory

- No merged PRs in `v0.18.65..v0.18.66`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bump to `0.18.66`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: resolve to `0.18.66`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: sync to `0.18.66`.

## Local validation evidence

- [x] `npm run build`
- [x] `node dist/scripts/run-test-files.js dist/cli/__tests__/uninstall.test.js dist/hooks/__tests__/notify-hook-tmux-scrollback.test.js dist/team/__tests__/runtime.test.js`
- [x] `npm run verify:native-agents`
- [x] `npm run verify:plugin-bundle`
- [ ] `node dist/scripts/check-version-sync.js --tag v0.18.66`
- [x] `npm pack --dry-run`
- [x] `git diff --check`
- [ ] `node dist/scripts/generate-release-body.js --template RELEASE_BODY.md --out /tmp/RELEASE_BODY.v0.18.66.generated.md --current-tag v0.18.66 --previous-tag v0.18.65 --repo PennixRv/oh-my-codex`

## CI / publication evidence

- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.66`
- [ ] clean uninstall / reinstall from npm
- [ ] published-artifact smoke confirms uninstall preserves custom `developer_instructions`, reinstall appends the OMX fragment back, and the installed hook/runtime path remains error-free

## Known gaps

- The tag workflow still runs the full `npm run test:node` lane; local validation remains focused on the uninstall hotfix plus the two prior release-blocking tmux regressions.
- `generate-release-body.js` verifies the current tag ref and therefore cannot produce the final compare-aware release body until the local `v0.18.66` tag exists.
- Published-artifact uninstall/reinstall smoke remains deferred until npm publication completes.

## Current readiness verdict

`0.18.66` is a bounded follow-up hotfix to `0.18.65`. The intended local gate is the exact uninstall failure we reproduced in the live environment, plus the two previously fixed release-blocking tmux surfaces. Remaining blockers are the standard version-sync/pack hygiene checks, successful tag-triggered CI publication, and the required clean uninstall/reinstall smoke against the published npm artifact.
