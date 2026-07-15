# oh-my-codex-pennix v0.18.87

## Summary

`0.18.87` fixes a false-positive model-context recommendation in `omx doctor`.

## Included Changes

- The `250000 / 200000` values remain OMX's default no-provider setup profile; they are no longer treated as a universal `gpt-5.6-terra` capability limit.
- Doctor now considers the root `model_provider` before applying that generic recommendation.
- Explicit provider routes, including `cch`, retain user-owned settings such as `model_context_window = 275000` and `model_auto_compact_token_limit = 240000` without a warning.
- Default no-provider routes still receive the existing advisory warning when their values exceed OMX's setup profile.

## Validation

- Full `npm test`
- `npm run lint`
- Targeted provider-aware doctor regression test
- Source CLI smoke against the active `cch` configuration

**Full Changelog**: [`v0.18.86...v0.18.87`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.86...v0.18.87)
