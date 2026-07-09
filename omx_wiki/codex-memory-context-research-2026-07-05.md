---
title: "Codex 会话记忆与上下文系统开源研究 2026-07-05"
tags: ["codex", "memory", "context", "handoff", "wiki", "research", "mcp", "hooks"]
created: 2026-07-05T06:34:05.000Z
updated: 2026-07-05T06:34:05.000Z
sources:
  - "https://developers.openai.com/codex/codex-manual"
  - "https://developers.openai.com/codex/hooks"
  - "https://developers.openai.com/codex/config-reference"
  - "https://developers.openai.com/codex/memories"
  - "https://github.com/mksglu/context-mode"
  - "https://github.com/rohitg00/agentmemory"
  - "https://github.com/majiayu000/remem"
  - "https://github.com/MarceloCaporale/codex-agent-mem"
  - "https://github.com/djannot/code-session-memory"
  - "https://github.com/mex-memory/mex"
  - "https://github.com/swarmclawai/swarmvault"
  - "https://github.com/volcengine/OpenViking"
  - "https://github.com/mem0ai/mem0"
  - "https://github.com/langchain-ai/langmem"
  - "https://github.com/letta-ai/letta-code"
  - "https://github.com/mindmuxai/brain.md"
links: ["codex-memory-project-due-diligence-2026-07-05.md", "pennix-omx-fork-design-inventory-2026-07-04.md", "scenario-1-context-compaction-restore-open-source-research-2026-07-06.md"]
category: reference
confidence: medium
schemaVersion: 1
---

# Codex 会话记忆与上下文系统开源研究 2026-07-05

## Scope

这页聚焦三个彼此相关、但不应混为一谈的主题：

1. 单会话内上下文压缩和精确恢复。
2. 跨会话的上下文系统交接。
3. 长期记忆的存储和快速访问。

研究目标不是泛泛讨论“AI 记忆”，而是为 OMX 后续开发和工作流部署找出：

- 哪些开源项目真正贴近 Codex CLI / Codex Desktop / coding-agent 场景。
- 哪些项目分别适合三类主题中的哪一类。
- 是否存在一个能同时覆盖三类主题的“全能项目”。
- 如果不存在，最合理的组合式设计应该如何拆层。

项目级纠偏和二次尽调见 [[codex-memory-project-due-diligence-2026-07-05]]。

## Executive Summary

### 结论先行

1. 目前开源社区里没有一个同时满足“严格开源、Codex 原生贴合、单会话高精度压缩恢复、跨会话高保真交接、长期 wiki 化沉淀、低接入成本”的完美项目。
2. 这三类主题最好分层看待。单会话压缩恢复最依赖 hooks 和 runtime observation；跨会话交接更依赖可导出的 handoff 包或可检索 session store；长期记忆则更适合 markdown/wiki/graph 或稳定 memory store。
3. 对 Codex 场景最接近的一批项目不是“替代 Codex”，而是利用 Codex 已有的 `resume`、`compact`、`Memories`、`SessionStart`、`PreCompact`、`PostCompact`、`Stop` 等官方接缝做补强。
4. 如果允许 source-available 而不强求 OSI 开源，`context-mode` 是技术上最完整的单会话与跨会话一体化候选。
5. 如果只看严格 OSS 并且要求 Codex 贴合度高，`agentmemory` 是最强全能候选，但它明显更重、更复杂。
6. 如果要求低侵入、低 token、局部增强而不是“大而全平台”，`codex-agent-mem` 和 `remem` 更值得重视。
7. 如果长期记忆的目标是“真正可审阅、可 Git 管理、可人读”的知识库，而不只是向量库，`swarmvault` 和 `mex` 的思路比纯数据库 memory layer 更适合参考。

### 重要限制

- `mksglu/context-mode` 使用 `Elastic License 2.0`，不是严格意义上的开源许可证。
- `djannot/code-session-memory` 当前仓库没有公开 license，研究可参考，但直接集成或二次分发有合规风险。
- `volcengine/OpenViking` 使用 `AGPL-3.0`，如果未来要深度集成或改造成服务层，需要单独评估许可证影响。
- `mem0`、`langmem`、`letta-code` 更像底层 memory framework / platform，不是现成的 Codex 记忆工作流方案。

## Evaluation Lens

本页中的“流行度 / 成熟度 / 契合度 / 上手难易程度”是综合判断，不是仓库自述：

