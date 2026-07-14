---
title: "AgentMemory GPT-5.4-mini 故障归因与 Qwen3-Embedding-8B 切换动作 2026-07-10"
tags: ["agentmemory", "cch", "gpt-5.4-mini", "qwen3-embedding-8b", "nas", "debugging", "decision"]
created: 2026-07-10T14:49:58+08:00
updated: 2026-07-10T14:49:58+08:00
sources:
  - "agentmemory-deploy/README.md"
  - "agentmemory-deploy/Dockerfile"
  - "agentmemory-router-model-survey-2026-07-07.md"
  - "agentmemory-已验证部署与增强路线-2026-07-08.md"
  - "/home/penn/.codex/cch-admin-token"
  - "/home/penn/devel/tmp/cch-upstream/src/app/api/v1/resources/usage-logs/router.ts"
  - "/home/penn/devel/tmp/cch-upstream/src/app/v1/_lib/proxy/response-output-normalizer.ts"
  - "/home/penn/devel/tmp/cch-upstream/src/app/v1/_lib/proxy/fake-streaming/response-validator.ts"
  - "/home/penn/devel/tmp/cch-upstream/src/app/v1/_lib/proxy/fake-streaming/proxy-integration.ts"
  - "/home/penn/.codex/.tmp/marketplaces/agentmemory/src/providers/openai.ts"
links:
  - "agentmemory-已验证部署与增强路线-2026-07-08.md"
  - "agentmemory-router-model-survey-2026-07-07.md"
  - "agentmemory-本地-rerank-cch-gpt-5-4-mini-低成本增强方案-2026-07-08.md"
category: debugging
confidence: high
schemaVersion: 1
---

# AgentMemory GPT-5.4-mini 故障归因与 Qwen3-Embedding-8B 切换动作 2026-07-10

## 这页的定位

这页只回答两个当前阻塞问题：

1. `agentmemory` 现网里的 `gpt-5.4-mini` 报错，到底更像模型问题、`agentmemory` 问题，还是 `CCH` / 上游 provider 问题。
2. embedding 是否可以从 `Qwen/Qwen3-Embedding-4B@2560` 切到 `Qwen/Qwen3-Embedding-8B@4096`，以及切换时是否需要重建。

本页只记录已经实机验证过的事实与后续动作，不在本轮直接修改线上配置。

## 当前现网事实

### NAS 上 `agentmemory` 的 live 配置

`ssh nas 'cd /vol1/1000/docker/agentmemory && sed -n "1,240p" .env'` 已验证当前运行参数：

- `OPENAI_BASE_URL=https://cch.141242.xyz:9999/v1`
- `OPENAI_MODEL=gpt-5.4-mini`
- `OPENAI_REASONING_EFFORT=none`
- `OPENAI_EMBEDDING_BASE_URL=https://router.tumuer.me/v1`
- `OPENAI_EMBEDDING_MODEL=Qwen/Qwen3-Embedding-4B`
- `OPENAI_EMBEDDING_DIMENSIONS=2560`
- `CONSOLIDATION_ENABLED=true`
- `RERANK_ENABLED=true`
- `GRAPH_EXTRACTION_ENABLED=false`

### NAS 上 `agentmemory` 的 live 容器

`ssh nas 'docker ps'` 已验证：

- 容器名：`agentmemory`
- 镜像：`gitea.141242.xyz:9999/penn/agentmemory-deploy:0.9.27-r6`
- 状态：`Up ... (healthy)`

## 问题一：`gpt-5.4-mini` 报错的真实责任面

### 已证实的日志现象

`ssh nas 'docker logs --since 6h agentmemory'` 已抓到大量同形态错误，核心模式一致：

- `Summarize failed`
- `Semantic consolidation failed`
- `OpenAI returned unexpected response`
- 错误片段里的响应对象是：
  - `object: "chat.completion"`
  - `model: "gpt-5.4-mini"`
  - `choices[0].message: {"role":"assistant"}`
  - 缺少 `content`

这不是猜测，而是现网容器日志里反复出现的原始错误文本。

### 本地有管理员 key，且已经成功用于后台对账

本地存在：

- `/home/penn/.codex/cch-admin-token`

这把 key 可以成功访问 `CCH` 的 admin usage logs：

- `GET /api/v1/usage-logs`

之前用 `agentmemory` 的 user-facing OpenAI key 去打 `/api/v1/me/*` / `/api/v1/usage-logs/full` 返回 `401`，不是因为后台无日志，而是因为那把 key 不具备 admin 路由权限。

### `CCH` 后台 usage logs 已对齐到 `agentmemory` 故障时间窗

