---
title: "AgentMemory 已验证部署与增强路线 2026-07-08"
tags: ["agentmemory", "codex", "nas", "deployment", "configuration", "cch", "gpt-5.4-mini", "enhancement"]
created: 2026-07-08T15:38:50+08:00
updated: 2026-07-08T16:22:00+08:00
sources:
  - "agentmemory-deploy/README.md"
  - "agentmemory-deploy/Dockerfile"
  - "agentmemory-deploy/.env.example"
  - "agentmemory-deploy/versions.lock"
  - "dot-codex/integrations/agentmemory.md"
  - "/home/penn/.npm-global/lib/node_modules/@agentmemory/agentmemory/README.md"
links:
  - "agentmemory-nas-deployment-plan-2026-07-08.md"
  - "agentmemory-0-9-27-r1-发布与-nas-上线记录-2026-07-08.md"
  - "agentmemory-本地-rerank-cch-gpt-5-4-mini-低成本增强方案-2026-07-08.md"
  - "agentmemory-router-model-survey-2026-07-07.md"
category: environment
confidence: high
schemaVersion: 1
---

# AgentMemory 已验证部署与增强路线 2026-07-08

## 这页的定位

这页是当前 `agentmemory` 在本地 `Codex + NAS + CCH` 环境中的**唯一可信部署基线**。

用途有三个：

1. 记录已经被本轮实机验证过的部署事实。
2. 把早于本页的 `plan / r1 上线 / 低成本增强` 页面降级为历史参考。
3. 收敛下一阶段哪些增强值得做，哪些开关暂时不该启用。

如果后续发现旧页面与本页冲突，以本页为准。

## 当前已验证的服务拓扑

### 服务端

- 中心化 `agentmemory` 服务部署在 NAS。
- 当前运行目录：
  - `/vol1/1000/docker/agentmemory`
- 当前在线镜像：
  - `gitea.141242.xyz:9999/penn/agentmemory-deploy:0.9.27-r6`
- 当前包装仓库版本事实源：
  - `agentmemory-deploy/versions.lock`
  - `AGENTMEMORY_VERSION=0.9.27`
  - `IMAGE_TAG=0.9.27-r6`

### 客户端

当前 `Codex` 侧的稳定接入形态仍是 plugin-first：

- 本地启用 `agentmemory@agentmemory` plugin
- plugin 自带同名 MCP transport 保持禁用
- 用户级 `[mcp_servers.agentmemory]` 接管到中心化 NAS 服务
- 本地 `AGENTMEMORY_URL` / `AGENTMEMORY_SECRET` 通过 `.codex/.env` 注入

当前 steady-state 仍然是：

- 使用远端中心化 server
- 不使用 `agentmemory connect codex`
- 不使用 `agentmemory connect codex --with-hooks`

## 已验证的 compose 形态

这是本轮已经明确收敛的一个关键点。

### 当前命名

在 `agentmemory-deploy` 仓库和 NAS 目录中，compose 文件的角色现在明确拆开：

- `compose.build.yaml`
  - 只用于本机构建、本地 smoke、本地 `docker compose -f ... --build`
- `docker-compose.yml`
  - 只用于部署消费，只拉已发布镜像

### 为什么要改名

之前 NAS 目录同时存在默认名 `compose.yaml` 和 `docker-compose.yml`。

结果是：

- 直接裸跑 `docker compose ...` 会先命中 `compose.yaml`
- Docker Compose 会发出 multiple config files 警告
- 更糟时会误走本机构建入口，而不是线上消费入口

这一轮已经把 NAS 上的：

- `compose.yaml`

改成了：

- `compose.build.yaml`

因此当前 NAS 目录里：

- 裸 `docker compose config`
- 裸 `docker compose ps`

都会自然落到 `docker-compose.yml`，不再出现歧义和警告。

### 运营命令基线

#### NAS 生产入口

```bash
cd /vol1/1000/docker/agentmemory
docker compose -f docker-compose.yml --env-file .env pull
docker compose -f docker-compose.yml --env-file .env up -d
```

#### 本机构建入口

