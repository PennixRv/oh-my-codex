# oh-my-codex-pennix v0.18.26

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release is the publishable follow-up to the `0.18.25` lifecycle train: it keeps the startup prompt delivery, shared-session resume, and shutdown cleanup/reporting fixes, and repairs the remaining worker prompt-contract drift that still produced bad lifecycle commands or occasional ACK-only stalls in real team runs.

## Highlights

- Worker-facing runtime prompts, inboxes, and skills now provide executable `omx team api ... --input <json> --json` lifecycle commands for claim, completion/failure transition, and release flows.
- Live workers no longer get routed through a redundant `load skill -> ACK -> return to inbox` startup loop after the runtime has already generated authoritative worker instructions.
- Worker continuation guidance is state-first again: after ACKs or mailbox replies, workers are told to continue assigned work or the next feasible task and to wait on state changes instead of terminal nudges.

## Fixes / compatibility

- Existing legacy OMX-managed config markers, AGENTS contracts, and setup artifacts remain recognized so upgrades can cleanly migrate older installs.
- Compatibility-sensitive plugin identifiers and cache paths such as `plugins/oh-my-codex` and `oh-my-codex-local` remain intact by design.
- Codex prompt-mode workers without a real TTY remain intentionally unsupported; this release focuses on interactive team lifecycle correctness rather than adding a new PTY-backed prompt worker surface.

## Validation

- Local release validation includes build, lint, worker bootstrap/API regression tests, package/plugin verification, a full rerun of `dist/team/__tests__/runtime.test.js`, the compiled recent-bug regression suite, and a real OMX team lifecycle smoke on the rebuilt CLI before tag cut.
- Tag-triggered GitHub Actions remain the authoritative publish-and-release gate for npm publication and GitHub release creation.

## Contributors

PennixRv and contributors to the fork/runtime fix stream.

**Full Changelog**: [`v0.18.25...v0.18.26`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.25...v0.18.26)
