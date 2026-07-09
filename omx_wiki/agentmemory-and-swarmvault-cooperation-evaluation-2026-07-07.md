---
title: "AgentMemory 与 SwarmVault 协同评估 2026-07-07"
tags: ["codex", "memory", "agentmemory", "swarmvault", "nas", "mcp", "hooks", "research"]
created: 2026-07-07T17:10:00.000Z
updated: 2026-07-07T17:32:00.000Z
sources:
  - "https://github.com/rohitg00/agentmemory"
  - "https://github.com/rohitg00/agentmemory/blob/main/README.md"
  - "https://github.com/rohitg00/agentmemory/blob/main/INSTALL_FOR_AGENTS.md"
  - "https://github.com/rohitg00/agentmemory/blob/main/.env.example"
  - "https://github.com/rohitg00/agentmemory/blob/main/plugin/.codex-plugin/plugin.json"
  - "https://github.com/rohitg00/agentmemory/blob/main/plugin/.mcp.json"
  - "https://github.com/rohitg00/agentmemory/blob/main/plugin/hooks/hooks.codex.json"
  - "https://github.com/rohitg00/agentmemory/blob/main/plugin/skills/agentmemory-mcp-tools/REFERENCE.md"
  - "https://github.com/rohitg00/agentmemory/blob/main/plugin/skills/agentmemory-rest-api/REFERENCE.md"
  - "https://github.com/rohitg00/agentmemory/blob/main/src/cli/connect/codex.ts"
  - "https://github.com/rohitg00/agentmemory/blob/main/src/mcp/tools-registry.ts"
  - "https://github.com/rohitg00/agentmemory/issues/400"
  - "https://github.com/rohitg00/agentmemory/issues/515"
  - "https://github.com/rohitg00/agentmemory/issues/620"
  - "https://github.com/rohitg00/agentmemory/issues/728"
  - "https://github.com/rohitg00/agentmemory/issues/745"
  - "https://github.com/rohitg00/agentmemory/issues/998"
  - "https://github.com/swarmclawai/swarmvault"
  - "https://github.com/swarmclawai/swarmvault/blob/main/README.md"
  - "https://github.com/swarmclawai/swarmvault/blob/main/STABILITY.md"
  - "https://github.com/swarmclawai/swarmvault/blob/main/CHANGELOG.md"
  - "https://github.com/swarmclawai/swarmvault/blob/main/packages/cli/README.md"
  - "https://github.com/swarmclawai/swarmvault/blob/main/packages/cli/src/index.ts"
  - "https://github.com/swarmclawai/swarmvault/blob/main/packages/engine/src/agents.ts"
  - "https://github.com/swarmclawai/swarmvault/blob/main/packages/engine/src/hooks/codex.ts"
  - "https://github.com/swarmclawai/swarmvault/blob/main/packages/engine/src/hooks/marker-state.ts"
  - "https://github.com/swarmclawai/swarmvault/blob/main/packages/engine/src/mcp.ts"
  - "https://github.com/swarmclawai/swarmvault/blob/main/Dockerfile"
links:
  - "agentmemory-suitability-and-deployment-evaluation-2026-07-05.md"
  - "swarmvault-nas-multi-codex-service-evaluation-2026-07-05.md"
  - "codex-memory-project-due-diligence-2026-07-05.md"
  - "codex-long-term-knowledge-base-research-2026-07-05.md"
  - "codex-open-source-knowledge-stack-combinations-2026-07-05.md"
category: reference
confidence: high
schemaVersion: 1
---

# AgentMemory 与 SwarmVault 协同评估 2026-07-07

## Scope

这页只回答一个更收敛的问题：

1. `agentmemory` 和 `SwarmVault` 在 `Codex` 下各自到底负责什么。
2. 它们是否真的可以在同一套环境里比较好地协同工作。
3. 如果可以，边界应该怎么切，哪些接入面应该避免重叠。
4. 对 NAS 中心化自托管而言，最合理的组合拓扑是什么。

这页不重新做整个 memory 开源生态的横向枚举；只做这两个项目的二次收敛和组合判断。

## 结论先行

截至 `2026-07-07`，我的结论是：

