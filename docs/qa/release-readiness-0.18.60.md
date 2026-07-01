# Release readiness: oh-my-codex 0.18.60

## Range

- Previous tag: `v0.18.59`.
- Candidate tag: `v0.18.60`.
- Release focus: ship the first bounded upstream integration wave without regressing Pennix-specific mailbox-first runtime behavior.

## Release scope

`0.18.60` carries the wave-1 Pennix fork integration bundle:

- repeated plugin-mode setup dedupes local OMX marketplace and first-party MCP server TOML tables instead of accumulating duplicates
- legacy `hooks.json` trust state is migrated into `config.toml [hooks.state]`, and stale top-level `state` now fails `omx doctor`
- native hook CLI output is hardened so Codex receives schema-safe JSON on null/empty hook outputs while Pennix `PreToolUse` mailbox `additionalContext` remains intact
- worker worktree root `AGENTS.md` preserves inherited user/project guidance and then layers the runtime overlay last

## PR inventory

- No merged PRs in `v0.18.59..v0.18.60`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bumped to `0.18.60`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: resolved to `0.18.60`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: synced to `0.18.60`.

## Local validation evidence

- [x] `npm run build`
- [x] `node dist/scripts/run-test-files.js dist/cli/__tests__/plugin-marketplace.test.js dist/config/__tests__/codex-hooks.test.js dist/team/__tests__/worker-bootstrap.test.js dist/cli/__tests__/setup-install-mode.test.js dist/cli/__tests__/doctor-warning-copy.test.js dist/scripts/__tests__/codex-native-hook.test.js`
- [x] `npm run verify:native-agents && npm run verify:plugin-bundle`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.60`
- [x] `git diff --check`
- [x] `npm pack --dry-run`
- [x] `npm run smoke:packed-install`
- [ ] `node dist/scripts/generate-release-body.js --template RELEASE_BODY.md --out /tmp/RELEASE_BODY.v0.18.60.generated.md --current-tag v0.18.60 --previous-tag v0.18.59 --repo PennixRv/oh-my-codex`

## CI / publication evidence

- [ ] `CI` workflow on `main` for the release candidate commit
- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.60`
- [ ] clean uninstall / reinstall from npm
- [ ] published-artifact smoke confirms setup dedupe, hooks-state migration, native-hook CLI compatibility, and worker AGENTS preservation in the installed package

## Known gaps

- `generate-release-body.js` verifies the current tag ref and therefore cannot produce the final compare-aware release body until the annotated `v0.18.60` tag exists locally; rerun it after tagging and before/alongside the release workflow.
- Published-artifact reinstall smoke is intentionally deferred until the GitHub tag workflow publishes npm and the local environment is cleaned and reinstalled from npm.
- This readiness record is for the new wave-1 release candidate. Historical `0.18.59` release collateral remains preserved because that version is already tagged and published.

## Current readiness verdict

The local wave-1 source bundle is prepared as a new release candidate because `0.18.59` is already published. Focused build, regression coverage, package dry-run, and packed-install smoke are green. Remaining work is `main` CI on the candidate commit, the tag-triggered GitHub release workflow, npm publication, and clean reinstall smoke against the published package.
