# Release readiness: oh-my-codex 0.18.82

## Range

- Previous published npm version / successful release: `v0.18.81`.
- Candidate tag: `v0.18.82`.
- Release focus: user-scope plugin-mode boundary cleanup, live-surface prompt resolution, packaged-plugin validation hardening, and setup idempotence for tmux-status plus Codex hook feature flags.

## Release scope

`0.18.82` is a bounded plugin-mode and setup-correctness release:

- user-scope plugin mode is now the primary documented onboarding path
- persistent `AGENTS.md` is reduced to bootstrap guidance, with narrower surfaces owning their own behavior details
- active role prompts resolve from the live Codex/plugin surfaces instead of stale repo-local prompt copies
- plugin install mode fails closed when packaged marketplace/plugin metadata is incomplete
- setup preserves trusted installed package roots for tmux-status assets and no longer rewrites existing `hooks = true` configs on Codex builds where `plugin_hooks` is already removed

## PR inventory

- No merged PRs in `v0.18.81..v0.18.82`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bump to `0.18.82`.
- Root `Cargo.toml` workspace package version and workspace package entries in `Cargo.lock`: resolve to `0.18.82`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: sync to `0.18.82`.

## Local validation evidence

- [x] `npm run build`
- [x] `node --test dist/config/__tests__/codex-feature-flags.test.js`
- [x] `node --test dist/cli/__tests__/setup-install-mode.test.js`
- [x] `node --test dist/cli/__tests__/tmux-status-lifecycle.test.js`
- [x] `node --test dist/cli/__tests__/uninstall.test.js`
- [ ] `npm run verify:native-agents`
- [ ] `npm run verify:plugin-bundle`
- [ ] `node dist/scripts/generate-catalog-docs.js --check`
- [ ] `npm pack --dry-run`
- [ ] `git diff --check`
- [ ] `node dist/scripts/check-version-sync.js --tag v0.18.82`
- [ ] `node dist/scripts/generate-release-body.js --template RELEASE_BODY.md --out /tmp/RELEASE_BODY.v0.18.82.generated.md --current-tag v0.18.82 --previous-tag v0.18.81 --repo PennixRv/oh-my-codex`

## CI / publication evidence

- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] published npm version returns `0.18.82`
- [ ] post-publish packed-install smoke passes
- [ ] `dev` is synced to released `main` via fast-forward or documented reconciliation merge

## Known gaps

- Final compare-aware release-body generation still depends on the local `v0.18.82` tag existing on the candidate commit.
- npm publication and GitHub release asset proof remain external post-tag gates.

## Current readiness verdict

`0.18.82` is staged as a bounded plugin-mode setup-correctness release. The remaining work is standard release hygiene: version-sync verification, plugin/native-agent verification, packed artifact inspection, tag publication, npm publication, and post-publish branch sync evidence.
