# Release readiness: oh-my-codex 0.18.65

## Range

- Previous published npm version / successful release: `v0.18.63`.
- Candidate tag: `v0.18.65`.
- Release focus: ship the bounded shared-session shutdown socket fix and restore a trustworthy release gate for tmux scrollback injection.

## Release scope

`0.18.65` carries one production hotfix line plus the aligned regression gate:

- shared-session interactive shutdown now reads pane-owner tags through the persisted tmux socket identity, so synthetic-server cleanup still removes team-owned panes when the default host socket is absent
- the real-tmux shutdown regression now forces an invalid ambient `TMUX` socket so this contract is exercised deterministically in local and CI runs
- the tmux scrollback regression harness now matches the current safe-paste `sendPaneInput()` implementation (`set-buffer` / `show-buffer` / `paste-buffer` / `delete-buffer`) and no longer fails for test-double drift

## PR inventory

- No merged PRs in `v0.18.64..v0.18.65`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bump to `0.18.65`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: resolve to `0.18.65`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: sync to `0.18.65`.

## Local validation evidence

- [x] `npm run build`
- [x] `node dist/scripts/run-test-files.js dist/hooks/__tests__/notify-hook-tmux-scrollback.test.js dist/team/__tests__/runtime.test.js`
- [x] `npm run verify:native-agents`
- [x] `npm run verify:plugin-bundle`
- [ ] `node dist/scripts/check-version-sync.js --tag v0.18.65`
- [x] `npm pack --dry-run`
- [x] `git diff --check`
- [ ] `node dist/scripts/generate-release-body.js --template RELEASE_BODY.md --out /tmp/RELEASE_BODY.v0.18.65.generated.md --current-tag v0.18.65 --previous-tag v0.18.64 --repo PennixRv/oh-my-codex`

## CI / publication evidence

- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.65`
- [ ] clean uninstall / reinstall from npm
- [ ] published-artifact smoke confirms shared-session teardown cleanup and an error-free installed hook path

## Known gaps

- The tag workflow still runs the full `npm run test:node` lane; only the two previously failing release-gate surfaces have been rerun locally for this hotfix.
- `generate-release-body.js` verifies the current tag ref and therefore cannot produce the final compare-aware release body until the local `v0.18.65` tag exists.
- Published-artifact uninstall/reinstall smoke remains deferred until npm publication completes.

## Current readiness verdict

The bounded `0.18.65` teardown/gate fixes are locally validated on the exact two release-blocking surfaces from the failed `0.18.64` workflow. Remaining blockers are the standard version-sync/pack hygiene checks, successful tag-triggered CI publication, and the required clean uninstall/reinstall smoke against the published npm artifact.
