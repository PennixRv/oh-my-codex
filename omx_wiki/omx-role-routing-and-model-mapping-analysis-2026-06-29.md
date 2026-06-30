---
title: "OMX Role Routing And Model Mapping Analysis 2026-06-29"
tags: ["roles", "routing", "models", "team", "architecture", "benchmarks", "context", "reasoning"]
created: 2026-06-29T08:54:15.928Z
updated: 2026-06-29T11:54:16.000Z
sources:
  - "https://developers.openai.com/codex/subagents"
  - "https://developers.openai.com/codex/config-reference"
  - "https://developers.openai.com/codex/models"
  - "https://developers.openai.com/api/docs/models/gpt-5.4"
  - "https://developers.openai.com/api/docs/models/gpt-5.4-mini"
  - "https://platform.openai.com/docs/guides/reasoning"
  - "https://platform.openai.com/docs/guides/prompt-caching"
  - "https://platform.openai.com/docs/guides/latency-optimization"
  - "https://platform.openai.com/docs/guides/compaction"
  - "https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/components/model-clients.html"
  - "https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/design-patterns/mixture-of-agents.html"
  - "https://docs.crewai.com/en/concepts/agents"
  - "https://docs.crewai.com/en/learn/llm-selection-guide"
  - "https://docs.langchain.com/oss/python/langgraph/workflows-agents"
  - "https://aclanthology.org/2024.tacl-1.9/"
  - "https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/"
links: []
category: architecture
confidence: medium
schemaVersion: 1
---

# OMX Role Routing And Model Mapping Analysis 2026-06-29

## Scope
This page captures the current OMX role-routing and model-mapping architecture, the gap between runtime reality and operator expectations, and a recommended GPT-only mapping strategy under the constraints discussed on 2026-06-29.

Constraints for the recommendation below:
- GPT-series only
- do not use `gpt-5.5`
- do not rely on GPT ultra-long-context defaults as the normal lane

## Findings First
1. OMX currently does **not** have a single authoritative per-role model configuration file.
2. The current effective control plane is split across built-in source definitions, Codex root config, optional `.omx-config.json`, generated native agent TOMLs, and Team runtime launch resolution.
3. Team `worker` is a runtime coordination surface, not the same thing as a normal business-role agent.
4. `omx team` supports two distinct routing modes:
   - explicit `N:agent-type` pinning, where every task keeps the requested role
   - implicit decomposition, where subtasks are heuristically routed to roles like `explore`, `researcher`, `debugger`, `designer`, `writer`, `dependency-expert`, `quality-reviewer`, or `test-engineer`
5. There is a real install/runtime inconsistency today: `quality-reviewer` is still used by Team routing, but current setup intentionally preserves it only as a prompt asset, not as an installed native agent TOML.
6. On this machine right now, `~/.codex/.omx-config.json` is absent, so even the optional OMX JSON routing layer is not currently acting as a practical operator SSOT.
7. Current OMX can already express per-role `model` and per-role `model_reasoning_effort`, but does **not** have a first-class supported per-role context-window control plane.
8. Benchmark-backed model selection should optimize for stable role execution, not raw “largest context” marketing claims: long context remains useful, but indiscriminately stretching context can reduce retrieval reliability and increase latency/cost.
9. The prior draft under-specified two important dimensions:
   - official GPT-5.4 family model pages now publish concrete maximum context windows
   - official reasoning docs explicitly include `xhigh`, and `xhigh` is relevant to Pennix because the main/leader agent is intentionally biased toward deeper reasoning
10. Pennix operator preference for context is now explicit:
   - keep the main/leader lane capability-first, but do not let raw history grow without bounds
   - prefer a practical ceiling around the `gpt-5.4` long-context pricing breakpoint (`272K`) rather than drifting into ultra-long defaults
   - use compaction earlier than the ceiling so the session stays stable, readable, and cost-predictable
   - if fine-grained context controls are added later, they should be named policies first, not raw integers as the first UX surface
11. Pennix has now explicitly decided to keep context out of the near-term role map:
   - the active mapping target is only `role -> model` and `role -> reasoning effort`
   - shared context budgets belong outside the role map, at the global or model-family layer
   - per-role `contextPolicy` is no longer the recommended implementation target for this round

