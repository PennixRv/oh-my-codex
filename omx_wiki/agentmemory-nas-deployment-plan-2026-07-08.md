---
title: "AgentMemory NAS 部署计划 2026-07-08"
tags: ["agentmemory", "nas", "deployment", "codex", "router", "plan", "self-hosted"]
created: 2026-07-08T09:30:00.000Z
updated: 2026-07-08T09:30:00.000Z
sources:
  - "omx_wiki/subconverter-compose-environment-reference.md"
  - "omx_wiki/subconverter-compose-session-2026-06-23.md"
  - "subconverter-compose/omx_wiki/2026-06-30-家庭网络完整体检.md"
  - "codex-config/openspec/changes/archive/2026-01-20-fix-memory-mcp-client-json-fallback/proposal.md"
  - "omx_wiki/agentmemory-suitability-and-deployment-evaluation-2026-07-05.md"
  - "omx_wiki/agentmemory-router-model-survey-2026-07-07.md"
links: ["agentmemory-suitability-and-deployment-evaluation-2026-07-05.md", "agentmemory-router-model-survey-2026-07-07.md", "nas-self-hosted-knowledge-stack-deployment-blueprint-2026-07-05.md"]
category: architecture
confidence: high
schemaVersion: 1
---

# AgentMemory NAS 部署计划 2026-07-08

> 历史说明：本页是部署前计划，不是最终落地记录。当前实际部署后的 embedding 选型、compose 文件命名收敛、`gpt-5.4-mini` 实际调用验证与增强建议，已由 [[agentmemory-已验证部署与增强路线-2026-07-08]] 接管。

## Scope

这页不是立即部署记录，而是当前环境下 `agentmemory` 的正式前置实施计划。

目标只有一个：

- 在家里 NAS 上部署一个中心化 `agentmemory` 服务。
- 让家里、公司、笔记本等多个 `Codex` 共用它。
- 第一阶段以 **稳定、保真、边界清楚** 为优先级。

这页只收敛：

1. 基础设施假设。
2. 服务拓扑。
3. 域名与目录决策。
4. `env` / embedding / auth 决策。
5. 验证门槛与 rollout 顺序。

不在这页展开：

- 实际 `docker compose` 文件内容。
- 具体反向代理配置细节。
- 真实部署日志。

## 结论先行

当前最稳的实施方向是：

1. 服务本体部署在 NAS。
2. 只公开 `REST 3111`，viewer 保持内网化。
3. 不复用 `memory.141242.xyz`，因为这个域名在旧工作流里已经承担过别的 memory MCP 语义。
4. `agentmemory` 第一阶段先接你现有的 `router.tumuer.me` embedding 路由站。
5. 默认 embedding 模型选 `BAAI/bge-m3`，把 `text-embedding-3-small` 作为基线对照。
6. 第一阶段不开自动压缩、自动注入、LLM consolidation。
7. 先做单机 `Codex` 接入，再做多机 rollout。

## 当前环境事实

## NAS 与入口

当前已确认：

- NAS SSH 公网入口：`nas-ssh.141242.xyz:6022`
- NAS LAN 地址：`192.168.31.220:6022`
- Gitea 已通过 `https://gitea.141242.xyz:9999` 对外服务
- Gitea SSH 已通过 `gitea-ssh.141242.xyz:3022` 对外服务
- 当前 NAS 上已有长期运行的 `docker compose` 服务目录形态：
  - `/vol1/1000/docker/subconverter-compose`

这说明：

- NAS 已经是一个长期在线的家庭服务节点。
- 对外域名、证书、端口转发、反向代理都不是新能力。
- `agentmemory` 应当复用这套能力，而不是单独发明一套新工作流。

## 路由器与家庭网络

当前已确认：

- 路由器系统：`ImmortalWrt 24.10-SNAPSHOT`
- 路由器地址：`192.168.31.1:22`
- 工作站可通过 `ProxyJump nas` 到路由器
- 路由器 `nginx:9999` 当前已承载多个子域反代
- 已知映射包括：
  - `gitea.141242.xyz -> 192.168.31.220:3000`
  - `proxy.141242.xyz -> 192.168.31.220:25501`
  - `cch.141242.xyz -> 192.168.31.220:23000`

这说明：

- 家庭公网入口已经形成“路由器反代 -> NAS 内网服务”的稳定模式。
- `agentmemory` 最合理的公网暴露方式，也应当服从这条现有路径。

## 已确认的域名冲突边界

这是本次计划必须明确写下来的点。

`memory.141242.xyz:9999` 在旧工作流中已经被用于别的 memory MCP 语义，而不是给 `agentmemory` 预留的空白子域。

