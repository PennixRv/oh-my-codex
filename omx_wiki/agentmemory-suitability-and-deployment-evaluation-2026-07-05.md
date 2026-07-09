---
title: "AgentMemory 适配性与部署评估 2026-07-05"
tags: ["codex", "memory", "agentmemory", "nas", "deployment", "mcp", "hooks", "research"]
created: 2026-07-05T08:20:00.000Z
updated: 2026-07-07T10:50:00.000Z
sources:
  - "https://github.com/rohitg00/agentmemory"
  - "https://github.com/rohitg00/agentmemory/blob/main/README.md"
  - "https://github.com/rohitg00/agentmemory/blob/main/INSTALL_FOR_AGENTS.md"
  - "https://github.com/rohitg00/agentmemory/blob/main/.env.example"
  - "https://github.com/rohitg00/agentmemory/blob/main/package.json"
  - "https://github.com/rohitg00/agentmemory/blob/main/docker-compose.yml"
  - "https://github.com/rohitg00/agentmemory/blob/main/plugin/.codex-plugin/plugin.json"
  - "https://github.com/rohitg00/agentmemory/blob/main/plugin/.mcp.json"
  - "https://github.com/rohitg00/agentmemory/blob/main/plugin/hooks/hooks.codex.json"
  - "https://github.com/rohitg00/agentmemory/blob/main/src/cli/connect/codex.ts"
  - "https://github.com/rohitg00/agentmemory/blob/main/src/config.ts"
  - "https://github.com/rohitg00/agentmemory/blob/main/src/providers/embedding/index.ts"
  - "https://github.com/rohitg00/agentmemory/blob/main/src/providers/embedding/local.ts"
  - "https://github.com/rohitg00/agentmemory/blob/main/src/state/reranker.ts"
  - "https://github.com/rohitg00/agentmemory/blob/main/src/state/vector-index.ts"
  - "https://github.com/rohitg00/agentmemory/blob/main/src/functions/smart-search.ts"
  - "https://github.com/rohitg00/agentmemory/blob/main/src/mcp/rest-proxy.ts"
  - "https://github.com/rohitg00/agentmemory/blob/main/src/cli/doctor-diagnostics.ts"
  - "https://github.com/rohitg00/agentmemory/blob/main/test/embedding-provider.test.ts"
  - "https://github.com/rohitg00/agentmemory/blob/main/deploy/coolify/README.md"
  - "https://github.com/rohitg00/agentmemory/blob/main/deploy/coolify/Dockerfile"
  - "https://github.com/rohitg00/agentmemory/blob/main/deploy/fly/README.md"
  - "https://github.com/rohitg00/agentmemory/blob/main/deploy/railway/README.md"
links: ["codex-memory-context-research-2026-07-05.md", "codex-memory-project-due-diligence-2026-07-05.md", "codex-long-term-knowledge-base-research-2026-07-05.md", "nas-self-hosted-knowledge-stack-deployment-blueprint-2026-07-05.md", "agentmemory-and-swarmvault-cooperation-evaluation-2026-07-07.md", "agentmemory-router-model-survey-2026-07-07.md", "agentmemory-nas-deployment-plan-2026-07-08.md"]
category: reference
confidence: high
schemaVersion: 1
---

# AgentMemory 适配性与部署评估 2026-07-05

## Scope

这页只回答 `agentmemory` 本身，不再泛谈整个 memory 开源生态。重点是四个问题：

1. 它是否真的适合作为我们在 `Codex` 环境中的第一落地对象。
2. 它的真实部署要求是什么。
3. 它是否适合部署在 NAS 上，再服务多地 `Codex`。
4. 它是否依赖外置 LLM、embedding、reranker 或外部数据库。

如果要看它与 `SwarmVault` 的组合判断，见 [[agentmemory-and-swarmvault-cooperation-evaluation-2026-07-07]]。

## 结论先行

截至 `2026-07-05`，如果当前第一目标是 `Codex` 的会话内/跨会话 memory 增强，而不是长期知识库替代，那么 `agentmemory` 依然是我看到的最强严格开源候选之一，适合做第一阶段 PoC。

但它不是“零瑕疵的全能选手”，也不能无条件视为“开箱即用的 NAS 共享记忆终局方案”。更准确的判断是：