## Current OMX Architecture

### 1. Business roles vs worker runtime role
The `worker` skill is a Team runtime protocol document. It governs ACK, mailbox, inbox, claim-safe task lifecycle, and shutdown behavior. It is not the same as a normal task-specialist role such as `architect`, `debugger`, or `writer`.

Evidence:
- `plugins/oh-my-codex/skills/worker/SKILL.md`
- `src/team/worker-bootstrap.ts:70-130`

Implication:
- When discussing role-to-model mapping, `worker` should not be treated as a normal business role in the same table as `architect` or `test-engineer`.
- The actual business role for a Team worker is injected as `workerRole` plus role prompt content into the generated worker runtime instructions.

### 2. How `omx team` decides roles
User-facing CLI help already exposes the explicit pinning surface:
- `omx team [N:agent-type] "<task description>"`

Evidence:
- `src/cli/team.ts:281-299`

Parsing behavior:
- `parseTeamArgs()` defaults to `workerCount=3`, `agentType='executor'`
- `3:executor` or `2:architect` sets `explicitAgentType=true`

Evidence:
- `src/cli/team.ts:885-908`

Execution-plan behavior:
- if `explicitAgentType=true`, every task keeps that explicit role
- otherwise Team decomposes the task and routes each subtask via `routeTaskToRole()`

Evidence:
- `src/cli/team.ts:1003-1004`
- `src/cli/team.ts:1073-1128`
- `src/team/role-router.ts:187-240`

Important detail:
- implicit `executor` is special-cased into `team-executor` as the fallback implementation lane when the user did **not** explicitly pin the role

Evidence:
- `src/cli/team.ts:1027-1029`

### 3. Where role metadata lives today
The built-in role registry is `AGENT_DEFINITIONS`.
Each role currently carries:
- `reasoningEffort`
- optional `exactModel`
- `posture`
- `modelClass`
- `routingRole`
- `tools`
- `category`

Evidence:
- `src/agents/definitions.ts:7-27`
- `src/agents/definitions.ts:52-220`

This means the source tree already has a partial role contract, but it is **not** yet a full operator-editable per-role model map.

### 4. How Team worker models are actually resolved
Team worker launch model resolution is layered.

First layer: explicit/inherited launch args
- `OMX_TEAM_WORKER_LAUNCH_ARGS` or inherited leader args can carry `--model ...` and `-c model_reasoning_effort="..."`
- those win over fallback role-class defaults

Evidence:
- `src/team/model-contract.ts:92-206`

Second layer: role-default resolution
- `resolveAgentDefaultModel()` maps role to model by `modelClass`
- `fast` -> low-complexity/spark default
- `frontier` -> main/frontier default
- `standard` -> standard default
- `executor` is special-cased to the main/frontier default

Evidence:
- `src/team/model-contract.ts:217-237`

Third layer: reasoning resolution
- `resolveAgentReasoningEffort()` first checks `.omx-config.json` `agentReasoning`, then falls back to built-in `AGENT_DEFINITIONS`

Evidence:
- `src/team/model-contract.ts:208-215`

### 5. How native agent TOMLs are resolved
Setup-generated native agent TOMLs do not merely mirror Team runtime.
They are generated through `src/agents/native-config.ts` and resolve models via:
- exact model pin if present
- frontier lane for frontier-class roles
- standard lane for standard roles
- spark lane for fast roles
- `executor` is again special-cased

Evidence:
- `src/agents/native-config.ts:174-195`

Important nuance:
- frontier native-agent generation reads Codex root `config.toml` model before falling back to OMX frontier defaults
- therefore `config.toml` can still dominate even if OMX docs make `.omx-config.json` look central

Evidence:
- `src/agents/native-config.ts:155-172`
- `src/config/models.ts:248-255`

### 6. Current configuration sources
The current effective sources are:
- built-in role metadata: `src/agents/definitions.ts`
- optional OMX JSON config: `${CODEX_HOME}/.omx-config.json`
- Codex root config: `${CODEX_HOME}/config.toml`
- generated native agent TOMLs: `${CODEX_HOME}/agents/*.toml`
- Team runtime launch args and inheritance logic