```bash
cd /home/penn/devel/agentmemory-deploy
set -a
. ./versions.lock
set +a
docker compose -f compose.build.yaml up -d --build
```

## 当前 NAS 运行配置

以下是当前实际运行态的关键配置语义。

### 网络与认证

- `AGENTMEMORY_BIND_ADDRESS=192.168.31.220`
- `AGENTMEMORY_BIND_HOST=0.0.0.0`
- `AGENTMEMORY_PORT=3111`
- `AGENTMEMORY_STREAMS_PORT=3112`
- `AGENTMEMORY_SECRET=<已设置>`

### Embedding

- `EMBEDDING_PROVIDER=openai`
- `OPENAI_EMBEDDING_BASE_URL=https://router.tumuer.me/v1`
- `OPENAI_EMBEDDING_MODEL=Qwen/Qwen3-Embedding-4B`
- `OPENAI_EMBEDDING_DIMENSIONS=2560`

### 低频 LLM

- `OPENAI_BASE_URL=https://cch.141242.xyz:9999/v1`
- `OPENAI_MODEL=gpt-5.4-mini`
- `OPENAI_REASONING_EFFORT=none`
- `OPENAI_API_KEY_FOR_LLM=true`
- `AGENTMEMORY_LLM_TIMEOUT_MS=90000`
- `OPENAI_API_KEY=<CCH OpenAI-compatible caller key>`

### 当前 flags

- `RERANK_ENABLED=true`
- `AGENTMEMORY_AGENT_SCOPE=shared`
- `AGENTMEMORY_TOOLS=all`
- `AGENTMEMORY_AUTO_COMPRESS=false`
- `AGENTMEMORY_INJECT_CONTEXT=false`
- `CONSOLIDATION_ENABLED=true`
- `GRAPH_EXTRACTION_ENABLED=false`

## 上游默认值与当前显式策略不要混淆

这一点后续脚本化时必须写清楚。

上游 README 的真实口径是：

- 只要配置了 LLM provider，`CONSOLIDATION_ENABLED` 默认就会开启
- `AGENTMEMORY_AUTO_COMPRESS` 默认关闭
- `AGENTMEMORY_INJECT_CONTEXT` 默认关闭
- `AGENTMEMORY_SLOTS` 默认关闭
- `AGENTMEMORY_REFLECT` 默认关闭
- `SNAPSHOT_ENABLED` 默认关闭

而我们当前在线部署不是“沿用上游默认”，而是**显式约束**成：

```env
RERANK_ENABLED=true
AGENTMEMORY_AUTO_COMPRESS=false
AGENTMEMORY_INJECT_CONTEXT=false
CONSOLIDATION_ENABLED=true
GRAPH_EXTRACTION_ENABLED=false
AGENTMEMORY_AGENT_SCOPE=shared
AGENTMEMORY_LLM_TIMEOUT_MS=90000
```

因此后续如果看到：

- “上游说 consolidation 默认开”
- 而我们线上也确实已经开启 consolidation

不要混淆“上游默认开启”和“我们显式开启且设定了 timeout”的两个来源。当前线上不是靠默认值碰巧生效，而是已经被我们明确写入部署契约。

## 当前已经证明正确的能力

### 1. 中心化 server 正常工作

本轮已确认：

- `agentmemory` 容器健康
- `agentmemory status` 可连到正式域名
- `Provider: llm`
- `Embeddings: ✓ embeddings`

这说明：

- 中心化 NAS server 正常提供服务
- 本地 Codex -> NAS 的接入面正常
- embedding 与 LLM provider 都能被识别

### 2. `gpt-5.4-mini` 不是“只配上了”，而是真的被 `agentmemory` 用到了

这一点在本轮之前一直没有最终坐实，本轮已经坐实。

#### 手动验证请求

`2026-07-08 23:18:00` 的：

- `messageId=345410`

是手工对 CCH 做的 `pong` 验证，不是 `agentmemory` 自动流量。

判断依据：

- `messages_count=1`
- 输入输出极小
- 与手工 `curl` 时间完全对齐