1. 它很适合做 `T1/T2` 层，也就是 runtime memory、cross-session handoff、shared memory server。
2. 它不适合单独承担 `T3` 的 **canonical knowledge base 主库**。
3. 它不需要外部数据库。
4. 它不强制需要外部 LLM。
5. 但“零凭证即可获得稳定语义检索”这件事，当前 README / runbook / `.env.example` 与源码实现之间存在明显漂移，不能盲信营销口径。
6. 如果要部署在你的 NAS 上、服务家里/公司/笔记本的多个 `Codex`，技术上是可行的，而且是它比较合理的使用方式之一。

因此：

- 作为 `Codex memory enhancement` 的第一 PoC，我认可它。
- 作为“唯一记忆系统”或“最终知识底座”，我不认可它单独承担。

这里需要补一句边界修正：

- `agentmemory` 并不是完全没有 `T3` 能力。
- 它已经具备 persistent memory、semantic/procedural consolidation、export、governance、shared recall 这些长期记忆能力。
- 更准确的判断是：它能承担一部分甚至中等偏强的 `T3`，但它不是最适合做 **canonical vault** 的那一个。

## 上游真实形态

`agentmemory` 现在不是一个小插件，而是一整套平台化组件：

- 本地或远端的 memory server
- `MCP` shim
- `Codex` / `Claude Code` 插件 hooks
- 实时 viewer
- `iii` engine 运行时
- deploy 模板

从上游仓库元数据看：

- 仓库：`rohitg00/agentmemory`
- 许可证：`Apache-2.0`
- homepage：`https://agent-memory.dev`
- GitHub stars：`24,579`
- 仓库创建日期：`2026-02-25`
- latest release：`v0.9.27`，发布时间 `2026-06-07`
- 最近更新时间：`2026-07-05`

这说明它已经很热，但也仍然非常新，仍处在快速演化期。

## 对 Codex 的真实接入面

对 `Codex` 来说，它的接入面是真实存在的，不是 README 口头声称。

已确认的上游事实：

- `plugin/.codex-plugin/plugin.json` 明确声明了 `mcpServers` 和 `hooks`。
- `plugin/.mcp.json` 默认用 `npx -y @agentmemory/mcp` 启动 MCP shim。
- `plugin/hooks/hooks.codex.json` 为 `Codex` 注册了 `6` 个 hooks：
  `SessionStart`、`UserPromptSubmit`、`PreToolUse`、`PostToolUse`、`PreCompact`、`Stop`。
- `src/cli/connect/codex.ts` 会向 `~/.codex/config.toml` 写入 `[mcp_servers.agentmemory]`，默认 `AGENTMEMORY_URL=http://localhost:3111`。
- `Codex Desktop` 当前仍受 `openai/codex#16430` 影响，因此上游专门提供了 `agentmemory connect codex --with-hooks`，把同样的 hooks 镜像写到 `~/.codex/hooks.json` 作为 workaround。

因此它不是“只能手工拼接 REST API”的方案，而是已经把 `Codex plugin + hooks + MCP` 这套接入面做出来了。

## 它到底适不适合我们的工作

### 适合的部分

如果我们现在关心的是下面这些目标，`agentmemory` 是高度契合的：

1. 让多个 `Codex` 共享同一个 memory server。
2. 在长会话或跨会话时保留可搜索的上下文痕迹。
3. 既支持自动 capture，也支持人工/程序显式 recall。
4. 允许后续继续做 session handoff、context injection、history review、memory governance。
5. 允许家里 NAS 作为中心记忆节点，多个终端通过 `AGENTMEMORY_URL` 接入。

尤其是“多地 Codex 共享一个中心 memory service”这件事，`agentmemory` 明确支持：

- 插件和 MCP shim 都支持 `AGENTMEMORY_URL`
- 远端保护通过 `AGENTMEMORY_SECRET`
- README 明确把“一个 MCP 配置块兼容本地和远端部署”作为推荐路径

这与“NAS 部署一个中心服务，然后让家里/公司/笔记本上的 Codex 都接它”是同一类拓扑。

### 不适合的部分

如果我们对“第一工具”的期待是下面这些，`agentmemory` 就不是完全满足：