Evidence:
- `src/config/models.ts:58-67`
- `src/config/models.ts:154-177`
- `src/config/models.ts:248-255`
- `src/agents/native-config.ts:174-195`
- `src/team/model-contract.ts:193-237`

### 7. Is there one unique config file today?
No.

Precise answer:
- practical runtime default on this machine is mostly controlled by `~/.codex/config.toml` because `~/.codex/.omx-config.json` does not exist
- source-level role defaults live in `AGENT_DEFINITIONS`
- generated native agent TOMLs materialize a snapshot of those decisions for native Codex subagents
- Team runtime still resolves worker models through its own launch/model-contract logic

So the answer is:
- there is **not** a unique single file today
- `.omx-config.json` is the closest operator-facing candidate, but it currently lacks a true per-role model map
- `AGENT_DEFINITIONS` is the closest code SSOT for role classes and reasoning defaults, but it is not the whole runtime control plane

## Known Inconsistency
`quality-reviewer` is still reachable from Team heuristic routing for general review work, but setup intentionally does not install `quality-reviewer.toml` as a native agent.

Evidence for routing:
- `src/team/role-router.ts:89-90`
- `src/team/role-router.ts:1110-1115` via `buildTeamExecutionPlan()` caller path

Evidence for non-installation:
- `src/cli/__tests__/setup-prompts-overwrite.test.ts:36-47`
- `src/cli/__tests__/setup-prompts-overwrite.test.ts:71-80`

Interpretation:
- this is survivable for Team, because Team workers use runtime prompt injection and do not require a native TOML per routed role
- but it is still a conceptual mismatch for operators who expect “routable role” and “installed native role” to line up 1:1

## Live GPT Models Available From Current `cch` Upstream
Verified on 2026-06-29 by querying the configured `cch` provider `/v1/models` endpoint using the current Codex auth token.

GPT-family models returned:
- `gpt-5.2`
- `gpt-5.2-2025-12-11`
- `gpt-5.2-chat-latest`
- `gpt-5.2-pro`
- `gpt-5.2-pro-2025-12-11`
- `gpt-5.3-codex`
- `gpt-5.3-codex-spark`
- `gpt-5.4`
- `gpt-5.4-2026-03-05`
- `gpt-5.4-mini`
- `gpt-5.4-nano`
- `gpt-5.5`

User constraint reminder:
- do not use `gpt-5.5`
- do not use GPT ultra-long-context as the normal lane

## Benchmark And Reliability Research

### 1. Official OpenAI model positioning for Codex
OpenAI’s current Codex model guide describes:
- `gpt-5.4` as the flagship frontier model for professional work with strong coding, reasoning, tool use, and agentic workflow capability
- `gpt-5.4-mini` as a fast, efficient mini model for responsive coding tasks and subagents

Evidence:
- `https://developers.openai.com/codex/models`

Interpretation:
- OpenAI’s own product positioning already aligns with a two-lane coding strategy:
  - strong frontier lane for high-stakes execution/judgment
  - faster subagent lane for lighter coding and decomposition work
- This supports role-aware tiering rather than uniform model assignment.

### 2. Official reasoning-effort guidance
OpenAI’s reasoning guide states:
- start with `gpt-5.5` for most reasoning workloads, `gpt-5.5-pro` when highest intelligence is worth extra latency, `gpt-5.4` for lower cost, and `gpt-5.4-mini` for lower cost and latency
- `reasoning.effort` guides how much the model thinks when performing a task
- supported effort values are model-dependent and can include `none`, `minimal`, `low`, `medium`, `high`, and `xhigh`
- `high` is recommended for hard reasoning, complex debugging, deep planning, and high-value tasks where quality matters more than latency
- `xhigh` is for deep research, asynchronous workflows, and agentic tasks with very long rollouts, and OpenAI explicitly says to use it only when evals show a clear benefit worth the extra latency/cost
- current official model pages show both `gpt-5.4` and `gpt-5.4-mini` support `xhigh`

Evidence:
- `https://platform.openai.com/docs/guides/reasoning`
- `https://developers.openai.com/api/docs/models/gpt-5.4`
- `https://developers.openai.com/api/docs/models/gpt-5.4-mini`

