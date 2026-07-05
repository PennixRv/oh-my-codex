# oh-my-codex-pennix v0.18.81

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release tightens the visible tmux metric formatting and restores the release workflow pieces that were supposed to ship the native artifacts. OMX now keeps the `Ctx` token pair on compact one-decimal notation while normalizing the rest of the visible metrics to two decimals, the tag workflow once again publishes `native-release-manifest.json` plus the native archives for `omx-api`, `omx-explore-harness`, and `omx-sparkshell`, and the documented `dev` sync step now reflects the real `fast-forward-or-reconcile` branch model instead of assuming every release can end with a pure fast-forward.

## Highlights

- `Cost`, `Total`, `Cache`, and the `Ctx` percentage now render with fixed two-decimal formatting, while the compact `Ctx` token pair remains one-decimal `remaining/effective-window` telemetry such as `222.2k/249.3k`.
- GitHub Releases again attach `native-release-manifest.json` and the native archives produced by the cross-platform cargo-dist matrix before npm publish proceeds.
- Published native archives are now smoke-verified by manifest/checksum/binary-path before the packed-install smoke and npm publication stages run.
- The release workflow contract test is active again, and the release protocol now documents the correct `dev` sync fallback when a simple fast-forward is not available.

## Fixes / compatibility

- The tmux status bar still prefers the same pane-local rollout/session binding and official remaining-context semantics from `0.18.80`; this release only tightens the visible numeric formatting on top of that logic.
- Older rollout records that lack `last_token_usage.total_tokens` still fall back to the last input token count, so historical telemetry continues to render instead of dropping to unknown.
- The `dev` tail step is now explicit about reconciliation merges when branch history has diverged; it no longer implies that a forceful reset or guaranteed fast-forward is acceptable.

## Validation

- `npm run build`
- `node dist/scripts/run-test-files.js dist/tmux-status/__tests__/render.test.js`
- `node dist/scripts/run-test-files.js dist/verification/__tests__/explore-harness-release-workflow.test.js dist/verification/__tests__/release-workflow-release-body.test.js dist/verification/__tests__/native-release-manifest.test.js`
- `npm run test:node`
- `npm run verify:native-agents`
- `npm run verify:plugin-bundle`
- `node dist/scripts/check-version-sync.js --tag v0.18.81`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.80...v0.18.81`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.80...v0.18.81)