1. 同时成为长期知识库真相源。
2. 给人类提供很好的日常写作、审阅、diff、结构化编辑体验。
3. 完全无运维判断、无模型决策、无安全边界设计。
4. 开箱即用地提供“零凭证 + 零配置 + 远端容器化语义检索”。

更直白地说：

- 它是 runtime memory platform。
- 它不是 markdown-first 的长期知识系统。

也可以换一种更不容易误解的表达：

- 它擅长的是 **runtime-first long-term memory**。
- 它不擅长的是 **vault-first long-term knowledge base**。

所以它应该放在你未来知识栈里的 `AI memory / runtime handoff` 这一层，而不是替代 `SilverBullet` 这类长期主库。

## 部署模式与真实要求

## 1. 本地单机模式

这是最简单的路径。

真实要求：

- Node.js `>= 20`
- macOS / Linux / WSL2
- 端口 `3111`、`3112`、`3113`、`49134`
- 本地数据目录 `~/.agentmemory`

默认端口角色：

- `3111`: REST API
- `3112`: streams
- `3113`: viewer
- `49134`: `iii` engine websocket

`iii` 不需要你手工单独装成一个长期系统依赖。正常路径下 `agentmemory` 会自己把 pin 住的 `iii` 二进制拉到 `~/.agentmemory/bin`。

## 2. 从源码启动

上游 README 的 `From source` 路径是：

```bash
git clone https://github.com/rohitg00/agentmemory.git
cd agentmemory
npm install
npm run build
npm start
```

这里要特别注意一个容易误读的点：

- 仓库根目录的 `docker-compose.yml` 只负责 `iii-engine`。
- 它不是完整的 `agentmemory app + engine` 全栈部署文件。

如果直接把根目录 `docker-compose.yml` 当成 NAS 生产部署模板，会少掉真正的 `agentmemory` 应用进程。

## 3. 远端托管 / 自托管服务模式

上游已经提供了四类正式 deploy 文档：

- `deploy/coolify`
- `deploy/fly`
- `deploy/railway`
- `deploy/render`

这些模板的共同点是：

1. 对外只发布 `3111`
2. `3113` viewer 保持内网或隧道访问
3. 数据挂载到 `/data`
4. 首次启动生成 `AGENTMEMORY_SECRET`
5. 通过 bearer token 保护 API

这意味着：

- `agentmemory` 完全可以被当成一个中心服务部署
- 也确实适合被多个客户端共享

## 是否需要自托管 / 子托管

## 自托管

不是“必须自托管”，但如果你的目标是“家里 NAS 作为中心记忆服务，供多个 Codex 使用”，那本质上就是自托管，而且 `agentmemory` 非常适合这种模式。

上游没有官方 SaaS 作为主要接入面。它的设计中心仍是：

- 本地运行
- 自建远端服务
- 再由客户端通过 `AGENTMEMORY_URL` 指向它

所以如果你要共享，多半就是自己托管。

## 子域 / 单独 host

不强制需要单独子域，但我建议使用单独子域。

不强制的原因：

- 理论上只要反向代理能把 `/agentmemory/*` 正确转发给它，路径式代理也能工作。

我建议单独子域的原因：

1. `AGENTMEMORY_URL` 作为独立 base URL 更清晰。
2. bearer auth 更容易单独做。
3. 不容易和别的服务的路径规则、CSP、认证中间件混淆。
4. 后续 viewer、MCP、健康检查、备份与日志都更好隔离。

因此对 NAS 更合理的做法通常是：

```text
memory.example.com -> agentmemory REST 3111
viewer 不公开，走 VPN / SSH tunnel / 内网代理
```

## 它是否需要外置模型或外部数据库

## 外部数据库

不需要。

这是它的一个明显优点。README 直接把 `0 external DBs` 当成主卖点之一。

它不是那种默认要求：

- Postgres
- Qdrant
- Neo4j
- Redis

这种四件套的 memory 平台。

## 外部 LLM

不是硬依赖。

当前上游实现中：

- 没有 provider key 时，LLM provider 进入 `noop`
- 此时 capture / BM25 / 部分 recall 仍然能工作
- richer summary、reflection、consolidation、auto-compress 这类能力才需要 provider key

支持的 LLM provider 检测顺序是：

