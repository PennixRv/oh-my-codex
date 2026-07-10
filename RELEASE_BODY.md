# oh-my-codex-pennix v0.18.85

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This patch corrects the plugin-mode hook semantics that were still inconsistent after `v0.18.84`. The shipped behavior now matches the intended operating contract: OMX plugin mode keeps Codex hook feature flags on the canonical `hooks` path, relies on plugin-cache hook assets for OMX lifecycle registration, does not inject OMX-managed `hooks.json` into the user Codex home, and refreshes OMX-generated `AGENTS.md` defaults cleanly.

## Highlights

- Plugin-mode setup now keeps canonical Codex hook enablement on `hooks = true` or legacy `codex_hooks = true`, instead of reviving `plugin_hooks = true` in user config.
- OMX-managed hook wrappers are removed from `~/.codex/hooks.json` in plugin mode; OMX lifecycle hook registration stays in the plugin cache hook bundle.
- Launch-time repair preserves custom `developer_instructions` and keeps the hidden `status_line = []` contract intact instead of reintroducing visible native footer segments.
- Existing OMX-generated plugin-mode `AGENTS.md` defaults now refresh automatically without treating the file as permanently user-owned stale bootstrap.
- Focused `setup`, `doctor`, `scope`, and config-repair regression coverage now matches the new plugin-cache hook semantics.

## Fixes / compatibility

- This release intentionally does not expand the native publication matrix. Linux `x86_64-unknown-linux-gnu` and `x86_64-unknown-linux-musl` remain the only shipped native targets.
- The change is compatibility-safe for existing plugin installs: plugin marketplace registration and plugin cache delivery remain the install-mode signal, while stale `plugin_hooks` residue is no longer required for healthy operation.
- `omx doctor` wording now reports plugin-cache hook registration explicitly, which aligns diagnostics with the actual runtime shape users see on current Codex builds.

## Validation

- `npm run build`
- `node --test dist/cli/__tests__/setup-install-mode-regression.test.js dist/cli/__tests__/setup-scope.test.js dist/cli/__tests__/doctor-warning-copy.test.js`
- `node --test dist/cli/__tests__/index.test.js dist/config/__tests__/generator-idempotent.test.js dist/config/__tests__/generator-notify.test.js`
- `npm run verify:native-agents`
- `npm run verify:plugin-bundle`
- `npm pack --dry-run`
- `git diff --check`
- `node dist/scripts/check-version-sync.js --tag v0.18.85`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.84...v0.18.85`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.84...v0.18.85)
