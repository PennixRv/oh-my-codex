---
title: "OpenViking Agent Context Database 深度研究 2026-07-14"
tags: ["openviking", "vikingmem", "codex", "agentmemory", "context-mode", "nas", "mcp", "knowledge-base", "memory", "rag", "research"]
created: 2026-07-14T03:25:22.000Z
updated: 2026-07-14T03:25:22.000Z
sources:
  - "https://github.com/volcengine/OpenViking"
  - "https://github.com/volcengine/OpenViking/releases/tag/v0.4.9"
  - "https://www.volcengine.com/about"
  - "https://raw.githubusercontent.com/volcengine/OpenViking/main/README.md"
  - "https://raw.githubusercontent.com/volcengine/OpenViking/main/docs/en/concepts/01-architecture.md"
  - "https://raw.githubusercontent.com/volcengine/OpenViking/main/docs/en/concepts/02-context-types.md"
  - "https://raw.githubusercontent.com/volcengine/OpenViking/main/docs/en/concepts/03-context-layers.md"
  - "https://raw.githubusercontent.com/volcengine/OpenViking/main/docs/en/concepts/05-storage.md"
  - "https://raw.githubusercontent.com/volcengine/OpenViking/main/docs/en/concepts/06-extraction.md"
  - "https://raw.githubusercontent.com/volcengine/OpenViking/main/docs/en/concepts/07-retrieval.md"
  - "https://raw.githubusercontent.com/volcengine/OpenViking/main/docs/en/concepts/08-session.md"
  - "https://raw.githubusercontent.com/volcengine/OpenViking/main/docs/en/concepts/09-transaction.md"
  - "https://raw.githubusercontent.com/volcengine/OpenViking/main/docs/en/concepts/10-encryption.md"
  - "https://raw.githubusercontent.com/volcengine/OpenViking/main/docs/en/concepts/11-multi-tenant.md"
  - "https://raw.githubusercontent.com/volcengine/OpenViking/main/docs/en/concepts/13-privacy.md"
  - "https://raw.githubusercontent.com/volcengine/OpenViking/main/docs/en/guides/01-configuration.md"
  - "https://raw.githubusercontent.com/volcengine/OpenViking/main/docs/en/guides/03-deployment.md"
  - "https://raw.githubusercontent.com/volcengine/OpenViking/main/docs/en/guides/04-authentication.md"
  - "https://raw.githubusercontent.com/volcengine/OpenViking/main/docs/en/guides/05-observability.md"
  - "https://raw.githubusercontent.com/volcengine/OpenViking/main/docs/en/guides/06-mcp-integration.md"
  - "https://raw.githubusercontent.com/volcengine/OpenViking/main/docs/en/guides/13-multi-write-storage.md"
  - "https://raw.githubusercontent.com/volcengine/OpenViking/main/docs/en/api/02-resources.md"
  - "https://raw.githubusercontent.com/volcengine/OpenViking/main/docs/en/api/11-snapshot.md"
  - "https://raw.githubusercontent.com/volcengine/OpenViking/main/docs/en/agent-integrations/04-codex.md"
  - "https://raw.githubusercontent.com/volcengine/OpenViking/main/examples/codex-memory-plugin/README.md"
  - "https://raw.githubusercontent.com/volcengine/OpenViking/main/examples/codex-memory-plugin/DESIGN.md"
  - "https://raw.githubusercontent.com/volcengine/OpenViking/main/examples/codex-memory-plugin/scripts/pre-compact-capture.mjs"
  - "https://raw.githubusercontent.com/volcengine/OpenViking/main/examples/codex-memory-plugin/scripts/auto-recall.mjs"
  - "https://arxiv.org/abs/2605.29640"
  - "https://learn.chatgpt.com/docs/config-file/config-reference#configtoml"
