# oh-my-codex-pennix v0.18.66

Drafted: 2026-07-02

Patch release for the Pennix fork uninstall-preservation hotfix line.

## Summary

`0.18.66` fixes a real clean-reinstall regression discovered immediately after `0.18.65` shipped:

- plugin-mode uninstall could delete the entire root `developer_instructions` key instead of preserving user-authored text
- the failure was especially easy to trigger when `developer_instructions` used multiline / triple-quoted TOML
- release coverage now locks the exact live shape that failed in the real environment

## Included changes

### Uninstall preservation fix

- `omx uninstall` now parses root `developer_instructions` with the TOML parser instead of a single-line JSON-only matcher.
- The managed top-level cleanup pass now strips only the managed `notify` root key and lets `developer_instructions` be cleaned by the OMX-fragment-aware preservation path.
- User-authored text surrounding the OMX plugin-mode fragment is preserved; only the OMX-managed fragment is removed.

### Regression coverage

- A new uninstall regression covers multiline custom `developer_instructions` that append the current plugin-mode OMX fragment.
- The release gate still includes the `0.18.65` tmux scrollback and shared-session teardown regressions, so this hotfix does not silently regress the prior fix line.

## Recommended release message

Use language that emphasizes safety and data preservation:

> `v0.18.66` fixes plugin-mode uninstall so clean reinstall flows no longer delete user-authored developer instructions.