1. `agentmemory` 和 `SwarmVault` **可以协同工作**。
2. 但前提是：**不要把它们当成两个同权的自动 runtime memory 层同时抢同一条生命周期热路径。**
3. `agentmemory` 本身并不是“完全没有 `T3`”。它已经有：
   - semantic / procedural consolidation
   - export / governance
   - 共享长期 recall
   只是它做的是 **runtime-first 的长期记忆**，不是 **vault-first 的长期知识库**。
4. 最合理的分工是：
   - `agentmemory` 负责 `T2` 主轴：runtime memory、cross-session handoff、中心化共享 recall。
   - `SwarmVault` 负责 `T3` 主轴：durable knowledge vault、graph、context packs、task ledger、长期知识资产。
5. 对 `Codex` 而言，`agentmemory` 的接入成熟度明显更高：
   - 原生 `Codex plugin + MCP + 6 hooks`
   - `connect codex`
   - 远端 `AGENTMEMORY_URL` / `AGENTMEMORY_SECRET`
6. `SwarmVault` 对 `Codex` 的接入目前更像：
   - `AGENTS.md`
   - project-level `.codex/hooks.json`
   - 手工或工程桥接的 `swarmvault mcp`
   - 而不是“Codex 一键完整 plugin + MCP install”
7. 因此，这两者的最佳协同不是“彼此替代”，也不是“全部自动化都打开”，而是 **分层组合 + 单向晋升**。

一句话概括：

`agentmemory` 做共享运行时记忆服务，`SwarmVault` 做长期知识与 context-pack 编译层。  
这是当前最稳、最贴合 `Codex`、也最适合 NAS 中心化的组合。

## 上游状态快照

### `agentmemory`

- 仓库：`rohitg00/agentmemory`
- 许可证：`Apache-2.0`
- stars：`24,732`
- latest release：`v0.9.27`
- release 时间：`2026-06-07`
- 最近 push：`2026-07-06`

### `SwarmVault`

- 仓库：`swarmclawai/swarmvault`
- 许可证：`MIT`
- stars：`598`
- latest release：`v3.20.0`
- release 时间：`2026-06-12`
- 最近 push：`2026-06-30`

这里要注意：

- `agentmemory` 更热、更成熟、更像一个已经跑出声量的 runtime memory 平台。
- `SwarmVault` 社区体量明显更小，但产品形状非常贴合“agent-native 长期知识库 / context compiler”。

因此不能只按 stars 判断适配度。

## `agentmemory` 在 Codex 下到底是什么

从上游源码和 README 可以确认几个硬事实：

1. `plugin/.codex-plugin/plugin.json` 明确声明了 `skills`、`mcpServers`、`hooks`。
2. `plugin/.mcp.json` 默认注册 `@agentmemory/mcp`，并传入：
   - `AGENTMEMORY_URL`
   - `AGENTMEMORY_SECRET`
   - `AGENTMEMORY_TOOLS`
3. `plugin/hooks/hooks.codex.json` 为 `Codex` 注册了 `6` 个 hook：
   - `SessionStart`
   - `UserPromptSubmit`
   - `PreToolUse`
   - `PostToolUse`
   - `PreCompact`
   - `Stop`
4. `src/cli/connect/codex.ts` 会把 `[mcp_servers.agentmemory]` 写入 `~/.codex/config.toml`。
5. `agentmemory connect codex --with-hooks` 还会把 workaround hook block 写到 `~/.codex/hooks.json`，用于绕过 `Codex Desktop` 当前 plugin-local hooks 不派发的问题。

这说明：

- `agentmemory` 不是“只有一个 MCP server”。
- 它在 `Codex` 下已经是完整的：
  - plugin
  - hooks
  - MCP
  - 远端 memory server
  四层接入。

### 它最适合承担的职责

1. 自动捕获会话中的工作痕迹。
2. 让多个 `Codex` 共享同一个中心 memory service。
3. 提供 recall / recap / handoff / session-history 这类跨会话连续性。
4. 在会话很长时，维持“我之前做过什么”的可检索痕迹。

### 它已经具备的一部分 `T3` 能力

如果把 `T3` 定义成“长期存储 + 之后快速 recall + 尽量 agent-native”，那 `agentmemory` 其实已经有相当一部分能力：