- 流行度：主要看 GitHub stars，以及该项目在 coding-agent 社区中的可见度。
- 成熟度：看最近 push、最近 release、文档完整性、集成面、是否有明确运行与验证叙述。
- Codex 契合度：看是否直接支持 Codex CLI / Desktop、是否使用 MCP / hooks、是否围绕 `compact` / `resume` / session continuity 设计。
- 上手难易程度：看安装面、依赖数量、是否需要常驻服务、是否需要额外数据库、是否需要用户理解复杂工作流。

研究时间点：`2026-07-05`。

## Official Codex Baseline

在看外部项目前，必须先明确官方 Codex 自带了什么：

- Codex 原生支持会话恢复：`codex resume`、`codex resume --all`、`codex exec resume ...`。
- Codex 原生支持上下文压缩：自动 compaction，以及手动 `/compact`。
- Codex 暴露了 compaction 相关配置：`model_context_window`、`model_auto_compact_token_limit`、`compact_prompt`、`experimental_compact_prompt_file`。
- Codex 暴露了关键生命周期 hooks：`SessionStart`、`PreCompact`、`PostCompact`、`Stop`，另外还有 `PreToolUse`、`PostToolUse` 等 turn-scope hooks。
- Codex 原生还有 `Memories`，但它更偏“跨线程的本地回忆层”，不是严格意义上的精确会话 handoff 系统。

这意味着外部项目真正的价值通常有三类：

1. 在 compaction 前后做更精细的捕获与重注入。
2. 在旧会话结束或失真前导出更好的 handoff 包。
3. 在长期知识层做比官方 `Memories` 更可控、更可审阅的持久化。

## Candidate Matrix

下表汇总本轮最相关的候选项目。

| Project | T1 单会话压缩/恢复 | T2 跨会话交接 | T3 长期记忆 | Codex 贴合度 | 上手难度 | 流行度 | 许可证 / 采用风险 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `context-mode` | 强 | 强 | 中 | 很高 | 中 | 很高，18,574 stars | `ELv2`，非严格开源 |
| `agentmemory` | 强 | 强 | 强 | 很高 | 高 | 很高，24,563 stars | Apache-2.0 |
| `remem` | 中 | 强 | 中强 | 很高 | 低到中 | 低，18 stars，但很新且很活跃 | MIT |
| `codex-agent-mem` | 中强 | 强 | 中强 | 高 | 中 | 低，30 stars | Apache-2.0 |
| `code-session-memory` | 弱到中 | 强 | 中 | 高 | 低到中 | 低，15 stars | 无 license，合规风险高 |
| `mex` | 弱 | 中强 | 强 | 中高 | 中 | 中，1,149 stars | MIT |
| `swarmvault` | 弱 | 中 | 强 | 中 | 中到高 | 中，594 stars | MIT |
| `OpenViking` | 中强 | 强 | 强 | 中 | 高 | 很高，26,320 stars | AGPL-3.0 |
| `mem0` | 弱 | 中 | 强 | 低到中 | 高 | 很高，60,102 stars | Apache-2.0 |
| `langmem` | 弱 | 中 | 中强 | 低 | 高 | 中，1,540 stars | MIT |
| `letta-code` | 弱到中 | 中 | 中强 | 低到中 | 高 | 中高，2,806 stars | Apache-2.0 |
| `brain.md` | 弱 | 中 | 中强 | 中 | 低 | 低，183 stars | Apache-2.0 |

### 表格解读

- T1 看重的是：能否在一个长会话内部，在 context 被工具输出与历史淹没之前，做精确捕获、压缩和恢复。
- T2 看重的是：能否把一个旧会话里的关键决策、当前状态、未完成事项、证据和上下文导出，并让新会话低损接手。
- T3 看重的是：能否把稳定知识长期沉淀下来，并在之后快速检索、路由、引用或人工审阅。

## Theme 1: 单会话内上下文压缩和精确恢复

这是最难的一类，因为它要求项目真正站在 runtime 热路径里，而不是只做离线知识库。

### 排名

#### 1. `context-mode`

这是目前技术上最接近“比 Codex 官方压缩更激进、又更可控”的方案。

- 它直接把问题定义成 context window 管理问题，而不是泛化的长期记忆问题。
- README 明确写出 `SessionStart`、`PreToolUse`、`PostToolUse`、`UserPromptSubmit`、`PreCompact`、`Stop` 这些 hooks，并配合 `11` 个 MCP tools。
- 它把文件编辑、git 操作、任务、报错、用户决策等事件记进 SQLite/FTS5，而不是在 compact 时把整段 prose 再塞回上下文。
- 它还直接暴露效率观测面，状态栏显示 “saved this session / saved across sessions / efficient”。