#### `agentmemory` 自动请求

从 `2026-07-08 23:25:35` 开始，出现了一批：

- `key=sk-2e01...`
- `provider_id=144`
- `endpoint=/v1/chat/completions`
- `model=gpt-5.4-mini`
- `actual_response_model=gpt-5.4-mini`
- `messages_count=2`

的请求，例如：

- `345496`
- `345497`
- `345498`
- `345499`
- `345501`
- `345503`
- `345519`
- `345520`
- `345521`
- `345522`
- `345523`
- `345524`

这些请求对应的 CCH 日志同样显示：

- `providerId=144`
- `providerName=Lucen GPT Plus1 OpenAI-compatible`
- `statusCode=200`

与此同时，`agentmemory` 自身日志出现了：

- `Summarize chunking session`
- `Session summarized`

因此可以明确判断：

- 这批 `gpt-5.4-mini` 请求确实是 `agentmemory` 的 summary 路径在使用
- 它们不是我手工测试留下的噪音

### 3. `mem::summarize` 的历史失败计数不能再被误读为“当前仍然坏着”

本轮一个容易误判的点是 health metrics。

在修复前，`mem::summarize` 一度表现为：

- `74 total`
- `74 failure`
- `0 success`

但在新 key 生效且真实 summary 请求跑通后，已经变成：

- `78 total`
- `74 failure`
- `4 success`
- `avgQualityScore=100`

这说明：

- health 面上的失败数是**累计历史**，不是“当前瞬时状态”
- 当前链路已经开始成功，不应再把旧失败累计直接等同于当前故障

## 当前哪些能力是“已具备”但还没有完全证明到位

### 本地 rerank 运行时依赖

这件事与 earlier 页面里的旧结论相比，已经发生了变化。

当前 `agentmemory-deploy/Dockerfile` 明确做了这些事：

- 显式安装 `@xenova/transformers`
- 显式安装 `onnxruntime-node`
- 显式安装 `onnxruntime-web`
- 保留 `RERANK_ENABLED=true`

因此：

- “包装镜像里缺 rerank 运行时依赖” 这个旧结论，**不再适用于当前 wrapper 状态**

但要保持边界清楚：

- 本轮只证明了依赖已经被包装进镜像
- 还没有做一轮严格的 live rerank A/B 验证
- 所以当前最准确说法是：
  - `rerank 运行时缺件问题已修复`
  - `rerank live 效果尚未在本轮被单独实证`

### Graph / injection / auto-compress

当前只有一部分增强能力已经进入 steady-state。

已上线：

- automatic consolidation
- `AGENTMEMORY_LLM_TIMEOUT_MS=90000`

仍然显式关闭：

- graph extraction
- in-session prompt injection
- post-tool auto-compress

因此当前不应把 graph / inject / auto-compress 说成已经上线。

## 下一阶段增强：建议优先级

这里按“收益 / 风险 / 当前环境贴合度”排序。

### P1. 先做 rerank 的 live 功能验证，不急着再开新开关

这是最应该先补的验证，不是先改配置。

原因：

1. 当前 `RERANK_ENABLED=true` 已经在环境里。
2. 包装镜像依赖层面已经补齐。
3. 但我们还没有证明“召回排序真的因为 rerank 变好了”。

建议验证方式：

1. 造一组固定 query
2. 对比 `RERANK_ENABLED=true/false` 的 recall top-K 结果
3. 重点看中文 + 代码 + 历史会话混合 query

这是低风险、高信息增益的一步。

### P2. `CONSOLIDATION_ENABLED=true` 已经落地，下一步是观察质量而不是再讨论要不要开

原因：

1. 它是低频路径，不像 `AGENTMEMORY_AUTO_COMPRESS` 会在高频工具调用上持续烧 token。
2. 本轮已经证明 `gpt-5.4-mini` 的 summary 路径能跑通。
3. `agentmemory` 的长期价值，本来就更依赖 session summarize / lessons / memories，而不是仅仅把 raw observations 存起来。

当前已落地的保守增强组合是：

