# oh-my-codex-pennix v0.18.28

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release is the publishable follow-up to `0.18.26`: it keeps the repaired worker prompt-contract surfaces and further calibrates worker inbox guidance so trivial exact-content file tasks do not drift into unnecessary subagent planning or heavyweight verification before completing.

## Highlights

- Exact-content single-file tasks now synthesize as narrow/no-delegation work, so workers can finish and transition them without optional subagent fanout noise.
- Initial worker inbox verification guidance now scales down for narrow single-task assignments instead of always injecting the standard full-project checklist.
- Broad investigation and coordinated tasks keep their stronger delegation and verification contracts; this release tightens trivial-task behavior without weakening the existing lifecycle guardrails for larger work.

## Fixes / compatibility

- Existing legacy OMX-managed config markers, AGENTS contracts, and setup artifacts remain recognized so upgrades can cleanly migrate older installs.
- Compatibility-sensitive plugin identifiers and cache paths such as `plugins/oh-my-codex` and `oh-my-codex-local` remain intact by design.
- Codex prompt-mode workers without a real TTY remain intentionally unsupported; this release focuses on interactive team lifecycle correctness rather than adding a new PTY-backed prompt worker surface.

## Validation

- Local release validation includes build, lint, worker bootstrap/API regression tests, targeted runtime delegation persistence coverage, package/plugin verification, and an install-path team lifecycle smoke reproduction/fix pass.
- Tag-triggered GitHub Actions remain the authoritative publish-and-release gate for npm publication and GitHub release creation.

## Contributors

PennixRv and contributors to the fork/runtime fix stream.

**Full Changelog**: [`v0.18.26...v0.18.28`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.26...v0.18.28)
