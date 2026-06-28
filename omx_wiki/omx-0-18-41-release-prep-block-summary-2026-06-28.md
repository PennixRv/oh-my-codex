---
title: "OMX 0.18.41 release-prep block summary"
tags: ["omx", "release", "version-bump", "tmux", "tests", "release-body"]
created: 2026-06-28T05:00:00.000Z
updated: 2026-06-28T05:00:00.000Z
sources: []
links: []
category: debugging
confidence: medium
schemaVersion: 1
---

# OMX 0.18.41 release-prep block summary

## Scope
This page records the concrete release-prep blockers and the verified fix path for the `0.18.40` -> `0.18.41` publish follow-up.

## Findings

### [Major] The `0.18.40` release workflow failed on the `notify-hook` scrollback regression fixture, not on the hook-review implementation itself
Evidence:
- `npm run build` completed successfully after the shared tmux hook-review fix.
- `node --test dist/hooks/__tests__/notify-hook-team-tmux-guard.test.js` passed.
- `node --test dist/hooks/__tests__/notify-hook-tmux-scrollback.test.js` failed in the release workflow because the fake tmux harness did not implement `capture-pane`.

### [Major] The release candidate was still pinned to `0.18.40` after the failed tag run
Evidence:
- `package.json`, `package-lock.json`, `Cargo.toml`, `Cargo.lock`, and `plugins/oh-my-codex/.codex-plugin/plugin.json` all remained on `0.18.40` until the republish follow-up.
- The publish follow-up was bumped to `0.18.41` and the version sync check passed with `tag=v0.18.41`.

### [Info] The shared hook-review behavior itself was already correct
Evidence:
- The shared send path still dismisses both visible hook-review layers before typing worker text.
- The failure was only in the fixture used to exercise the path during release validation.

## Fix path
- Keep the `0.18.40` hook-review implementation unchanged.
- Repair the tmux regression fixture so it answers `capture-pane`.
- Bump the release to `0.18.41` and use the standard tag-based GitHub release workflow.
- Do not add retry or fallback behavior back into the leader mailbox path.
