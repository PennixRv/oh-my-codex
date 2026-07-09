---
title: "AgentMemory 路由模型盘点与选型 2026-07-07"
tags: ["codex", "memory", "agentmemory", "embeddings", "rerank", "router", "research"]
created: 2026-07-07T10:50:00.000Z
updated: 2026-07-07T10:50:00.000Z
sources:
  - "https://router.tumuer.me/v1/models"
  - "https://router.tumuer.me/v1/embeddings"
  - "https://router.tumuer.me/v1/rerank"
  - "https://github.com/rohitg00/agentmemory/blob/main/src/config.ts"
  - "https://github.com/rohitg00/agentmemory/blob/main/src/providers/embedding/openai.ts"
  - "https://github.com/rohitg00/agentmemory/blob/main/src/providers/_openai-shared.ts"
  - "https://github.com/rohitg00/agentmemory/blob/main/src/state/reranker.ts"
  - "https://openai.com/index/new-embedding-models-and-api-updates/"
  - "https://docs.voyageai.com/docs/embeddings"
  - "https://huggingface.co/BAAI/bge-m3"
  - "https://huggingface.co/BAAI/bge-reranker-v2-m3"
  - "https://huggingface.co/Qwen/Qwen3-Embedding-4B"
  - "https://huggingface.co/Qwen/Qwen3-Reranker-4B"
  - "https://ai.google.dev/gemini-api/docs/embeddings"
  - "https://huggingface.co/jinaai/jina-embeddings-v4"
  - "https://huggingface.co/nomic-ai/nomic-embed-code"
  - "https://huggingface.co/nvidia/NV-Embed-v1"
links: ["agentmemory-suitability-and-deployment-evaluation-2026-07-05.md"]
category: reference
confidence: high
schemaVersion: 1
---

# AgentMemory 路由模型盘点与选型 2026-07-07

## Scope

这页只回答一个很具体的问题：

- 已知我们有一个 OpenAI 兼容的 `Embedding / Reranker` 路由站。
- 现在不考虑价格，只看模型库存、实际上游能力、与 `agentmemory` 的真实契合度。
- 目标不是泛泛讨论“哪个 embedding 模型强”，而是回答：
  1. 这个路由站上到底有哪些模型。
  2. 哪些模型已经被实测证明能走标准 OpenAI 风格接口。
  3. 哪些模型虽然名字好看，但并不适合 `agentmemory` 第一阶段接入。
  4. 最终我们应该先用哪几个。

## 结论先行

当前结论很明确：

1. 这个路由站当前可见模型总数是 `57`。
2. 按 `supported_endpoint_types` 聚合，当前返回面是：
   - `openai`: `43`
   - `embeddings`: `11`
   - `gemini`: `4`
   - `rerank-multimodal`: `3`
3. 对 `agentmemory` 来说，第一阶段真正关键的是 `embedding`，不是外部 `rerank`。
4. 如果只选一个最稳妥、最贴近当前中文 + 代码 + 会话记忆混合场景的模型，我当前首推 `BAAI/bge-m3`。
5. 如果更偏代码检索，我会把 `voyage-code-3` 放到很高优先级。
6. 如果更看重“最低接入风险、最标准、最少意外”，`text-embedding-3-small` 仍然是最稳的基线。
7. `Qwen` 家族很有潜力，但当前这个路由站上同名家族不同别名返回维度并不一致，部署时必须按“具体别名”配置，不能按家族名想当然。
8. 外部 rerank 模型可以作为未来增强项，但对当前 `agentmemory` 一阶段部署价值不高，因为它当前内置的是本地 reranker 路线。

## 为什么不是“模型多就都能直接用”

这件事必须先看 `agentmemory` 源码，而不是看 README 宣传口径。

已确认的实现边界：

1. `src/providers/embedding/openai.ts` 的 OpenAI 兼容 embedding provider 只会向目标端点发送标准请求体：
   - `model`
   - `input`
2. 它支持：
   - `OPENAI_EMBEDDING_BASE_URL`
   - `OPENAI_EMBEDDING_MODEL`
   - `OPENAI_EMBEDDING_DIMENSIONS`
3. 它不提供“为特定模型额外注入 `input_type`、task_type、adapter、truncate 规则”等每模型私有参数能力。
4. `src/state/reranker.ts` 当前 reranker 是本地 `@xenova/transformers` 路线，不是“任意外部 rerank API 适配层”。

这会直接导致一个非常现实的筛选标准：

