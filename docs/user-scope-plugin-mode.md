# User-Scope Plugin Mode

This is the recommended Pennix OMX install shape.

Use it when you want OMX available in Codex without using repo-local
`AGENTS.md`, repo-local prompt/skill copies, or project-local `.codex/`
bootstrap surfaces as the default install path.

This mode still uses repo-local `.omx/` runtime state and setup preferences for
the current workspace.

If you need the surface-by-surface ownership and runtime loading map, read
[Codex Surface Boundaries and Runtime Loading](./codex-surface-boundaries.md).

## Recommended install

```bash
codex --version
npm install -g oh-my-codex-pennix
omx setup --scope user --plugin
omx doctor
codex login status
omx exec --skip-git-repo-check -C . "Reply with exactly OMX-EXEC-OK"
```

What this does:

- Registers OMX plugin delivery for bundled skills and plugin-cache hook assets.
- Writes user-scope `~/.codex/AGENTS.md` as the persistent OMX bootstrap contract.
- Refreshes `~/.codex/config.toml`.
- Installs native-agent TOMLs under `~/.codex/agents/` so `agent_type` routing still works.
- Removes stale legacy OMX-managed prompt/skill copies when switching from legacy mode.
- Creates repo-local `.omx/` state, logs, plans, and setup preference files for the current workspace.
- Installs tmux status assets and a managed `~/.tmux.conf` block for the OMX HUD path.

What it does not require:

- repo-local `AGENTS.md`
- project-local `./.codex/prompts/`
- user-local `~/.codex/prompts/`
- project-local `./.codex/skills/`

## Runtime surface ownership

Persistent surfaces:

- `~/.codex/AGENTS.md`: top-level OMX bootstrap contract
- `~/.codex/config.toml`: setup-owned config blocks plus user edits
- `~/.codex/agents/*.toml`: native agent routing metadata
- plugin marketplace/cache entries under `~/.codex/plugins/...`: bundled skills, plugin-cache hook assets, companion metadata

Runtime-composed surfaces:

- `.omx/state/sessions/omx-*/AGENTS.md`: session-scoped `model_instructions_file`
- `.omx/state/session.json`, `.omx/metrics.json`, and `.omx/logs/*`: repo-local runtime/session bookkeeping
- team worker instruction files under `.omx/state/team/...`
- hook-injected routing context at `SessionStart`, `UserPromptSubmit`, and related boundaries

Packaged-but-not-required-as-local-copies:

- `prompts/*.md`: packaged role prompt assets used by OMX runtime and helper commands
- `skills/*/SKILL.md`: packaged workflow surfaces, typically discovered through plugin delivery

## Dynamic loading model

At launch, Codex performs its normal AGENTS discovery first. Per the current
official guide, that means `AGENTS.override.md`, then `AGENTS.md`, then
configured fallback names such as `CLAUDE.md` or `GEMINI.md` in each directory
from the current working directory upward.

OMX then composes a session-scoped instructions file and passes it to Codex as
`model_instructions_file`.

The practical OMX-added chain is:

1. User-owned global Codex discovery under `~/.codex/`, including
   `AGENTS.override.md`, `AGENTS.md`, and configured fallback names when present
2. Any repo-level files Codex would normally discover in the working tree
3. OMX runtime overlay
4. For team workers or `omx ask --agent-prompt`, role prompt assets resolve
   from `${CODEX_HOME}` first and fall back to packaged prompts; repo-local
   `.codex/prompts` only takes precedence when the nearest persisted setup scope
   is `project`

This means plugin mode does not depend on `~/.codex/prompts/` being populated.

## Compatibility paths

Use these only when you intentionally need them:

- `omx setup --scope user --legacy`
  Purpose: keep local prompt/skill copies under `~/.codex/`
- `omx setup --scope project --plugin`
  Purpose: advanced repo-local Codex home isolation
- `omx setup --scope project --legacy`
  Purpose: full project-local legacy install for debugging or compatibility

These are not the default onboarding story.

## Uninstall and rollback

Recommended cleanup:

```bash
omx uninstall --scope user
```

Also remove project runtime state if you want a clean local reset:

```bash
omx uninstall --scope user --purge
```

What uninstall primarily removes in this mode:

- OMX-managed config blocks and hook registrations
- plugin registration/cache entries owned by OMX
- native-agent TOMLs owned by setup
- generated `AGENTS.md` defaults when they are OMX-managed

What may already be absent in this mode:

- local prompt copies under `~/.codex/prompts/`
- local skill copies under `~/.codex/skills/`

Rollback to compatibility mode:

```bash
omx setup --scope user --legacy
```

## Quick checks

- `omx doctor` should pass without requiring `~/.codex/prompts/`.
- `/skills` should show OMX workflow surfaces through plugin discovery.
- `omx ask --agent-prompt executor "..."` should work even when local prompt copies are absent.
- Team workers should still receive role-specific guidance because OMX falls back to packaged prompt assets.
