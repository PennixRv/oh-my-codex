---
title: "Codex 长期知识库选型研究 2026-07-05"
tags: ["codex", "memory", "knowledge-base", "wiki", "pkm", "rag", "graph", "research"]
created: 2026-07-05T13:15:00.000Z
updated: 2026-07-05T13:15:00.000Z
sources:
  - "https://github.com/swarmclawai/swarmvault"
  - "https://github.com/mex-memory/mex"
  - "https://github.com/silverbulletmd/silverbullet"
  - "https://github.com/logseq/logseq"
  - "https://github.com/foambubble/foam"
  - "https://github.com/dendronhq/dendron"
  - "https://github.com/requarks/wiki"
  - "https://github.com/outline/outline"
  - "https://github.com/BookStackApp/BookStack"
  - "https://github.com/khoj-ai/khoj"
  - "https://github.com/mem0ai/mem0"
  - "https://github.com/langchain-ai/langmem"
  - "https://github.com/getzep/graphiti"
links: ["codex-memory-context-research-2026-07-05.md", "codex-memory-project-due-diligence-2026-07-05.md", "pennix-omx-fork-design-inventory-2026-07-04.md"]
category: reference
confidence: medium
schemaVersion: 1
---

# Codex 长期知识库选型研究 2026-07-05

## Scope

这页只研究长期知识库层，不再把重点放在会话热路径记忆、`PreCompact`、runtime hooks 或 `agentmemory` 这类 session memory server 上。

本轮问题是：

1. 长期知识应该存在哪里。
2. 它应该如何被人类审阅、维护、搜索、迁移。
3. 它应该如何服务 Codex / OMX / agent 工作流。
4. 当前 `omx_wiki` 为什么使用体验不理想，以及应不应该换形态。

这里的长期知识包括：

- 项目设计决策。
- 架构约束。
- 运行环境事实。
- 部署拓扑。
- 常见故障和验证命令。
- 发布流程。
- 用户偏好和工作流约定。
- 不适合只留在向量库里的稳定知识。

## Executive Summary

### 结论先行

1. 长期知识库不应选择单一“AI memory database”。长期知识的第一性要求是可审阅、可 diff、可迁移、可被人直接修正，而不是召回分数最高。
2. `agentmemory` 适合作为 runtime memory / handoff 层，不适合作为唯一长期知识底座。
3. 对 Codex / OMX 最合理的长期知识架构是 `Markdown-first canonical store + structured index + optional graph/RAG retrieval`。
4. 当前 `omx_wiki` 的方向没有错，但产品形态偏弱：单层扁平文件、弱索引、弱 schema、弱 review、弱 graph、弱检索反馈，会导致页面越多越难维护。
5. 如果只选一个最值得研究的长期知识库候选，当前是 `swarmvault`。它最接近“LLM Wiki + graph + local artifacts + agent context packs”。
6. 如果只选一个最务实、低风险的 UI / NAS 自托管层，当前是 `SilverBullet`。它是 Markdown 文件空间加浏览器 UI 和查询/脚本能力，适合作为 `omx_wiki` 的人类编辑界面候选。
7. 如果只选一个长期工程记忆规范层，当前是 `mex`。它解决的是 scaffold、drift detection、项目记忆结构，不是完整 wiki UI。
8. `Logseq` / `Foam` / `Dendron` 代表成熟 Markdown PKM 思路，但不应直接作为 OMX 后端依赖：它们更像人类笔记工具或编辑体验参考。
9. `Wiki.js` / `Outline` / `BookStack` 是团队文档系统，不是 agent-native 长期记忆系统。它们适合做人类门户，不适合做 Codex 工作流内核。
10. `Khoj` / `mem0` / `langmem` / `Graphiti` 是 RAG / memory / graph 技术层，不应成为长期知识 canonical store。它们可以作为检索增强层或实验层。

### 推荐组合

短期最稳妥组合：