links:
  - "agentmemory-and-swarmvault-cooperation-evaluation-2026-07-07.md"
  - "codex-long-term-knowledge-base-research-2026-07-05.md"
  - "nas-self-hosted-knowledge-stack-deployment-blueprint-2026-07-05.md"
  - "agentmemory-gpt-5-4-mini-incident-and-qwen3-embedding-8b-switch-plan-2026-07-10.md"
category: reference
confidence: high
schemaVersion: 1
---

# OpenViking Agent Context Database 深度研究 2026-07-14

## Scope

本页记录截至 `2026-07-14` 对 `volcengine/OpenViking` 的二次深度研究，目标不是只判断它能否承担长期知识库，而是判断它对当前 Codex 环境三个不同连续性场景的真实覆盖范围：

1. 场景一：同一 work unit 内的上下文压缩、热状态与 compact 连续性。
2. 场景二：跨会话、跨设备、精确且可验证的 handoff。
3. 场景三：NAS 上中心化、多客户端共享、agent-first 的长期语义知识与记忆。

结论必须区分以下证据等级：

- `已支持`：上游当前文档、发布包或源码直接证明。
- `PoC 必验`：协议或设计可行，但尚未在本环境实际端到端验证。
- `不具备`：现有公开接口或契约未提供，不能用语义相似能力替代。

本页是只读研究结论，不代表已经部署、安装 plugin、迁移 OMX Wiki，或改变 Context Mode / AgentMemory 的既有责任边界。

## 结论先行

OpenViking 是当前最接近“统一 Agent Memory、Knowledge RAG 和 Skills”的中心化开源项目之一。它可以成为未来 Codex 环境的**中心语义记忆与知识运行时**，并且是场景三的第一候选。

但它目前不能单独、安全地重塑整个 Codex 记忆系统：

| 场景 | 当前判断 | 原因 |
| --- | --- | --- |
| 场景一：同会话 compact continuity | 部分覆盖，不能直接替换 | 官方 plugin 会在 Stop 捕获、PreCompact commit、UserPromptSubmit recall；但 Codex 无干净 SessionEnd，plugin 用 active-window 和 idle TTL 启发式补偿，且 extraction 异步完成。 |
| 场景二：精确跨会话 handoff | 不覆盖 | 没有 source session ID + cwd + label + schema + SHA-256 digest 的 Registry，也没有 exact resolve 或 fail-closed finalization。 |
| 场景三：中心长期知识与记忆 | 条件性通过 | 具备独立 HTTP server、远程 MCP、Resource/Memory/Skill、RBAC、账户隔离、资源导入、语义检索、事务恢复、快照和 multi-write。仍须通过 NAS、模型、中文检索与恢复 PoC。 |

因此当前推荐边界是：

```text
Context Mode
  = 当前 work unit 事件、工具输出检索、same-session compact continuity

AgentMemory Registry
  = exact source identity、handoff label/schema/digest、fail-closed continuation

OpenViking
  = NAS 中心共享的 Resource / Memory / Skill 语义层
  = 场景三主系统；场景一和二的语义补充，不定义精确真实性
```

当前决策：

```text
OpenViking server PoC:                    GO
无 hook 的远程 /mcp Codex 接入:            GO，需隔离 PoC
安装官方 Codex Memory Plugin:              NO-GO
替代 Context Mode:                         NO-GO，除非完成逐项一致性验证
替代 AgentMemory exact Registry:           NO-GO
替代 OMX Wiki 的 agent-first 知识职责:     CONDITIONAL GO
```

## 项目归属、许可证与成熟度

### 归属结论

`OpenViking` 的 GitHub owner 是组织 `volcengine`。火山引擎官网明确表述“火山引擎是字节跳动旗下的云服务平台”。因此，以下表述有直接证据：

```text
OpenViking 是由 Volcengine 组织维护、具有 ByteDance / Volcengine 背景的开源项目。
```

但截至本页日期，没有发现将 OpenViking 明确归属给某个指定“字节跳动 AI 团队”、Seed 团队或特定实验室的官方声明。因此不应写成已证实的“某某字节 AI 团队项目”。