1. 长期持久化的 memory server。
2. `memory_export`、`memory_obsidian_export`、`/agentmemory/export` 这类导出面。
3. `memory_consolidate`，把工作记忆进一步整理成 episodic / semantic / procedural tiers。
4. `memory_patterns`、`memory_sessions`、`session_handoff` 这类跨 session 归纳与恢复接口。
5. governance / delete / audit 面，避免长期记忆只会增长不会治理。

更准确的说法不是“`agentmemory` 不做 `T3`”，而是：

- 它做的是 **runtime-first 的长期记忆**。
- 它不擅长充当 **canonical knowledge vault**。

### 它不应该承担的职责

1. 作为唯一长期知识真相库。
2. 承担人类日常审阅、结构化写作、知识策展的主界面。
3. 自动把所有 session 噪声都直接沉淀成“长期稳定知识”。

## `SwarmVault` 在 Codex 下到底是什么

从 `README`、`packages/cli/README.md`、`packages/engine/src/agents.ts`、`packages/engine/src/hooks/codex.ts` 可以确认几个硬事实：

1. `swarmvault mcp` 是稳定公开面，且是 **stdio MCP server**。
2. `swarmvault install --agent codex --hook` 会写：
   - `AGENTS.md`
   - `.codex/hooks.json`
   - `.codex/hooks/swarmvault-graph-first.js`
3. 其 `Codex` hook 目前主要覆盖：
   - `SessionStart`
   - `PreToolUse`
4. 这个 hook 的主职责不是会话记忆注入，而是：
   - graph-first 提示
   - broad search 前的上下文提醒或拦截
   - 读 `wiki/graph/report.md`
5. `resolveGraphFirstMode()` 的默认值是 `context`，不是 `deny`。
   - `deny` 必须显式通过 `--graph-first deny` 或配置项启用。
6. `install --mcp` 目前 **只支持 `--agent claude`**。
   - `Codex` 还没有一条一键式的 `SwarmVault MCP installer`。
   - 这意味着 `Codex` 想接 `swarmvault mcp`，当前需要手工或工程桥接。

这说明：

- `SwarmVault` 在 `Codex` 下目前不是“完整 runtime memory plugin”。
- 它更像：
  - durable vault
  - graph / retrieval workbench
  - context pack compiler
  - task ledger
  - graph-first guidance layer

### 它最适合承担的职责

1. 把长期材料编译成 `wiki/graph/retrieval/context-pack/task` 等 durable artifacts。
2. 为新会话或新 agent 准备 bounded context pack。
3. 维护 project-level 知识图与长期决策资产。
4. 让长期知识不只是一堆摘要，而是可查询、可浏览、可重编译的 vault。

### 它不应该承担的职责

1. 直接成为 `agentmemory` 那种自动 session memory server。
2. 承担会话生命周期热路径上的主连续性恢复责任。
3. 被误当成“远程 HTTP memory SaaS”。

## 两者重叠在哪里

| 维度 | `agentmemory` | `SwarmVault` | 判断 |
| --- | --- | --- | --- |
| 自动会话捕获 | 强 | 弱 | 主责任应给 `agentmemory` |
| `PreCompact` / `Stop` 级 lifecycle 观察 | 强 | 无主打 | 主责任应给 `agentmemory` |
| 跨会话 handoff | 强 | 中 | `agentmemory` 主，`SwarmVault` 补 durable artifact |
| 长期知识库 | 中 | 强 | 主责任应给 `SwarmVault` |
| graph / context pack / task ledger | 中 | 强 | 主责任应给 `SwarmVault` |
| 中心化 NAS 共享服务 | 强 | 中到强 | `agentmemory` 更原生；`SwarmVault` 适合作为中心 vault |
| `Codex` 一键接入成熟度 | 强 | 中 | `agentmemory` 更成熟 |
| 无 API key 起步 | 可以，但 BM25-only 降级 | 可以，heuristic provider 默认本地可用 | 两者都能先低门槛启动 |

重叠确实存在，但并不意味着冲突不可控。  
关键在于：**不要让两者同时做“同一层自动记忆所有事”的工作。**

## 会不会互相冲突

## 1. hooks 层

这是最容易出问题的一层。

### 已确认的重叠