Interpretation:
- “model size” and “thinking depth” are separate control knobs and should not be collapsed into one decision
- for OMX role mapping, the correct question is not just “which model for this role?” but “which model plus which effort level for this role?”
- the omission of `xhigh` from the prior mapping draft was incomplete; Pennix should treat `xhigh` as a real tier for leader/orchestrator and selected audit/synthesis roles

### 3. Long-context reliability limits
The `Lost in the Middle` paper shows that long-context models do not robustly use all tokens equally. Performance is often strongest when relevant information is near the beginning or end, and degrades when the model must retrieve key information from the middle of long contexts.

Evidence:
- `https://aclanthology.org/2024.tacl-1.9/`

Interpretation:
- large context windows are not a free reliability upgrade
- roles that must make precise judgments from sprawling context should prefer:
  - curated/reduced context
  - retrieval and summarization
  - checkpointing and compaction
  over “just increase the context window”

### 4. Official GPT-5.4 family context-window facts
OpenAI’s current model pages publish concrete maximum windows for the two main candidate models discussed here:
- `gpt-5.4` -> `1,050,000` max context window, `128,000` max output tokens
- `gpt-5.4-mini` -> `400,000` max context window, `128,000` max output tokens

OpenAI also notes a practical pricing breakpoint for the `1.05M`-window family:
- for `gpt-5.4`, prompts above `272K` input tokens trigger a higher full-session price multiplier

Evidence:
- `https://developers.openai.com/api/docs/models/gpt-5.4`
- `https://developers.openai.com/api/docs/models/gpt-5.4-mini`

Interpretation:
- there **is** now an official answer for model maximum context size
- but a model maximum is not the same thing as the recommended operating window for reliable agent work
- for Pennix, these official maxima should be treated as hard ceilings, while the actual default operating target should stay much lower unless the task genuinely cannot be compacted or decomposed

### 4. Long-task agent reliability limits
METR’s long-task analysis reports:
- task length at 50% reliability has been improving rapidly, with roughly a 7-month doubling time
- current frontier agents are near-certain on tasks taking expert humans under a few minutes, but success falls sharply on much longer tasks
- the report explicitly frames this in terms of substantive software tasks and multi-step work

Evidence:
- `https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/`

Interpretation:
- robust role mapping must acknowledge that reliability decays with task horizon
- therefore OMX should not rely on a single agent carrying huge ambiguous work in one pass
- decomposition, compaction, verification, and narrower task envelopes remain structurally important even with stronger models

### 5. Prompt caching and context-shape guidance
OpenAI’s prompt-caching guide states:
- cache hits require exact prefix matches
- static content such as instructions and examples should be placed at the beginning of the prompt
- variable content should be placed at the end
- prompt caching significantly decreases latency and reduces cost on cache hits

Evidence:
- `https://platform.openai.com/docs/guides/prompt-caching`

Interpretation:
- OMX role prompts and stable developer instructions should stay structurally stable
- role-specific context should be separated from volatile task payload where possible
- this is another argument against stuffing huge ad-hoc role state into every request

### 6. Compaction and context-management guidance
OpenAI’s compaction guide states:
- compaction is for reducing context size while preserving state needed for subsequent turns
- compaction helps balance quality, cost, and latency as conversations grow

Evidence:
- `https://platform.openai.com/docs/guides/compaction`

Interpretation:
- long-running role sessions should be designed around explicit preserved state, not raw history retention
- this supports OMX’s direction toward mailbox, task files, wiki, checkpoints, and other durable state surfaces

### 7. Latency optimization guidance
OpenAI’s latency guide states:
- smaller models usually run faster and cheaper and can outperform larger models when used correctly
- generating fewer tokens is often the biggest latency lever
- reducing input tokens helps less than reducing output tokens, but still matters operationally

Evidence:
- `https://platform.openai.com/docs/guides/latency-optimization`

Interpretation:
- latency guidance is a secondary optimization surface, not the primary objective for this fork
- performance-first mapping should only downgrade a role when the role is clearly bounded and benchmark/routing evidence says the cheaper lane is still reliably strong enough

## What OMX Can Actually Configure Today