```env
CONSOLIDATION_ENABLED=true
GRAPH_EXTRACTION_ENABLED=false
AGENTMEMORY_AUTO_COMPRESS=false
AGENTMEMORY_INJECT_CONTEXT=false
AGENTMEMORY_LLM_TIMEOUT_MS=90000
```

也就是当前已经明确选择：

- 让 session end / consolidate pipeline 正常沉淀 memories
- 不同时打开 graph
- 不同时打开 auto-compress
- 不同时打开 context injection
- 给经 `CCH -> lucen` 的 LLM 路径留出更稳的超时窗口

接下来更重要的是观察：

- summary / lessons / memories 是否稳定沉淀
- CCH 请求是否保持低频、稳定
- recall 质量是否出现明显正收益或副作用

### P3. `AGENTMEMORY_LLM_TIMEOUT_MS=90000` 已经落地

当前 CCH -> lucen 这条链路虽然已经跑通，但本轮也见过过短时间内的抖动和历史失败。

因此当前线上已经显式配置：

```env
AGENTMEMORY_LLM_TIMEOUT_MS=90000
```

而不是改成：

```env
OPENAI_TIMEOUT_MS=90000
```

理由：

- 默认 `60s` 虽然通常够用
- 但经过 CCH 中转、上游再转发时，`90s` 更稳
- 这属于稳定性增强，不是行为增强
- 使用全局 `AGENTMEMORY_LLM_TIMEOUT_MS`，比只给 OpenAI 路径打补丁更符合当前包装仓库的长期契约

### P4. `GRAPH_EXTRACTION_ENABLED` 值得做，但不是现在

这个开关的价值在于：

- 更强的知识图关系
- 更好的 graph-assisted retrieval

但它不该是下一步第一优先级。

原因：

1. 它会放大 LLM 参与面。
2. 它引入更多结构化副产物，更容易把“当前到底哪里坏了”变复杂。
3. 如果 consolidation 本身还没先稳定，graph 只会放大变量。

因此推荐顺序是：

1. 先验证 rerank
2. 再开 consolidation
3. 观察一段时间
4. 再考虑 graph

### P5. `AGENT_ID` 值得考虑，但当前不建议改 `AGENTMEMORY_AGENT_SCOPE`

如果后续多个设备、多个角色开始同时重度使用一个中心化 server，建议考虑：

```env
AGENT_ID=<device-or-role-name>
AGENTMEMORY_AGENT_SCOPE=shared
```

而不是直接切：

```env
AGENTMEMORY_AGENT_SCOPE=isolated
```

原因：

- `shared` 仍然保持跨设备共享 recall
- `AGENT_ID` 只增加审计维度
- `isolated` 会直接切断跨设备/跨角色可见性，过早启用会削弱中心化服务价值

因此当前推荐是：

- 先保持 `shared`
- 未来若确实需要更细粒度审计，再补 `AGENT_ID`

### P6. `SNAPSHOT_ENABLED` 可以研究，但优先级低于 consolidation

如果未来想增强：

- 回滚
- git-versioned memory state
- 更强的运维可恢复性

`SNAPSHOT_ENABLED` 值得单独研究。

但在当前阶段，它的优先级仍低于：

1. rerank live 验证
2. consolidation 开启

## 当前不建议启用的开关

### `AGENTMEMORY_AUTO_COMPRESS`

暂不建议开。

原因：

- 每次 `PostToolUse` 都可能触发 LLM 压缩
- token 消耗会显著上升
- 容易把稳定性问题和成本问题混在一起

这不符合当前“更稳、更保真”的优先级。

### `AGENTMEMORY_INJECT_CONTEXT`

暂不建议开。

原因不是它“没能力”，而是它在当前 `Codex` 下的收益/副作用比不理想：

1. `SessionStart` 注入会直接进入首轮上下文
2. `PreToolUse` 路径更多是 enrich / debug surface
3. 它更容易增加 prompt 噪音，而不是稳定增强 recall

对当前环境来说，这不是第一优先级增强。

### `AGENTMEMORY_SLOTS` / `AGENTMEMORY_REFLECT`