```text
canonical knowledge:  repo-local Markdown knowledge vault
human editing UI:     SilverBullet or existing editor workflow
agent context packs:  SwarmVault-inspired generated packs
drift checks:         mex-inspired schema/check command
runtime memory:       agentmemory on NAS, optional
remote retrieval:     existing NAS Memory MCP or future search API
```

对 OMX 的推荐不是“替换成某个项目”，而是把当前 `omx_wiki` 升级为更明确的 `knowledge vault`：

```text
knowledge/
  schema.md
  decisions/
  architecture/
  operations/
  workflows/
  incidents/
  research/
  handoffs/
  generated/
    graph.json
    search-index/
    context-packs/
```

## Evaluation Lens

长期知识库的评价标准和 session memory 不同：

| 维度 | 高价值特征 | 低价值特征 |
| --- | --- | --- |
| Canonical store | Markdown / Git / 文件系统 / 可审阅 | 只在数据库或向量库里 |
| Human review | diff、frontmatter、link、schema、lint | 黑盒自动摘要 |
| Agent fit | MCP、context pack、CLI、可自动生成上下文 | 只能手工浏览 |
| Drift control | 能发现文档与代码/事实偏离 | 只负责写入，不负责过期 |
| Retrieval | 关键词 + tag + graph + semantic 可组合 | 单一全文搜索或单一 embedding |
| Deployment | 本地优先，可 NAS 自托管，可备份 | 重 SaaS 或复杂数据库 |
| Governance | 删除、归档、审计、来源追踪 | 没有来源和生命周期 |

## Candidate Matrix

| Project | 类型 | T3 适配度 | 优势 | 主要风险 |
| --- | --- | --- | --- | --- |
| `swarmvault` | LLM Wiki / graph / RAG vault | 很高 | local-first, wiki/graph/search/context packs/MCP, agent-oriented | 新项目，生态小，Node >= 24 |
| `mex` | project memory scaffold + drift CLI | 高 | 针对 coding agent，结构化项目记忆，drift detection | 不是完整 wiki UI / retrieval platform |
| `SilverBullet` | self-hosted Markdown PKM | 高 | Markdown files, browser UI, self-hosted, query/script | 不是 agent-native，需要 OMX 自己接检索/上下文包 |
| `Logseq` | mature local-first PKM | 中高 | Markdown/graph/local-first 成熟，社区大 | AGPL，面向人类笔记，不是 agent workflow |
| `Foam` | VS Code Markdown PKM | 中高 | GitHub/VS Code/Markdown/wiki links，轻量 | 主要是编辑体验，不是服务端/agent 层 |
| `Dendron` | hierarchical Markdown PKM | 中 | Git-backed vault/hierarchy/graph 思路强 | README 明确 active development ceased，维护风险 |
| `Wiki.js` | self-hosted team wiki | 中 | 成熟、Git/Markdown、Docker、团队门户 | AGPL，agent-native 能力弱 |
| `Outline` | team knowledge base | 中 | UI 好、协作强、Markdown compatible | license 非标准 OSS，偏团队 SaaS 风格 |
| `BookStack` | structured docs wiki | 中 | MIT，成熟，自托管，人类知识结构清楚 | Git/Markdown/agent integration 弱 |
| `Khoj` | self-hosted AI second brain / RAG | 中 | docs semantic search，自托管，Obsidian/Emacs/browser | AGPL，canonical store 不是它，偏 AI app |
| `mem0` | universal AI memory layer | 中低 | 流行度最高，memory API 强 | 不是 wiki，长期知识不可审阅性弱 |
| `langmem` | LangGraph memory primitive | 中低 | memory extraction primitives 好 | 绑定 LangGraph 思路，不是知识库产品 |
| `Graphiti` | temporal knowledge graph | 中低 | temporal graph for agents 很强 | 不是文档库，适合增强层而非主存储 |

## Project Findings

### 1. `swarmvault`

#### Evidence

仓库描述直接定位为 local-first LLM Wiki、knowledge graph builder、RAG knowledge base、agent memory store，并明确提到 durable Claude Code / Codex / OpenClaw memory。