为什么它在 T1 最强：

- 它明确站在 `PreCompact` 和 `SessionStart` 这两个关键节点上。
- 它对“工具输出会污染上下文”这个问题有很强的针对性。
- 它不是简单做摘要，而是做事件索引和按需回取。

主要缺点：

- `ELv2`，不适合作为“严格开源依赖”来直接采纳。
- 安装和运行面比轻量 MCP 项目更复杂。
- 它更像一个完整运行时层，而不是一个容易裁剪进 OMX 的小模块。

#### 2. `agentmemory`

这是严格 OSS 里最完整的 T1 候选。

- 它对 Codex CLI 直接提供 plugin + MCP + `6` 个 lifecycle hooks。
- README 明确列出 `SessionStart`、`UserPromptSubmit`、`PreToolUse`、`PostToolUse`、`PreCompact`、`Stop`。
- 它的目标不是只存摘要，而是做 hybrid retrieval：`BM25 + vector + graph`。
- 官方自述里把 `92% fewer tokens` 作为核心卖点之一。

为什么它值得排第二：

- 它在 hooks 面的覆盖已经足以深入单会话热路径。
- 它同时有 session history、handoff、recap、remember 这一类高层工作流技能。
- 它在流行度和生态可见度上明显比其他 Codex 记忆项目更强。

主要缺点：

- 很重。它依赖自己的 `iii` engine 和单独 server，运行面不是“一个小工具”。
- 它更适合希望直接接入一整套 memory platform 的用户，不适合只想补一个小接缝。
- 功能面很大，意味着更高的误配、调参和调试成本。

#### 3. `codex-agent-mem`

它不是最“自动化”的，但可能是最值得借鉴的低开销设计之一。

- 核心设计是 `context packs`，不是“把所有东西都自动写进一个记忆系统里”。
- 它强调 `known_pack_hash` / `not_modified`，避免重复发送没变的上下文包。
- 它有 session-aware retrieval、open work、blockers、snapshots、deterministic closure checks。
- 公布了大约 `95%` 的重复上下文缩减样例。

为什么它在 T1 很有参考价值：

- 它在“如何少发 token”这件事上思路非常克制。
- 它更像一个精确、pull-based 的 continuity layer，而不是大而全 agent OS。
- 这和 OMX 未来如果想做“最小侵入的上下文补强层”很接近。

主要缺点：

- 它刻意不做强自动化：没有 session-start 自动注入，也没有 stop-hook 自动总结。
- 因此它更像“优秀的压缩包和检索器”，不是完整自动恢复器。
- 社区体量还小，成熟度不能高估。

#### 4. `remem`

`remem` 的长处是非常轻，且和 Codex 的接缝很干净。

- 一个 Rust binary。
- 本地 SQLite / SQLCipher。
- `remem install --target codex` 直接配置 Codex MCP 和 `SessionStart` / `Stop` hooks。
- README 明确写它会在 session start 注入相关记忆，在 session stop 总结 durable memory。

为什么只排第四：

- 它很适合 T2 和轻量 T3。
- 但对于“单会话内部，在 compact 之前精确保存和恢复”的能力，它不如 `PreCompact` 深入布局的方案。

#### 5. `code-session-memory`

它更适合作为 T2 候选，不是理想的 T1 方案。

- 它在每次 agent turn 结束后自动把新消息索引到 `sqlite-vec` 或 `pgvector`。
- 对 Codex 通过 `notify` hook 触发。
- 它有一个非常好的“Compact for restart”思路，但这个已经接近 T2 而不是 T1。

为什么它在 T1 较弱：

- 它不是围绕 `PreCompact` 或 `SessionStart` 去设计的。
- 它更像“turn 后归档 + 之后搜索”，不是会话内压缩恢复 runtime。

### Theme 1 判断

如果只为 T1 选项目：

1. 允许 source-available：优先看 `context-mode`。
2. 只看严格 OSS：优先看 `agentmemory`。
3. 想做轻量、低 token、低侵入原型：优先看 `codex-agent-mem`，其次看 `remem`。

## Theme 2: 跨会话的上下文系统交接

这一类主题其实至少分成两种：