`OPENAI_API_KEY -> MINIMAX_API_KEY -> ANTHROPIC_API_KEY -> GEMINI_API_KEY or GOOGLE_API_KEY -> OPENROUTER_API_KEY -> noop`

所以：

- 不接外置 LLM 可以跑
- 但高级压缩和总结能力会明显下降

## 外部 embedding 模型

不是硬依赖，但这里存在一个必须单独强调的风险点：上游文档和源码并不完全一致。

从文档口径看，上游多处表达容易让人以为：

- 默认就是本地 embeddings
- 零凭证就能稳定开启 hybrid semantic recall

但从源码和测试看，事实更谨慎：

1. `createEmbeddingProvider()` 在没有 `EMBEDDING_PROVIDER` 且没有 embedding key 时会返回 `null`。
2. 官方测试 `test/embedding-provider.test.ts` 也明确断言“no API keys -> provider is null”。
3. 真正的本地 embedding provider 是 `LocalEmbeddingProvider`，加载的是 `@xenova/transformers` 和 `Xenova/all-MiniLM-L6-v2`。
4. 也就是说，当前源码层面不能把“local embeddings 默认自动启用”视为完全确认。

因此更可靠的说法是：

- 想要真正的 vector semantic recall，你需要显式确认 embedding provider 这一层。
- 可选路径是外部 embedding provider，或本地 `Xenova` embedding。

## 外部 reranker

不需要。

当前 reranker 是可选本地能力：

- 模型：`Xenova/ms-marco-MiniLM-L-6-v2`
- 量化：`quantized: true`
- 如果不可用，就直接回退到原始排序

因此 rerank 是增益项，不是硬前提。

## 2026-07-07 补充：embedding / reranker / LLM 应该怎么选

这一轮补充只回答一个更具体的问题：

1. `agentmemory` 到底需不需要外部 embedding 模型。
2. 本地 embedding / 本地 reranker 是否已经足够支撑第一阶段部署。
3. 如果要上外部 provider，上游更推荐哪一类，我们又该怎么选。

先给结论：

1. 对第一阶段 `Codex shared runtime memory` 部署来说，本地 embedding + 本地 reranker 是可以成立的。
2. 但“本地 embedding 默认自动启用”并不是源码已经证明的事实，必须显式配置并验证。
3. 外部 LLM 与 embedding 是两回事。第一阶段完全可以不接外部 LLM。
4. 如果后续实测发现本地向量召回质量不够，再把 embedding 单独切到外部 provider，比一开始同时引入外部 LLM + embedding 更稳。

### 1. 本地 embedding 不是硬依赖，但也不是当前源码里的自动默认

这里必须明确纠正上游文档容易造成的误解。

README 一方面写：

- `Local (recommended)`
- “best results, install local embeddings”
- 甚至还有一句 “Local embeddings ship out of the box”

但源码里的真实检测逻辑是：

1. `detectEmbeddingProvider()` 先看 `EMBEDDING_PROVIDER`
2. 然后才依次看 `GEMINI_API_KEY`、`OPENAI_API_KEY`、`VOYAGE_API_KEY`、`COHERE_API_KEY`、`OPENROUTER_API_KEY`
3. 如果这些都没有，就直接返回 `null`

也就是说：

- 没有显式 `EMBEDDING_PROVIDER=local`
- 也没有外部 embedding provider key

当前源码并不会自动回落到 `local` provider。

这与 README / `.env.example` 中“好像 local 是默认路由”的表达存在明显漂移。

更稳妥的工程结论是：

- 如果想使用本地向量检索，应该显式设置 `EMBEDDING_PROVIDER=local`
- 不要把“没配任何东西也会自动启用 local embeddings”当成已证明事实

### 2. 本地 embedding 还依赖 optional 依赖，不能假设一定已经随安装可用

`LocalEmbeddingProvider` 实际加载的是：

- `@xenova/transformers`
- 模型 `Xenova/all-MiniLM-L6-v2`

而 `package.json` 里这些都在 `optionalDependencies`。

这意味着：

1. 本地 embedding 路线是存在的。
2. 但如果 `@xenova/transformers` 没有真正安装到目标环境，本地 embedding 会直接报错并要求手工安装。
3. 因此“本地 embedding 可用性”必须被视为一个部署验证项，而不是默认事实。

