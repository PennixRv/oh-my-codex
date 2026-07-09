---
title: "AgentMemory 本地 Rerank + CCH GPT-5.4-mini 低成本增强方案 2026-07-08"
tags: ["agentmemory", "nas", "rerank", "cch", "gpt-5.4-mini", "deployment", "decision"]
created: 2026-07-08T06:45:46.783Z
updated: 2026-07-08T06:45:46.783Z
sources: []
links: []
category: decision
confidence: medium
schemaVersion: 1
---

# AgentMemory 本地 Rerank + CCH GPT-5.4-mini 低成本增强方案 2026-07-08

# AgentMemory 本地 Rerank + CCH GPT-5.4-mini 低成本增强方案 2026-07-08

> 历史说明：本页记录的是 `2026-07-08` 早期阶段的低成本增强决策。其中“现网 wrapper 缺少 rerank 运行时依赖”的判断仅适用于当时的包装层状态。当前 wrapper 已显式安装 `@xenova/transformers` 与 `onnxruntime-*`，最新部署事实与增强顺序以 [[agentmemory-已验证部署与增强路线-2026-07-08]] 为准。

## 结论

这一轮正式确认的运行方案是：

- NAS 侧继续以中心化 `agentmemory` 服务为主。
- embedding 继续走 `router.tumuer.me`，模型保持 `Qwen/Qwen3-Embedding-4B`，维度保持 `2560`。
- LLM 打开，但只用于低频高价值路径，提供方改为 `CCH`，模型固定为 `gpt-5.4-mini`。
- rerank 打开，但只采用上游内置的本地 reranker，不引入外部 `/v1/rerank` 服务。
- 自动压缩、consolidation、graph extraction、prompt 注入继续关闭，优先保证低成本和高保真。

## 这轮为什么要改包装仓库

已经确认当前 NAS 在线部署虽然可以把 `RERANK_ENABLED=true` 写进环境变量，但实际上不会生效。根因不在配置层，而在包装镜像：

- 上游 `agentmemory` 的 rerank 代码只支持本地加载 `@xenova/transformers`。
- 具体模型是 `Xenova/ms-marco-MiniLM-L-6-v2`。
- 当前 `agentmemory-deploy` Dockerfile 使用 `npm install --omit=optional`，导致 `@xenova/transformers` 与 `onnxruntime-*` 没被安装进容器。
- 因此现网镜像即使开启 `RERANK_ENABLED=true`，实际也只会静默回退成“无 rerank”。

这意味着：

- 这轮要解决的不是上游能力不足，而是我们自己的包装镜像把必要运行时裁掉了。
- 最小修复方式不是 fork 上游，而是修正包装层依赖。

## 为什么不用外部 rerank 服务

已经确认上游当前没有外部 rerank provider 配置面：

- 没有 `RERANK_PROVIDER`
- 没有 `RERANK_BASE_URL`
- 没有 OpenAI-compatible `/v1/rerank` 接口接入面

所以这一轮如果强行接 `Qwen/Qwen3-Reranker-4B`，就不再是配置问题，而会变成源码改造问题。这不符合当前“先用包装层把能力补齐”的边界。

## 选定的运行参数

### 保持不变

- `EMBEDDING_PROVIDER=openai`
- `OPENAI_EMBEDDING_BASE_URL=https://router.tumuer.me/v1`
- `OPENAI_EMBEDDING_MODEL=Qwen/Qwen3-Embedding-4B`
- `OPENAI_EMBEDDING_DIMENSIONS=2560`

### 新增 / 调整

- `OPENAI_API_KEY=<CCH token>`
- `OPENAI_BASE_URL=https://cch.141242.xyz:9999/v1`
- `OPENAI_MODEL=gpt-5.4-mini`
- `OPENAI_REASONING_EFFORT=none`
- `OPENAI_API_KEY_FOR_LLM=true`
- `RERANK_ENABLED=true`

### 继续关闭

- `AGENTMEMORY_AUTO_COMPRESS=false`
- `CONSOLIDATION_ENABLED=false`
- `GRAPH_EXTRACTION_ENABLED=false`
- `AGENTMEMORY_INJECT_CONTEXT=false`

## 这套配置的真实含义

这不是把 `agentmemory` 切成“重 LLM 模式”，而是一个明确偏保守的配置：

- observation capture 仍然主要走 synthetic compression，不为每次工具调用烧 token。
- `Stop` hook 的 session summarize 等低频路径，才允许走 `gpt-5.4-mini`。
- recall 阶段在 hybrid search 结果上增加本地 rerank，提升候选排序质量。

因此这套配置的目标不是“功能全开”，而是：

1. 先把语义召回质量补强。
2. 只为真正值得的 LLM 路径付费。
3. 尽量避免把 NAS 服务变成高频 token 消耗器。

## 发布语义决策

当前包装仓库原先把“上游版本号”和“镜像标签/仓库 tag”绑死，这对自动跟随上游有利，但不利于做包装层修订。

这一轮已经确认需要拆成两层语义：

- `AGENTMEMORY_VERSION` 继续表示上游 npm pin，例如 `0.9.27`
- 新增单独的 `IMAGE_TAG` 表示包装发布号，例如 `0.9.27-r1`

这样做的好处是：

- 不会伪装成上游重新发了一个 `0.9.27`
- 后续仍然可以继续自动跟随 upstream release
- 包装层修订可以单独累进，而不污染上游版本事实源

## 当前轮的最终推荐

如果目标是“最省钱且有明显收益”，当前最合理的第一步不是打开更多主动能力，而是：

1. 修正包装镜像，让本地 rerank 真正可用。
2. 用 `CCH` 的 `gpt-5.4-mini` 只承担低频 LLM 路径。
3. 继续把自动压缩、consolidation、graph extraction、context injection 保持关闭。

这是截至 `2026-07-08` 我们已经收敛出来的最低风险、收益最明确的 `agentmemory` NAS 增强方案。