### 当前成熟度快照

| 项目属性 | 证据 |
| --- | --- |
| 仓库创建时间 | `2026-01-05` |
| 当前正式版本 | `v0.4.9`，发布于 `2026-07-13T09:19:44Z` |
| 许可证 | `AGPL-3.0` |
| 当前公开 issue 数 | 约 `329`，随上游变化 |
| 上游活动 | 主分支持续提交、PR/主分支/API/CLI/CodeQL/周度安全扫描等 workflow 均处于 active 状态 |
| 近期 CI 信号 | 多条 API/CLI integration 与 PR workflow 成功；本次查看时一条 scheduled API-effect workflow 失败，公开 failed-step 日志未给出具体断言根因 |

这说明它不是无人维护的实验仓库，但仍是高频演进的 `0.x` 服务。近期 release 仍在修复 peer 归属、memory 写入位置、resource write lock、vector 并发、OAuth/MCP 与 parser 路径问题。活跃度是积极信号，接口与语义仍快速变化也是生产风险。

### 学术与评测背景

README 说明 OpenViking 开源了 `VikingMem` 论文描述的一部分核心能力：

```text
VikingMem: A Memory Base Management System for Stateful LLM-based Applications
arXiv:2605.29640, submitted 2026-05-28, revised 2026-06-12.
README 称该论文被 VLDB 2026 接收。
```

这提升了设计思想的可信度，但不能直接证明当前 `v0.4.9` 的工程实现已经适合本环境。论文、README benchmark 和本 NAS/Codex 集成是三个不同的证据层。

## 核心架构与数据模型

OpenViking 的定位是 `Context Database for AI Agents`，不是传统 Wiki，也不只是向量库。

### 三类 Context

| 类型 | 目的 | 生命周期 | 主动方 |
| --- | --- | --- | --- |
| `Resource` | 知识、文档、规则、代码库等 | 长期、相对静态 | 用户或系统导入 |
| `Memory` | Agent 的事实、偏好、经验、判断 | 长期、动态变化 | Agent 记录与提取 |
| `Skill` | Agent 可复用操作知识与能力配置 | 长期、相对静态 | 用户或系统添加 |

这正匹配“弱化人类编辑、以 Agent 消费和生产知识为中心”的目标。人类主要通过 Studio/CLI 进行审计、纠错、资源检查和恢复，而不是维护一套页面编辑工作流。

### L0/L1/L2 渐进上下文模型

| 层级 | 内容 | 典型上限 | 用途 |
| --- | --- | --- | --- |
| L0 | `.abstract.md` | 约 100 tokens | 向量检索粗筛 |
| L1 | `.overview.md` | 约 2k tokens | rerank、导航与有限注入 |
| L2 | 原始完整资源/目录 | 不限 | 按需读取完整细节 |

这一设计可降低把全部历史直接塞回 prompt 的 token 成本，但它是检索/加载策略，不是对“上下文绝对正确”的保证。

### 存储与检索设计

```text
RAGFS / VikingFS / AGFS
  = 内容事实源，保存 L0/L1/L2、资源和关系

Vector Index
  = 只保存 URI、vector 与 metadata，不保存完整文件内容

Retrieval
  = intent analysis -> hierarchical retrieval -> rerank -> results
```

优点是向量索引可视为派生状态，内容不是只存在于 vector DB 中。`find` 用于快速无 session 检索，`search` 可带 session 与 intent analysis，`recall` 使用类型配额做 memory recall。

## 场景一：同会话 compact continuity 的深度判断

### 官方 plugin 已实现的链路

OpenViking 的 Codex Memory Plugin 声称并实现了以下 lifecycle：