### 1. Per-role model: yes
Current native agent TOMLs already encode per-role `model` values.
On this machine today, for example:
- `architect.toml` -> `gpt-5.4-mini`
- `planner.toml` -> `gpt-5.4-mini`
- `researcher.toml` -> `gpt-5.4-mini`
- `explore.toml` -> `gpt-5.3-codex-spark`
- `executor.toml` -> `gpt-5.4`
- `code-reviewer.toml` -> `gpt-5.4`

Evidence:
- current installed `~/.codex/agents/*.toml`
- generation path: `src/agents/native-config.ts:297-352`

### 2. Per-role reasoning depth: yes
Current native agent TOMLs already encode per-role `model_reasoning_effort`, and Team runtime can also inject role-default or `agentReasoning`-override effort values.

Evidence:
- `src/agents/native-config.ts:312-352`
- `src/team/model-contract.ts:208-215`
- `docs/reference/omx-config-schema-routing.md`

Interpretation:
- OMX already has a credible per-role thinking-depth mechanism
- this is a real supported surface, not just an idea

### 3. Per-role context window: not as a supported OMX surface
Codex native agent TOML format can carry model-level settings in principle, and official Codex config supports agent `config_file` layering. However, OMX currently does not expose a supported per-role context-window map through `.omx-config.json` or Team runtime model resolution.

Evidence:
- OpenAI Codex config reference: `agents.<name>.config_file`
- `src/agents/native-config.ts:297-352` only writes `model`, `model_provider`, `model_reasoning_effort`, and `developer_instructions`
- Pennix fork setup explicitly does not seed `model_context_window` or `model_auto_compact_token_limit`: `src/config/generator.ts:668-669`

Interpretation:
- today’s OMX can reliably standardize:
  - role -> model
  - role -> reasoning effort
- and this now matches the Pennix near-term design target
- shared context budgets should stay outside the role map, at the global or model-family layer
- if OMX later surfaces context controls, they should not start as a per-role contract by default

### 4. Practical current status on this machine
The currently installed role configs already align partially with the recommended mapping:
- `explore` is on `gpt-5.3-codex-spark` with `low`
- `planner`, `architect`, `researcher` are on `gpt-5.4-mini` with `high`
- execution/review-heavy roles are largely on `gpt-5.4`

This is directionally good, but still lacks:
- operator-visible per-role SSOT
- an OMX-owned shared context policy surface if Pennix later wants the `272K` operating budget enforced by OMX rather than local Codex root config
- an explicit benchmark-backed explanation of why each lane exists

## External Best-Practice Research

### OpenAI Codex official direction
Codex official docs explicitly support custom agents as standalone TOML files under `~/.codex/agents/` or `.codex/agents/`, and state that each custom agent can carry its own model configuration and instructions.

Evidence:
- OpenAI Codex subagents docs: `https://developers.openai.com/codex/subagents`
- OpenAI Codex config reference: `https://developers.openai.com/codex/config-reference`

Relevant takeaways:
- per-agent configuration is a first-class concept
- global subagent controls such as thread/depth remain under `[agents]`
- the official pattern is not “one global role-to-model blob only”; it is “global orchestration knobs + per-agent config layers”

### AutoGen official direction
AutoGen’s official docs center the model on the agent/component boundary through `model_client`, and its Mixture-of-Agents pattern distinguishes orchestrator and worker agents explicitly.

Evidence:
- `https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/components/model-clients.html`
- `https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/design-patterns/mixture-of-agents.html`

Relevant takeaways:
- per-agent model binding is normal
- orchestrator and worker roles are intentionally different concerns
- layered worker/orchestrator structures are a standard design pattern, not an OMX-specific invention

### CrewAI official direction
CrewAI official docs expose `llm` on each agent and separately discuss a strategic multi-model approach. Their guidance explicitly recommends using different models for different agent roles rather than forcing a single model across all agents.

Evidence:
- `https://docs.crewai.com/en/concepts/agents`
- `https://docs.crewai.com/en/learn/llm-selection-guide`

Relevant takeaways:
- planning agents benefit from reasoning-oriented models
- content agents benefit from stronger writing/creative models
- routine processing agents should use efficient models
- the best-practice pattern is role-aware tiering, not one-model uniformity

