# oh-my-codex-pennix v0.18.81

Drafted: 2026-07-05

Patch release for the Pennix fork tmux-status formatting and release-pipeline recovery line.

## Summary

`0.18.81` tightens the visible status-bar numeric formatting and restores the missing native-asset publication stages in the standard release workflow:

- `Cost`, `Total`, `Cache`, and the `Ctx` percentage now render with fixed two-decimal formatting
- the `Ctx` token pair deliberately stays on compact one-decimal notation such as `222.2k/249.3k`
- the tag-triggered `Release` workflow once again publishes `native-release-manifest.json` and the cross-platform native archives before npm publication proceeds

## Included changes

### Fixed-width metric formatting without regressing `Ctx` token readability

- Visible metric formatting is now consistent across the tmux status bar: dollar amounts, compact totals, and percentages use two decimals.
- The compact `Ctx` token pair keeps one decimal by design so `remaining/effective-window` still fits in the status line cleanly.
- `Ctx` semantics remain the same as `0.18.80`: the metric still uses `last_token_usage.total_tokens`, the fixed `12000` baseline reserve, and live rollout `model_context_window` priority.

### Native release assets are back in the GitHub release workflow

- The tag workflow now rebuilds the cargo-dist native matrix for `omx-api`, `omx-explore-harness`, and `omx-sparkshell`.
- `native-release-manifest.json` is generated from the cargo-dist plan and attached alongside the native archives and checksums.
- Published assets are smoke-verified by manifest, checksum, size, and embedded binary path before the packed-install smoke and npm publish stages run.

### Release-process contract is explicit again

- The native release workflow contract test is active again, so losing the asset publication stages is now a test failure instead of a silent workflow drift.
- `RELEASE_PROTOCOL.md` now states the real post-publish `dev` rule: fast-forward when possible, otherwise land a dedicated `main -> dev` reconciliation merge rather than assuming a guaranteed fast-forward.

## Recommended release message

> `v0.18.81` restores the missing native GitHub release assets, keeps tmux status metrics on fixed two-decimal formatting without changing the compact `Ctx` token pair, and updates the documented `dev` sync rule to the real fast-forward-or-reconcile workflow.