```text
SessionStart
  -> 根据 active-window / idle TTL 清理或提交 orphan session

UserPromptSubmit
  -> query OpenViking
  -> 将 recall 结果包装为 additionalContext 注入当前 turn

Stop
  -> 读取 Codex transcript
  -> 追加新 turn 到确定性 OpenViking session: cx-<codex-session-id>

PreCompact
  -> catch up 未捕获 turns
  -> commit 完整 compact 前 transcript
```

这解释了它为什么看起来可以处理场景一。它的 `PreCompact` 实现确实会提交完整 pre-compact transcript；失败时保留状态供之后 sweep 或 SessionStart 重试，而不是丢弃 session。

### 不能据此宣称已严格解决场景一的原因

1. 上游设计文档明确写明 Codex **没有 clean SessionEnd**。因此 session 结束与 orphan 处理不是原子生命周期事件，而是 active-window/idle-TTL 启发式。
2. `session.commit()` Phase 1 只同步归档 messages 并返回 `task_id`；Phase 2 才异步生成 L0/L1、提取 memory、写 `memory_diff.json` 与 `.done`。compact 后紧接着的新 prompt 可能发生在语义提取尚未完成的窗口内。
3. `PreCompact` 输出可以是 no-op。服务器不可达或 commit 异常时它不会阻塞 Codex compact，而是保留本地 plugin state 留待重试。这是有韧性的 fail-open 捕获策略，不是 fail-closed 恢复协议。
4. OpenViking plugin 与当前 Context Mode 在 `SessionStart`、`UserPromptSubmit`、`Stop`、`PreCompact` 的职责冲突。两套系统同时注入上下文和写入状态时，没有已验证的 hook 顺序、token 预算、重试或去重契约。
5. OpenViking 不提供 Context Mode 的 `ctx_*` 大输出处理、FTS 工作区索引和当前 work-unit 事件检索，因此即使 plugin recall 好用，也不是 Context Mode 的完整功能等价物。

### 场景一结论

OpenViking 是值得单独验证的 scene-1 comparator，但在现有环境中不应安装 plugin。只有在隔离环境完成下列测试后，才讨论替代任何现有 hook：

- 连续多次 compact 后，对刚刚发生的决定、未完成动作和文件修改的 recall 准确率。
- commit accepted 到 `.done` 的延迟分布、失败率和 retry 行为。
- server 断开、VLM 超时、embedding 失败、plugin 重启、并发 Codex session 时的完整性。
- recall 注入是否产生 token 挤占、陈旧事实、提示注入或重复上下文。

## 场景二：精确跨会话 handoff 的深度判断

### OpenViking 已具备的相关能力

- 中心 server 能保存 user-scoped session、message archive、memory 和 resource。
- session commit 会保留 `messages.jsonl`、history archive、L0/L1、`memory_diff.json` 和 `.done`。
- `search` 可以带 `session_id`，memory/session 由 account/user/peer namespace 隔离。
- 远程 MCP 可以跨客户端访问相同 account 的资源与对应 user memory。

这些能力足以做**语义上的跨会话继续**：例如“过去关于 NAS OpenViking PoC 做了什么”。

### OpenViking 当前不具备的关键契约

内建 MCP 工具是：

```text
find, search, recall, read, list, remember, add_resource,
list_watches, cancel_watch
```

没有以下能力：

```text
exact handoff publish / resolve
source session identity lock
source cwd binding
handoff label contract
schema version validation
canonical payload SHA-256 verification
required semantic-record digest match
fail-closed lifecycle finalization
```

因此，OpenViking 的 recall 不能取代 AgentMemory Registry。相似的 memory、L0/L1 摘要、resource URI 或 session archive 都只能补充已验证 Registry handoff，不能成为 exact identity 的来源、替代或否决者。

### 场景二结论

维持当前 AgentMemory 的职责：

```text
AgentMemory Registry
  = sourceSessionId + sourceCwd + handoffLabel + schemaVersion + payloadSha256
  = exact authority, fail closed

OpenViking
  = semantic evidence, related resources, stable knowledge references
  = never identity authority
```

