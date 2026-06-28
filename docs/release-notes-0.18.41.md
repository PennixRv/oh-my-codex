# oh-my-codex-pennix v0.18.41

`0.18.41` is the publishable follow-up to the failed `0.18.40` release candidate. It keeps the shared two-stage hook-review send path from that line and repairs the tmux scrollback regression fixture that was blocking the release workflow test run.

## Highlights

- **Shared hook-review send path stays fixed** - the tmux worker send path still dismisses both hook review layers before typing worker text.
- **Release-prep scrollback coverage is now complete** - the fake tmux harness used by the `notify-hook` scrollback regression now implements `capture-pane`, so the release workflow can exercise the send path without a stubbed-command failure.
- **No retry or fallback behavior is reintroduced** - the fork keeps the mailbox-first delivery boundary and does not add synthetic reminders back into the leader mailbox.

## Fixes / compatibility

- Existing tmux, worker, and leader mailbox behavior remains compatible with the fork's current release line.
- The only release-prep-only change in this patch is the regression fixture support that allows the tagged workflow to validate the shared send path cleanly.

## Merged PR inventory

- No merged PRs. This publish follow-up is a direct release-prep commit that repairs the scrollback regression fixture after the failed `v0.18.40` tag workflow.

## Validation

- `npm run build`
- `node --test dist/hooks/__tests__/notify-hook-team-tmux-guard.test.js`
- `node --test dist/hooks/__tests__/notify-hook-tmux-scrollback.test.js`
- `node dist/scripts/check-version-sync.js --tag v0.18.41`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.40...v0.18.41`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.40...v0.18.41)