### LangGraph / LangChain official direction
LangGraph docs frame agent systems as workflows of separate LLM calls/nodes. The examples initialize LLMs at node/workflow boundaries, which naturally supports different models for different steps.

Evidence:
- `https://docs.langchain.com/oss/python/langgraph/workflows-agents`

Relevant takeaways:
- the mainstream OSS pattern is not necessarily “per role file”, but it is consistently “per node / per subagent / per stage model selection”
- a small number of capability tiers plus selective explicit overrides is usually simpler than a sprawling bespoke map for every label

## Best-Practice Conclusion
The strongest cross-framework pattern is:
1. keep a small number of stable capability tiers
2. let roles map onto those tiers by default
3. allow explicit per-role overrides only where quality/cost asymmetry justifies them
4. keep orchestrator roles and worker roles separate in both prompt design and model policy
5. avoid letting runtime transport/protocol roles like `worker` leak into the business-role model map
6. keep context budgeting mostly global or model-family scoped unless a measured exception proves role-specific control is actually needed

So the recommended OMX end-state is **not** “hundreds of bespoke role rules”.
The recommended end-state is:
- a small tier model contract
- a single OMX-owned per-role override map layered on top
- both native agent generation and Team runtime consuming the same map

Additional benchmark-backed conclusion:
- long context should be treated as a scarce reliability budget, not as the primary way to make roles stronger
- stronger role performance usually comes from the combination of:
  - the right model lane
  - the right reasoning depth
  - the right task horizon
  - retrieval/compaction/checkpoint discipline
  rather than from maximizing context alone

Fork policy conclusion for Pennix:
- optimize for capability and reliability first
- do **not** default to cheaper models merely because they are available
- only assign a lower-cost lane when the role is clearly low-risk, narrow in scope, and the available evidence suggests no material loss in role competence

## Recommended GPT-Only Mapping For OMX
Under the current constraints, and with a capability-first priority, the cleanest mapping is:

### Pennix leader / main-agent baseline
- `leader` or main orchestrating agent -> `gpt-5.4`, `xhigh`

Why:
- the user’s stated Pennix preference is that the main agent is already `xhigh` by default
- this now aligns with official reasoning guidance: `xhigh` is explicitly appropriate for asynchronous workflows, deep research, and long-rollout agentic work
- leader/orchestrator work is exactly where longer-horizon planning, cross-worker synthesis, deferred judgment, and failure recovery pressure accumulate
- this does **not** imply that all workers should also default to `xhigh`

### Default strong lane
- `executor` -> `gpt-5.4`, medium reasoning
- `team-executor` -> `gpt-5.4`, medium reasoning
- `planner` -> `gpt-5.4`, `high` by default, `xhigh` when operating as a long-horizon planner
- `architect` -> `gpt-5.4`, `high` by default, `xhigh` for major design synthesis
- `researcher` -> `gpt-5.4`, `high` by default, `xhigh` for deep asynchronous research passes
- `analyst` -> `gpt-5.4`, high reasoning
- `writer` -> `gpt-5.4`, high reasoning
- `debugger` -> `gpt-5.4`, high reasoning
- `code-reviewer` -> `gpt-5.4`, `high` by default, `xhigh` for adversarial/security-critical review
- `critic` -> `gpt-5.4`, `high` by default, `xhigh` for deep challenge/synthesis passes
- `dependency-expert` -> `gpt-5.4`, high reasoning
- `test-engineer` -> `gpt-5.4`, medium or high reasoning
- `designer` -> `gpt-5.4`, medium reasoning
- `verifier` -> `gpt-5.4`, `high` by default, `xhigh` for final high-stakes verification
- `git-master` -> `gpt-5.4`, high reasoning
- `scholastic` -> `gpt-5.4`, `high` by default, `xhigh` for difficult literature/evidence synthesis
- `vision` -> `gpt-5.4`, medium reasoning