如果未来希望 OpenViking 单独承担场景二，需要其上游提供同等精确的 Registry API 与验证协议；或者自建一个兼容 Registry。后一种情况已经不是“只用一个 OpenViking 项目”。

## 场景三：中心化长期知识与 Agent Memory

### 独立服务与多客户端

OpenViking 支持 standalone HTTP server，可通过 Docker 持久挂载整个 `/app/.openviking`。服务端内建 `/mcp`，任何兼容 MCP 的客户端可以通过 HTTP 连接，不需要额外的 MCP server process。

标准远程 MCP 形态：

```text
Codex client
  -> HTTPS reverse proxy
  -> OpenViking /mcp
  -> resources / memories / sessions / skills
```

OpenViking 文档示例使用 `Authorization: Bearer <api-key>`。Codex 官方 `config.toml` 支持 remote Streamable HTTP MCP 的 `url`、`bearer_token_env_var`、`http_headers` 和 tool allowlist，因此传输层兼容性明确；但本环境尚未做真实连接，仍属于 PoC 必验。

### 多租户、权限与隔离

| 角色 | 作用域 | 能力 |
| --- | --- | --- |
| ROOT | 全局 | 创建/删除 account、跨租户访问、用户管理 |
| ADMIN | 单 account | 管理同 account 用户、重置 user key |
| USER | 单 account | 自身 user/peer/session 数据与 account 共享资源 |

数据边界：

| 数据 | 跨 account | 同 account 默认共享 | 默认边界 |
| --- | --- | --- | --- |
| `viking://resources` | 否 | 是 | account |
| user resource | 否 | 否 | user |
| peer resource | 否 | 否 | user/peer |
| memory | 否 | 否 | user/peer |
| skill | 否 | 否 | user |
| session | 否 | 否 | user/session |

首期 NAS 部署只能使用 `api_key` 模式。`trusted` 只适合已有可信身份网关的环境，`dev` 是 localhost 开发模式，不能暴露到网络。

### 资源导入、来源与增量同步

官方支持的文档资源包括：

```text
Markdown, PDF, HTML, DOCX, TXT, EPUB
```

还支持本地文件、URL、Git repository、sitemap/RSS/Atom，以及特定 Feishu 文档导入。`add_resource` 可以指定稳定 `viking://` URI；目标已存在时支持增量更新。`watch_interval` 可以持久化 watch task，按计划重新导入资源。

重要行为：语义摘要与 vectorization 走 `SemanticQueue` 异步处理。Git import 的 `wait=false` 可先返回 `task_id`，后续阶段为 `queued/fetching/parsing/finalizing/processing_queue`。任何迁移工具都必须轮询任务完成，而不能把“已接受”当成“已可检索”。

### Studio 与人类角色

`/studio` 提供资源树、retrieval、request log、token/context-commit 趋势等审计界面。它不是 BookStack/Outline 式多人协作 Wiki，但对本项目“人类仅审计、纠错、恢复和偶尔检查”的定位足够接近。

## 模型、检索和隐私边界

### 模型层

OpenViking 将 dense embedding 与 VLM/LLM 配置分开：

```text
dense embedding
  -> vector retrieval

VLM / LLM
  -> L0/L1 generation, semantic extraction, memory extraction
```

当前配置文档支持 OpenAI-compatible embedding：可设置 `api_base`、`api_key`、`model`、`dimension` 和 `encoding_format`；也支持 local GGUF、Ollama 等路径。它可对接当前 OpenAI-compatible embedding endpoint，但必须新建独立 index namespace，不能和 AgentMemory 的现有 vector collection 混用。

限制：OpenAI-compatible/Ollama/local embedding 是 dense-only。上游不会自动补 BM25 或 sparse fallback；要使用 hybrid retrieval，需要配置被支持的 sparse/hybrid provider。模型内存与吞吐由模型/服务商决定，不由 OpenViking 承诺。