- `agentmemory` 在 `Codex` 下会用到：
  - `SessionStart`
  - `UserPromptSubmit`
  - `PreToolUse`
  - `PostToolUse`
  - `PreCompact`
  - `Stop`
- `SwarmVault` 在 `Codex` 下会用到：
  - `SessionStart`
  - `PreToolUse`

### 风险点

1. `SessionStart` 都会输出模型可见内容。
2. `PreToolUse` 都可能在搜索/读取动作前介入。
3. 如果再叠加 `agentmemory connect codex --with-hooks` 的 user-scope workaround，生命周期来源会更多。

### 但它不是“必然硬冲突”

原因是这两者的 hook 目标不同：

- `agentmemory` 更偏 observation / recall / continuity。
- `SwarmVault` 更偏 graph-first guidance。

真正的问题不是“名字重了”，而是：

- 终端噪声会不会变多。
- 模型会不会收到两套相互竞争的提示。
- 搜索前是否会被多次打断。

### 当前最稳判断

两者 **可以共存**，但不建议一开始就把两边的所有 hook 能力全部打开。

更稳的顺序应是：

1. 先把 `agentmemory` 作为主自动 memory 层。
2. `SwarmVault` 先只作为 vault / MCP / context-pack 工具使用。
3. 只有在确认 graph-first guidance 真有价值时，再在特定 repo 上启用 `SwarmVault` 的 `codex --hook`。
4. 启用时优先保持默认 `context` 模式，不要一开始就 `deny`。

## 2. MCP 层

这一层反而比较容易共存。

### 已确认的事实上游边界

- `agentmemory`：
  - 已有 `connect codex`
  - 已有 `[mcp_servers.agentmemory]`
  - 已有 plugin `.mcp.json`
- `SwarmVault`：
  - `swarmvault mcp` 是稳定 stdio MCP 面
  - 但 `install --mcp` 目前只支持 `claude`
  - `Codex` 需要手工加一个新的 MCP server block

### 组合上并不矛盾

`Codex` 可以同时拥有两个 MCP server：

- `agentmemory`
- `swarmvault`

它们的工具命名空间也不同，不会天然撞名。

### 需要注意的点

`SwarmVault` 目前没有“Codex 官方一键 MCP 安装”这层便利性。  
所以它能与 `agentmemory` 协同，是 **工程上可组合**，不是“上游已经为这组组合做了产品化集成”。

## 3. 存储语义层

这层最容易在概念上打架。

### 不该做的事

不要把下面这些东西都自动同步成长期知识：

- 全部工具调用
- 全部 prompt
- 全部 session recall
- 全部临时结论

如果这么做：

- `agentmemory` 会变成过量的运行时历史噪声来源。
- `SwarmVault` 会被 session 垃圾污染，不再像知识库。

### 推荐语义分层

`agentmemory` 存：

- 自动捕获的 runtime 观察
- session 轨迹
- recall 素材
- handoff 摘要
- 跨会话 continuity

`SwarmVault` 存：

- 人审后可长期保留的决策
- 结构化研究结论
- 项目知识图
- task ledger
- bounded context pack
- durable source material / curated wiki

简化成一句话：

`agentmemory` 存“活的过程痕迹”，`SwarmVault` 存“沉淀后的知识资产”。

## 最推荐的协同模型

## 模型 A：最稳妥的分层组合

### 角色分工

```text
agentmemory  -> 中心 runtime memory / handoff service
SwarmVault   -> 中心 durable knowledge vault / graph / context-pack compiler
Codex client -> 同时消费两者，但不让两者同时主导 session lifecycle
```

### 建议的工作流

1. `Codex` 正常工作时，由 `agentmemory` 自动捕获 session 痕迹。
2. 当会话变长或跨设备续接时，优先用 `agentmemory` 做 recall / recap / handoff。
3. 当某个结论已经稳定、值得长期保留时，再把它沉淀进 `SwarmVault`：
   - source
   - wiki page
   - task update
   - context pack
4. 新会话启动时：
   - 需要“我上次做到哪了”时，先看 `agentmemory`
   - 需要“这个项目长期知识与结构化背景”时，先看 `SwarmVault`

### 这套模型的优点

1. 分工清晰。
2. 不需要改任何上游源码。
3. 符合你对 NAS 中心化的偏好。
4. 既能给 agent 连续性，也能给 agent 一个相对干净的长期知识层。

