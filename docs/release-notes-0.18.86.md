# oh-my-codex-pennix v0.18.86

Drafted: 2026-07-14

## Summary

`0.18.86` completes the status-line responsibility split introduced for the Pennix Codex environment:

- Codex's native footer owns model and reasoning display.
- OMX's tmux renderer owns operational information only.
- OMX-managed defaults now use `gpt-5.6-terra` for general frontier and standard roles.
- Packaging validation works with both historical and npm 12 `npm pack --json` output.

## Included changes

### Native footer becomes the model display surface

- The default native status-line preset is now `model`, which writes `tui.status_line = ["model-with-reasoning"]`.
- Setup, config generation, and launch-time repair propagate the resolved model preset instead of restoring the old hidden-footer representation.
- Legacy OMX-managed hidden and focused footer values migrate to the model-only footer. User-owned status-line values remain unchanged.

### Tmux status stays operational and non-duplicative

- The tmux status renderer no longer reads or displays model and reasoning effort.
- It continues to render cost, exact context, totals, cache, conditional team/worker information, session, path, dirty git state, and time.

### General model defaults move to Terra

- `DEFAULT_FRONTIER_MODEL`, default native-agent generation, `omx agents add`, doctor guidance, and team default launch arguments now use `gpt-5.6-terra`.
- Explicit `gpt-5.4-mini` and `gpt-5.3-codex-spark` routes remain intentional specialized lanes.

### Packaging validation is npm 12 compatible

- Packed-install smoke validation normalizes both the legacy array result and npm 12's package-name mapping from `npm pack --json`.
- Package-bin and SparkShell packaging contracts use that shared parser, so validation checks actual package contents on either npm output shape.

## Validation

- `npm test` completed successfully after the compiled test suite, native-agent verification, plugin-bundle verification, and catalog check.
- `npm run lint` completed successfully.
- Focused compiled tests covered native status-line setup, launch repair, tmux rendering, model routing, packaging contracts, packed-install parsing, and team runtime defaults.

## Recommended release message

> `v0.18.86` moves model and reasoning display into Codex's native footer, removes the duplicate tmux segments, makes OMX's general default routes `gpt-5.6-terra`, preserves user status-line customizations, and restores npm 12-compatible packed-release validation.