### 数据外发与隐私

OpenViking 的 privacy config 主要处理 skill 中的 `api_key`、`token`、`base_url` 等敏感字段：先提取并替换占位符，再按需要恢复。它不是通用的文档脱敏、DLP 或“禁止向外部 embedding/VLM/LLM endpoint 发送内容”系统。

当前 AgentMemory 的 embedding、LLM endpoint 是远程 HTTPS 服务，不是已确认的 NAS 本地模型。因而首期必须定义数据分级：

```text
secret
  -> 不进入 OpenViking resource/memory，不进入 embedding/rerank/VLM

internal
  -> 只有 endpoint 归属、留存与访问控制获批准才可发送

shareable
  -> 可用于 PoC corpus
```

### 现有 Benchmark 的证据质量

README 公布的是 OpenViking 自己的 `0.3.22` 评测，不是对本 NAS 的独立验收：

| 场景 | 上游报告值 |
| --- | --- |
| LoCoMo / OpenClaw | 24.20% -> 82.08%，平均查询时间 95.14s -> 38.8s |
| LoCoMo / Claude Code | 57.21% -> 80.32%，平均查询时间 49.1s -> 20.4s |
| tau2-bench retail | 70.94% -> 77.81% |
| tau2-bench airline | 54.38% -> 66.25% |
| HotpotQA | top-5: 72.75%；top-20: 91.00%，但每问输入 token 增至 12,533 |
| 五开源数据集单轮 RAG | 66.87% average accuracy、0.19s retrieval latency（上游环境） |

这些指标说明上游确实按长对话记忆、Agent experience memory、knowledge QA 三类场景评估产品；它们不能证明本环境中的中文 Wiki、模型端点、权限隔离、NAS I/O 或 Codex hook 质量。

## 存储、恢复、备份与安全

### 写入一致性与恢复

核心写操作 `rm`、`mv`、`add_resource`、`session.commit` 使用 path locks 与 redo log。文档列出的恢复策略包括：

```text
session.commit Phase 2 crash
  -> RedoLog recovery on restart

enqueue 后 worker 前崩溃
  -> QueueFS SQLite persisted queue, worker restart recovery

add_resource semantic processing crash
  -> lifecycle lock expiry, processor re-acquires on restart

orphan vector index
  -> on-demand L2 cleanup
```

这是强于“只保存向量”的设计，但需要通过真实重启、断网、VLM timeout 和破坏性恢复演练验证。

### Snapshots 与 multi-write

Snapshot 是每个 `account_id` 的 Git-like 不可变 commit 历史，可 diff、dry-run restore 和按 subtree 或 whole account tree restore。它不是异地备份。

RAGFS 支持 primary backend 写入多个 backup backend，支持 local/S3 等示例。异步模式是最终一致性，官方明确建议需要强读一致性时回退 primary 或不从可能滞后的 backup 读。

NAS 推荐原则：

```text
primary workspace / QueueFS SQLite
  -> NAS 本机 ext4/btrfs/ZFS Docker bind mount
  -> 不放在 SMB/NFS 二次挂载目录

backup
  -> 独立对象存储或独立受控同步目标
  -> 定期离线 restore drill
```

### 多实例说明

部署文档有共享 workspace 的 multi-instance notes：shared temp upload、`skip_process_lock=true`、每实例独立 QueueFS SQLite 和 usage-audit SQLite path。它说明上游考虑了多实例场景，但没有构成已验证的 active-active、自动故障切主或 NAS HA 承诺。首期仍应设计为单实例、单写者、可恢复。

### 加密与观测

上游提供静态加密设计：root key -> account key -> per-file AES-256-GCM data key。该功能未替代 TLS、密钥托管、主机安全、模型外发控制或独立安全审计。

可用运维入口：

