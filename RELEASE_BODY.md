# oh-my-codex-pennix v0.18.47

> Release notes template for the Pennix fork. The tag workflow regenerates this file into the final GitHub release body.

## Summary

This release ships a narrow installation/injection contract alignment for the Pennix fork: currently installed and injected AGENTS/developer-instruction surfaces now consistently describe where OMX workflows, prompts, skills, and native agent roles actually come from in legacy versus plugin setup modes.

## Highlights

- Installed `AGENTS.md` now tells the truth about setup mode - the persistent template explicitly distinguishes legacy setup-owned local surfaces from plugin-delivered bundled workflows.
- Plugin-mode wording no longer implies bundled prompts/skills were copied into local `.codex` directories - it now says those bundled workflow surfaces come from the registered Codex marketplace/plugin, while setup still installs native-agent TOMLs for `agent_type`.
- Injected `developer_instructions` now match the same contract - plugin-mode sessions are told not to assume bundled prompt/skill files exist locally, while still documenting the active Codex-home native-agent and user-skill surfaces.
- Setup tests were tightened around the real user-visible text - scope/install-mode assertions now cover the new surface-resolution wording directly.

## Fixes / compatibility

- `templates/AGENTS.md` now carries an explicit `<surface_resolution>` block that separates legacy setup behavior from plugin-mode marketplace resolution.
- `src/cli/setup.ts` now rewrites that entire block for plugin installs so persistent AGENTS output matches the real Pennix fork behavior instead of the older local-copy assumption.
- `src/config/generator.ts` now emits plugin-mode `developer_instructions` that match the same setup contract for both Pennix branding and the legacy display-name path.
- This release is wording/setup-surface alignment only; it does not change runtime mailbox, hook, or team orchestration behavior.

## Merged PR inventory

- No merged PRs. `0.18.47` is a direct release-line commit on the Pennix fork.

## Validation

- `npm run build`
- `node --test dist/cli/__tests__/setup-scope.test.js`
- `node dist/scripts/check-version-sync.js --tag v0.18.47`
- `git diff --check`
- `npm pack --dry-run`

## Contributors

Thanks to the contributors who made this release possible.

**Full Changelog**: [`v0.18.46...v0.18.47`](https://github.com/PennixRv/oh-my-codex/compare/v0.18.46...v0.18.47)
