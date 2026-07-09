# Codex Surface Boundaries and Runtime Loading

Status: Pennix OMX maintainer/operator guide for user-scope plugin mode.

This document explains how Pennix OMX maps onto Codex's instruction surfaces
without relying on repo-local setup as the default path.

Use it together with:

- [User-Scope Plugin Mode](./user-scope-plugin-mode.md) for install and uninstall
- [Prompt Guidance Contract](./prompt-guidance-contract.md) for wording rules
- [Unified Guidance Schema](./guidance-schema.md) for AGENTS/worker structure

## Recommended default

The recommended Pennix OMX install shape is:

```bash
npm install -g oh-my-codex-pennix
omx setup --scope user --plugin
omx doctor
```

That default deliberately keeps the persistent surface small:

- `~/.codex/AGENTS.md` is the durable OMX bootstrap contract
- plugin-discovered skills carry reusable workflow playbooks
- packaged role prompts carry role-local behavior
- hooks carry runtime routing and dynamic context
- optional root `developer_instructions` stays a narrow bootstrap hint, not a
  second full orchestration brain

## Surface ownership map

| Surface | Primary job | Installed from | Loaded when | Should stay small? | OMX owner |
| --- | --- | --- | --- | --- | --- |
| `~/.codex/AGENTS.md` | Persistent user-scope bootstrap contract | `omx setup --scope user --plugin` | Session start | Yes | setup-managed defaults or user-authored merged file |
| `./AGENTS.md` | Repo- or subtree-specific rules | user/repo | Session start when present in cwd tree | Yes | repo owner, not user-scope setup by default |
| `skills/*/SKILL.md` | Reusable workflow logic and playbooks | plugin cache or legacy local install | On demand when Codex selects the skill | No, can be detailed | packaged plugin or legacy install |
| `prompts/*.md` | Role-local execution behavior | packaged repo assets, optional local compatibility copies | At setup time when OMX compiles native-agent TOMLs, and at runtime when OMX resolves role prompts for `omx ask --agent-prompt` or team worker composition | Moderate | packaged repo assets |
| plugin cache under `~/.codex/plugins/cache/...` | Distribution unit for skills, hooks, apps, metadata | Codex plugin discovery + `omx setup` cache refresh | At Codex/plugin discovery time | N/A | plugin delivery |
| `hooks.json` / `config.toml` hook entries | Lifecycle automation and dynamic routing | `omx setup` | Hook boundaries such as `SessionStart`, `UserPromptSubmit`, `SubagentStart` | N/A | setup-managed shared ownership |
| root `developer_instructions` | Narrow optional bootstrap hint | user-owned config, not written by default during standard plugin setup | Session start | Yes | optional config hint, user-owned by default |
| `.codex/agents/*.toml` | Native agent routing metadata for `agent_type` | `omx setup` in both plugin and legacy modes | When Codex resolves a native subagent | Yes | setup-managed |
| `.omx/state/sessions/.../AGENTS.md` | Session-scoped composed instructions file | OMX runtime | Passed as `model_instructions_file` at launch | Generated | runtime-owned |
| `.omx/state/team/...` worker instruction files | Team worker runtime protocol and role composition | OMX runtime | Team worker launch only | Generated | runtime-owned |

## What stays in `AGENTS.md`

The persistent root `AGENTS.md` is intentionally bootstrap-sized.

It should carry only the things that must be available before the first tool
call or first repo action:

- autonomy posture and execution bias
- mode selection and delegation rules
- routing boundaries between `explore`, `researcher`, `dependency-expert`,
  `executor`, `debugger`, and other roles
- verification and stop/escalate rules
- runtime marker ownership
- brief statements about which narrower surfaces exist

It should not carry:

- full workflow walkthroughs for every OMX skill
- long role catalogs with detailed tactics
- large blocks of team worker protocol text
- legacy install-path explanations repeated in multiple sections
- a second copy of keyword registries or prompt catalogs

## Where the older AGENTS content moved

When Pennix OMX shrank the top-level `AGENTS.md`, the intent was not to delete
behavior. The detailed parts were moved down to the owning surfaces:

| Older top-level content | New canonical home |
| --- | --- |
| workflow playbooks such as setup / plan / team / QA / cancellation details | `skills/*/SKILL.md` |
| role-specific tactics and output shape details | `prompts/*.md` |
| keyword registry details | `src/hooks/keyword-registry.ts` plus hook-generated routing context |
| prompt wording invariants | `docs/prompt-guidance-contract.md` and its tests |
| AGENTS/worker structure rules | `docs/guidance-schema.md` |
| team worker runtime protocol | `skills/worker/SKILL.md` and `src/team/worker-bootstrap.ts` |
| plugin-mode install/uninstall behavior | `docs/user-scope-plugin-mode.md` and `skills/omx-setup/SKILL.md` |
| setup-owned bootstrap hint wording | `src/config/generator.ts` |

No critical workflow contract is supposed to exist only in the old long-form
`AGENTS.md`. If a rule still matters at runtime, it should live on the owning
surface above.

