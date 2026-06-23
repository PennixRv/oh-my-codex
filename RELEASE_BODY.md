# oh-my-codex-pennix v0.0.0

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release continues the Pennix fork of OMX with current runtime, workflow, and packaging updates while preserving compatibility-sensitive plugin and setup paths where needed.

## Highlights

- Team runtime startup, lifecycle, and prompt injection are hardened to avoid duplicate startup dispatch and stale-worker confusion.
- Fork-facing user-visible copy is normalized to the Pennix repository and the `oh-my-codex-pennix` npm package across CLI output, setup surfaces, docs, and release flow.
- The GitHub tag release path now generates release notes from this template instead of publishing stale checked-in body text.

## Fixes / compatibility

- Existing legacy OMX-managed config markers, AGENTS contracts, and setup artifacts remain recognized so upgrades can cleanly migrate older installs.
- Compatibility-sensitive plugin identifiers and cache paths such as `plugins/oh-my-codex` and `oh-my-codex-local` remain intact by design.
- Upstream `Yeachan-Heo/oh-my-codex` references remain only where historical provenance or compare links need them.

## Validation

- Local release validation includes build, targeted regression tests for team runtime/prompt injection, fork-facing wording contracts, package/plugin verification, and packed-install smoke checks.
- Tag-triggered GitHub Actions remain the authoritative publish-and-release gate for npm publication and GitHub release creation.

## Contributors

Outdated contributor text.

**Full Changelog**: [`v0.0.0...v0.0.1`](https://github.com/PennixRv/oh-my-codex/compare/v0.0.0...v0.0.1)