1. 自动 warm-start 型：新会话启动时自动带出上个会话的有效记忆。
2. 显式 handoff 包型：在旧会话结束或即将失真时，主动导出一个可审阅、可粘贴、可继续追踪的交接文档。

### T2-A: 自动 warm-start 型

#### 1. `agentmemory`

- 共享 memory server，可跨 Codex、Claude Code、Cursor、Gemini CLI 等工具复用。
- Codex 上有 `SessionStart` hook。
- 还有 `/handoff`、`/recap`、`/session-history` 等专门的工作流技能。

这是目前严格 OSS 里最像“会话交接系统”的一体化方案。

#### 2. `remem`

- 直接在 `SessionStart` 注入项目记忆。
- 在 `Stop` 之后总结 durable memory。
- 非常适合“上个会话结束，新会话自动带着必要上下文开始”的流派。

它的优势不在“超级智能”，而在“简单、直接、局部可控”。

#### 3. `context-mode`

- 它本质上也在做跨 session continuity。
- 只是它的重点更偏 runtime context efficiency，而不是显式 handoff 文档。

如果未来 OMX 想把 T1 和 T2 做成同一层，`context-mode` 的设计比纯 session archive 项目更值得研究。

#### 4. `codex-agent-mem`

- session-aware retrieval。
- `mem_session_list`、`mem_scope_resolve`、`mem_bootstrap_context`。
- open work / blockers / snapshots / scoped context packs。

它更适合“新会话按需拉取上个会话真正相关的工作集”，而不是“无脑把上个会话摘要贴进来”。

### T2-B: 显式 handoff 包型

#### 1. `code-session-memory`

这是这一类里匹配度最高的项目之一。

- 它的 session browser 直接提供 `Compact for restart`。
- README 明确说明 restart 文档包含：
  - Context
  - Key Decisions
  - Current State
  - Unresolved Issues
- 长会话还会使用 map-reduce 总结策略。

这基本就是“旧会话导出交接包给新会话”的直接产品化。

主要缺点：

- 当前无公开 license。
- 默认依赖 OpenAI API 做 compactor。
- 它擅长“消息级重启摘要”，但不一定擅长“项目级长期知识组织”。

#### 2. `mex`

`mex` 的价值是把 handoff 文档化、项目化，而不是只停留在 session 摘要。

- `AGENTS.md` / `CLAUDE.md` 只保留小 anchor。
- `ROUTER.md` 路由任务上下文。
- `context/` 存架构、技术栈、决策、约定。
- `patterns/` 存可复用任务模式。
- `mex check` / `mex sync` 负责 drift detection。

如果你认为“最好的跨会话交接方式是结构化项目记忆，而不是继续堆一个大 prompt”，`mex` 很值得看。

#### 3. `codex-agent-mem`

它虽然不是专门做 clipboard handoff 文档的，但它的 `context pack`、open work、blockers、snapshots 其实天然适合生成可交接包。

如果 OMX 未来要做自己的 handoff bundle，`codex-agent-mem` 比 `code-session-memory` 更值得拿来学 token economy 和 scope control。

#### 4. `swarmvault`

`swarmvault task start ... --agent codex` 和 wiki/graph/task note 体系，适合把 handoff 做成持久工件而不是一次性摘要。

它不一定是最好的“马上继续一个技术会话”的工具，但很适合做持续演化的项目交接资产。

### Theme 2 判断

如果要自动 warm-start：

1. `agentmemory`
2. `remem`
3. `context-mode`
4. `codex-agent-mem`

如果要显式 restart / handoff 包：

1. `code-session-memory`
2. `mex`
3. `codex-agent-mem`
4. `swarmvault`

## Theme 3: 长期记忆的存储和快速访问

这类主题最容易被误做成“再造一个向量库”。如果目标是稳定知识、设计决策、常见坑、工作流约定、项目结构、检查清单，那么 markdown / wiki / graph 反而往往比纯向量层更适合。

### 排名

#### 1. `swarmvault`

这是最接近“长期知识库系统”的项目。

- 明确是 local-first LLM Wiki + knowledge graph + RAG knowledge base。
- 产物是 `wiki/`、`graph.json`、retrieval index、graph viewer、share artifacts。
- 支持 `compile --max-tokens`、graph query/path/explain、watch mode、git hooks、MCP server。
- 它不是只存向量，而是把知识组织成 reviewable artifacts。

这和“长期记忆应该被人类审阅和维护”的方向高度一致。

#### 2. `mex`

`mex` 比 `swarmvault` 更偏 coding project 记忆，而不是通用知识库。