这也解释了为什么：

- 本地裸机 Node 安装
- 和上游托管模板 / 裁剪后的容器安装

在最终能力上可能并不等价。

### 3. 上游对 embedding provider 的真实推荐

README 的 provider 表里，上游给出的取向大致是：

- `Local`：`all-MiniLM-L6-v2`，免费、离线、推荐起步
- `OpenAI`：`text-embedding-3-small`，标成 `Highest quality`
- `Voyage AI`：`voyage-code-3`，标成 `Optimized for code`
- `Gemini`：`gemini-embedding-001`，强调免费层与多语言

因此，如果只问“上游更推荐什么”：

1. 起步推荐：本地 embedding
2. 质量优先推荐：`OpenAI text-embedding-3-small`
3. 偏代码语义推荐：`Voyage voyage-code-3`

### 4. reranker 不需要外接服务，内置本地路线已经够用

当前 reranker 是本地可选能力：

- 模型：`Xenova/ms-marco-MiniLM-L-6-v2`
- 量化：`quantized: true`
- 加载失败时：直接回退到原始混合排序，不会让检索硬失败

这意味着：

- 没必要为了 `agentmemory` 再专门部署一个独立的外部 rerank 服务
- 第一阶段让它使用内置本地 reranker 就够了
- 真正值得单独决策的是 embedding，不是 reranker

### 5. 外部 LLM 不是第一阶段必需项

当前上游实现里，LLM provider 主要影响的是：

- richer compression
- summarization
- reflection
- consolidation
- auto-injection 这类更主动的记忆增强

而不是“是否可以有一个可用的 shared memory server”。

因此第一阶段完全可以：

- 不接外部 LLM
- 只做 capture / search / recall / handoff
- 等 recall 质量和工作流稳定后，再决定是否启用 `AGENTMEMORY_AUTO_COMPRESS` 或 `AGENTMEMORY_INJECT_CONTEXT`

### 6. 对我们当前环境的推荐排序

如果目标是“先稳、先保真、先把多地 Codex 共享记忆服务跑通”，我当前的推荐排序是：

1. **第一阶段默认方案**
   - `EMBEDDING_PROVIDER=local`
   - 显式安装 `@xenova/transformers`
   - 不接外部 LLM
   - 使用内置本地 reranker
2. **第二阶段质量优先方案**
   - embedding 切到 `OpenAI text-embedding-3-small`
   - 仍然暂时不急着打开 auto-compress / inject-context
3. **代码语义偏置方案**
   - 如果后续实测发现“代码记忆召回”明显比“通用文本记忆召回”更重要，再评估 `Voyage voyage-code-3`

我不建议一开始就把：

- 外部 LLM
- 外部 embedding
- auto-compress
- auto-inject

四件事一起打开。那样很难判断真正改善 recall 的到底是哪一层，同时也会更快把复杂度和副作用抬高。

### 7. 中文环境还有一个额外要求：建议补装 CJK 分词依赖

README 里明确写了：

- BM25 对希腊文、阿拉伯文、重音拉丁文等支持较好
- 但对 `Chinese / Japanese / Korean`，建议安装可选分词器

对应依赖是：

- `@node-rs/jieba`
- `tiny-segmenter`

如果不装，CJK 会退化成整段 tokenization。

这对你的实际工作流很重要，因为你的 session / memory 内容中有大量中文说明、决策和任务语句。

所以对我们这套环境，更稳的本地依赖组合其实是：

```text
@xenova/transformers
@node-rs/jieba
tiny-segmenter
```

### 8. 最终建议

这轮之后，我对 `agentmemory` 模型依赖面的最终建议是：

```text
phase 1:
  llm = none
  embedding = local (explicit, verified)
  reranker = built-in local
  cjk segmenters = enabled

phase 2:
  if recall quality is insufficient:
    embedding -> openai text-embedding-3-small
```

这条路径的好处是：

1. 最大限度降低外部依赖和变量数量。
2. 最容易判断“memory 服务本身是否有价值”。
3. 如果后续需要升级，只先替换 embedding 这一层，不会把整个系统同时重构。

## 一个关键现实问题：远端容器化部署默认并不等于“本地 embedding 可用”

这是本次尽调里最重要的新发现之一。

