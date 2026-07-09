---
title: "Codex 开源知识栈组合建议 2026-07-05"
tags: ["codex", "knowledge-base", "self-hosted", "silverbullet", "anythingllm", "swarmvault", "graphiti", "memos", "research"]
created: 2026-07-05T14:10:00.000Z
updated: 2026-07-05T14:10:00.000Z
sources:
  - "https://github.com/silverbulletmd/silverbullet"
  - "https://github.com/swarmclawai/swarmvault"
  - "https://github.com/Mintplex-Labs/anything-llm"
  - "https://github.com/khoj-ai/khoj"
  - "https://github.com/getzep/graphiti"
  - "https://github.com/usememos/memos"
  - "https://github.com/infiniflow/ragflow"
  - "https://github.com/BookStackApp/BookStack"
  - "https://github.com/requarks/wiki"
links: ["codex-long-term-knowledge-base-research-2026-07-05.md", "codex-memory-project-due-diligence-2026-07-05.md", "silverbullet-canonical-vault-evaluation-2026-07-05.md", "codex-ai-layer-anythingllm-vs-khoj-2026-07-05.md", "nas-self-hosted-knowledge-stack-deployment-blueprint-2026-07-05.md", "swarmvault-nas-multi-codex-service-evaluation-2026-07-05.md"]
category: reference
confidence: medium
schemaVersion: 1
---

# Codex 开源知识栈组合建议 2026-07-05

## Scope

这页只回答一个问题：

如果不继续把 `omx_wiki` 当最终产品形态，而是尽可能使用开源项目搭一套“人类友好 + AI agent 友好 + NAS 可自托管”的长期知识系统，当前更合理的组合是什么。

这页是 [[codex-long-term-knowledge-base-research-2026-07-05]] 的进一步收敛，不再扩展会话热路径 memory 项目，而是明确长期知识栈的角色分工。

## 结论先行

截至 `2026-07-05`，没有一个我愿意无保留称为“全能选手”的开源项目，能够同时把下面五件事都做好：

1. `canonical store` 必须是可审阅、可 diff、可 Git 迁移的长期真相层。
2. 人类日常编辑和浏览必须舒服。
3. AI / RAG / agent / MCP 能力必须成熟。
4. 长期 graph / context-pack / handoff 能力必须强。
5. 许可证、部署方式、后续维护成本必须稳妥。

因此最优路线不是押单体，而是分层组合。

进一步展开的专题页：

- `SilverBullet` 真相层角色见 [[silverbullet-canonical-vault-evaluation-2026-07-05]]
- AI layer 取舍见 [[codex-ai-layer-anythingllm-vs-khoj-2026-07-05]]
- NAS 部署蓝图见 [[nas-self-hosted-knowledge-stack-deployment-blueprint-2026-07-05]]

## 推荐的角色分工

### 1. Canonical Knowledge Vault

首选：`SilverBullet`

原因：

- Markdown 文件空间是主存储，不是黑盒数据库。
- 有浏览器 UI。
- 自托管容易。
- 适合 NAS 长期挂载和 Git 管理。

它更像“主知识库编辑台”，不是 AI 工作台。

### 2. AI Retrieval / Agent Workspace

首选：`AnythingLLM`

原因：

- MIT 许可。
- 多模型、多向量后端、多 workspace。
- 文档摄取、RAG、agents、MCP、scheduled tasks 都比较完整。

它更像 AI 中台，不应反客为主成为知识真相源。

备选：`Khoj`

适合更偏“个人 second brain / 个人检索中枢”的路线。

### 3. Agent-Native Compilation / Context Pack Layer

首选：`SwarmVault`

原因：

- 最接近“LLM Wiki + graph + context pack + MCP + agent memory artifact”。
- 明确区分 `raw/`、`wiki/`、`state/`、`agent/`。
- 对 Codex / Claude Code 这类 coding agent 的适配意识最强。

它适合做编译层和 handoff 层，不建议一上来就直接取代所有主知识库写作流程。

