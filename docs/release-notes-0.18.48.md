# oh-my-codex-pennix v0.18.48

`0.18.48` is a narrow native-hook correctness patch for the Pennix fork. It keeps the existing `omx question` launch guard intact while letting help and usage invocations pass through so Codex users can inspect the command without tripping the real launch protection.

## Highlights

- **`omx question` help calls now pass through the native hook** - `--help`, `-h`, and `help` invocations are no longer treated as live question launches in `PreToolUse`.
- **Real question launches remain protected** - plain `omx question` or `node ... omx.js question` commands still require the leader-pane return bridge or the native structured question flow.
- **Regression coverage now locks the help behavior** - the native-hook test suite now asserts that help invocations are not blocked while the existing allow/block bridge cases remain intact.

## Fixes / compatibility

- `src/scripts/codex-native-pre-post.ts` now skips `omx question` enforcement when the command is clearly a help/usage invocation.
- `src/scripts/__tests__/codex-native-hook.test.ts` now covers the help path alongside the existing launch-block and bridge-allow cases.
- This release does not change leader mailbox injection, team orchestration, or `omx question` runtime semantics.

## Merged PR inventory

- No merged PRs. `0.18.48` is a direct release-line commit on the Pennix fork.

## Validation

- `npm run build`
- `node --test dist/scripts/__tests__/codex-native-hook.test.js --test-name-pattern "does not block Bash omx question help invocations|blocks Bash omx question when no leader-pane return hint is preserved|allows Bash omx question when the command preserves the leader-pane return hint|blocks native/App Bash omx question with bridge-specific outside-tmux guidance"`
- `node --test dist/cli/__tests__/question.test.js`
- `npm run smoke:packed-install`
- `git diff --check`
- `npm pack --dry-run`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.47...v0.18.48`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.47...v0.18.48)