上游 deploy Dockerfile 并不是简单 `npm install @agentmemory/agentmemory`，而是：

```text
npm install "@agentmemory/agentmemory@${AGENTMEMORY_VERSION}" --omit=optional
```

而 `package.json` 里：

- `@xenova/transformers`
- `onnxruntime-node`
- `onnxruntime-web`

都在 `optionalDependencies`。

这意味着：

1. 上游官方远端部署模板默认会省掉 optional 依赖。
2. 本地 embedding 与本地 reranker 依赖这些 optional 包。
3. 所以“直接用上游托管 Dockerfile 部署到 NAS”这件事，不能自动等同于“语义向量检索已经启用”。

这点非常关键。它直接影响“我们是否真的能无外部 embedding API 地部署一个中心化共享 memory service”。

当前更稳妥的判断是：

- 如果用上游 deploy Dockerfile 原样部署，又不配外部 embedding provider，那么很可能只能稳定拿到 BM25 路径，而不是我愿意直接承诺的 full local semantic retrieval。

## 多机 / 多地 Codex 共享时的能力边界

`agentmemory` 本身对多 agent / 多角色共享是有设计的。

已确认能力包括：

- `TEAM_ID`
- `USER_ID`
- `AGENT_ID`
- `AGENTMEMORY_AGENT_SCOPE=shared|isolated`

默认模式是：

- 共享写入带标签
- recall 不隔离

也就是：

- 同一个 server 可以被多个 agent 共享
- 同时还能保留谁写入了什么的审计线索

如果需要更严格隔离，也可以切到 `isolated`。

对你的实际场景，这意味着：

- 如果只是你一个人从家里、公司、笔记本接同一套 memory，最简单是共享模式。
- 如果你未来希望把“个人研发 Codex”和“公司环境 Codex”做逻辑隔离，可以再引入 `AGENT_ID` / `TEAM_ID` 方案。

## 我对 NAS 落地的具体建议

如果我们真的要先实现它，我不建议盲目照搬任意一条 README 快速路径。我更建议按下面的方式落地。

## 推荐路线 A：NAS 上做中心服务，但自己控制镜像

这是我目前最推荐的路线。

做法：

1. 在 NAS 或 NAS 旁边的 Linux 主机上跑一个自定义容器。
2. 参考上游 `deploy/coolify` 的形状，而不是仓库根目录 `docker-compose.yml`。
3. 只公开 `3111`。
4. `3113` viewer 不公开，走内网、VPN 或 SSH 隧道。
5. 强制设置 `AGENTMEMORY_SECRET`。
6. 明确决定 embedding 路线：
   - 要纯本地语义检索：不要 `--omit=optional`，并显式安装 `@xenova/transformers`，同时设置 `EMBEDDING_PROVIDER=local`
   - 要省事：直接配 `Gemini` / `OpenAI` / `Voyage` 等 embedding provider
7. 初期保持这些开关关闭：
   - `AGENTMEMORY_AUTO_COMPRESS=false`
   - `AGENTMEMORY_INJECT_CONTEXT=false`
   - `CONSOLIDATION_ENABLED=false`

理由：

- 第一阶段先把“共享记忆服务 + recall 正常 + Codex 端接入稳定”跑通。
- 不要一上来就把 token 消耗、自动注入、副作用路径全打开。

## 推荐路线 B：裸机 Node 服务

如果 NAS 环境允许，裸机 Node 其实比“直接套上游 deploy Dockerfile”更直观。

优点：

- 更容易确认 optional dependencies 是否真的装上
- 更容易验证本地 embeddings 是否可用
- 更少受官方 deploy 模板裁剪影响

缺点：

- 运维上不如容器规整
- 需要你自己做守护、备份和反向代理

如果你非常在意“不依赖外部 embedding API”，这条路线反而可能比直接用官方托管 Dockerfile 更省事。

## 不推荐的路线

### 1. 直接把根目录 `docker-compose.yml` 当成 NAS 生产部署

不推荐原因：

- 它主要是 `iii-engine` compose，不是完整 app stack。

### 2. 直接公开 viewer 到公网

不推荐原因：

- 上游 deploy 文档本身就默认把 `3113` 留在内网或隧道里。
- viewer 的安全边界比 REST API 更值得保守处理。