从 `agentmemory` 日志里提取出的异常响应时间，例如：

- `resp_02cf91... created=1783661576`
- `resp_00416b... created=1783662798`

换算成 UTC 分别是：

- `2026-07-10T05:32:56Z`
- `2026-07-10T05:53:18Z`

用 admin key 查询同时间窗的 `CCH` usage logs，已经对齐出对应请求：

#### 时间窗 A：`2026-07-10T05:32:43Z` 左右

`/api/v1/usage-logs?model=gpt-5.4-mini&endpoint=/v1/chat/completions&startTime=1783661500000&endTime=1783661700000`

返回 4 条记录，关键字段一致：

- `statusCode=200`
- `userAgent=node`
- `clientIp=192.168.31.220`
- `userName=Penn`
- `keyName=OpenAI-compatible`
- `actualResponseModel=gpt-5.4-mini`
- `providerChain[*].id=144`
- `providerChain[*].reason=request_success`

#### 时间窗 B：`2026-07-10T05:53:09Z` 左右

`/api/v1/usage-logs?model=gpt-5.4-mini&endpoint=/v1/chat/completions&startTime=1783662700000&endTime=1783662905000`

返回 1 条记录，关键字段同样一致：

- `statusCode=200`
- `userAgent=node`
- `clientIp=192.168.31.220`
- `actualResponseModel=gpt-5.4-mini`
- `providerChain[*].id=144`
- `providerChain[*].reason=request_success`

这已经把那批 malformed 200 明确锚定到：

- 来源客户端：NAS 上的 `agentmemory`
- 协议：非流式 `/v1/chat/completions`
- 路由模型：`gpt-5.4-mini`
- 上游 provider：`144 / Lucen GPT Plus1 compatible`

### 为什么这不像是 “AgentMemory 自己坏了”

`agentmemory` 的 OpenAI-compatible provider 代码已经核对过。它的接受条件是：

1. `message.content` 存在，则返回 `content`
2. 否则若 `message.reasoning` 或 `message.reasoning_content` 存在，则返回 reasoning
3. 否则抛出 `OpenAI returned unexpected response`

也就是说：

- 如果上游返回的是正常 summary 文本，`agentmemory` 会接收
- 如果上游返回的是 reasoning-only 变体，`agentmemory` 也有 fallback
- 只有 `{"role":"assistant"}` 这种空壳 message 才会被它拒绝

对 summary / consolidation 这类调用来说，这个严格性是合理的，不属于 `agentmemory` 自身 bug。

### 为什么这也不像是 “`gpt-5.4-mini` 完全不可用”

本轮已经独立验证过：

- 简单 chat 请求可成功
- 单次 summarize 风格请求可成功
- 多并发 summarize 也并非必然失败

所以不能把结论粗暴收敛成：

- `gpt-5.4-mini` 在 `CCH` 上完全不可用

更准确的说法是：

- `gpt-5.4-mini` 在当前 `CCH -> provider 144` 链路上，存在间歇性返回 **200 但无 deliverable content** 的情况

### 为什么这也不太像是 “CCH 主动把 content 裁掉了”

本轮核对 `CCH` 源码后，得到两个关键点：

1. `response-output-normalizer.ts` 只处理 `object === "response"` 的 `/v1/responses` 风格响应，不处理 `/v1/chat/completions`。
2. `fake-streaming/response-validator.ts` 确实有 `openai-chat choices have no deliverable message` 的校验逻辑，但它只在 fake-streaming 路径下运行；普通非流式 chat completion 正常路径不会用这套 validator。

这意味着：

- 当前没有证据显示 `CCH` 在普通 chat completion 成功响应上主动删掉了 `message.content`
- 更像是 `CCH` 把上游返回的异常 `200` 直接原样透传并记录成 success

### 当前最高置信度结论

当前最高置信度结论是：

1. **主因更偏上游 provider / Lucen 返回了 malformed 的 200 chat completion 响应。**
   证据是 `agentmemory` 容器日志里直接打印出了 `chat.completion` 对象，且 `message` 只有 `role` 没有 `content`。
2. **次因是 `CCH` 普通 `/v1/chat/completions` 非流式路径缺少“deliverable content”校验。**
   它把这种异常 `200` 视为 success，导致下游 `agentmemory` 才在解析时暴露问题。
3. **`agentmemory` 本身更像是正常拒绝了一个不满足最小语义要求的响应。**
4. **因此这不是一个“纯模型不支持”的问题，也不是“纯 agentmemory bug”。**
   更准确地说，是：
   - `provider 144 / Lucen GPT Plus1 compatible` 的返回稳定性问题
   - 加上 `CCH` 对 fake-200 malformed chat payload 的鲁棒性缺口