README 显示其产物结构包括：

- `raw/`：源材料。
- `wiki/`：生成与人工维护的 Markdown wiki。
- `state/graph.json`：机器可读知识图。
- `state/retrieval/`：本地检索索引。
- `wiki/graph/share-card.md` / SVG / share-kit。
- `agent/`：生成给 agent 使用的 helper。

它明确提供：

- `swarmvault quickstart`
- `swarmvault query`
- `swarmvault graph serve`
- `swarmvault next`
- `swarmvault doctor`
- `swarmvault compile --approve`
- MCP server
- context packs
- graph viewer
- hybrid search
- contradiction detection
- git-backed workflow

#### Fit

这是本轮最接近 OMX 长期知识库目标的项目，因为它不是只做“记忆 API”，而是把长期知识明确做成：

```text
source material -> generated/reviewed markdown wiki -> graph -> retrieval/context packs -> agent use
```

这比当前 `omx_wiki` 强的地方：

1. 有 raw/wiki/state/agent 分层。
2. 有 graph 和 retrieval index。
3. 有 review/approve 工作流。
4. 有 context pack 概念。
5. 有 MCP / agent-facing 接口。
6. 有 `next` / `doctor` 这类状态机式 CLI。

#### Risk

- 新项目，stars 约 `594`，成熟度不能和 Logseq/Wiki.js 比。
- Node `>=24`，对当前工具链有要求。
- 生成式 wiki 必须防止幻觉沉淀；它自己的 `compile --approve` 和 conflict lint 是正方向，但需要实际验证。

#### OMX takeaway

`swarmvault` 是最值得借鉴的长期知识库形态。即使不直接采用，也应参考它的目录结构和生命周期：

```text
raw -> wiki -> state/graph -> state/retrieval -> agent/context-packs
```

### 2. `mex`

#### Evidence

仓库定位是 persistent project memory for AI coding agents，核心卖点是 structured scaffold + drift detection CLI。

README 明确指出常见 agent memory 问题：

- 巨型 `CLAUDE.md` / rules file 会污染 context。
- 决策、模式、项目状态需要持久化。
- docs 会和代码漂移。
- `mex check` 用于捕获 stale 或 broken scaffold claims。

#### Fit

`mex` 不像完整 wiki，更像长期工程记忆规范器。它适合补当前 `omx_wiki` 的最大短板：缺少 schema 和 drift control。

适合借鉴：

- 小 anchor 文件 + routed context，而不是一个巨型总提示文件。
- project memory scaffold。
- drift check。
- 对 coding agent 的默认结构。

不适合承担：

- 人类友好的完整知识库 UI。
- graph viewer。
- NAS 自托管门户。
- 语义检索平台。

#### OMX takeaway

`mex` 适合作为 `omx wiki lint/check` 的设计参考，而不是替代 `omx_wiki`。

### 3. `SilverBullet`

#### Evidence

README 把它定义为 programmable, private, browser-based, open source, self-hosted personal knowledge database。内容以 Markdown Pages 组成的 Space 保存，支持 wiki-style linking、built-in database、query language、Space Lua scripting，并可 Docker 运行：

```bash
docker run -p 3000:3000 -v <PATH-TO-YOUR-SPACE>:/space silverbullet
```

#### Fit

`SilverBullet` 是本轮最适合 NAS 自托管做人类编辑层的候选。

它适合解决当前 `omx_wiki` 的一个现实问题：CLI 生成 Markdown 后，人类浏览、维护、重构、查找、编排体验差。

如果将 `omx_wiki` 或未来 `knowledge/` 映射为 SilverBullet Space，可以获得：

- 浏览器编辑 UI。
- Markdown canonical files。
- wiki links。
- 查询能力。
- 自托管部署。
- 不必把知识交给外部 SaaS。

#### Risk

- 它不是 agent-native memory system。
- 没有天然 Codex hooks / handoff。
- 需要 OMX 自己定义 frontmatter、目录、context pack 生成器。