## Runtime loading chain

Codex does its own native AGENTS discovery first. Per the current official
guide, in each directory it checks `AGENTS.override.md`, then `AGENTS.md`, then
configured fallback names such as `CLAUDE.md` or `GEMINI.md`.

Pennix OMX then layers its own runtime surfaces on top of that native discovery:

1. user-owned global Codex discovery under `~/.codex/`, including
   `AGENTS.override.md`, `AGENTS.md`, and configured fallback names when present
2. any repo-level files Codex would normally discover, including
   `AGENTS.override.md`, `AGENTS.md`, and configured fallbacks in the cwd tree
3. OMX session overlay written under `.omx/state/sessions/.../AGENTS.md`
4. hook-injected routing context at native hook boundaries
5. on-demand `SKILL.md` loading when Codex selects a workflow skill
6. role-prompt resolution when OMX needs a role-local prompt asset

Important consequences:

- plugin mode does not require `~/.codex/prompts/` to be populated
- plugin mode does not require `~/.codex/skills/` copies for bundled OMX skills
- the session-scoped instructions file is a composed runtime artifact, not a new
  long-lived source of truth
- user-scope plugin mode still uses repo-local `.omx/` runtime state and setup
  preferences for the current workspace; it only avoids repo-local `.codex/`
  prompt/skill/bootstrap surfaces as the default install shape
- when the project `AGENTS.md` is OMX-generated bootstrap content, runtime
  composition can strip duplicate managed bootstrap sections and keep only
  user-authored residue plus the overlay

## Role prompt resolution in Pennix OMX

When OMX needs a runtime role prompt, it resolves prompt sources in this order:

1. the nearest persisted project-scope compatibility root
   `./.codex/prompts/<role>.md`, but only when the nearest `.omx/setup-scope.json`
   says `scope=project`, or when `${CODEX_HOME}` itself points there
2. `${CODEX_HOME:-~/.codex}/prompts/<role>.md`
3. packaged `prompts/<role>.md` inside the installed OMX package

That means:

- project-local prompt overrides remain a project-scope compatibility path, not
  the default for user-scope plugin installs
- user-local legacy prompt copies still work as compatibility
- packaged prompts remain the canonical source in plugin mode

Current implementation surfaces:

- `src/team/role-router.ts`
- `src/cli/ask.ts`
- `src/team/runtime.ts`
- `src/team/scaling.ts`

## How hooks fit in

Hooks are the dynamic layer, not the persistent orchestration brain.

Pennix OMX uses hooks for:

- keyword routing and workflow activation hints
- session-start and prompt-submit context shaping
- runtime/team reminders
- continuity and notification behavior

That is the correct place for context that depends on:

- current cwd
- active OMX runtime mode
- current team/session state
- current prompt text

That is not the correct place for:

- a durable coding standard
- long reusable workflow instructions
- role-local execution doctrine

## How `developer_instructions` should be used

Root `developer_instructions` is treated as optional and narrow.

Best practice in Pennix OMX:

- keep it short
- use it only as a bootstrap hint
- do not inject it during standard plugin setup
- preserve user-authored content by default
- do not append a large OMX control payload automatically

Do not use root `developer_instructions` as:

- a replacement for `AGENTS.md`
- a hidden second workflow surface
- a dumping ground for all plugin/skill/prompt semantics

## How native agents fit in

Native agent TOMLs under `.codex/agents/` still matter in plugin mode.

Their job is not to duplicate the full prompt catalog. Their job is to keep
`agent_type` routing available for:

- subagent launches
- role-specific team workers
- commands that need a Codex-recognizable native agent entry

For native subagents, OMX compiles the relevant packaged role prompt content
into `.codex/agents/*.toml` during setup. Runtime role-prompt resolution remains
primarily for `omx ask --agent-prompt` and team-worker composition.

## Anti-patterns Pennix OMX should avoid

These are the patterns this fork should keep avoiding:

- silently overwriting an existing user `~/.codex/AGENTS.md`
- telling plugin-mode users that bundled skills require local
  `~/.codex/skills/*/SKILL.md` copies
- telling plugin-mode users that bundled role prompts require populated local
  `~/.codex/prompts/`
- growing root `developer_instructions` into a second full AGENTS surface
- relying on repo-local setup as the default onboarding path
- relying on `model_instructions_file` as a replacement for Codex built-in
  instructions outside OMX's runtime-composed session file

## Install and uninstall summary

Recommended install:

```bash
omx setup --scope user --plugin
omx doctor
codex login status
omx exec --skip-git-repo-check -C . "Reply with exactly OMX-EXEC-OK"
```

Recommended uninstall:

```bash
omx uninstall --scope user
```

Optional runtime purge:

```bash
omx uninstall --scope user --purge
```

Compatibility rollback:

```bash
omx setup --scope user --legacy
```

For the full operator walkthrough, use
[User-Scope Plugin Mode](./user-scope-plugin-mode.md).