## 问题一的后续动作

### 最值得推进的动作

1. 在 `CCH` 普通非流式 `/v1/chat/completions` 路径补一层与 fake-streaming 同等的 deliverable-content 校验。
2. 对 `200 但 choices[].message 无 content / tool_calls / function_call / reasoning` 的响应，不再记 success，而是：
   - 记为 provider error
   - 尽量保留截断后的 upstream body 供后台排障
   - 允许进入 retry / fallback 逻辑
3. 若短期只求稳定，不追求继续用 `gpt-5.4-mini`，则把 `agentmemory` 的 LLM lane 切到更稳定的 provider / model。

### 当前不建议的误判

以下结论都过于粗糙，不应直接采用：

- “`gpt-5.4-mini` 完全坏了，不能用”
- “是 `agentmemory` summary parser 写错了”
- “只是网络波动”

## 问题二：embedding 切到 `Qwen/Qwen3-Embedding-8B@4096` 是否需要重建

### 已证实的 router 行为

本轮已实测：

- `Qwen/Qwen3-Embedding-4B` 默认维度：`2560`
- `Qwen/Qwen3-Embedding-8B` 默认维度：`768`
- `Qwen/Qwen3-Embedding-8B` 显式 `dimensions=4096`：可用
- `Qwen/Qwen3-Embedding-8B` 显式 `dimensions=2560`：provider 拒绝

因此如果要切到 8B，你的目标配置必须是：

- `OPENAI_EMBEDDING_MODEL=Qwen/Qwen3-Embedding-8B`
- `OPENAI_EMBEDDING_DIMENSIONS=4096`

不能只改模型名，不改维度。

### 已证实的 `agentmemory` 索引约束

`agentmemory` 启动时会检查持久化向量索引的维度。

如果旧索引维度和当前 embedding 维度不一致，它不会透明地“自动全量重嵌入恢复”；典型结果是：

- 拒绝启动，或
- 需要丢弃旧索引后冷启动

此外：

- `AGENTMEMORY_DROP_STALE_INDEX=true` 更像“丢弃不匹配索引再启动”
- 它**不是**“自动把所有历史 observation 完整重嵌入”的方案

### 当前结论

如果从 `4B@2560` 切到 `8B@4096`：

1. **需要重建向量索引。**
2. **不能在现有向量目录上无感热切。**
3. **如果只丢索引不做历史重嵌入，semantic recall 会短期退化。**

不过结合当前上下文：

- 你已经明确表示内容还不多
- 当前不要求备份

所以从运营角度看，**硬切是可接受的**，只是要接受它本质上是一次冷重建。

## 问题二的后续动作

当你决定动手时，推荐动作顺序是：

1. 把 NAS `.env` 的 embedding 配置改成：
   - `OPENAI_EMBEDDING_MODEL=Qwen/Qwen3-Embedding-8B`
   - `OPENAI_EMBEDDING_DIMENSIONS=4096`
2. 以“冷重建”心态处理旧向量索引：
   - 要么显式清空旧向量索引数据
   - 要么用一次性 `AGENTMEMORY_DROP_STALE_INDEX=true` 让服务丢弃旧索引再起
3. 重启后重新观察：
   - `/agentmemory/status`
   - `/agentmemory/memories`
   - `/agentmemory/semantic`
   - recall 命中情况

## 当前批次建议

本批次先不改线上，先把动作顺序固定住：

1. **先解决 / 规避 `gpt-5.4-mini` fake-200 malformed chat completion 问题。**
2. **再执行 embedding 的 `4B@2560 -> 8B@4096` 冷切。**

原因很简单：

- 如果先切 embedding，而 LLM consolidation 仍然间歇性坏，排障面会变大
- 先把 `gpt-5.4-mini` 的责任面收敛，再动 embedding，会更容易判断切换后的真实效果

## 最终摘要

截至 `2026-07-10`，最稳妥的判断是：

- `agentmemory` 当前的 `gpt-5.4-mini` 问题，本质上更像 **provider 144 / Lucen 偶发返回 malformed 200 chat completion**，而不是 `agentmemory` parser 本身写坏。
- `CCH` 在普通非流式 chat completion 路径上缺少 deliverable-content 校验，因此把这类异常 200 当成 success 透传了，是当前链路中的第二责任面。
- embedding 切到 `Qwen/Qwen3-Embedding-8B@4096` 在技术上可行，但需要按**冷重建向量索引**来理解，不应误判成可无感热切。
