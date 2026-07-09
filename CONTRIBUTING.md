# Contributing to oh-my-codex-pennix

Thanks for contributing.

## Development setup

- Node.js >= 20
- npm

```bash
npm install
npm run lint
npm run build
npm test
```

For local CLI testing:

```bash
npm link
omx setup
omx doctor
```

### Team/state coverage gate (issue #454)

CI enforces minimum coverage for critical team orchestration modules:

```bash
npm run coverage:team-critical
```

This command checks coverage for `dist/team/**` and `dist/state/**` and writes reports to `coverage/team/`.

### Release-readiness local verification

When validating team/state changes, run this sequence locally:

```bash
npm run build
node --test dist/team/__tests__/state.test.js dist/hooks/__tests__/notify-hook-cross-worktree-heartbeat.test.js
npm test
```

If you were recently in a team worker session, clear team env vars first so tests do not inherit worker-specific state roots:

```bash
unset OMX_TEAM_WORKER OMX_TEAM_STATE_ROOT OMX_TEAM_LEADER_CWD OMX_TEAM_WORKER_CLI OMX_TEAM_WORKER_CLI_MAP OMX_TEAM_WORKER_LAUNCH_ARGS
```

## Project structure

- `src/` -- TypeScript source (CLI, config, agents, MCP servers, hooks, modes, team, verification)
- `prompts/` -- canonical packaged role prompt markdown files (plugin mode resolves these directly; legacy mode may also copy them into `${CODEX_HOME:-~/.codex}/prompts/`)
- `skills/` -- canonical workflow skill directories with `SKILL.md` (plugin mode discovers packaged skills; legacy mode may also copy them into `${CODEX_HOME:-~/.codex}/skills/`)
- `templates/` -- persistent `AGENTS.md` bootstrap contract template

### Adding a new agent prompt

1. Create `prompts/my-agent.md` with the agent's system prompt
2. Treat that packaged prompt file as canonical. For plugin mode, test it through OMX runtime resolution such as `omx ask --agent-prompt my-agent "..."` or a native agent that composes the role prompt.
3. If you specifically need to test legacy local prompt copies, run `omx setup --force --legacy` and verify `${CODEX_HOME:-~/.codex}/prompts/my-agent.md`.

### Prompt guidance contract

Before changing `AGENTS.md`, `templates/AGENTS.md`, `prompts/*.md`, or the generated `developer_instructions` text in `src/config/generator.ts`, read [`docs/prompt-guidance-contract.md`](./docs/prompt-guidance-contract.md).

That document defines the GPT-5.5 behavior contract contributors should preserve across prompt surfaces and explains how it differs from posture-aware routing metadata.

Also read [`docs/codex-surface-boundaries.md`](./docs/codex-surface-boundaries.md) before moving behavior between `AGENTS.md`, prompts, skills, hooks, and setup-owned bootstrap hints.

### Adding a new skill

1. Create `skills/my-skill/SKILL.md` with the skill workflow
2. Treat that packaged skill directory as canonical. In plugin mode, verify discovery through `/skills`; in legacy mode, use `omx setup --force --legacy` if you need a local compatibility copy under `${CODEX_HOME:-~/.codex}/skills/`.
3. Use `$my-skill` in Codex CLI once discovery is confirmed.


### Document refresh warnings

OMX has an agent-only document-refresh warning MVP for spec-driven changes. It
warns Codex/OMX agents when mapped product or test-contract code changes appear
without a rule-scoped planning-spec or product-doc refresh. This is warning-only:
it does not add a generic CI failure, does not install a pre-commit framework,
and must not hard-block `git commit` for document-refresh reasons.

Current mapped refresh examples:

- Native hook behavior (`src/scripts/codex-native-hook.ts`,
  `src/scripts/codex-native-pre-post.ts`, `src/config/codex-hooks.ts`, and
  related native-hook tests) should refresh `docs/codex-native-hooks.md` or a
  native-hook-scoped planning/spec file.
- Document-refresh enforcer behavior (`src/document-refresh/**`) should refresh
  `docs/codex-native-hooks.md` or a document-refresh-scoped planning/spec file.
- CLI/operator behavior (`src/cli/**`) should refresh `README.md`,
  `docs/getting-started.html`, or a relevant planning/spec file.
- Prompt-guidance behavior (`src/hooks/**` rule-owned guidance surfaces) should
  refresh `docs/prompt-guidance-contract.md` or a relevant planning/spec file.

Commit-path warnings are Bash `git commit` scoped and read only the staged diff.
Because `.omx/` is gitignored, `.omx/plans/**` and `.omx/specs/**` count for
commit-path suppression only when tracked or force-staged and rule-owned.
Final-handoff warnings run only on terminal-looking handoff attempts, read staged
plus unstaged changes, and can count fresh local rule-owned `.omx` planning/spec
files. That mtime-based local freshness is heuristic evidence, not proof of a
semantic refresh.

If no document refresh is needed, include an explicit acknowledgement with a
reason in the commit message or final handoff:

```text
Document-refresh: not-needed | <reason>
```

## Workflow

1. Create a branch from `dev` for normal contributions.
2. Make focused changes.
3. Run lint, build, and tests locally.
4. Open a pull request targeting `dev` using the provided template. Use `main` only for maintainer-directed exceptions.

## Commit style

Use concise, intent-first commit messages. Existing history uses prefixes like:

- `feat:`
- `fix:`
- `docs:`
- `chore:`

Example:

```text
docs: clarify setup steps for Codex CLI users
```

## Pull request checklist

- [ ] Scope is focused and clearly described
- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] `npm run lint` passes
- [ ] Documentation updated when behavior changed
- [ ] No unrelated formatting/refactor churn

## Reporting issues

Use the GitHub issue templates for bug reports and feature requests, including reproduction steps and expected behavior.
