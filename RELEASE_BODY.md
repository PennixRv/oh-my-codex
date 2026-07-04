# oh-my-codex-pennix v0.18.79

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release narrows plugin-mode setup guidance to the intended contract: `AGENTS.md` stays the primary persistent orchestration surface, while root `developer_instructions` becomes an optional OMX bootstrap that setup adds or refreshes only when explicitly requested. Existing custom guidance now remains untouched by default, historical managed guidance can still be refreshed on demand, and plugin-mode migration continues to preserve user-owned root settings such as `model_reasoning_effort`.

## Highlights

- Plugin-mode setup now treats root `developer_instructions` as a three-way decision surface: missing, historical OMX-managed bootstrap, or custom user-authored guidance.
- Missing `developer_instructions` is preserved by default in non-interactive setup; the OMX plugin bootstrap is added only when setup is explicitly told to add it.
- Historical OMX-managed guidance is preserved by default and refreshed only when setup is explicitly told to update the bootstrap wording.
- Custom `developer_instructions` is no longer appended with the OMX fragment, so user-owned policy blocks stay exactly as written while `AGENTS.md` remains the durable orchestration contract.

## Fixes / compatibility

- Existing user Codex config remains protected: custom root `developer_instructions` is preserved instead of being auto-extended with OMX bootstrap text.
- Historical managed plugin/bootstrap guidance still has an explicit refresh path, so previously setup-owned wording can be migrated forward without touching unrelated root config.
- Plugin-mode migration still preserves user-owned root `model_reasoning_effort`; the narrowed `developer_instructions` behavior does not reintroduce the earlier root-setting ownership regression.

## Validation

- `npm run build`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/setup-agents-overwrite.test.js`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/setup-install-mode.test.js`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/uninstall.test.js`
- `npm run verify:native-agents`
- `npm run verify:plugin-bundle`
- `node dist/scripts/check-version-sync.js --tag v0.18.79`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.78...v0.18.79`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.78...v0.18.79)
