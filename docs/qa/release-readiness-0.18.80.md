# Release readiness: oh-my-codex 0.18.80

## Range

- Previous published npm version / successful release: `v0.18.79`.
- Candidate tag: `v0.18.80`.
- Release focus: align managed tmux `Ctx` semantics with official Codex remaining-context behavior so the status bar no longer mixes a Pennix-specific `input_tokens / context_window` approximation with official-looking percentages.

## Release scope

`0.18.80` is a bounded tmux-status parity release:

- `Ctx` now uses `last_token_usage.total_tokens` from the active rollout window when present
- remaining context now follows the official fixed-baseline `12000` token reserve formula
- the visible tmux context value now renders official effective-window numerator/denominator plus `%`, matching the new official-style semantic without dropping the token totals
- focused regression coverage now locks both the official token source and the exact `23% left` parity example

## PR inventory

- No merged PRs in `v0.18.79..v0.18.80`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bump to `0.18.80`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: resolve to `0.18.80`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: sync to `0.18.80`.

## Local validation evidence

- [x] `npm run build`
- [x] `node dist/scripts/run-test-files.js dist/tmux-status/__tests__/render.test.js`
- [x] `npm run test:node`
- [x] `npm run verify:native-agents`
- [x] `npm run verify:plugin-bundle`
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.80`
- [x] `npm pack --dry-run`
- [x] `git diff --cached --check`
- [ ] `node dist/scripts/generate-release-body.js --template RELEASE_BODY.md --out /tmp/RELEASE_BODY.v0.18.80.generated.md --current-tag v0.18.80 --previous-tag v0.18.79 --repo PennixRv/oh-my-codex`

## CI / publication evidence

- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.80`
- [ ] clean uninstall / reinstall from npm
- [ ] published-artifact smoke confirms the managed tmux `Ctx` metric now matches official Codex remaining-context semantics

## Known gaps

- The tag-triggered `Release` workflow remains the authoritative npm publication gate.
- `generate-release-body.js` verifies the current tag ref and therefore cannot produce the final compare-aware release body until the local `v0.18.80` tag exists and points at the candidate commit.
- Published-artifact clean reinstall smoke remains deferred until npm publication completes.

## Current readiness verdict

`0.18.80` has passed the local tmux-status parity gates: the official-token-source/effective-window renderer tests pass, the full `npm run test:node` suite passed on the final candidate, version sync and plugin/native verification are green, and the package dry-run succeeded. Remaining blockers are the standard local tag/release-body step, the tag-triggered GitHub workflow, npm publication, and published-artifact smoke.