- 它非常适合软件项目长期记忆。
- 它的最大价值是 drift detection，不让记忆文档长期背离真实代码。
- 它的 repo-native 结构很适合和 `AGENTS.md` 共存。

如果 T3 的重点是“工程项目记忆”，`mex` 可能比 `swarmvault` 更轻、更实用。

#### 3. `agentmemory`

`agentmemory` 走的是 LLM Wiki + graph + hybrid search 这条路，但它更偏“runtime memory platform”，不是 markdown-first 知识库。

它很强，但不一定最适合作为 OMX 的最终长期知识载体。

#### 4. `OpenViking`

这是重平台路线：

- 自动 session management。
- memory self-iteration。
- 目录递归检索。
- graph / vector / semantic retrieval 混合。

如果未来希望做一个“OMX 上层的 context DB / agent memory platform”，`OpenViking` 很值得研究；但它不适合作为轻量接入方案。

#### 5. `brain.md`

这是一个很轻的 markdown-first 思路：

- `BRAIN.md` 作为长期记忆入口。
- 记忆存在 repo 里。
- 通过 skills / wiring 让 Claude Code / Codex 学会读取。

它不强在自动化和检索深度，而强在简单、Git 友好、人类容易理解。

### 作为底层框架的二线候选

这些项目更适合作为“如果我们自己造系统，可以借鉴底层能力”的候选，而不是直接部署到 Codex 工作流：

- `mem0`
  - 超高流行度。
  - 强调 user/session/agent multi-level memory。
  - 更适合应用级 AI memory layer。
- `langmem`
  - 明确是 LangGraph / LangChain 生态里的 memory primitive。
  - 更偏开发框架，不是现成 Codex 工作流层。
- `letta-code`
  - 有 message search 和 hooks，也有 MemGPT / dreaming 研究血统。
  - 但对“Codex 内的三类记忆主题”而言，它更像上层 agent 平台而不是精准补丁层。

## Cross-Theme All-Rounders

如果只问“哪些项目同时覆盖三类主题”，最值得关注的是这四个：

### `agentmemory`

这是严格 OSS 里最强的全能候选。

- T1 强：PreCompact + PostToolUse + SessionStart + Stop。
- T2 强：跨工具共享 server、handoff / recap / session-history。
- T3 强：LLM Wiki、graph、hybrid search。

但它的代价是复杂度明显最高的一档。

### `context-mode`

这是技术上最完整的全能候选。

- T1 非常强。
- T2 强。
- T3 有一定能力，但长期知识库不是它最强的产品中心。

它的主要障碍不是技术，而是许可证和整体侵入性。

### `OpenViking`

这是平台级全能候选。

- 三类主题都覆盖。
- 但它明显过重，更像未来单独产品方向，而不是 OMX 短期增量能力。

### `remem`

这是最轻的 all-rounder。

- 它没有前面三个那么大而全。
- 但它在 Codex 接缝、局部增强、低接入成本上非常好。

如果将来 OMX 想先把系统做小做稳，再逐步变强，`remem` 的形状比 `agentmemory` 和 `OpenViking` 更接近“第一步”。

## What This Means For OMX

### 1. 不建议追求“一个项目吃掉三类主题”

当前社区没有一个真正无明显短板的完美项目。OMX 如果直接选一个全家桶，大概率会在以下三者里至少牺牲一个：

- 许可证边界。
- 接入复杂度。
- 对 Codex 官方语义和工作流的贴合度。

### 2. 更合理的 OMX 方向是三层拆分

#### T1 层：会话内压缩恢复层

建议重点研究：

- `context-mode` 的 `PreCompact + SessionStart + PostToolUse + SQLite/FTS5` 结构。
- `codex-agent-mem` 的 `context pack + known_pack_hash + not_modified + scoped retrieval` 结构。
- `agentmemory` 的 hooks coverage 和 hybrid retrieval。

目标不应该是“再做一个摘要器”，而应该是：

- 尽量少发 token。
- 尽量不重复发没变的内容。
- 尽量按 scope、task、session 精确恢复工作集。

#### T2 层：跨会话 handoff 层

建议重点研究：

- `code-session-memory` 的 `Compact for restart` 输出结构。
- `mex` 的结构化项目记忆与 drift detection。
- `remem` 的 `SessionStart/Stop` 自动 warm-start 机制。

目标应该同时支持两种模式：

- 自动 warm-start。
- 显式 handoff bundle 导出。

