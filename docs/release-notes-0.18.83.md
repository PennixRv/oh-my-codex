# oh-my-codex-pennix v0.18.83

Drafted: 2026-07-09

Patch release for the Pennix fork publishable follow-up to the failed `0.18.82` candidate.

## Summary

`0.18.83` carries forward the unpublished `0.18.82` user-scope plugin-mode and setup-fidelity fixes, then narrows native publication to the two Linux x86 targets you actually want:

- `x86_64-unknown-linux-gnu`
- `x86_64-unknown-linux-musl`

The point of this release is not new runtime behavior. It is to publish the already-prepared `0.18.82` payload without depending on unnecessary macOS, Windows, or hosted ARM runner capacity.

## Included changes

### The unpublished `0.18.82` payload remains intact

- User-scope plugin mode stays the documented default onboarding path.
- Persistent `AGENTS.md` remains a bootstrap contract instead of a catch-all guidance dump.
- Active role prompts keep resolving from the live Codex/plugin surfaces instead of stale repo-local leftovers.
- Plugin install mode still fails closed when packaged marketplace/plugin metadata is incomplete.
- Setup still preserves trusted installed package roots for tmux-status assets and no longer rewrites existing `hooks = true` configs on Codex builds where `plugin_hooks` is already removed.

### Native release publication is now Linux x86-only

- The tag-triggered `Release` workflow now builds and publishes only:
  - `x86_64-unknown-linux-gnu`
  - `x86_64-unknown-linux-musl`
- macOS, Windows, and ARM targets are removed from this fork's standard release matrix.
- `native-release-manifest.json` still ships, but it now reflects only the two supported Linux x86 native archives.

### The release pipeline is aligned to the reduced target set

- `.github/workflows/release.yml` no longer waits on hosted `ubuntu-24.04-arm`, macOS, or Windows matrix legs.
- `dist-workspace.toml` is trimmed to the same two cargo-dist targets.
- The release-workflow contract test now locks the Linux x86-only matrix so the removed targets do not silently come back later.

## Why this release exists

- The `v0.18.82` tag workflow failed before GitHub release publication and npm publication.
- The blocking point was not package logic; GitHub could not acquire the hosted `ubuntu-24.04-arm` runner for `aarch64-unknown-linux-gnu`.
- Since `v0.18.82` is already a public tag, the safe recovery path is a new patch release instead of rewriting that tag.

## Recommended release message

> `v0.18.83` republishes the unpublished `0.18.82` plugin-mode/setup fixes with a Linux x86-only native release matrix, removing the unnecessary macOS, Windows, and hosted ARM publication targets that blocked the prior tag workflow.