- 能直接吃标准 `/v1/embeddings` 且只需要 `model + input` 的模型，最适合 `agentmemory` 第一阶段。
- 需要额外 body 字段才能正常工作的模型，即使理论能力不错，也不应该放到第一批上线候选。

还有一个部署细节非常关键：

- `agentmemory` 的 provider 检测会把 `OPENAI_API_KEY` 同时视作 OpenAI LLM provider 候选。
- 如果我们只是想让这个路由站承担 embedding，而不希望它顺手接管 LLM 压缩路径，推荐显式设置：

```bash
OPENAI_API_KEY_FOR_LLM=false
```

同时最好用：

```bash
OPENAI_EMBEDDING_BASE_URL=https://router.tumuer.me/v1
```

而不是粗暴把 `OPENAI_BASE_URL` 整体改掉。

## 路由站完整模型库存

### OpenAI

- `text-embedding-ada-002`
- `text-embedding-3-small`
- `text-embedding-3-large`

### Voyage

- `voyage-3-lite`
- `voyage-4`
- `voyage-4-large`
- `voyage-4-lite`
- `voyage-code-2`
- `voyage-code-3`

### BAAI

- `BAAI/bge-m3`
- `BAAI/bge-reranker-v2-m3`
- `Pro/BAAI/bge-m3`
- `Pro/BAAI/bge-reranker-v2-m3`

### Qwen / Qwen3 / Qwen3-VL

- `Qwen/Qwen3-Embedding-0.6B`
- `Qwen/Qwen3-Embedding-4B`
- `Qwen/Qwen3-Embedding-8B`
- `Qwen/Qwen3-Reranker-0.6B`
- `Qwen/Qwen3-Reranker-4B`
- `Qwen/Qwen3-Reranker-8B`
- `Qwen3-Embedding-4B`
- `Qwen3-Embedding-8B`
- `Qwen3-Reranker-4B`
- `Qwen3-Reranker-8B`
- `Qwen3-VL-Embedding-2B`
- `Qwen3-VL-Embedding-8B`
- `Qwen3-VL-Reranker-2B`
- `Qwen3-VL-Reranker-8B`

### Gemini

- `gemini-embedding-001`
- `gemini-embedding-2-preview`
- `google/gemini-embedding-001`
- `google-gemini-embedding-001`

### Cohere 风格包装层

- `embed-v4.0`
- `embed-english-v3.0`
- `embed-english-light-v3.0`
- `embed-multilingual-v3.0`
- `embed-multilingual-light-v3.0`
- `rerank-english-v2.0`
- `rerank-english-v3.0`
- `rerank-multilingual-v2.0`
- `rerank-multilingual-v3.0`
- `rerank-v3.5`
- `rerank-v4.0-fast`
- `rerank-v4.0-pro`

### Jina

- `jina-clip-v1`
- `jina-clip-v2`
- `jina-embeddings-v4`
- `jina-reranker-m0`

### Nomic

- `nomic-embed-code`

### NVIDIA

- `nvidia/llama-nemotron-embed-1b-v2`
- `nvidia/llama-nemotron-embed-vl-1b-v2`
- `nvidia/nv-embed-v1`
- `nvidia/nv-embedcode-7b-v1`
- `nvidia/nv-embedqa-e5-v5`

### ZeroEntropy

- `zembed-1`
- `zerank-1`
- `zerank-1-small`
- `zerank-2`

## 实测：哪些 embedding 能被标准 OpenAI 风格接口直接调用

这里的标准是：

- 调用 `POST /v1/embeddings`
- 请求体只包含 `model + input`
- 不人为补任何模型私有字段

这非常接近 `agentmemory` 第一阶段真正会怎么用。

### 已成功返回向量

#### OpenAI

| Model | Result | Dimensions |
| --- | --- | --- |
| `text-embedding-ada-002` | ok | `1536` |
| `text-embedding-3-small` | ok | `1536` |
| `text-embedding-3-large` | ok | `3072` |

#### Voyage

| Model | Result | Dimensions |
| --- | --- | --- |
| `voyage-3-lite` | ok | `512` |
| `voyage-4` | ok | `1024` |
| `voyage-4-large` | ok | `1024` |
| `voyage-4-lite` | ok | `1024` |
| `voyage-code-2` | ok | `1536` |
| `voyage-code-3` | ok | `1024` |

#### BAAI