```text
/health, observer/*
  -> service, queue, vector DB, VLM 状态

/metrics, Prometheus, OTel
  -> request/error/latency/queue telemetry

/studio, ov tui, request logs
  -> resource, retrieval, audit, debugging
```

## 与当前环境的冲突与正确协作方式

### 不能安装官方 Codex plugin

官方 plugin 同时使用：

```text
SessionStart
UserPromptSubmit
Stop
PreCompact
```

当前环境已明确分工：

```text
Context Mode
  -> current-work-unit event capture
  -> same-session compact recovery
  -> ctx_* retrieval

AgentMemory
  -> NAS-backed exact handoff Registry
  -> source identity/schema/label/digest verification
```

在未建立 hook ordering、retry、token budget、deduplication 和 failure semantics 的共同契约前，叠加 OpenViking plugin 会导致：

- 同一 prompt 被多套 recall 注入，增加陈旧或相互矛盾的上下文。
- 同一 transcript 被多套 Stop/PreCompact 写入，产生重复或不一致记忆。
- OpenViking 的语义 recall 被误用为 AgentMemory exact handoff 的事实来源。
- 异步 extraction、Context Mode compact 和 AgentMemory finalization 的失败策略互相遮蔽。

### 唯一可接受的首期接入

```text
1. 不安装 OpenViking Codex plugin。
2. NAS OpenViking 只暴露 HTTPS /mcp，采用 api_key mode。
3. Codex 以远程 Streamable HTTP MCP 直接连接，不引入额外 MCP gateway。
4. 初期 tool allowlist 只开放 find/search/recall/read/list。
5. 通过来源、隔离、恢复与外发控制验收后，再开放 remember/add_resource。
6. AgentMemory Registry 与 Context Mode 的现有 lifecycle 不作变更。
```

无 hook MCP 不会自动保存每一轮 transcript。这是首期故意保留的边界：先验证读路径和有来源的显式写入，再评估是否需要受审计的自动 capture 方案。

## NAS 适配性

本轮已知 NAS 快照：x86_64、8 CPU、31 GiB RAM、可用约 8.9 GiB、可用磁盘约 104 GiB、Docker 28.5.2；未确认 GPU、Ollama、vLLM 或 nvidia-smi，Emby 约占 14.16 GiB。

结论：

- OpenViking 作为 server + 外部模型 endpoint 有机会适配，但上游没有可直接套用的 NAS CPU/RAM/并发容量基线。
- 不能把现有 Qwen3-Embedding-8B@4096 endpoint 视为 NAS 本地能力；它是远程 HTTPS endpoint。
- 不应在当前余量上假定可本地运行 8B embedding 或复杂 VLM extraction。
- RAGFlow 仍不适合作为 NAS 第一阶段：上游最低要求 4 CPU、16 GiB RAM、50 GiB 磁盘，且依赖 Elasticsearch/Infinity、MySQL、MinIO、Redis。

## 与其他候选的定位

| 候选 | 与本目标的关系 |
| --- | --- |
| OpenViking | 首选 agent-first 中心 semantic context service；唯一可直接暴露内建 HTTP MCP 的主候选。 |
| Mem0 OSS Server | REST memory service，认证/审计/配置成熟度较好；自托管主 server 无可作为新基础的官方远程 MCP，旧 OpenMemory MCP 已 sunset，因此会引入 bridge。 |
| AnythingLLM | 多用户 RAG/Agent 应用，其 MCP 主要是作为 client 连接外部 MCP servers；未证明能将自身知识库作为远程 MCP 直接提供给 Codex。 |
| RAGFlow | RAG 能力强但当前 NAS 资源不适合首期。 |
| SwarmVault | 本地/仓库侧 context compiler，不是中心多客户端 server；不再是本目标主候选。 |
| BookStack/Outline/Docmost | 面向人类协作，当前人类角色已弱化，不应作为新默认架构中心。 |

## 必须通过的 OpenViking PoC 验收项

### 服务与权限

