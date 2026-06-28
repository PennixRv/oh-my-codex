# oh-my-codex-pennix v0.18.47

`0.18.47` is a narrow installation/injection contract patch for the Pennix fork. It does not change runtime mailbox or hook orchestration logic; it aligns the installed and injected text surfaces so Codex sessions are told the truth about where bundled OMX workflows, prompts, skills, and native agent roles actually come from in legacy versus plugin setup modes.

## Highlights

- **Persistent AGENTS wording now matches real setup mode behavior** - the default `AGENTS.md` template now explicitly separates legacy setup-owned local surfaces from plugin-delivered bundled workflows.
- **Plugin-mode AGENTS output no longer implies local bundled prompt/skill copies** - plugin-mode installs now say bundled Pennix OMX workflows come from the registered Codex marketplace/plugin while setup still installs native-agent TOMLs for `agent_type` routing.
- **Injected developer instructions match the same contract** - plugin-mode `developer_instructions` now tell sessions not to assume bundled prompt/skill files were copied into local `.codex prompts/skills` directories, while still documenting setup-owned native-agent TOMLs and possible user-installed skill roots.
- **Setup regression coverage now checks the user-visible wording directly** - install-mode and scope tests assert the new legacy/plugin surface-resolution contract.

## Fixes / compatibility

- `templates/AGENTS.md` now exposes a `<surface_resolution>` block that describes legacy versus plugin setup surfaces accurately.
- `src/cli/setup.ts` now rewrites the full surface-resolution block for plugin installs instead of patching one older paragraph shape.
- `src/config/generator.ts` now emits matching plugin-mode `developer_instructions` for both Pennix and legacy-display-name variants.
- `src/cli/__tests__/setup-install-mode.test.ts` and `src/cli/__tests__/setup-scope.test.ts` now enforce the updated contract.
- This release is wording/setup-surface alignment only; it does not change the already-shipped runtime mailbox or native-hook behavior.

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