| Model | Result | Dimensions |
| --- | --- | --- |
| `BAAI/bge-m3` | ok | `1024` |
| `Pro/BAAI/bge-m3` | ok | `1024` |

#### Qwen / Qwen3 / VL

| Model | Result | Dimensions |
| --- | --- | --- |
| `Qwen/Qwen3-Embedding-0.6B` | ok | `1024` |
| `Qwen/Qwen3-Embedding-4B` | ok | `2560` |
| `Qwen/Qwen3-Embedding-8B` | ok | `768` |
| `Qwen3-Embedding-4B` | ok | `1024` |
| `Qwen3-Embedding-8B` | ok | `1024` |
| `Qwen3-VL-Embedding-2B` | ok | `1024` |
| `Qwen3-VL-Embedding-8B` | ok | `1024` |

#### Gemini

| Model | Result | Dimensions |
| --- | --- | --- |
| `gemini-embedding-001` | ok | `3072` |
| `gemini-embedding-2-preview` | ok | `3072` |
| `google/gemini-embedding-001` | ok | `3072` |
| `google-gemini-embedding-001` | ok | `3072` |

#### Jina

| Model | Result | Dimensions |
| --- | --- | --- |
| `jina-clip-v1` | ok | `768` |
| `jina-clip-v2` | ok | `1024` |
| `jina-embeddings-v4` | ok | `2048` |

#### NVIDIA

| Model | Result | Dimensions |
| --- | --- | --- |
| `nvidia/nv-embed-v1` | ok | `4096` |

#### ZeroEntropy

| Model | Result | Dimensions |
| --- | --- | --- |
| `zembed-1` | ok | `2560` |

### 已失败或不适合第一阶段直接接入

#### Cohere 风格 embedding 包装层

下面这些在标准 `POST /v1/embeddings` 探测中都返回了 `convert_request_failed` / “无效的数据格式”：

- `embed-v4.0`
- `embed-english-v3.0`
- `embed-english-light-v3.0`
- `embed-multilingual-v3.0`
- `embed-multilingual-light-v3.0`

这说明至少在当前这个路由站上，它们并不是 `agentmemory` 第一阶段可直接放心使用的对象。

#### Nomic

- `nomic-embed-code`

当前返回的是“该模型已停用，请更换或升级为其他模型版本”。

这不是模型本身不强，而是当前这个路由站上的可用性不成立。

#### 需要额外参数的 NVIDIA 非对称模型

下面这些在标准 `model + input` 探测中失败，错误明确指向缺少 `input_type` 或等效角色参数：

- `nvidia/llama-nemotron-embed-1b-v2`
- `nvidia/llama-nemotron-embed-vl-1b-v2`
- `nvidia/nv-embedcode-7b-v1`
- `nvidia/nv-embedqa-e5-v5`

这类模型未必不能用，但它们不适合作为 `agentmemory` 第一阶段的直接接入候选，因为当前 `agentmemory` 的 OpenAI 兼容 provider 不会为模型私有协议自动补这些字段。

## 一个非常关键的发现：别名不等于同一个部署面

这轮实测里最需要记住的一点，是 `Qwen` 家族的维度并不稳定：

| Alias | Returned dimensions |
| --- | --- |
| `Qwen/Qwen3-Embedding-4B` | `2560` |
| `Qwen3-Embedding-4B` | `1024` |
| `Qwen/Qwen3-Embedding-8B` | `768` |
| `Qwen3-Embedding-8B` | `1024` |

这大概率意味着：

- 路由层背后可能挂的是不同 provider 包装面。
- 或者某些别名默认启用了不同的 MRL / truncation / deployment preset。

因此：

1. 不要把“同一家族名”当成“同一向量维度”。
2. 任何非 OpenAI 标准 embedding 模型，只要用于 `agentmemory`，都应该显式写 `OPENAI_EMBEDDING_DIMENSIONS`。
3. 最稳的做法是针对“具体要用的别名”先探测一次维度，再写配置。

## 实测：哪些 rerank 能被标准接口调用

当前探测口径是：

- 调用 `POST /v1/rerank`
- 发送 `query + documents + top_n`

### 成功

- `BAAI/bge-reranker-v2-m3`
- `Pro/BAAI/bge-reranker-v2-m3`
- `Qwen/Qwen3-Reranker-0.6B`
- `Qwen/Qwen3-Reranker-4B`
- `Qwen/Qwen3-Reranker-8B`
- `Qwen3-Reranker-4B`
- `Qwen3-Reranker-8B`
- `rerank-english-v3.0`
- `rerank-multilingual-v3.0`
- `zerank-1`
- `zerank-1-small`
- `zerank-2`

