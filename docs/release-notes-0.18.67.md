# oh-my-codex-pennix v0.18.67

Drafted: 2026-07-02

Patch release for the Pennix fork uninstall-cleanliness follow-up line.

## Summary

`0.18.67` closes the remaining clean-reinstall gap found right after `0.18.66`:

- uninstall was still leaving OMX-managed install-state files behind under `CODEX_HOME/.omx`
- the uninstall summary text implied the cleanup was broader than the implementation really was
- release coverage now locks the narrow cleanup contract so future uninstall changes do not silently reintroduce residue or over-delete user files

## Included changes

### Managed install-state cleanup

- `omx uninstall` now removes managed `install-state.json` and `native-agents.json` from `CODEX_HOME/.omx`.
- If those managed files were the only remaining entries, uninstall now prunes the empty `CODEX_HOME/.omx` directory too.
- The cleanup remains bounded: unrelated files in `CODEX_HOME/.omx` are preserved.

### Summary and regression coverage

- Uninstall summary output now distinguishes managed `CODEX_HOME/.omx` install artifacts from the separate project `.omx/` purge path.
- A new uninstall regression proves that managed install artifacts are removed while unrelated `CODEX_HOME/.omx` files survive.

## Recommended release message

Use language that emphasizes clean teardown without broad deletion:

> `v0.18.67` fixes uninstall residue by removing OMX-managed install-state files from `CODEX_HOME/.omx` while preserving unrelated user files.
