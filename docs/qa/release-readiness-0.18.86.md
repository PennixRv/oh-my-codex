# Release readiness: oh-my-codex 0.18.86

## Range

- Last released tag: `v0.18.85`.
- Candidate release range: `v0.18.85..HEAD`.
- Candidate changes are direct release-line changes on `main`.

## Release scope

- Make Codex's native footer the single model/reasoning display surface through a model-only OMX-managed status-line preset.
- Remove duplicate model and effort segments from the tmux status renderer without removing its operational state fields.
- Move general default model routes and generated native agents to `gpt-5.6-terra`, retaining intentional mini and spark routes.
- Normalize `npm pack --json` output across legacy arrays and npm 12 package-name mappings for real packed-install and package-content validation.
- Preserve user-owned Codex status-line customizations during setup and launch-time config repair.

## PR inventory

- No merged PRs in `v0.18.85..HEAD`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: `0.18.86`.
- Root `Cargo.toml` workspace package version: `0.18.86`.
- Workspace package entries in `Cargo.lock`: `0.18.86`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: `0.18.86`.

## Local validation evidence

- [x] `npm test`
- [x] `npm run lint`
- [x] targeted compiled regression tests for native status-line setup, renderer output, Terra defaults, package contracts, packed-install parsing, and team runtime routing
- [x] `npm pack --dry-run`
- [x] `git diff --check` after final release metadata
- [x] `node dist/scripts/check-version-sync.js --tag v0.18.86`

## CI / publication evidence

- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] published npm version returns `0.18.86`
- [ ] post-publish packed-install smoke passes
- [ ] local complete reinstall and `omx setup --scope user --plugin --force` verification pass

## Known gaps

- Publication remains an external gate until npm credentials are available and the tagged release workflow completes.
- The expected full reinstall is deliberately deferred until the published npm package is available; no local uninstall has been performed during release preparation.

## Current readiness verdict

`0.18.86` is locally ready pending final metadata validation, npm publication, tag-triggered release evidence, and post-publish reinstall verification.