#### OMX takeaway

如果用户“不喜欢当前 omx_wiki 设计”，最现实的第一步可能不是换成 RAG，而是：

```text
保留 Markdown canonical store
用 SilverBullet 提供人类编辑/浏览层
OMX 负责生成 index/graph/context packs
```

### 4. `Logseq`

#### Evidence

仓库描述是 privacy-first, open-source platform for knowledge management and collaboration；topics 包含 knowledge-base、graph、markdown、git、local-first、knowledge-graph、note-taking、PKM。

#### Fit

`Logseq` 是成熟 PKM 代表，适合学习：

- block/outliner 知识组织。
- 双链和 graph。
- local-first 知识管理。
- Markdown / org-mode 文件存储。

但它不是 Codex 长期知识库内核的最佳候选：

- AGPL。
- 面向人类笔记，不面向 agent handoff/context packs。
- 结构可能更适合个人日记/卡片，而不是 repo-native engineering memory。

#### OMX takeaway

学交互和 graph，不直接依赖。

### 5. `Foam`

#### Evidence

README 定义为 built on VS Code and GitHub 的 personal knowledge management and sharing system，支持 graph visualization、wiki syntax、link alias、navigation、backlink 等。

#### Fit

`Foam` 很适合 developer-local Markdown vault 编辑体验：

- VS Code 内工作。
- GitHub / Markdown / wiki links。
- graph visualization。
- 不引入复杂后端。

但它不是服务端，也不是 agent runtime 层。它更适合成为“编辑体验参考”或用户本地浏览补充。

#### OMX takeaway

如果未来 `omx_wiki` 改成标准 Markdown vault，应尽量兼容 Foam/Obsidian 风格 wiki links 和 frontmatter。

### 6. `Dendron`

#### Evidence

README 明确说 Dendron 是 local-first, markdown-based note-taking tool，能用 Git 管理、git blame、vaults、graph view、hierarchy、publish。但 README 也明确写 active development has ceased / maintenance only。

#### Fit

设计思想很契合长期工程知识：

- hierarchy。
- schema。
- vaults。
- Git-backed notes。
- publishing。
- scale-oriented retrieval。

但维护状态是硬风险。

#### OMX takeaway

学它的 hierarchy/schema/vault 思路，不建议作为新依赖。

### 7. `Wiki.js`

#### Evidence

成熟 self-hosted wiki，Node.js，Docker pulls 多，topics 包含 wiki、git、documentation、markdown、open-source。

#### Fit

适合作为团队文档门户，不适合作为 OMX agent memory 内核。

优点：

- 自托管成熟。
- 人类 wiki UI 强。
- Git/Markdown 相关能力。

风险：

- AGPL。
- agent context pack、drift detection、Codex handoff 不原生。
- 引入完整 web app 运维面。

#### OMX takeaway

如果要给 NAS 上的长期文档加一个成熟 web 门户，Wiki.js 可以评估；但它不是第一推荐。

### 8. `Outline`

#### Evidence

仓库描述是 team knowledge base，realtime collaborative，markdown compatible，stars 约 `39k`，但 licenseInfo 是 `other`。

#### Fit

人类团队知识库体验强，但对当前需求不优：

- 非标准 OSS license 风险。
- 偏团队协同/SaaS 产品。
- 不以 repo-local Markdown canonical store 为中心。

#### OMX takeaway

不建议作为 OMX 长期知识底座。

### 9. `BookStack`

#### Evidence

成熟 self-hosted documentation/wiki，MIT，结构是 books/chapters/pages。GitHub README 标明当前主要迁移到 Codeberg 管理。

#### Fit

BookStack 适合人工文档站：

- 结构清楚。
- 上手容易。
- 自托管成熟。
- MIT。

但不适合 agent-native 长期知识：

- 不是 Markdown/Git-first。
- graph / context pack / drift detection 不原生。
- 更偏人类手册。

#### OMX takeaway

如果目标是 NAS 上的人类文档站，BookStack 可选；如果目标是 Codex 长期知识层，不是首选。