### 3. 一上来就启用 auto-compress / inject-context

不推荐原因：

- 这会让你在还没有建立 recall 质量基线时，就把 token 成本和行为复杂度一起抬高。

## 当前最值得警惕的源码 / 文档漂移

本项目不是不能用，而是使用时必须比 README 更相信源码。

本次已确认的几个漂移点：

### 1. “零凭证默认 hybrid recall”口径并不稳

文档多处把默认模式描述成：

- BM25 + local embeddings
- 零凭证即可语义 recall

但源码和测试显示：

- 无 key、无 `EMBEDDING_PROVIDER` 时，embedding provider 可能就是 `null`
- onboarding 的 skip 路径甚至明确写的是 `BM25-only mode`

这不是小修辞差异，而是部署策略会因此变化。

### 2. README 写的是 `BGE-small`，源码实际加载的是 `all-MiniLM-L6-v2`

当前 `src/providers/embedding/local.ts` 实际模型是：

- `Xenova/all-MiniLM-L6-v2`

不是 README 那句 “BGE-small entirely on-device”。

### 3. 官方 deploy Dockerfile 会省掉 optional deps

这会直接影响：

- local embeddings
- local reranker

所以远端托管模板的默认能力边界，比 README 给人的印象更保守。

### 4. 根目录 compose 与 deploy 容器不是一回事

根目录 `docker-compose.yml` 是 `iii-engine` 视角，`deploy/*` 才是面向托管服务的一体化容器路径。

## 是否把它作为第一实施对象

我的最终判断是：

1. 如果第一目标是“为 Codex 增强 memory”，我认可把 `agentmemory` 放到第一实施位。
2. 但前提是把它定义成“共享 runtime memory service PoC”，不是“最终全能知识系统”。
3. 部署时不能偷懒照抄所有 README 口径，尤其要单独确认 embeddings 路线。

更直接一点：

- 作为你当前想做的 `Codex` memory 增强第一站：可以。
- 作为唯一长期知识底座：不可以。
- 作为 NAS 上的中心共享 memory server：可以。
- 作为“无任何模型决策即可稳定上线”的零维护方案：不可以。

## 当前推荐

如果下一步要真正动手，我建议把 `agentmemory` 的实施目标定义为：

```text
phase 1:
  target = codex shared runtime memory
  host = NAS or NAS-adjacent Linux box
  public surface = REST 3111 only
  viewer = internal only
  auth = AGENTMEMORY_SECRET
  embedding = explicit decision, not assumed default
  llm compression = off initially
```

这会是一个工程上更诚实、也更稳的起步方式。

## 对 OMX / 后续工作流的直接启发

无论最后是否采用它，`agentmemory` 已经证明了几件对我们有价值的事：

1. `Codex plugin + hooks + MCP + shared server` 这条路线是成立的。
2. `PreCompact`、`SessionStart`、`Stop` 这些生命周期点值得被当成一级能力看待。
3. 中心 memory service 可以服务多个 agent surface，而不必每个客户端各管一套。
4. 安全设计上，REST 对外、viewer 对内，是一个很合理的默认边界。

所以即便未来我们不完全采用它，它仍然非常值得作为第一阶段参考实现。

## 2026-07-07 补充：路由模型盘点与第一批选型

围绕用户现有的 `router.tumuer.me` OpenAI 兼容 embedding / rerank 站点，我额外做了一轮完整盘点、标准接口实测与官方能力比对。

详细矩阵见：

- [[agentmemory-router-model-survey-2026-07-07]]

如果要看已经结合当前家庭 NAS / 路由器 / 域名现实约束收敛出来的正式实施计划，见：

- [[agentmemory-nas-deployment-plan-2026-07-08]]

这一轮最重要的新增结论只有三条：

1. `agentmemory` 第一阶段应优先决策 embedding，而不是外部 rerank。
2. 现有路由站上最值得优先尝试的模型是 `BAAI/bge-m3`，其次是 `text-embedding-3-small` 与 `voyage-code-3`。
3. `Qwen` 家族在当前路由站上存在“不同别名返回不同维度”的现象，因此任何此类模型都必须按具体别名显式配置 `OPENAI_EMBEDDING_DIMENSIONS`，不能按家族名想当然。