因此：

- 本次计划 **不能** 再把 `memory.141242.xyz` 当作默认目标域名。
- 应当新建一个单独子域，避免语义与历史配置冲突。

## 推荐目标域名

第一推荐：

```text
agentmemory.141242.xyz:9999
```

备选：

```text
amemory.141242.xyz:9999
agent-memory.141242.xyz:9999
```

这里优先 `agentmemory.141242.xyz` 的原因是：

1. 语义清楚。
2. 不与旧 `memory.141242.xyz` 混淆。
3. 与现有 `gitea` / `proxy` / `cch` 命名风格一致。

## 目标服务拓扑

建议的第一阶段拓扑：

```text
Internet / remote Codex
  -> router nginx :9999
  -> agentmemory.141242.xyz
  -> NAS 192.168.31.220:3111

viewer
  -> NAS 127.0.0.1:3113
  -> only via LAN / SSH tunnel / VPN
```

对应原则：

1. 公网面只暴露 API，不暴露 viewer。
2. 客户端统一使用一个远端 `AGENTMEMORY_URL`。
3. `Codex` 侧不需要知道 NAS 的 LAN 地址，只需要知道正式域名。

## 目录与运行形态

## 推荐目录

建议新建：

```text
/vol1/1000/docker/agentmemory/
  compose/
  data/
  logs/
  .env
```

目录职责：

- `compose/`
  - 存放 `docker compose` 文件和后续可能的模板
- `data/`
  - 持久化 `agentmemory` 数据
- `logs/`
  - 如后续需要单独挂出日志目录，可放这里
- `.env`
  - 服务侧 secrets 与 provider 配置

## 为什么继续用 docker compose

不是因为它“最先进”，而是因为它最贴合你当前 NAS 的运维现实。

原因：

1. 现有 NAS 服务已经长期采用 `/vol1/1000/docker/<service>` 结构。
2. 这套模式已经和你的备份、SSH、排障习惯对齐。
3. 与其另起一个裸机 Node 守护体系，不如先沿用现成编排面。

## 但不能照抄上游默认 deploy 模板

必须保留这个边界：

- 不能把上游根目录 `docker-compose.yml` 当成生产模板。
- 不能假设官方 deploy 路线天然适合本地 embedding。

原因：

1. 上游根目录 `compose` 更偏 `iii-engine` 视角。
2. 上游某些 deploy 路线会省略 optional deps，影响本地 embedding / reranker。
3. 我们当前的第一阶段目标不是“最快跑起来”，而是“最稳接住多地 Codex”。

## 第一阶段能力决策

## 目标能力

第一阶段只承诺这些能力：

1. 共享 memory server
2. capture
3. search / recall
4. 跨会话 handoff
5. 多机共享接入

## 暂时关闭的能力

第一阶段建议显式关闭：

```text
AGENTMEMORY_AUTO_COMPRESS=false
AGENTMEMORY_INJECT_CONTEXT=false
CONSOLIDATION_ENABLED=false
```

原因：

1. 先验证服务本体是否稳定。
2. 先验证 recall 质量是否值得继续投入。
3. 避免把副作用来源混进初始验证。

## embedding 决策

## 第一阶段不优先本地 embedding

这不是说本地 embedding 不可行，而是说：

- 在当前 NAS 远端容器语境里，它不是最稳的第一步。

原因：

1. 上游对 local embedding 的文档与源码存在漂移。
2. 远端容器路线下 optional deps 容易成为隐性变量。
3. 你已经有一个实测可用的 OpenAI-compatible embedding 路由站。

## 第一阶段推荐 embedding 路线

直接使用：

```text
https://router.tumuer.me/v1
```

并显式把它只用于 embedding，不让它接管 LLM provider。

## 默认首选模型

```text
BAAI/bge-m3
```

原因：

1. 更贴近中文 + 代码 + 会话文本混合场景。
2. 已经在现有路由站上实测能走标准 `/v1/embeddings`。
3. 维度固定清楚：`1024`。

## 基线对照模型

```text
text-embedding-3-small
```

作用：

1. 作为最稳的协议基线。
2. 后续若 `bge-m3` 表现异常，可以快速切回。

## 第一阶段不优先的模型

以下不作为第一批上线候选：

1. 需要额外 body 参数的 NVIDIA embedding
2. Cohere 风格但当前路由站请求格式不稳定的 `embed-*`
3. 多模态取向的 `jina-clip-*` / `Qwen3-VL-*`
4. 外部 rerank 模型

## 推荐 env 决策

