---
title: "NAS 自托管知识栈部署蓝图 2026-07-05"
tags: ["nas", "codex", "knowledge-base", "deployment", "silverbullet", "anythingllm", "swarmvault", "memos", "graphiti", "architecture"]
created: 2026-07-05T14:45:00.000Z
updated: 2026-07-05T14:45:00.000Z
sources:
  - "https://github.com/silverbulletmd/silverbullet"
  - "https://github.com/Mintplex-Labs/anything-llm"
  - "https://github.com/swarmclawai/swarmvault"
  - "https://github.com/usememos/memos"
  - "https://github.com/getzep/graphiti"
links: ["codex-open-source-knowledge-stack-combinations-2026-07-05.md", "swarmvault-nas-multi-codex-service-evaluation-2026-07-05.md", "silverbullet-canonical-vault-evaluation-2026-07-05.md", "codex-ai-layer-anythingllm-vs-khoj-2026-07-05.md"]
category: architecture
confidence: medium
schemaVersion: 1
---

# NAS 自托管知识栈部署蓝图 2026-07-05

## Scope

这页不是具体部署命令，而是一版面向当前研究结论的部署蓝图。

目标是：

- 把长期知识放到 NAS 上
- 同时服务不同地点的 `Codex`
- 维持“人类友好 + AI agent 友好 + 可替换 + 可备份”的边界

## 总体原则

### 1. 主库与 AI 层分离

长期知识真相层不应由 AI 平台持有。

建议：

- `SilverBullet` 持有主库
- `AnythingLLM` 或 `Khoj` 只读消费主库
- `SwarmVault` 负责 graph / context pack / compiler
- `Graphiti` 只承担关系与时间事实层

### 2. 派生状态可重建

这些内容都应被视为可重建派生物：

- retrieval index
- embeddings
- graph export
- context pack cache
- AI conversation side-state

真正需要最稳备份的是：

- canonical markdown vault
- task/decision artifacts
- 关键配置

### 3. 不让所有服务都写主库

推荐只有少数明确入口可以写：

- 人类通过 `SilverBullet`
- 审核后的结构化导入
- 受控的 capture 合并流程

不建议：

- AI 平台直接无审查改 canonical vault
- 多个 agent 同时高频回写主知识库

## 推荐服务拆分

### Core

```text
kb.example.com       -> SilverBullet
ai.example.com       -> AnythingLLM
notes.example.com    -> Memos
vault.example.com    -> SwarmVault graph/workbench
graph.example.com    -> Graphiti (optional)
```

### 推荐角色

#### `SilverBullet`

- 长期知识主库
- 人类编辑界面
- Git 真相层的 Web 壳

#### `AnythingLLM`

- AI 检索与 agent 消费层
- 面向多个 Codex/agent 的统一入口

#### `Memos`

- capture / inbox / 临时发现
- 会话碎片和轻量记录

#### `SwarmVault`

- graph
- context packs
- task ledger
- source management
- handoff artifacts

#### `Graphiti`

- 时间变化中的关系和事实
- 可选，不是第一阶段必需

## 推荐目录结构

```text
/srv/knowledge/
  canonical-vault/
  memos-data/
  anythingllm-data/
  swarmvault-main/
  graphiti/
  backups/
```

### 目录职责

#### `canonical-vault/`

- Markdown pages
- attachments
- 最终长期知识真相
- Git 仓库

#### `memos-data/`

- 快速 capture 的原始记录
- 可周期性人工归档进主库

#### `anythingllm-data/`

- AI workspace state
- provider / workspace / vector side state

#### `swarmvault-main/`

- `raw/`
- `wiki/`
- `state/`
- `agent/`

如果不想把 artifact 混入源码树，可优先用 `SWARMVAULT_OUT` 做隔离。

## 各地点 Codex 的接入方式

### 家里主力机

- 可直接读 NAS 主库
- 可使用 AI layer
- 如需本地 repo graph，可额外跑 repo-local `SwarmVault`

### 公司机器

- 优先通过 SSH / 反向代理访问 NAS
- 共享主知识和 handoff artifacts
- 对公司内未同步本地分支，不依赖中心 NAS 做唯一 live graph

### 笔记本

- 作为轻量客户端
- 消费主知识、AI retrieval、context packs
- 离线时不必承担完整编译职责

## `SwarmVault` 在这个蓝图中的边界

这点必须单独强调。

`SwarmVault` 在这里不是主知识库编辑台，而是：

- compiler
- graph builder
- context-pack generator
- task memory artifact layer

它非常重要，但不应替代主库。

更详细的边界见 [[swarmvault-nas-multi-codex-service-evaluation-2026-07-05]]。

## 推荐的 PoC 顺序

### Phase 1

- 部署 `SilverBullet`
- 把主知识库目录挂进去
- Git 化主库

### Phase 2

- 部署 `Memos`
- 作为 capture / inbox 入口

### Phase 3

- 部署 `AnythingLLM`
- 只读索引主知识库

### Phase 4

- 对目标 repo / docs 部署 `SwarmVault`
- 生成 graph / context packs / task memory

### Phase 5

- 如果确实有大量 temporal facts，再引入 `Graphiti`

## 为什么这套蓝图稳

因为它允许你逐层增加能力，而不是一开始就押一个巨型单体。

好处是：

1. 主知识资产始终是文件
2. AI 层可以替换
3. graph / retrieval 层可以重建
4. NAS 天然适合做长期在线的知识编译中心
5. 各地点 `Codex` 可以共享 durable context，而不是每台机器从零开始

## 当前建议

如果下一步从研究进入工程实施，我建议先以这页蓝图为基线，再继续收敛到：

- 具体子域
- 具体数据目录
- 反向代理与认证
- Git 备份策略
- 各地点 `Codex` 的接入桥接方式

这会比继续泛泛比较更多开源项目更有价值。