### 4. Temporal Relationship / Dynamic Fact Layer

首选：`Graphiti`

原因：

- temporal context graph 能力强。
- 适合“关系会变化、事实有时间维度”的长期知识。
- 有 MCP server。

它不是文档 authoring 系统，而是增强层。

### 5. Capture / Inbox Layer

首选：`Memos`

原因：

- 自托管轻量。
- Markdown-native。
- 有 REST / gRPC / webhook / MCP。
- 适合快速收集零散发现、临时记录、会话碎片。

它适合做捕获入口，不适合做唯一主库。

## 默认推荐栈

```text
canonical knowledge vault: SilverBullet
capture / inbox:           Memos
AI retrieval / agents:     AnythingLLM
agent-native compiler:     SwarmVault
temporal graph:            Graphiti (optional)
```

这是当前最稳妥的组合。

理由不是“功能最多”，而是边界最清楚：

- `SilverBullet` 保持文件真相层。
- `Memos` 接收高频零散输入。
- `AnythingLLM` 负责 AI 对话和检索消费。
- `SwarmVault` 生成 graph、context packs、task memory。
- `Graphiti` 只在确实需要时间维关系图时加入。

## Agent-First 备选栈

```text
canonical artifact: SwarmVault
human editor:       SilverBullet
AI layer:           SwarmVault MCP first, AnythingLLM optional
temporal layer:     Graphiti
capture layer:      Memos (optional)
```

这条路线更激进，优点是最贴近 Codex / Claude Code 的理想工作流。

缺点也很明确：

- `SwarmVault` 还新。
- 编译、approve、candidate pages、graph state 这些范式更重。
- 更依赖使用纪律。

关于它部署在 NAS 上、再服务多地 `Codex` 的具体边界，见 [[swarmvault-nas-multi-codex-service-evaluation-2026-07-05]]。

## 为什么不推荐把以下项目放在第一优先级

### `Wiki.js` / `BookStack`

适合作为团队 wiki 门户，不是最佳 agent-serving canonical store。

### `Outline`

产品体验强，但 license 不是我愿意默认押长期底座的类型。

### `Docmost`

现代协作文档形态不错，但 API / AI / MCP 更偏 enterprise 特性，不适合作为“尽可能开源”的第一主选。

### `Open WebUI` / `Dify` / `Onyx`

它们更像 AI 平台、聊天前端、企业搜索层，不应被误当成长期知识真相库。

### `RAGFlow`

很强，但更像重型 AI context engine / RAG 平台，而不是轻量可维护的主知识库形态。

## NAS + 域名的推荐落地轮廓

建议按服务职责拆子域：

```text
kb.example.com       -> SilverBullet
notes.example.com    -> Memos
ai.example.com       -> AnythingLLM
vault.example.com    -> SwarmVault graph/workbench
graph.example.com    -> Graphiti API or MCP bridge
```

建议按磁盘职责拆目录：

```text
/srv/knowledge/
  canonical-vault/
  memos-data/
  anythingllm-data/
  swarmvault/
  graphiti/
  backups/
```

## 对 OMX 的直接启发

如果后续要把这些思路反哺 OMX，最值得借鉴的是：

1. `SwarmVault` 的 `raw -> wiki -> state -> agent` 分层。
2. `SilverBullet` 的人类友好 Markdown Web UI。
3. `Memos` 的轻量 capture / MCP 能力。
4. `Graphiti` 的 temporal relationship layer。
5. “不要让 AI 层持有真相”的边界纪律。

## 当前建议

如果要开始实际 PoC，推荐顺序是：

1. 先把主知识库和人类编辑层定为 `SilverBullet`。
2. 再加 `Memos` 承接日常捕获。
3. 再让 `AnythingLLM` 只读索引主库。
4. 最后用 `SwarmVault` 为 repo / docs 生成 graph 和 context packs。

这是目前我认为最平衡、最适合 NAS 自托管、也最能服务多个 Codex 的路线。
