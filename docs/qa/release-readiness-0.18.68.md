# Release readiness: oh-my-codex 0.18.68

## Range

- Previous published npm version / successful release: `v0.18.67`.
- Candidate tag: `v0.18.68`.
- Release focus: ship the tracked tmux status bar plus the aligned setup/uninstall preservation hardening without regressing existing OMX lifecycle boundaries.

## Release scope

`0.18.68` carries one new tracked operator-facing surface and two bounded lifecycle fixes:

- managed tmux status bar assets now install in user scope and uninstall cleanly
- the tmux status renderer now uses the finalized text labels and tmux 256-color palette
- setup preserves a trusted existing installed marketplace source when rerun from a source checkout
- uninstall preserves official Codex `plugin_hooks` and `goals` feature flags while still removing OMX-managed wrappers

## PR inventory

- No merged PRs in `v0.18.67..v0.18.68`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bump to `0.18.68`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: resolve to `0.18.68`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: sync to `0.18.68`.

## Local validation evidence

- [x] `npm run build`
- [x] `node dist/scripts/run-test-files.js dist/cli/__tests__/tmux-status-lifecycle.test.js`
- [x] `node --test dist/tmux-status/__tests__/render.test.js dist/tmux-status/__tests__/install.test.js`
- [x] `node dist/scripts/run-test-files.js dist/cli/__tests__/setup-install-mode.test.js dist/cli/__tests__/uninstall.test.js`
- [x] `npm run verify:native-agents`
- [x] `npm run verify:plugin-bundle`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.68`
- [x] `npm pack --dry-run`
- [x] `git diff --cached --check`
- [ ] `node dist/scripts/generate-release-body.js --template RELEASE_BODY.md --out /tmp/RELEASE_BODY.v0.18.68.generated.md --current-tag v0.18.68 --previous-tag v0.18.67 --repo PennixRv/oh-my-codex`

## CI / publication evidence

- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.68`
- [ ] clean uninstall / reinstall from npm
- [ ] published-artifact smoke confirms tmux status assets are installed from the published package, uninstall remains bounded, trusted marketplace source survives setup reruns, and installed uninstall keeps official Codex `plugin_hooks` / `goals` intact

## Known gaps

- The tag workflow remains the authoritative full `npm run test:node` gate; local validation here is focused on the new tmux-status and lifecycle-preservation surfaces.
- `generate-release-body.js` verifies the current tag ref and therefore cannot produce the final compare-aware release body until the local `v0.18.68` tag exists.
- Published-artifact clean reinstall smoke remains deferred until npm publication completes.

## Current readiness verdict

`0.18.68` is a bounded Pennix fork release that packages the now-tracked tmux status bar together with the setup/uninstall preservation fixes already staged in the current line of work. The remaining blockers are the standard local verification gates, the tag-triggered GitHub release workflow, npm publication, and the required clean reinstall smoke against the published artifact.