1. NAS 本机持久卷下的单实例启动、重启、健康检查、QueueFS recovery。
2. `api_key` 模式下的 ROOT/ADMIN/USER；跨 account 绝对隔离。
3. 同 account `viking://resources` 可共享；不同 user 的 memory/session 不泄漏。
4. TLS、reverse proxy、key rotation、最小权限和日志脱敏。

### Codex 接入与场景边界

1. 两个隔离 Codex 客户端可直连 HTTPS `/mcp`，无需 plugin 或自建 bridge。
2. 没有新的 lifecycle hook；Context Mode 和 AgentMemory 行为不变。
3. OpenViking semantic recall 不得覆盖、否决或替代 AgentMemory Registry handoff。
4. `find/search/recall/read/list` 的工具权限和结果引用符合预期。

### 知识质量与来源

1. 以 OMX Wiki Markdown 的只读副本建立中文/中英混合 benchmark corpus。
2. 每个资源记录 `source_uri`、`source_sha256`、source commit/revision、分类、captured time。
3. 每条 memory 回链 resource URI 与来源；LLM summary/entity/tag 只能是派生工件。
4. 衡量 citation correctness、freshness、CJK recall、next-action usefulness、提示注入抗性与过期资源处理。

### 模型、恢复与回滚

1. 外部 embedding/VLM/LLM 的端点归属、留存与允许语料范围获明确批准。
2. embedding model、dimension、chunker、metadata schema 或 ACL 改变时，新建 index namespace；禁止混写。
3. resource import、watch update、session commit 的 task status、失败率和 p95 延迟可观测。
4. 模拟 VLM timeout、server restart、queue crash、vector index rebuild，验证内容事实源可恢复。
5. 验证 snapshot dry-run/restore、multi-write 延迟、独立离线 backup restore；旧 index 保留期内只读，支持回滚。

## 后续决策门槛

| 结论 | 所需证据 |
| --- | --- |
| 作为场景三主服务 | 上述 PoC 全部通过，尤其是权限、来源、中文检索、恢复、模型外发控制。 |
| 开放 `remember`/`add_resource` 写入 | 证明有来源、可审计、可撤销，不会写入 secret 或无证据事实。 |
| 自动 capture | 先设计独立、可审计、去重、可观测的策略；不得直接叠加官方 plugin。 |
| 替代 Context Mode | 必须证明 compact 后立即连续性、工具输出处理、hook failure behavior 都不退化。 |
| 替代 AgentMemory Registry | 需要 OpenViking 原生或兼容的 exact publish/resolve、source identity、digest、schema 与 fail-closed 协议；当前不具备。 |
| 迁移/退役 OMX Wiki | 资源导入的保真、检索、恢复、引用与回滚全部通过；保留旧 Wiki 只读观察期。 |

## 不应回退的事实

- OpenViking 的语义 memory 永远不能成为 AgentMemory exact handoff 的 identity authority。
- Snapshot 与 async multi-write 不是离机备份或自动 HA 的同义词。
- OpenViking privacy config 不是通用 DLP；模型外发仍需独立管控。
- 上游 benchmark 是积极但非本地、非独立、非生产验收证据。
- 在当前环境安装官方 OpenViking Codex plugin 会造成 hook 职责重叠，除非先有完整替换计划与隔离验证。

## 相关页面

- [[agentmemory-and-swarmvault-cooperation-evaluation-2026-07-07]]：AgentMemory Registry 与 SwarmVault 的既有边界。
- [[codex-long-term-knowledge-base-research-2026-07-05]]：早期长期知识库候选与 OMX Wiki 问题。
- [[nas-self-hosted-knowledge-stack-deployment-blueprint-2026-07-05]]：已被 agent-first 目标部分替代的旧部署蓝图。
- [[agentmemory-gpt-5-4-mini-incident-and-qwen3-embedding-8b-switch-plan-2026-07-10]]：模型端点与 vector dimension 的历史事故和索引迁移约束。