#### T3 层：长期知识层

OMX 当前已经有 `omx_wiki`，所以短期最稳妥的方向不是替换它，而是增强它。

建议重点研究：

- `swarmvault` 的 markdown wiki + graph + retrieval + reviewable artifact 结构。
- `mex` 的 repo-native scaffold + drift detection。
- `agentmemory` 的 graph / search 设计，但不必照搬其整个平台。

也就是说，OMX 更应当把 `omx_wiki` 继续当作长期知识底座，而不是改成只剩向量库或黑盒 memory store。

### 3. 最值得优先借鉴的组合

如果只从研究结果出发，不考虑立刻引入第三方完整产品，最值得借鉴的组合是：

1. T1 学 `context-mode` 的 runtime interception 思路。
2. T1/T2 学 `codex-agent-mem` 的 low-token context pack 思路。
3. T2 学 `code-session-memory` 的 restart handoff 文档结构。
4. T2/T3 学 `remem` 的轻量 SessionStart/Stop 自动化。
5. T3 学 `swarmvault` 的 wiki/graph/reviewable artifact 思路。
6. T3 学 `mex` 的结构化 scaffold 和 drift detection。

## Practical Recommendation

### 如果今天就要选“研究优先级”

第一梯队：

1. `agentmemory`
2. `context-mode`
3. `codex-agent-mem`
4. `remem`

第二梯队：

1. `code-session-memory`
2. `mex`
3. `swarmvault`

第三梯队：

1. `OpenViking`
2. `mem0`
3. `langmem`
4. `letta-code`
5. `brain.md`

### 如果今天就要选“最可能落进 OMX 的灵感源”

按价值排序：

1. `codex-agent-mem`
2. `context-mode`
3. `code-session-memory`
4. `remem`
5. `swarmvault`
6. `mex`

原因很直接：

- `codex-agent-mem` 最像“可以拆出来学的低开销 continuity layer”。
- `context-mode` 最像“功能正确的 runtime 设计标杆”。
- `code-session-memory` 最像“交接包产品形态的现成答案”。
- `remem` 最像“最小、最稳、最能先落地的自动 warm-start 方案”。
- `swarmvault` 和 `mex` 最适合作为长期知识层的设计灵感，而不是直接替换 Codex 热路径。

## Bottom Line

对这三个主题，当前最接近真实答案的不是单个项目，而是组合式架构：

- 单会话压缩恢复：`hooks + event index + scoped pack + dedupe`
- 跨会话交接：`warm-start memory + explicit handoff bundle`
- 长期记忆沉淀：`repo-native wiki + graph/search + drift control`

这和 OMX 自身的现状也是一致的：[[pennix-omx-fork-design-inventory-2026-07-04]] 已经说明 Pennix OMX 更适合做可组合的能力层，而不是再造一个黑盒全家桶。

单会话压缩恢复这个子问题已经在 [场景 1：会话内上下文压缩与恢复开源项目研究 2026-07-06](scenario-1-context-compaction-restore-open-source-research-2026-07-06.md) 中单独复核，结论是：它确实是 agent runtime reliability 问题，但严格成熟 OSS 方案很少，最可借鉴的组合是 `context-mode` 的事件化 resume snapshot、`claude-breadcrumbs` 的 prepare/restore 语义、`context-os` 的 compaction survival eval，以及 `code-session-memory` 的 restart document 结构。

## Source Pointers

官方 Codex 文档：

- Codex manual: https://developers.openai.com/codex/codex-manual
- Hooks: https://developers.openai.com/codex/hooks
- Config reference: https://developers.openai.com/codex/config-reference
- Memories: https://developers.openai.com/codex/memories

核心候选项目：

- context-mode: https://github.com/mksglu/context-mode
- agentmemory: https://github.com/rohitg00/agentmemory
- remem: https://github.com/majiayu000/remem
- codex-agent-mem: https://github.com/MarceloCaporale/codex-agent-mem
- code-session-memory: https://github.com/djannot/code-session-memory
- mex: https://github.com/mex-memory/mex
- swarmvault: https://github.com/swarmclawai/swarmvault
- OpenViking: https://github.com/volcengine/OpenViking

二线 / 底层框架候选：

- mem0: https://github.com/mem0ai/mem0
- langmem: https://github.com/langchain-ai/langmem
- letta-code: https://github.com/letta-ai/letta-code
- brain.md: https://github.com/mindmuxai/brain.md