### 10. `Khoj`

#### Evidence

README 定位为 self-hostable AI second brain，可从 web 或 docs 回答问题，支持 markdown、org-mode、word、notion files，支持 Obsidian/Emacs/browser/phone/WhatsApp，semantic search。

#### Fit

Khoj 是很强的 self-hosted RAG / AI assistant，不是 canonical store。

适合：

- 在已有 docs/vault 上做语义检索。
- NAS 自托管 AI search。
- 对 Markdown/Obsidian 知识库做问答。

不适合：

- 替代长期知识源。
- 管理工程决策生命周期。
- 保证文档 drift control。

#### OMX takeaway

可作为第二阶段检索增强层，不是第一阶段知识库结构。

### 11. `mem0`

#### Evidence

仓库描述为 universal memory layer for AI Agents，stars 约 `60k`，Apache-2.0，长期记忆和多层 memory API 很强。

#### Fit

`mem0` 是 AI memory framework，不是 wiki。

优点：

- 流行度和生态强。
- API / memory algorithm 值得研究。
- 可作为应用级长期个性化 memory 层。

缺点：

- 不提供人类可审阅的 Markdown canonical store。
- 不解决项目知识治理。
- 长期事实容易变成数据库黑盒。

#### OMX takeaway

不应作为 OMX T3 主存储，只适合作为未来 memory API 参考。

### 12. `langmem`

#### Evidence

README 定位为帮助 agents 从交互中学习，提供 core memory API、memory management tools、background memory manager，并原生集成 LangGraph long-term memory store。

#### Fit

它是 LangGraph agent memory primitive，不是长期知识库产品。适合学习：

- hot-path memory tools。
- background consolidation。
- storage-agnostic memory APIs。

不适合作为 OMX wiki 替代。

### 13. `Graphiti`

#### Evidence

仓库描述为 Build Real-Time Knowledge Graphs for AI Agents，README 强调 temporal context graphs for AI agents，并有 MCP server。

#### Fit

Graphiti 是很强的 graph memory / temporal knowledge graph 技术层。它适合放在：

```text
Markdown canonical store -> extracted temporal graph -> agent graph query
```

不适合把它作为唯一长期知识库，因为它不是文档 authoring/review system。

#### OMX takeaway

如果 OMX 未来要给知识库加 graph intelligence，Graphiti 值得第二阶段研究。

## Current `omx_wiki` Design Problems

用户说“不太喜欢 omx 的 wiki 设计”，这个判断有依据。当前 `omx_wiki` 的主要问题不是 Markdown 本身，而是缺少知识库产品层。

### Problem 1: 扁平页面结构

当前所有页面都在 `omx_wiki/*.md` 一层目录中。随着研究页、事故页、发布页、设计页增多，页面类型之间没有强边界。

影响：

- 查找依赖文件名记忆。
- 页面关系靠人工 link。
- 难以做按领域的 context pack。

### Problem 2: schema 太弱

当前 frontmatter 有 `title/tags/sources/links/category/confidence/schemaVersion`，但没有强约束：

- 页面类型。
- 生命周期状态。
- stale/review 时间。
- 事实 vs 推断。
- owner。
- source strength。
- last verified。
- downstream consumers。

影响：

- 很难判断一页是否仍可信。
- 很难自动路由到合适上下文。
- 很难做 drift detection。

### Problem 3: index/log 是派生面，但不够产品化

`index.md` 和 `log.md` 解决了“有入口”，但没有解决：

- 搜索质量。
- 分类导航。
- graph navigation。
- 未验证候选知识。
- review queue。
- stale queue。

### Problem 4: 缺少 raw / curated / generated 分层

当前页面混合了：

- 原始会话发现。
- 人工结论。
- 自动整理。
- 研究摘要。
- 操作事实。

影响：

- 无法区分证据和稳定知识。
- 自动生成内容可能直接变成长期事实。

### Problem 5: 对 agent 可用，但对人类不够好用