## 模型 A+：单向晋升桥

这是比“简单并存”更强的一种协同方式，也是当前我最认可的长期演化方向。

### 核心思想

不要让两边双向同步，也不要让 `SwarmVault` 吃下全部 runtime 噪声。  
更好的做法是：

```text
agentmemory
  -> 自动捕获工作流内生的活记忆
  -> consolidation / handoff / pattern detection
  -> 选择性导出稳定条目
  -> promotion bridge
  -> SwarmVault inbox/raw/source/task
  -> compile / review / candidate / promote
  -> durable vault
```

### 为什么这条链更强

1. `agentmemory` 擅长“别忘”，能在工作流里自动长出长期记忆候选。
2. `SwarmVault` 擅长“别乱”，能把候选知识编译成可审阅、可组织、可上下文打包的资产。
3. 二者组合后，长期知识不再只是“能 recall”，而是“能 recall 且能策展”。

### `agentmemory` 侧可用的晋升输入

当前已经可以利用的上游面包括：

1. `session_handoff`
2. `memory_consolidate`
3. `memory_export`
4. `memory_obsidian_export`
5. `/agentmemory/semantic`
6. `/agentmemory/procedural`
7. commit / session 关联查询

这些都足够形成“候选长期知识包”，不需要改 `agentmemory` 源码。

### `SwarmVault` 侧可用的接收面

当前已经可以利用的上游面包括：

1. `ingest_input`
2. `compile_vault`
3. `build_context_pack`
4. `start_task` / `update_task` / `resume_task`
5. candidate / review / promote 流程
6. `inbox/`、`raw/`、managed source registry

这意味着它已经具备“接住晋升内容并继续编译”的条件。

### 推荐的最小桥接流程

1. `agentmemory` 持续自动捕获。
2. 定时或事件触发执行：
   - `memory_consolidate`
   - `session_handoff`
   - 读取 semantic / procedural memory
3. bridge 按规则筛出值得长期保留的条目。
4. 生成结构化 markdown / json 包，写入：
   - `SwarmVault inbox/`
   - 或 `raw/agentmemory/`
   - 或一个 managed source
5. `SwarmVault` 执行 ingest / compile / approve。
6. 候选内容进入 review / candidate / promote 流程。

### 哪些内容值得晋升

1. 跨多个 session 重复出现的稳定事实。
2. 多次验证过的排障流程或操作规程。
3. 已经形成明确结论的设计决策。
4. 与 commit / branch / repo 演进强关联的长期结论。
5. 值得跨设备、跨会话延续的长期任务 handoff。

### 哪些内容不该晋升

1. 原始 prompt。
2. 高频 shell / grep / read 噪声。
3. 一次性试探和低置信度推断。
4. 只对当前 session 有价值的短命 scratchpad。

### 这条桥的边界

这不是“双向同步”，更不是“全量镜像”。  
它本质上是：

- `agentmemory` 产出长期知识候选
- `SwarmVault` 决定什么值得成为 durable asset

因此它更像 **promotion pipeline**，不是 replication pipeline。

## 模型 B：更激进的组合

### 角色分工

```text
agentmemory  -> 继续负责 runtime memory
SwarmVault   -> 额外启用 codex graph-first hook
Codex        -> 同时收到 recall 与 graph-first guidance
```

### 什么时候适合

- 你已经确认 `SwarmVault` 的 graph/query/report 对当前 repo 真有帮助。
- 你愿意接受更多 hook 可见输出。
- 你希望在搜索前先被提醒走 graph/report/context-pack 路线。

### 主要风险

1. `SessionStart` 和 `PreToolUse` 的可见输出更多。
2. 如果把 `graphFirst` 调成 `deny`，会更强地干预习惯性的广搜行为。
3. 与 `agentmemory` 一起使用时，体验层复杂度明显上升。

因此这条路不适合一上来就开。

## NAS 中心化部署的推荐拓扑

## `agentmemory`

最自然的中心化形态就是：

```text
NAS:
  agentmemory daemon / REST API
  internal viewer
  local data directory

clients:
  Codex plugin + MCP
  AGENTMEMORY_URL=https://memory.example.com
  AGENTMEMORY_SECRET=...
```

