# oh-my-codex-pennix v0.18.30

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release is the publishable follow-up to `0.18.29`: it fixes the remaining startup regression in fresh `git init` repositories and tightens team leader notification transport so visible tmux injection is no longer the default fallback for leader mailbox activity.

## Highlights

- Plain `omx team` no longer forces detached worktree mode in the CLI layer. When no explicit `--worktree` flag is set, runtime decides whether the repo can support the default detached-worktree path.
- Fresh unborn repositories now fall back cleanly to `workspace_mode: single` instead of failing with `fatal: ambiguous argument 'HEAD'` during startup.
- Team leader mailbox activity now stays mailbox-first: fallback watcher nudges no longer recreate visible leader prompts, and leader mailbox dispatch records mailbox transport instead of falling back to a visible tmux injection.
- Normal committed repositories keep the existing default detached-worktree lifecycle, and explicit `--worktree` still behaves as a force-on operator choice.

## Fixes / compatibility

- Existing legacy OMX-managed config markers, AGENTS contracts, and setup artifacts remain recognized so upgrades can cleanly migrate older installs.
- Compatibility-sensitive plugin identifiers and cache paths such as `plugins/oh-my-codex` and `oh-my-codex-local` remain intact by design.
- This patch keeps explicit worktree flags and normal committed-repo team behavior compatible while also reducing visible leader-side tmux injection for mailbox-driven notifications.

## Validation

- Local release validation includes build, lint, CLI/runtime regressions for default worktree resolution, leader mailbox transport regressions, package/plugin verification, and fresh lifecycle smokes in both committed and unborn git repositories.
- Tag-triggered GitHub Actions remain the authoritative publish-and-release gate for npm publication and GitHub release creation.

## Contributors

PennixRv and contributors to the fork/runtime fix stream.

**Full Changelog**: [`v0.18.29...v0.18.30`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.29...v0.18.30)
