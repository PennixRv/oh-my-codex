# oh-my-codex-pennix v0.18.84

Drafted: 2026-07-10

Corrective patch release for the Pennix fork after `v0.18.83` failed before npm publication.

## Summary

`0.18.84` keeps the intended user-scope plugin-mode and setup-fidelity payload from the prior release line, then fixes the publish-gate drift that caused `Publish npm Package -> npm run test:node` to fail:

- prompt-guidance fragments and `templates/AGENTS.md` drifted apart
- the scaling contract test still assumed an older role-prompt shape
- the checked-in plugin bundle manifest was left at `0.18.83`

This release is not about a new target matrix or a new setup direction. It is the safe corrective cut that gets the intended payload actually publishable.

## Included changes

### Publish-gate contract alignment

- `docs/prompt-guidance-fragments/core-operating-principles.md` now includes the same-thread-evidence guidance that already existed in `templates/AGENTS.md`.
- `templates/AGENTS.md` and the prompt-guidance fragment source are back in sync, so the prompt-guidance contract test passes again.
- `src/team/__tests__/scaling.test.ts` now validates the current multiline role-prompt layout instead of the older narrower formatting assumption.

### Versioned package metadata is fully synchronized

- Root `package.json`, `package-lock.json`, and workspace `Cargo.toml` are bumped to `0.18.84`.
- Workspace package entries in `Cargo.lock` are updated to `0.18.84`.
- `plugins/oh-my-codex/.codex-plugin/plugin.json` is updated to `0.18.84`, which is required by the plugin bundle SSOT contract.

### Native release scope stays intentionally unchanged

- Native publication remains limited to:
  - `x86_64-unknown-linux-gnu`
  - `x86_64-unknown-linux-musl`
- No macOS, Windows, or ARM targets are reintroduced in this corrective release.

## Why this release exists

- `v0.18.83` already created a GitHub release.
- npm publication still failed, so the registry remained on `0.18.81`.
- Rewriting `v0.18.83` would be the wrong recovery path; the correct fix is a new patch version with the publish-gate regressions removed.

## Recommended release message

> `v0.18.84` is the corrective publish-gate follow-up to `v0.18.83`: it keeps the intended plugin-mode/setup payload, then fixes prompt-guidance drift, scaling-test drift, and stale plugin metadata so the standard release path can complete npm publication.