Why:
- these roles either make important decisions or carry material execution risk
- `gpt-5.4` is the strongest permitted default under the stated ban on `gpt-5.5`
- performance-first policy says these roles should start on the stronger lane unless there is a concrete reason to demote them
- debugging, review, research, and verification all benefit from stronger synthesis and better hidden-assumption handling
- `xhigh` should participate selectively, not universally:
  - yes for leader/orchestrator by default
  - yes for selected deep-planning, deep-research, code-review, critique, and final-verification moments
  - no as a blanket worker default, because OpenAI explicitly cautions that `xhigh` should be justified by eval-visible gains
- context is intentionally omitted from this role table:
  - all `gpt-5.4` roles are assumed to share the same Pennix operating budget outside the role map
  - context is therefore no longer a dimension that must be decided per role in this round

### Explicit exception lane: clearly bounded subagent roles only
- `explore` -> `gpt-5.3-codex-spark`, low reasoning
- `style-reviewer` -> `gpt-5.3-codex-spark`, low reasoning

Why:
- these are unusually narrow and low-risk roles
- their job is fast search, triage, or style-level checking rather than deep judgment
- benchmark and long-context evidence suggest these roles benefit more from narrow curated context than from a stronger but slower model
- this is the main exception class where a cheaper/faster model is justified by role shape, not by cost pressure

### Optional mini lane: only if validated in practice
- `planner` -> `gpt-5.4-mini`, high reasoning
- `architect` -> `gpt-5.4-mini`, high reasoning
- `researcher` -> `gpt-5.4-mini`, high reasoning
- `analyst` -> `gpt-5.4-mini`, high reasoning
- `writer` -> `gpt-5.4-mini`, high reasoning

Status:
- this is a secondary optimization candidate, not the preferred default for Pennix

Why:
- OpenAI positions `gpt-5.4-mini` as strong for responsive subagents
- some planning/research roles may retain enough quality on the mini lane
- even though `gpt-5.4-mini` also supports `xhigh`, that should not be the Pennix default because the mini lane exists only as an optional optimization candidate
- under a capability-first policy, these roles should remain on `gpt-5.4` by default until repeated real-task validation shows no meaningful drop in quality

### Shared context budget outside the role map
Pennix has now explicitly decided not to encode context as a per-role mapping dimension in this round.
So this section records the shared operating policy instead of a role-class matrix.

Official model maxima:
- `gpt-5.4` -> `1,050,000`
- `gpt-5.4-mini` -> `400,000`

Pennix active operating decision:
- do not add `role -> context` mapping to OMX’s near-term operator SSOT
- treat `272K` as the practical upper cap for routine `gpt-5.4` work
- compact earlier than that cap so sessions stay stable, readable, and cost-predictable
- treat beyond-`272K` as exceptional-only rather than a normal strength lane
- keep this budget shared across `gpt-5.4` roles instead of reintroducing per-role context classes

Why:
- they are **not** claimed by OpenAI as universal recommendations
- they are Pennix operating-policy inferences derived from:
  - official hard ceilings
  - OpenAI compaction guidance
  - prompt-caching guidance about stable prefixes and volatile tails
  - long-context reliability research
  - the explicit user preference to avoid “ultra-long context as the default lane”
  - the explicit Pennix preference to treat `272K` as a practical cap for normal `gpt-5.4` use, with compaction before that point

Future-only extension:
- if OMX later exposes context controls, the first supported surface should be shared global or model-family policy
- per-role `contextPolicy` is no longer the recommended next step
- raw arbitrary per-role context integers remain the least desirable UX

### Reasoning-depth recommendation by role
- `low`
  - `explore`, `style-reviewer`
- `medium`
  - `executor`, `team-executor`, `designer`, `test-engineer`, `vision`
- `high`
  - `planner`, `architect`, `researcher`, `analyst`, `writer`, `debugger`, `code-reviewer`, `critic`, `dependency-expert`, `verifier`, `scholastic`, `git-master`
- `xhigh`
  - main `leader` / orchestrator
  - `planner`, `architect`, `researcher` on long-horizon synthesis passes
  - `code-reviewer`, `critic`, `verifier` on high-stakes or adversarial review passes
  - `scholastic` on difficult evidence-integration tasks

