# Release readiness: oh-my-codex 0.18.54

## Range

- Previous tag: `v0.18.53`.
- Candidate tag: `v0.18.54`.
- Release focus: align Spark-lane diagnostics with the Pennix fork provider model so intentional root-provider installs such as `cch` do not show false `Spark routing` warnings after setup.

## Release scope

`0.18.54` is a narrow Spark-routing diagnostics release:

- `doctor` no longer treats every non-`openai` Spark-lane provider as broken by default
- Spark-lane native agents remain allowed to inherit the configured root provider from `config.toml`
- `doctor` now passes when the installed Spark-lane agent provider matches the configured root provider
- `doctor` still warns for real drift: missing Spark TOMLs, model drift, provider drift, or non-default providers without matching root-provider intent

## PR inventory

- No merged PRs in `v0.18.53..v0.18.54`.
- Candidate changes are direct release-line commits on `main`.

## Version and lockfile audit

- Root `package.json` and `package-lock.json`: bumped to `0.18.54`.
- Root `Cargo.toml` workspace package version and root `Cargo.lock` workspace packages: bumped to `0.18.54`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json`: synced to `0.18.54`.

## Local validation evidence

- [x] `npm run build`
- [x] `node dist/scripts/run-test-files.js dist/agents/__tests__/native-config.test.js dist/cli/__tests__/doctor-spark-routing.test.js`
- [x] `node dist/cli/omx.js setup --plugin --force --verbose`
- [x] `node dist/cli/omx.js doctor`
- [x] installation-state check: `/home/penn/.codex/agents/explore.toml` preserves `model_provider = "cch"`
- [ ] `node dist/scripts/check-version-sync.js --tag v0.18.54`
- [ ] `git diff --check`
- [ ] `npm pack --dry-run`
- [ ] `node dist/scripts/generate-release-body.js --template RELEASE_BODY.md --out /tmp/RELEASE_BODY.v0.18.54.generated.md --current-tag v0.18.54 --previous-tag v0.18.53 --repo PennixRv/oh-my-codex`

## CI / publication evidence

- [ ] `CI` workflow on `main` for the release candidate commit
- [ ] tag-triggered `Release` workflow
- [ ] GitHub release exists and is non-draft/non-prerelease
- [ ] `npm view oh-my-codex-pennix version` returns `0.18.54`
- [ ] clean uninstall / reinstall from npm
- [ ] post-install smoke confirms `doctor` reports `Spark routing` as healthy under root-provider `cch` and hook health remains clean

## Known gaps

- The authoritative public release gate for npm publication remains the tag-triggered `Release` workflow; local evidence here focuses on the Spark-lane diagnostics and install-state surfaces directly touched by the candidate.
- `generate-release-body.js` verifies the current tag ref and therefore cannot produce the final compare-aware release body until `v0.18.54` exists; the tag-triggered `Release` workflow is the canonical generator for that final output.
- This release intentionally does not change Spark model selection itself, only the installation/diagnostics contract around provider-aligned Spark lanes.

## Current readiness verdict

Local release prep for `0.18.54` is aligned to the intended Spark-routing diagnostics fix. The focused native-config and doctor gates are green, the installed `explore.toml` now remains provider-aligned with `cch`, and the remaining work is the standard version-sync/diff/pack checks, then GitHub CI, tag-triggered release, npm publication, clean reinstall from npm, and final published-artifact smoke.