暂不建议现在就开。

原因：

1. 这是“agent 会自己维护一层 pinned memory”的能力
2. 一旦开 `REFLECT`，会自动往这些 slot 里归纳 pending items / patterns
3. 如果没有先建立好审计和验证习惯，它很容易形成“看起来很聪明，但其实在漂移”的第二层记忆

这类能力更适合放在 consolidation 与 recall 质量稳定之后再做。

## 增强配置速查矩阵

| 配置 | 当前建议 | 原因 | 建议时机 |
| --- | --- | --- | --- |
| `RERANK_ENABLED=true` | 保持开启 | 已补齐包装镜像依赖，理论收益直接对应 recall 排序质量 | 现在保持；先做 live A/B 验证 |
| `CONSOLIDATION_ENABLED=true` | 已启用并保持 | 低频高价值，能把 summarize / lessons / memories 真正沉淀下来 | 当前 steady-state |
| `AGENTMEMORY_LLM_TIMEOUT_MS=90000` | 已启用并保持 | 主要提升 `CCH -> lucen` 链路稳定性，不改变检索语义 | 当前 steady-state |
| `OPENAI_TIMEOUT_MS=90000` | 当前不需要 | 对 OpenAI-compatible LLM 路径等价生效，但我们已经采用全局 timeout 入口 | 仅在未来要走 OpenAI scoped alias 时 |
| `GRAPH_EXTRACTION_ENABLED=true` | 暂缓 | 会扩大 LLM 参与面和结构复杂度 | consolidation 稳定后再评估 |
| `AGENT_ID=<device-or-role>` | 值得预留 | 增加多设备审计维度，但不破坏 shared recall | 多设备高频协同时 |
| `AGENTMEMORY_AGENT_SCOPE=shared` | 保持不变 | 仍是中心化部署的最佳基线 | 当前长期保持 |
| `AGENTMEMORY_AGENT_SCOPE=isolated` | 不建议现在启用 | 会直接切断跨设备共享检索面 | 只有强隔离需求时 |
| `AGENTMEMORY_AUTO_COMPRESS=true` | 不建议 | 高频烧 token，且更容易把压缩噪音引入 Codex 流程 | 仅在未来单独评测时 |
| `AGENTMEMORY_INJECT_CONTEXT=true` | 不建议 | 容易增加 prompt 噪音，收益不如 retrieval 稳定 | 暂不考虑 |
| `AGENTMEMORY_SLOTS=true` | 暂缓 | 会引入一层可编辑 pinned memory，需要更强审计习惯 | recall / consolidation 稳定后 |
| `AGENTMEMORY_REFLECT=true` | 暂缓 | 依赖 slots，会自动写入第二层记忆 | 最后再评估 |
| `SNAPSHOT_ENABLED=true` | 可研究但低优先级 | 主要增强可恢复性与运维可回滚性 | 后续运维阶段 |
| `LESSON_DECAY_ENABLED=true` | 默认保留 | 有助于 lesson 老化，不需要主动改动 | 保持上游默认 |

## 当前推荐的增强顺序

推荐按这个顺序推进：

1. 保持当前 baseline，不回退 `CONSOLIDATION_ENABLED=true` 与 `AGENTMEMORY_LLM_TIMEOUT_MS=90000`
2. 先做一次 rerank live 验证
3. 观察一段时间的 summary / recall / CCH 请求稳定性
4. 再决定是否开启 `GRAPH_EXTRACTION_ENABLED`
5. 最后才考虑 `AGENTMEMORY_SLOTS` / `AGENTMEMORY_REFLECT` / `SNAPSHOT_ENABLED`

## 一句话收敛

当前 `agentmemory` 已经不再是“只完成部署”，而是已经证明：

- 中心化服务可用
- embedding 可用
- `CCH -> OpenAI-compatible -> gpt-5.4-mini` 的低频 summary 路径可用

下一阶段最合理的路线不是盲目全开功能，而是：

**保持 consolidation + timeout 已开启，先验证 rerank，继续把 auto-compress 和 inject 保持关闭。**