Rationale:
- use `low` only for bounded classification/search/triage
- use `medium` for implementation roles that must stay responsive while still completing end-to-end work
- use `high` where hidden assumptions, failure analysis, tradeoff judgment, or evidence synthesis dominate
- use `xhigh` for asynchronous, deep-rollout, or audit-heavy work where the extra thinking budget changes outcomes
- under capability-first policy, if a role oscillates between `medium` and `high`, bias upward unless latency or overthinking has been shown to cause a concrete regression
- do **not** flatten everything to `xhigh`; keep `xhigh` as a deliberate high-capability tier centered on leader/orchestrator and selected verification/synthesis moments

## Recommended OMX Product Direction

### What should become the operator SSOT?
If OMX wants one operator-facing file, the best place is still:
- `${CODEX_HOME}/.omx-config.json`

Reason:
- OMX already owns and documents this file
- it is a better fork-owned control plane than overloading Codex root `config.toml`
- it can cleanly layer on top of Codex’s own official per-agent TOML concept

### What should be added?
A new supported map, for example:
```json
{
  "roleModels": {
    "explore": { "model": "gpt-5.3-codex-spark", "reasoning": "low" },
    "planner": { "model": "gpt-5.4", "reasoning": "high" },
    "executor": { "model": "gpt-5.4", "reasoning": "medium" }
  }
}
```

This page no longer recommends expanding `roleModels` with per-role `contextPolicy` in the near term.
If Pennix later wants OMX-owned context controls, they should be introduced separately, for example:
```json
{
  "modelFamilyDefaults": {
    "gpt-5.4": {
      "modelContextWindow": 272000,
      "modelAutoCompactTokenLimit": 200000
    }
  }
}
```

Important:
- do not put context configuration into `roleModels` for the current Pennix design
- if OMX later surfaces context controls, prefer a shared global or model-family layer over a per-role layer
- if Pennix later wants finer control than one shared family default, named shared policies are still safer than raw arbitrary per-role integers

### What should consume it?
Both of these paths should read the same map:
- native agent TOML generation
- Team runtime worker launch resolution

### What should remain separate?
Keep separate:
- global Codex/session defaults in `config.toml`
- global Team concurrency/depth limits
- runtime protocol/transport behavior for Team workers

Do not overload a role-model map with:
- mailbox behavior
- tmux runtime policy
- idle/retry/fallback transport mechanics

## Recommendation Summary
1. Treat `worker` as runtime protocol, not as a business role in model mapping.
2. Preserve role-aware routing in Team, but unify model resolution behind one OMX-owned per-role override map for `model` and `reasoning`.
3. Use a capability-first default strategy, not a cost-first strategy.
4. Under current constraints, default almost all meaningful roles to `gpt-5.4`, and only downgrade roles that are clearly narrow, low-risk, and empirically stable on a smaller lane.
5. Pennix should explicitly document the main leader/orchestrator lane as `gpt-5.4` plus `xhigh`, because that matches both the user’s operating preference and OpenAI’s documented `xhigh` use cases.
6. Keep `explore` and `style-reviewer` as the main default exceptions on `gpt-5.3-codex-spark`.
7. Treat `gpt-5.4-mini` as an optional validated optimization lane, not the default for important roles, unless repeated real-task evidence shows parity.
8. Make `${CODEX_HOME}/.omx-config.json` the operator-facing SSOT, but only after adding a real supported per-role `model` / `reasoning` map and wiring both native-agent generation and Team runtime to it.
9. Do not add per-role context mapping in this iteration; keep shared context budgets outside the role map.
10. If OMX later exposes context controls, make them global or model-family scoped first, and distinguish official hard ceilings from Pennix operating budgets.
11. Keep the design benchmark-aware:
   - long-context retrieval is imperfect
   - long-horizon task reliability still decays
   - decomposition, compaction, and verification remain first-class reliability tools

## Follow-up Work
1. Add a supported `.omx-config.json` role-model schema for `model` and `reasoning`.
2. Refactor Team runtime and native-agent generation to read the same role-model source.
3. Decide whether `quality-reviewer` should remain a routable Team-only prompt role, or be fully normalized into `code-reviewer` everywhere.
4. Update docs to clearly distinguish:
   - native Codex subagents
   - OMX Team workers
   - operator config defaults
   - per-role override policy