### 失败 / 受限

- `Qwen3-VL-Reranker-2B`
- `Qwen3-VL-Reranker-8B`

返回“暂不支持该接口”，说明它们不是这个标准 rerank 面的直接候选。

- `jina-reranker-m0`

返回“该模型已停用”。

- `rerank-english-v2.0`
- `rerank-multilingual-v2.0`

返回 upstream `sunset` 错误，已经过时。

- `rerank-v3.5`
- `rerank-v4.0-fast`
- `rerank-v4.0-pro`

这组并不是“接口不兼容”，而是在批量探测时命中了 provider 侧的试用 key / rate limit 限制。也就是说，它们的主要问题是当前供应侧可用性和限流，不是 wire-format 本身不兼容。

## 各家官方能力画像

这里只看与 `agentmemory` 选型相关的核心特征。

### OpenAI `text-embedding-3-small` / `3-large`

OpenAI 官方在 `2024-01-25` 的 embedding 更新中明确给出：

- `text-embedding-3-small` 相比 `ada-002` 在 MIRACL 与 MTEB 上都有明显提升。
- `text-embedding-3-large` 是更高能力版本。

对我们来说，它们的核心价值不是“最激进”，而是：

- 标准
- 稳
- 维度和接口都最可预测
- 非常适合做基线

### Voyage

Voyage 官方文档把家族角色分得很清楚：

- `voyage-4-large`: best general-purpose and multilingual retrieval quality
- `voyage-4`: general-purpose multilingual retrieval
- `voyage-4-lite`: 更偏轻量与延迟
- `voyage-code-3`: 明确面向 code retrieval

如果我们的 memory 主要是：

- 代码
- 文件路径
- 变更摘要
- 工程决策

那么 `voyage-code-3` 的贴合度非常高。

### BAAI `bge-m3`

`bge-m3` 的官方模型卡强调：

- 支持 `100+` 语言
- 同时支持 dense / sparse / multi-vector retrieval
- 最长上下文到 `8192`
- 官方直接建议 hybrid retrieval + reranking

这对我们的意义很直接：

- 中文自然语言
- 英文技术文本
- 代码片段
- 会话摘要

这类混合语料非常符合 `bge-m3` 的强项。

### BAAI `bge-reranker-v2-m3`

官方模型卡强调：

- multilingual
- 轻量
- 易部署
- 更快推理

如果未来真要做外部 rerank，它是一个很强的候选。但对当前 `agentmemory` 一阶段并不是硬需求。

### Qwen3 Embedding / Reranker

Qwen 官方模型卡给出的重点是：

- `100+` 语言
- 强 multilingual / cross-lingual / code retrieval
- `32k` context
- instruction-aware
- MRL / 可变维度能力

这解释了为什么它在“理论能力画像”上很诱人。

但也正因为它有更灵活的维度与部署面，当前路由站上的别名维度不一致问题，才需要格外保守对待。

### Gemini Embedding

Google 官方 embedding 文档强调：

- `gemini-embedding-001` / `gemini-embedding-2` 使用 Matryoshka Representation Learning
- 默认 `3072` 维
- 可截断到 `768` / `1536` / `3072`
- 支持多种任务类型，包括 code retrieval

这说明 Gemini 的优势是：

- 多语言能力强
- 理论上很适合做“同家族多维度裁剪”
- 但在当前 `agentmemory` 接入里，我们优先吃它最标准的默认输出，不追求复杂变体

### Jina `jina-embeddings-v4`

官方模型卡强调：

- universal multimodal + multilingual retrieval
- text / image / visual document
- task-specific adapters: retrieval / text-matching / code
- 默认 dense `2048` 维
- 最长 `32768` tokens

它很强，但对我们当前阶段来说略显“过大而全”。

如果以后想把截图、视觉文档、PDF 页面也并入 memory，它会变得更有吸引力。

### Nomic `nomic-embed-code`

Nomic 官方模型卡把它定位为 code retrieval specialist，并声称在 CodeSearchNet 上优于 Voyage Code 3 和 OpenAI Embed 3 Large。

但当前这个路由站返回的是“模型已停用”，所以短期不应作为部署候选。

### NVIDIA `NV-Embed-v1`

NVIDIA 官方模型卡强调的是高能力 retrieval embedding。

