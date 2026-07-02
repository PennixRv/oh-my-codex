# Release readiness: oh-my-codex 0.18.64

## Range

- Previous published tag: `v0.18.63`.
- Candidate tag: `v0.18.64`.
- Release focus: ship the Pennix team/runtime + setup-preservation line without regressing mailbox-boundary behavior or plugin-mode config preservation.

## Release scope

`0.18.64` carries four bounded operator-facing lines plus the release collateral:

- preserve current plugin `developer_instructions`, preserve user-owned OMX policy blocks in regenerated `AGENTS.md`, and protect local native-agent edits with a hash-tracked install manifest
- harden team runtime around Gemini startup prompt seeding, HUD-disabled relaunch, exact-role model pins, inherited leader model routing, and safer pane ownership tagging
- improve auth/session tooling with isolated `omx auth add` login homes, invalidated-slot hotswap rotation, project runtime Codex history discovery, and explicit `--codex-home` selection
- keep mailbox-boundary native-hook behavior while hardening planning/goal/subagent guardrails, notification config inheritance, and Windows plugin-hook spawning

## PR inventory

- No merged PRs in `v0.18.63..v0.18.64`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bump to `0.18.64`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: resolve to `0.18.64`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: sync to `0.18.64`.

## Local validation evidence

- [x] `npm run build`
- [x] `npm run verify:native-agents`
- [x] `npm run verify:plugin-bundle`
- [x] `npm run test:recent-bug-regressions:compiled`
- [x] `node dist/scripts/run-test-files.js dist/cli/__tests__/setup-agents-overwrite.test.js dist/cli/__tests__/auth.test.js dist/cli/__tests__/codex-plugin-layout.test.js dist/cli/__tests__/doctor-warning-copy.test.js dist/cli/__tests__/session-search-help.test.js dist/cli/__tests__/session-search.test.js dist/session-history/__tests__/search.test.js`
- [ ] `npm run test:node`
- [ ] `npm ci`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.64`
- [x] `npm pack --dry-run`
- [x] `git diff --check`
- [ ] `node dist/scripts/generate-release-body.js --template RELEASE_BODY.md --out /tmp/RELEASE_BODY.v0.18.64.generated.md --current-tag v0.18.64 --previous-tag v0.18.63 --repo PennixRv/oh-my-codex`

## CI / publication evidence

- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.64`
- [ ] clean uninstall / reinstall from npm
- [ ] published-artifact smoke confirms setup preservation, team Gemini/HUD relaunch hardening, and project runtime session-history discovery in the installed package

## Known gaps

- The tag workflow itself still runs the full `npm run test:node` lane; that full local lane has not yet been rerun after the `0.18.64` metadata bump.
- `generate-release-body.js` verifies the current tag ref and therefore cannot produce the final compare-aware release body until the local `v0.18.64` tag exists.
- Published-artifact uninstall/reinstall smoke remains deferred until npm publication completes.

## Current readiness verdict

The bounded `0.18.64` runtime/setup/auth/session changes are locally validated through the focused release gate and regression suites. Remaining release blockers are version-sync/pack hygiene after the metadata bump, successful tag-triggered CI publication, and the required clean uninstall/reinstall smoke against the published npm artifact.
