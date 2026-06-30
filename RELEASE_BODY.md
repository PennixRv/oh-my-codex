# oh-my-codex-pennix v0.18.54

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release ships a narrow diagnostics-and-provider-alignment fix for the Pennix fork: Spark-lane doctor checks now respect intentional non-default root providers such as `cch`, while setup continues preserving the configured provider on installed native-agent TOMLs.

## Highlights

- `Spark routing` doctor checks now pass when the installed Spark-lane native agent intentionally matches the configured root `model_provider`, instead of warning only because the provider is not `openai`.
- Setup continues preserving the configured root provider on native-agent TOMLs, including the Spark-lane `explore.toml`, so provider-routed installs such as `cch` stay executable after refresh.
- Spark-lane diagnostics now distinguish intentional provider alignment from real provider drift or missing-root-provider ambiguity.
- The Spark routing contract is regression-covered for both intentional non-default root-provider alignment and actual misconfiguration.

## Fixes / compatibility

- `src/cli/doctor.ts` now treats Spark-lane agents as healthy when their `model_provider` matches the configured root provider, even when that provider is a non-default fork environment such as `cch`.
- `src/cli/__tests__/doctor-spark-routing.test.ts` now covers both the intentional root-provider-alignment case and the real non-default-provider warning case when no matching root provider is configured.
- `src/agents/native-config.ts` keeps preserving the configured root provider on generated native-agent TOMLs, including Spark-lane native agents.

## Merged PR inventory

- No merged PRs. `0.18.54` is a direct release-line commit on the Pennix fork.

## Validation

- `npm run build`
- `node dist/scripts/run-test-files.js dist/agents/__tests__/native-config.test.js dist/cli/__tests__/doctor-spark-routing.test.js`
- `node dist/cli/omx.js setup --plugin --force --verbose`
- `node dist/cli/omx.js doctor`
- `node dist/scripts/check-version-sync.js --tag v0.18.54`
- `git diff --check`
- `npm pack --dry-run`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.53...v0.18.54`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.53...v0.18.54)
