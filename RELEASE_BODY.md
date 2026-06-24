# oh-my-codex-pennix v0.18.29

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release is the publishable follow-up to `0.18.28`: it removes the last trivial-task prompt drift found in the real npm-installed lifecycle smoke, so narrow exact-content file tasks complete without unnecessary goal-handoff noise, heavyweight verification loops, or false commit-step confusion after runtime auto-checkpointing.

## Highlights

- Exact-content single-file tasks now keep both startup and follow-up worker inboxes lightweight: no per-worker goal handoff, no fix-loop boilerplate, and only micro-scope verification prompts.
- Worker completion guidance now treats runtime auto-checkpoint/integration truthfully: if the requested result is already preserved in HEAD, a clean detached worktree is not treated as a failed completion path.
- Broad investigation and coordinated tasks keep their stronger delegation and verification contracts; this release tightens only the narrow-task completion path.

## Fixes / compatibility

- Existing legacy OMX-managed config markers, AGENTS contracts, and setup artifacts remain recognized so upgrades can cleanly migrate older installs.
- Compatibility-sensitive plugin identifiers and cache paths such as `plugins/oh-my-codex` and `oh-my-codex-local` remain intact by design.
- Codex prompt-mode workers without a real TTY remain intentionally unsupported; this release focuses on interactive team lifecycle correctness rather than adding a new PTY-backed prompt worker surface.

## Validation

- Local release validation includes build, lint, worker bootstrap/API regression tests, targeted runtime delegation persistence coverage, package/plugin verification, and a fresh real team lifecycle smoke that confirms the narrowed inbox/commit contract on the live path.
- Tag-triggered GitHub Actions remain the authoritative publish-and-release gate for npm publication and GitHub release creation.

## Contributors

PennixRv and contributors to the fork/runtime fix stream.

**Full Changelog**: [`v0.18.28...v0.18.29`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.28...v0.18.29)