这是它的原生长项。

## `SwarmVault`

更自然的中心化形态是：

```text
NAS:
  one or more SwarmVault vault roots
  state/, wiki/, raw/, agent/, inbox/
  optional graph serve
  optional scheduled compile / retrieval rebuild / doctor

clients:
  consume via git sync, SSH, or MCP stdio bridge
```

这里要特别注意：

- `SwarmVault` 不是现成的远程 HTTP MCP SaaS。
- 它的 MCP 主路径是 `swarmvault mcp`，即 stdio server。

因此，多地 `Codex` 共用一个中心 `SwarmVault` 的最自然做法不是“所有客户端直连一个公网 HTTP API”，而是：

1. 共享 vault 仓库 / 目录。
2. 在 NAS 上运行 `swarmvault` CLI。
3. 客户端通过：
   - 本地同步 checkout
   - 或 SSH 调用远端 `swarmvault mcp`
   来消费。

这里的 “SSH 调远端 stdio MCP” 属于**工程桥接推论**，不是 `SwarmVault README` 单独强调的第一主路径，但和它当前的 stdio 设计是兼容的。

## 两者能否共享同一套模型资源

可以，但只是“共用后端模型资源”，不是“共用同一记忆索引”。

### 已确认

- `agentmemory`：
  - 不需要外部数据库
  - 可以无 LLM key 先跑
  - 可以 BM25-only
  - 可以本地 embeddings
  - 可以 OpenAI-compatible / Ollama / 其他 provider
- `SwarmVault`：
  - 默认 heuristic provider 可离线启动
  - 可接 Ollama / OpenAI / Anthropic / Gemini / OpenRouter 等
  - 有 embeddings 和 rerank 配置位

### 更准确的理解

两者都可以指向：

- 同一台 NAS 上的 Ollama
- 同一个 OpenAI-compatible endpoint
- 或同一组云端 API key

但这只是在“算力后端”层面复用。  
它们各自的：

- 索引
- 检索逻辑
- 数据模型
- 状态目录

仍然是分离的。

## 当前最推荐的实际策略

## 第一阶段

1. `agentmemory` 作为主自动 memory 层。
2. `SwarmVault` 只做中心 durable knowledge vault。
3. 给 `Codex` 手工接 `swarmvault mcp`，但先**不启用** `SwarmVault` 的 `codex --hook`。

这是最稳的起步方式。

## 第二阶段

确认 `SwarmVault` 的 graph / task / context pack 真实有价值后，再做：

1. 在特定 repo 启用 `swarmvault install --agent codex --hook`
2. 保持默认 advisory `context`
3. 暂时不要切 `deny`

## 第三阶段

如果之后要进一步收敛部署体系，再考虑：

1. 哪些 `agentmemory` handoff 结果值得人工晋升到 `SwarmVault`
2. 是否要做少量“从 `agentmemory` 到 `SwarmVault` 的人工策展桥”
3. 是否要在 NAS 上统一跑：
   - `agentmemory`
   - `SwarmVault`
   - 本地模型后端

## 不推荐的组合方式

1. 一开始就同时开启：
   - `agentmemory` 全套 hooks
   - `agentmemory connect codex --with-hooks`
   - `SwarmVault codex --hook`
   - `SwarmVault graphFirst=deny`
2. 试图让 `SwarmVault` 自动吸收所有 `agentmemory` session 噪声。
3. 试图让 `agentmemory` 充当长期 canonical knowledge base。
4. 以为 `SwarmVault` 已经具备现成的 `Codex` 一键远程 MCP 托管模式。

## 最终判断

如果问题是：

“这两个项目是否真的可以比较好地协同工作？”

我的回答是：

**可以，但必须分层。**

最好的分层是：

- `agentmemory`：共享 runtime memory / cross-session continuity
- `SwarmVault`：长期知识库 / graph / context-pack / task ledger

如果问题是：

“它们能不能作为两个同权自动 memory runtime 一起打开？”

我的回答是：

**不建议。**  
那样最先出现的问题不是功能不够，而是 hooks、提示、噪声、语义边界开始互相污染。

因此，这两个项目当前最值得采纳的不是“二选一”，而是：

**`agentmemory` 做活记忆，`SwarmVault` 做久知识。**
