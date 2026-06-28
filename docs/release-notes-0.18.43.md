# oh-my-codex-pennix v0.18.43

`0.18.43` is the follow-up release that fixes the release-blocking detached tmux launch regression uncovered while publishing `0.18.42`. It keeps the fork default of HUD disabled, but restores the required detached-session finalize path so explicit tmux launches still attach correctly and HUD-enabled flows continue to work when opted in.

## Highlights

- **Detached tmux launch works again with HUD disabled by default** - the detached launcher no longer skips `attach-session` and other finalize steps just because the fork default disables automatic HUD.
- **HUD-only launch tests are now explicit** - CLI launch regression tests that validate HUD split behavior now opt in with `.omx/hud-config.json` instead of depending on an old default.
- **Release pipeline blocker is removed** - the tag workflow failure on `dist/cli/__tests__/launch-fallback.test.js` is fixed in source and covered by the updated regression suite.

## Fixes / compatibility

- `src/cli/index.ts` now runs detached tmux finalize/attach steps independently of whether a HUD pane was created.
- `src/cli/__tests__/launch-fallback.test.ts` now writes explicit HUD config for scenarios that are specifically verifying HUD-enabled behavior.
- Fork semantics remain unchanged:
  - default HUD state is disabled
  - explicit `"enabled": true` still enables launch/team HUD paths

## Validation

- `npm run build`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/launch-fallback.test.js`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/index.test.js dist/cli/__tests__/launch-fallback.test.js`
- `node dist/scripts/check-version-sync.js --tag v0.18.43`
- `git diff --check`

## Release context

- `v0.18.42` source changes correctly disabled team HUD by default in the fork, but the tag workflow failed before npm publication because `launch-fallback.test.js` still assumed the old auto-HUD default and also exposed a detached attach control-flow bug.
- `0.18.43` supersedes that failed publication attempt and is the release intended for npm install / clean reinstall validation.

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.42...v0.18.43`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.42...v0.18.43)
