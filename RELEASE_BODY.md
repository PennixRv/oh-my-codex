# oh-my-codex-pennix v0.18.25

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release is the publishable follow-up to the `0.18.24` lifecycle train: it keeps the startup prompt delivery, shared-session resume, and shutdown cleanup/reporting fixes, and adds the CI-discovered shutdown teardown classification correction needed for a clean release gate.

## Highlights

- Interactive Codex team startup keeps a single evidence-gated startup dispatch path instead of mixing a failed startup-direct pre-injection with a second canonical replay.
- Shared-session teams can be resumed from live worker panes even when the saved tmux target is a shared session/window such as `leader:0`.
- Forced shutdown now surfaces real pane teardown failures without misclassifying stale or already-missing pane ids as release-blocking errors.

## Fixes / compatibility

- Existing legacy OMX-managed config markers, AGENTS contracts, and setup artifacts remain recognized so upgrades can cleanly migrate older installs.
- Compatibility-sensitive plugin identifiers and cache paths such as `plugins/oh-my-codex` and `oh-my-codex-local` remain intact by design.
- Codex prompt-mode workers without a real TTY remain intentionally unsupported; this release focuses on interactive team lifecycle correctness rather than adding a new PTY-backed prompt worker surface.

## Validation

- Local release validation includes build, targeted regression tests for startup/resume/shutdown lifecycle behavior, a full rerun of `dist/team/__tests__/runtime.test.js`, package/plugin verification, and packed-install smoke checks.
- Tag-triggered GitHub Actions remain the authoritative publish-and-release gate for npm publication and GitHub release creation.

## Contributors

PennixRv and contributors to the fork/runtime fix stream.

**Full Changelog**: [`v0.18.24...v0.18.25`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.24...v0.18.25)