但当前对 `agentmemory` 更重要的不是它理论强不强，而是：

- `nvidia/nv-embed-v1` 能直接标准调用
- 其他多款 NVIDIA embed 模型要求额外 `input_type`

所以如果想要“最少协议摩擦”，`NV-Embed-v1` 可以研究，但不是我第一阶段最推荐的对象。

## 最终推荐：哪些最适合 `agentmemory`

### 第一梯队

#### 1. `BAAI/bge-m3`

我当前最推荐它作为这个路由站上的第一部署选择。

原因：

- 中文 + 英文 + 代码混合场景非常契合
- 标准 `/v1/embeddings` 已实测可用
- 维度适中：`1024`
- 官方能力画像与我们“工程会话 memory”场景更贴近

#### 2. `text-embedding-3-small`

如果你想先拿一个最稳、最标准、最不折腾的对照组，它是最佳 baseline。

原因：

- 接口最标准
- 行为最可预测
- `1536` 维也不算夸张
- 后续可以拿它和 `bge-m3` / `voyage-code-3` 做 A/B

#### 3. `voyage-code-3`

如果你发现 memory 主要命中的是：

- 代码块
- 文件名
- repo 内决策
- 工程实现轨迹

那么 `voyage-code-3` 很可能会优于更泛化的多语言 embedding。

### 第二梯队

#### 4. `Qwen/Qwen3-Embedding-4B`

它是很有潜力的高能力候选，但前提是你接受以下代价：

- 必须按具体 alias 配置
- 必须显式写 `OPENAI_EMBEDDING_DIMENSIONS=2560`
- 不能把家族内其他别名与它混用

#### 5. `gemini-embedding-001`

它的官方能力画像很好，当前标准探测也成立。

不把它排到更前面的主要原因不是能力，而是：

- `3072` 维更大
- 当前对我们来说没有比 `bge-m3` / `text-embedding-3-small` 明显更优的确定性

#### 6. `jina-embeddings-v4`

当我们未来真的需要：

- 文档密集检索
- 视觉文档
- 多模态扩展

它会更有吸引力。当前阶段可以先不作为第一选择。

### 当前不建议作为第一阶段部署对象

- `embed-*` Cohere 风格包装层：当前标准调用失败
- `nomic-embed-code`: 当前路由站停用
- `nvidia/*` 里要求 `input_type` 的那些模型：协议摩擦太大
- `jina-clip-*` / `Qwen3-VL-*`: 更偏多模态，不是当前第一目标
- 所有外部 rerank 模型：对 `agentmemory` 当前一阶段价值偏低

## 推荐的起步配置

### 默认首选：`BAAI/bge-m3`

```bash
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_API_KEY_FOR_LLM=false
OPENAI_EMBEDDING_BASE_URL=https://router.tumuer.me/v1
OPENAI_EMBEDDING_MODEL=BAAI/bge-m3
OPENAI_EMBEDDING_DIMENSIONS=1024
```

### 最稳 baseline：`text-embedding-3-small`

```bash
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_API_KEY_FOR_LLM=false
OPENAI_EMBEDDING_BASE_URL=https://router.tumuer.me/v1
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_EMBEDDING_DIMENSIONS=1536
```

### 偏代码检索：`voyage-code-3`

```bash
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_API_KEY_FOR_LLM=false
OPENAI_EMBEDDING_BASE_URL=https://router.tumuer.me/v1
OPENAI_EMBEDDING_MODEL=voyage-code-3
OPENAI_EMBEDDING_DIMENSIONS=1024
```

## 最后结论

如果现在的目标是：

- 让 `agentmemory` 在 `Codex` 环境中更稳地做 runtime memory
- 更保真地召回“上一个会话 / 上一个压缩点 / 上一个工作阶段”的关键信息
- 同时尽量少踩协议与部署坑

那么当前最佳策略不是盲目追最强模型，而是：

1. 先选一个与 `agentmemory` 请求面严格兼容的 embedding。
2. 先把回忆质量和部署稳定性跑通。
3. 再逐步替换 embedding，而不是一开始就引入复杂 rerank 或多模态模型。

按这个标准，当前排序我给成：

1. `BAAI/bge-m3`
2. `text-embedding-3-small`
3. `voyage-code-3`
4. `Qwen/Qwen3-Embedding-4B`
5. `gemini-embedding-001`
6. `jina-embeddings-v4`

如果只允许我选一个最值得先试的，就是：

```text
BAAI/bge-m3
```