Markdown 对 agent 友好，但当前缺少人类编辑界面、query UI、graph UI、review UI。长期来看会降低维护意愿。

## Recommended OMX Long-Term Knowledge Architecture

### Layer 1: Canonical Markdown Vault

继续保留 repo-local Markdown，但不要继续单层 `omx_wiki/*.md` 无限扩展。

建议目标形态：

```text
omx_knowledge/
  schema.md
  inbox/
  decisions/
  architecture/
  operations/
  workflows/
  incidents/
  research/
  environment/
  handoffs/
  references/
  generated/
    index.md
    graph.json
    search-index/
    context-packs/
    stale-report.md
```

`omx_wiki` 可以保留为兼容目录，长期逐步迁移。

### Layer 2: Structured Frontmatter

建议页面 frontmatter 至少包含：

```yaml
title:
type: decision | architecture | operation | incident | research | handoff | convention
status: draft | reviewed | superseded | stale
created:
updated:
last_verified:
confidence: low | medium | high
source_strength: direct | inferred | external | memory
tags:
projects:
systems:
links:
supersedes:
superseded_by:
review_after:
```

### Layer 3: Review / Drift Workflow

借鉴 `mex`：

- `omx knowledge check`
- `omx knowledge lint`
- `omx knowledge stale`
- `omx knowledge verify --page`

最小目标：

- broken links。
- duplicate titles。
- missing required frontmatter。
- stale pages。
- pages referencing missing files/commands。
- high-confidence pages with no source.

### Layer 4: Graph / Retrieval Index

借鉴 `swarmvault`：

- 生成 `generated/graph.json`。
- 生成 `generated/context-packs/*.md`。
- 保留 keyword/tag search。
- 第二阶段再加 semantic search。

不要一开始就把 canonical store 改成向量库。

### Layer 5: Human UI

最现实候选：

1. `SilverBullet`：NAS 自托管 Markdown Space UI。
2. `Foam`：VS Code 本地编辑体验。
3. `Obsidian`：非 OSS，但作为本地编辑器兼容 Markdown vault。

如果用户不喜欢当前 `omx_wiki`，优先改人类入口和目录/schema，而不是直接换成数据库。

## Final Recommendation

### 最佳单项目研究对象

`swarmvault`

原因：

- 最接近长期知识库的目标架构。
- local-first。
- Markdown wiki 是核心产物。
- 有 graph / retrieval / context pack / MCP。
- 明确面向 Codex / Claude Code / agent memory。

### 最佳务实落地组合

```text
OMX canonical vault:
  自己维护 Markdown-first 知识库

Human UI:
  SilverBullet on NAS

Agent/routing ideas:
  SwarmVault context packs + graph

Drift control:
  mex check/scaffold 思路

Runtime memory:
  agentmemory, 只做 T1/T2，不做长期真相源

Optional retrieval:
  existing NAS Memory MCP / future Khoj or Graphiti layer
```

### 不建议

1. 不建议把长期知识主存储放进 `agentmemory` / `mem0` / `langmem` 这类 memory DB。
2. 不建议把 `omx_wiki` 直接替换成 Wiki.js / Outline / BookStack 这类人类 wiki；它们不能天然服务 Codex context routing。
3. 不建议继续让 `omx_wiki` 保持单层散页增长。
4. 不建议只靠 semantic search；长期知识首先要可治理。

## Next Research Step

如果继续深入，建议只做两条线：

1. `swarmvault` 实测：用 `oh-my-codex` 跑一次 quickstart/scan，观察生成的 `wiki/`、`state/graph.json`、context packs 是否真适合 OMX。
2. `SilverBullet` NAS PoC：把 `omx_wiki` 或一个复制出来的 vault 挂到 `/space`，验证人类维护体验是否明显优于当前扁平 Markdown。

这两个 PoC 能直接回答：

- 是否要迁移 `omx_wiki` 结构。
- 是否需要自己写 `omx knowledge`。
- 是否值得把长期知识层做成 OMX 的一级能力。

