# oh-my-codex-pennix v0.18.88

## Summary

`0.18.88` aligns the managed OMX tmux status bar with Codex's intentional two-column outer footer gutter.

## Included Changes

- Visible left-side OMX telemetry now begins after two blank columns.
- Right-side session, path, git, and time data now leaves two blank columns at the outer right edge.
- The gap applies only to nonempty OMX output. Non-OMX panes continue to render no left status content.
- Codex source and the user-owned native footer configuration are unchanged.

## Validation

- Full `npm test`
- `npm run lint`
- Targeted tmux renderer and installer test suites
- `npm pack --dry-run`
- `git diff --check`
- `node dist/scripts/check-version-sync.js --tag v0.18.88`

**Full Changelog**: [`v0.18.87...v0.18.88`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.87...v0.18.88)