第一阶段推荐配置形态：

```bash
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_API_KEY_FOR_LLM=false
OPENAI_EMBEDDING_BASE_URL=https://router.tumuer.me/v1
OPENAI_EMBEDDING_MODEL=BAAI/bge-m3
OPENAI_EMBEDDING_DIMENSIONS=1024
```

基线切换版本：

```bash
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_API_KEY_FOR_LLM=false
OPENAI_EMBEDDING_BASE_URL=https://router.tumuer.me/v1
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_EMBEDDING_DIMENSIONS=1536
```

## 鉴权与公网暴露决策

## 必须项

```text
AGENTMEMORY_SECRET=<strong-random-secret>
```

第一阶段必须满足：

1. 公网 API 走 HTTPS。
2. 服务侧 bearer secret 打开。
3. viewer 不上公网。

## 不建议的暴露方式

以下不建议：

1. viewer 直接通过 `*.141242.xyz:9999` 暴露
2. 只依赖路由器源 IP 控制，不设 `AGENTMEMORY_SECRET`
3. 让客户端直接访问 `192.168.31.220:3111` 作为长期正式入口

原因：

1. 客户端分布在不同地点，LAN 地址不具备统一语义。
2. secret 是服务级能力，不应该用网络偶然性替代。
3. viewer 的内容天然比纯 API 面更敏感。

## 多机共享与隔离策略

第一阶段默认：

```text
AGENTMEMORY_AGENT_SCOPE=shared
```

原因：

1. 当前主要目标是“同一个人，多地 Codex，共享同一套 runtime memory”。
2. 不先引入不必要的逻辑隔离复杂度。

第二阶段如果要区分：

- 家里私人研发
- 公司工作环境

再引入：

- `USER_ID`
- `TEAM_ID`
- `AGENT_ID`

## 实施顺序

## Phase 0: 域名与目录准备

完成这些前置事项：

1. 选定新子域，优先 `agentmemory.141242.xyz`
2. 新建 NAS 目录 `/vol1/1000/docker/agentmemory`
3. 明确 `.env` 的 secret 与 embedding key 存放方式

## Phase 1: NAS 本机服务验证

目标：

- 证明服务本体可在 NAS 上稳定启动

验收：

1. `3111` 本机可访问
2. 数据目录持久化生效
3. `AGENTMEMORY_SECRET` 生效
4. embedding provider 能实际产出向量

## Phase 2: LAN 验证

目标：

- 证明工作站经 `192.168.31.220` 可以稳定访问服务

验收：

1. 工作站对 NAS 内网 API 通
2. viewer 仍只通过内网或 SSH 隧道访问
3. 路由器不需要新增业务逻辑即可维持可达性

## Phase 3: 公网域名验证

目标：

- 证明 `agentmemory.141242.xyz:9999` 能通过现有反代模式稳定访问

验收：

1. HTTPS 正常
2. secret 生效
3. viewer 未被错误暴露
4. 不影响 `gitea` / `proxy` / `cch` 既有入口

## Phase 4: 单机 Codex 接入

目标：

- 只在一台主力 `Codex` 上接入

验收：

1. MCP / hooks 路径稳定
2. `SessionStart`、`Stop`、`PreCompact` 相关行为没有明显噪音
3. 至少完成一次真实 recall 与一次跨会话 handoff

## Phase 5: 多机 rollout

顺序建议：

1. 家里主力机
2. 公司 `Codex`
3. 笔记本

不建议一开始三台一起接。

## 验收标准

部署是否算通过，不看“服务是否起来”，而看下面这些：

1. 单机接入时没有明显错误噪音。
2. 至少一次会话结束后的 recall 真正命中有价值内容。
3. 至少一次跨设备的 recall 命中一致。
4. embedding 路线稳定，没有出现维度错配。
5. 公网入口、viewer 边界、secret 行为都符合预期。

## 当前不做的事

这一轮明确不做：

1. 追求“纯本地 embedding”
2. 一开始就开自动压缩和自动注入
3. 让路由器承担 `agentmemory` 业务逻辑
4. 复用 `memory.141242.xyz`
5. 同时接入多台 `Codex`

## 最终实施目标

当前这一轮计划收敛后的目标形态可以写成：

```text
phase 1:
  host = NAS
  public domain = agentmemory.141242.xyz:9999
  public surface = REST 3111 only
  viewer = internal only
  auth = AGENTMEMORY_SECRET
  embedding = router.tumuer.me -> BAAI/bge-m3
  llm compression = off
  rollout = single Codex first, then multi-device
```

这就是后续真正开工时应遵守的标准版本。
