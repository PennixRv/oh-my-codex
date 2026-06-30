# Release readiness: oh-my-codex 0.18.55

## Range

- Previous tag: `v0.18.54`.
- Candidate tag: `v0.18.55`.
- Release focus: restore correct ownership boundaries for root reasoning, stop install-time auto-setup side effects, and fully converge leader mailbox delivery onto durable mailbox-boundary semantics.

## Release scope

`0.18.55` carries four linked Pennix fork fixes:

- root `model_reasoning_effort` is treated as user-owned again across setup, plugin migration, merge, and uninstall
- global npm postinstall no longer auto-runs setup and instead prints an explicit manual setup/update reminder
- `leader-fixed` mailbox sends now resolve to `leader_mailbox_boundary_delivery` across runtime and notify-hook dispatch consumers, with no direct leader-pane injection fallback and no pending/deferred missing-pane branch
- current installed guidance now reflects Codex full-history fork inheritance instead of pretending OMX must always force `agent_type`, `model`, or `reasoning_effort`

## PR inventory

- No merged PRs in `v0.18.54..v0.18.55`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bumped to `0.18.55`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: bumped to `0.18.55`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: synced to `0.18.55`.

## Local validation evidence

- [x] authoritative full suite: `npm run verify:native-agents && npm run verify:plugin-bundle && npm run test:node`
- [x] `npm run build`
- [x] focused regressions were covered in the full suite, including `dist/config/__tests__/generator-root-reasoning-contract.test.js`, `dist/cli/__tests__/setup-agents-overwrite.test.js`, `dist/cli/__tests__/uninstall.test.js`, `dist/scripts/__tests__/postinstall.test.js`, `dist/team/__tests__/mcp-comm.test.js`, `dist/team/__tests__/runtime.test.js`, and `dist/hooks/__tests__/notify-hook-team-dispatch.test.js`
- [x] `npm run verify:native-agents && npm run verify:plugin-bundle`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.55`
- [x] `git diff --check`
- [x] `npm pack --dry-run`
- [ ] `node dist/scripts/generate-release-body.js --template RELEASE_BODY.md --out /tmp/RELEASE_BODY.v0.18.55.generated.md --current-tag v0.18.55 --previous-tag v0.18.54 --repo PennixRv/oh-my-codex`

## CI / publication evidence

- [ ] `CI` workflow on `main` for the release candidate commit
- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.55`
- [ ] clean uninstall / reinstall from npm
- [ ] published-artifact smoke confirms root `model_reasoning_effort` remains user-owned, postinstall only reminds, and hook health stays clean

## Known gaps

- `node dist/scripts/generate-release-body.js --template RELEASE_BODY.md --out /tmp/RELEASE_BODY.v0.18.55.generated.md --current-tag v0.18.55 --previous-tag v0.18.54 --repo PennixRv/oh-my-codex` currently fails with `unable to verify current tag ref for release compare: v0.18.55` until the annotated tag exists locally; this should be rerun after tagging and before/alongside the release workflow.
- Final validation for this line must come from the published npm artifact after a clean uninstall/reinstall, not from a local unpublished install.

## Current readiness verdict

Local release checks are green: the full validation chain passed, version sync matches `v0.18.55`, `git diff --check` is clean, and `npm pack --dry-run` produced the expected `oh-my-codex-pennix-0.18.55.tgz`. Remaining work is to commit the release line, create and push the `v0.18.55` tag, confirm the GitHub Actions release/npm publication, then perform the required clean npm reinstall and published-artifact smoke.
