---
title: "Codex 记忆项目二次尽调 2026-07-05"
tags: ["codex", "memory", "research", "due-diligence", "mcp", "hooks", "handoff"]
created: 2026-07-05T06:39:47.000Z
updated: 2026-07-05T06:39:47.000Z
sources:
  - "https://github.com/mksglu/context-mode"
  - "https://github.com/rohitg00/agentmemory"
  - "https://github.com/majiayu000/remem"
  - "https://github.com/MarceloCaporale/codex-agent-mem"
  - "https://github.com/djannot/code-session-memory"
  - "https://github.com/mex-memory/mex"
  - "https://github.com/swarmclawai/swarmvault"
  - "https://github.com/volcengine/OpenViking"
links: ["codex-memory-context-research-2026-07-05.md", "agentmemory-suitability-and-deployment-evaluation-2026-07-05.md", "pennix-omx-fork-design-inventory-2026-07-04.md", "context-mode-codex-deployment-and-uninstall-due-diligence-2026-07-06.md"]
category: reference
confidence: medium
schemaVersion: 1
---

# Codex 记忆项目二次尽调 2026-07-05

## Scope

这页是 [[codex-memory-context-research-2026-07-05]] 的二次尽调补充。第一篇已经完成主题分层和第一轮排序；这篇只做三件事：

1. 修正第一轮中容易过度概括的地方。
2. 把每个重点项目的“真实接入面”说清楚。
3. 为 OMX 后续借鉴提供更可靠的事实边界。

本页优先看上游仓库中的实际文件，而不是只看 README 营销文案。重点核查对象：

- `.codex-plugin/plugin.json`
- `.codex-plugin/hooks.json`
- `.mcp.json` 或 MCP 配置样例
- 安装脚本 / connect 脚本
- Codex 相关 docs

其中 `agentmemory` 的部署要求、NAS 共享拓扑、模型依赖与源码/文档漂移，已单独继续深挖到 [[agentmemory-suitability-and-deployment-evaluation-2026-07-05]]。

## High-Level Corrections

### 1. `remem` 需要区分“独立安装路径”和“当前仓库内的 Codex 插件包装层”

第一轮研究里把 `remem` 总结成“轻量自动 warm-start 方案”，这个大方向没错，但不够精确。

更准确的说法是：

- 作为独立安装路径，`remem install --target codex` 会配置 Codex 的 hooks 和 MCP，README 也明确写了会在 `SessionStart` 注入上下文、在 `Stop` 后做总结。
- 但当前仓库里的 Codex plugin wrapper 明确写着不默认静默启用 hooks，自动注入和 Stop summarization 需要显式运行 `node plugins/remem/scripts/activate-codex.js`。

因此：

- `remem` 作为“产品能力”支持自动 warm-start。
- 但 `remem` 当前的 plugin 包装层仍然是偏保守、显式激活的设计。

### 2. `codex-agent-mem` 不是 hooks-first，而是 `notify + MCP + optional AGENTS.md sync`

第一轮里把它归为“pull-based continuity layer”是对的，但这还不够。

更准确的说法是：

- 主要捕获入口是 Codex `notify`。
- 主要检索入口是 MCP stdio。
- 自动 reinjection 不是通过 `SessionStart` hooks，而是可选的 `AGENTS.md` 同步。
- `--sync-project-doc` 是 opt-in，不是默认启用。

这意味着它更像“低开销工作记忆生成器 + 可检索 continuity store”，而不是“全面观察所有生命周期的 hook runtime”。

### 3. `OpenViking` 的 Codex 接入确实存在，但比第一轮印象更重、更脆弱

第一轮里把它视为平台级大方案是对的，但需要补充一个更重要的事实：

- 仓库里确实有完整的 Codex memory plugin 示例。
- 但官方推荐路径不是纯插件市场安装，而是 one-line installer + shell wrapper。
- README 直接说明纯市场安装只适合本地、无认证的 `127.0.0.1:1933/mcp`，远程或带认证的服务不适合这条路径。

因此对 Codex 而言，它不是“开箱即用插件”，而是“有能力，但需要较强运维接入”。

### 4. `swarmvault` 不应再被视为会话热路径压缩器

第一轮里把 `swarmvault` 放在长期记忆层是对的，但它和 T1 的距离其实比第一轮表达得更远。

从 `packages/engine/src/hooks/codex.ts` 看，它在 Codex 上主要做的是：

- graph-first 提示注入
- session marker reset
- 引导先读 graph/report 再广搜

它的 `context-pack` 是一等公民，但属于 durable artifact/workflow 输出，不是单会话压缩恢复的 hot-path runtime。

### 5. `mex` 是 scaffold + drift control，不是 runtime memory layer

第一轮把它放在 T2/T3 是合理的，但这里补明确：

- `mex` 的核心是 `.mex/` scaffold。
- 主要文件是 `AGENTS.md`、`ROUTER.md`、`context/*`、`patterns/*`。
- `watch` 安装的是 git `post-commit` hook，用于 drift check。
- 它没有进入 Codex 会话生命周期热路径去做 message/tool capture。

所以：

- 它是项目记忆结构化工具。
- 不是会话级 memory interception 工具。

## Deep Dive Matrix

| Project | 真实接入面 | 自动化程度 | 存储形态 | Codex 边界 | 当前判断 |
| --- | --- | --- | --- | --- | --- |
| `context-mode` | 插件 hooks + MCP + 手动 fallback 配置 | 高 | SQLite + FTS5 | source-available，非 OSS | T1 标杆，借鉴意义极高 |
| `agentmemory` | 插件 hooks + MCP + 独立 server | 很高 | 共享 memory server，graph/vector/BM25 | 重、复杂、Desktop 仍要 workaround | 严格 OSS 全能候选 |
| `remem` | 独立 install 或插件 wrapper + 显式 hooks 激活 | 中 | SQLite/SQLCipher | 插件包装层尚非最终形态 | 轻量 warm-start 很强 |
| `codex-agent-mem` | `notify` + MCP + 可选 AGENTS 同步 | 中 | SQLite + FTS5 + pack artifact | 不是 hooks-first | 最值得学的低开销 continuity 设计之一 |
| `code-session-memory` | `notify` 索引 + 2 个 MCP 工具 + CLI compactor | 中 | sqlite-vec 或 pgvector | 无公开 license | handoff / restart 文档很强 |
| `mex` | repo scaffold + drift CLI + post-commit hook | 低到中 | Markdown scaffold | 不接入会话热路径 | 项目长期记忆层优秀 |
| `swarmvault` | graph-first hooks + context packs + wiki/graph/mcp | 中 | wiki + graph + search DB | 偏知识库，不偏 hot-path | 长期知识库层优秀 |
| `OpenViking` | 外部 memory server + Codex plugin 示例 + shell wrapper | 高 | 平台级 session/context/memory store | 接入重，远程认证路径复杂 | 平台级参考，不宜轻率集成 |

## Project Deep Dives

## 1. `mksglu/context-mode`

### What is clearly true

从 `.codex-plugin/plugin.json` 可以直接确认：

- 插件版本 `1.0.169`。
- 对外自述就是 “session continuity + 11 languages sandbox + FTS5 knowledge base + automatic state restore across compactions”。
- license 字段是 `Elastic-2.0`。

从 `.codex-plugin/hooks.json` 可确认 Codex 插件实际注册了这 `6` 类 hooks：

- `PreToolUse`
- `PostToolUse`
- `SessionStart`
- `PreCompact`
- `UserPromptSubmit`
- `Stop`

从 `.codex-plugin/mcp.json` 可确认它把 `context-mode` 作为 MCP server 暴露给 Codex。

### Important nuance

- 它在 Codex 上没有 `PostCompact`，至少插件清单里没有。
- 它更强调“在压缩前先把有价值的执行痕迹转入 SQLite/FTS5，再按需回取”，而不是“压缩后再修补”。
- README 中的 `98%` 节省是产品话术，不能直接当作对任何项目、任何会话的保证。

### OMX takeaway

对 OMX 而言，它最值得学的不是具体工具列表，而是三点：

1. `PreCompact` 是一等能力，不是次要补丁。
2. 会话内状态不应只保存 prose summary，而应保存事件化、可索引的工作痕迹。
3. 效率指标也应成为产品面，而不是隐藏实现细节。

## 2. `rohitg00/agentmemory`

### What is clearly true

从 `plugin/.codex-plugin/plugin.json` 可以直接确认：

- 版本 `0.9.27`
- 说明里直接写了 `6 hooks`, `53 MCP tools`, `8 skills`

从 `plugin/hooks/hooks.codex.json` 可确认 Codex 插件确实注册了这 `6` 个 hooks：

- `SessionStart`
- `UserPromptSubmit`
- `PreToolUse`
- `PostToolUse`
- `PreCompact`
- `Stop`

从 `src/cli/connect/codex.ts` 可确认：

- `agentmemory connect codex` 会在 `~/.codex/config.toml` 写一个 `[mcp_servers.agentmemory]` block。
- 默认 MCP 命令是 `npx -y @agentmemory/mcp`。
- `AGENTMEMORY_URL` 默认指向 `http://localhost:3111`。
- README 里提到的 Desktop workaround 不是口头建议，而是 connect 流程的一部分能力。

### Important nuance

- `PreToolUse` 在 Codex hooks.json 中的 matcher 只覆盖 `Edit|Write|Read|Glob|Grep`，不是“任何工具”。
- Codex hooks 里用的是 `${CLAUDE_PLUGIN_ROOT}` 路径变量，这依赖 Codex 注入兼容环境变量。
- README 明确提到 Codex Desktop 当前 plugin-local hooks 仍有上游问题，需要 `--with-hooks` 写入全局 hooks.json 作为 workaround。

### OMX takeaway

`agentmemory` 最值得借鉴的点不是“53 个工具”，而是：

1. 把 capture / recall / handoff / history 做成一整套可调用工作流。
2. 用 plugin + hooks + MCP 同时覆盖自动与手动两条路径。
3. 允许 Codex 和其他 agent 共享同一个 memory server。

但如果 OMX 只想补 T1/T2 的关键缝，它整体偏重。

## 3. `majiayu000/remem`

### What is clearly true

从 README 可确认独立安装路径：

- `remem install --target codex` 会配置 Codex hooks 和 MCP。
- 默认使用 `SessionStart` 注入上下文，`Stop` 后台总结。
- 明确声明不会默认安装高频 `PostToolUse(Bash)` 观察钩子，除非显式设置 `REMEM_ENABLE_CODEX_BASH_OBSERVE=1`。

从 `plugins/remem/.codex-plugin/plugin.json` 可确认当前插件包装层：

- 版本是 `0.5.163`。
- 插件描述写的是 “Automatic context injection and Stop summarization stay behind an explicit activation script.”

从 `plugins/remem/README.md` 和 `plugins/remem/scripts/activate-codex.js` 可确认：

- 插件本身不默认静默启用 hooks。
- 需要显式运行 `activate-codex.js`，其本质是执行 `remem install --target codex --hooks-only`。

从 `docs/spec-codex-context-injection-gating-2026-05-25.md` 可确认一个很重要的设计细节：

- 它专门为 Codex 的 `SessionStart` 行为设计了 duplicate-injection gating。
- 目标是同一 Codex 会话只在第一次发 full context，后续相同上下文静默抑制，必要时只发 delta。

### Important nuance

- 仓库主分支 plugin 版本 `0.5.163` 明显领先于公开 release `v0.5.155`。这意味着主分支文档和已发布版本之间存在轻微漂移风险。
- 目前插件设计文档明确承认“当前插件还是 wrapper，不是最终自足插件产品形态”。

### OMX takeaway

`remem` 最值得借鉴的是：

1. 对 Codex `SessionStart` 重复注入的专门治理。
2. 默认低噪声，不默认开高频 observe hook。
3. 插件路径与全局 host-level hook 激活路径分离。

这三个点都很符合 OMX 的谨慎集成哲学。

## 4. `MarceloCaporale/codex-agent-mem`

### What is clearly true

从 `docs/codex-integration.md` 可确认它的 Codex integration 是六层结构：

1. `notify` 捕获 turn
2. MCP stdio 检索
3. `/ui` inspector
4. 可选 `AGENTS.md` working memory sync
5. provenance / health / snapshot audit tools
6. policy / inheritance / repair flows

从 `examples/codex/config.toml.example` 可确认：

- 它通过 `notify` 调 `codex_agent_mem.codex_notify`
- 通过 `[mcp_servers."codex-agent-mem"]` 暴露 MCP
- 工具面很大，包含 `mem_session_list`、`mem_scope_resolve`、`mem_bootstrap_context`、`mem_context_pack`、`mem_provenance`、`mem_health_runtime`、snapshot/policy 系列工具

从文档还可确认：

- `mem_context_pack` 支持 `known_pack_hash` / `not_modified`
- `--sync-project-doc` 是 opt-in
- `--read-only` 是一个明确的一等运行模式
- 对 Codex Desktop 的 host lifecycle 问题做了单独分析文档

### Important nuance

- 它不是通过 `SessionStart` hooks 自动打入上下文。
- 它对 Codex Desktop 的运行时问题有清醒认识，文档明确说 host lifecycle 才是主要疑点，不把锅简单甩给 MCP 本身。
- 它对 “project-wide container pack 被误当作当前 active scope” 这种问题非常敏感，说明它在 scope hygiene 上比很多项目更成熟。

### OMX takeaway

这个项目最值得借鉴的不是它有多少工具，而是：

1. `context pack` 是明确定义的 artifact，而不是模糊摘要。
2. `known_pack_hash` / `not_modified` 很适合降低重复 token。
3. `scope_resolve` / `bootstrap_context` 很适合做跨会话 handoff 的精确路由。

## 5. `djannot/code-session-memory`

### What is clearly true

从 `src/indexer-cli-codex.ts` 可确认：

- Codex 集成入口就是 `notify` hook。
- 它通过 thread id 去定位 `~/.codex/sessions/...-<thread-id>.jsonl`。
- 然后把新消息索引进自己的存储。

从 `mcp/server.ts` 可确认：

- MCP 面非常小，只有 `query_sessions` 和 `get_session_chunks` 两个工具。
- 存储默认是 `sqlite-vec`。

从 `src/cli-sessions.ts` 可确认：

- `Compact for restart` 不是 MCP 行为，而是 CLI 侧操作。
- 它明确调用 OpenAI 做 compaction。
- 必须设置 `OPENAI_API_KEY`。
- 默认模型是 `gpt-5-nano`。
- 成功后会尝试复制到 clipboard，否则打印到 stdout。

### Important nuance

- 这是一个“会话索引 + restart digest”工具，不是完整 runtime memory layer。
- Codex 侧只有 notify 索引，没有 `SessionStart` / `PreCompact` 等生命周期恢复逻辑。
- 该仓库当前没有公开 license，`gh api repos/djannot/code-session-memory/license` 返回 `404`。这不是小问题。

### OMX takeaway

尽管 license 有风险，它依然值得研究，因为：

1. `Compact for restart` 的用户产品形态非常清晰。
2. `Context / Key Decisions / Current State / Unresolved Issues` 这四段结构很适合被 OMX handoff bundle 直接借鉴。
3. `只索引新消息` 的思路很实用。

## 6. `mex-memory/mex`

### What is clearly true

从 README 和 `src/setup/index.ts` 可确认：

- `mex setup` 会创建 `.mex/` scaffold。
- 关键文件包括 `ROUTER.md`、`AGENTS.md`、`SETUP.md`、`SYNC.md`、`context/*`。
- 对 Codex 的配置落点就是根目录 `AGENTS.md`。
- `watch` 安装的是 git `post-commit` hook，不是会话内 hooks。

从 `src/doctor.ts` 和 `src/watch.ts` 可确认：

- 它的核心健康机制是 drift score 和 drift repair。
- post-commit hook 触发 drift check。
- 它是“项目记忆 scaffold 持续校验器”，不是对话生命周期捕获器。

### Important nuance

- `mex` 的 token 节省是通过 routed scaffold 实现，不是通过 MCP/hook 热路径压缩实现。
- 它适合长期工程记忆和交接，而不适合直接解决 Codex 单会话 context overflow。

### OMX takeaway

OMX 如果继续强化 `omx_wiki` / `AGENTS.md` / 结构化知识层，`mex` 很值得借：

1. 极小 anchor + 路由文件。
2. 漂移检测而不是“写完文档就不管”。
3. 把 agent memory 当项目资产维护。

## 7. `swarmclawai/swarmvault`

### What is clearly true

从 `packages/engine/src/context-packs.ts` 可确认：

- `Context Pack` 是正式 artifact。
- 既写 JSON artifact，也写 markdown page。
- 落盘到 `state/context-packs` 和 `wiki/context`。
- pack 中有 `goal`、`target`、`budgetTokens`、`estimatedTokens`、included/omitted items、citations 等字段。

从 `packages/engine/src/hooks/codex.ts` 可确认：

- Codex hook 主要做 graph-first note 和 broad search gating。
- 它在 `session-start` 会 reset session marker 并提示优先看 graph/report。
- 它不是在 Codex 热路径里自动做会话记忆压缩或恢复。

### Important nuance

- `swarmvault` 的 `context pack` 很强，但更偏 durable workflow artifact。
- 它更像 wiki/graph-first 工作台，而不是 runtime memory interceptor。

### OMX takeaway

对于 T3 和可审阅 handoff artifact，`swarmvault` 很有价值；对于 T1，它不应被高估。

## 8. `volcengine/OpenViking`

### What is clearly true

从 `examples/codex-memory-plugin/.codex-plugin/plugin.json` 和 `hooks/hooks.json` 可确认：

- 它确实有完整 Codex plugin 示例。
- 插件注册了：
  - `SessionStart`
  - `UserPromptSubmit`
  - `Stop`
  - `PreCompact`
- 插件说明里直接写了：
  - 每次 prompt 自动 recall
  - 每次 turn end 增量 capture
  - `PreCompact` 前 commit 到 memory extractor
  - `SessionStart` 做 active-window heuristic / idle-TTL sweep

从 `examples/codex-memory-plugin/README.md` 可确认：

- 推荐安装路径是 one-line installer。
- 它会克隆/刷新本地 repo、注册本地 marketplace、开启 `features.plugin_hooks = true`、并修改 shell rc。
- 纯插件市场安装路径只推荐给本地无认证 `127.0.0.1:1933/mcp`。
- 远程或认证服务需要 wrapper / 额外渲染 `.mcp.json` bearer token。

从 `docs/en/concepts/08-session.md` 可确认：

- OpenViking 的 session commit 会做 archive、结构化 summary、long-term memory extraction。
- 这是平台原生能力，不是示例插件硬凑出来的。

### Important nuance

- 仓库总 license 元数据是 `AGPL-3.0`，但示例插件 manifest 里写的是 `Apache-2.0`。在 maintainer 明确解释前，应按整个仓库的 AGPL 风险看待，而不是按插件示例单独乐观解释。
- 它对 Codex 的接入不是“轻量插件”范式，而是“外部平台 + 本地包装 + shell/credential 处理”范式。

### OMX takeaway

OpenViking 值得研究的平台点：

1. `PreCompact` 前 commit 全 transcript 的策略。
2. session commit 的 archive + summary + memory extraction 流程。
3. 把 Codex 作为外部 agent client，而不是记忆系统本体。

但它不适合作为 OMX 短期轻量落地方案。

## Corrected Recommendations

### 对 T1 的修正后排序

1. `context-mode`
2. `agentmemory`
3. `codex-agent-mem`
4. `remem`
5. `OpenViking` plugin example

修正点：

- `OpenViking` 由于确实有 `PreCompact` / `UserPromptSubmit` / `Stop` / `SessionStart` 的完整 Codex 生命周期插件示例，T1 能力应当高于第一轮的直觉印象。
- `swarmvault` 不应出现在 T1 竞争里。

### 对 T2 的修正后排序

自动 warm-start：

1. `agentmemory`
2. `remem`
3. `context-mode`
4. `codex-agent-mem`
5. `OpenViking`

显式 handoff bundle：

1. `code-session-memory`
2. `codex-agent-mem`
3. `mex`
4. `swarmvault`

修正点：

- `codex-agent-mem` 在显式交接包这条线里应略高于 `mex`，因为它的 scope-aware pack artifact 更接近“精准交接载荷”。

### 对 T3 的修正后排序

1. `swarmvault`
2. `mex`
3. `agentmemory`
4. `OpenViking`
5. `remem`

修正点：

- `remem` 有长期记忆能力，但更偏工程化本地 memory store，不像 `swarmvault` / `mex` 那样天然适合被人类长期维护为知识资产。

## OMX Design Implications

二次尽调后，最稳妥的 OMX 研究方向比第一轮更清晰：

### 可以直接借鉴的

1. `context-mode`
   - `PreCompact` 热路径设计
   - FTS5 / eventized continuity
2. `codex-agent-mem`
   - `context pack`
   - `known_pack_hash` / `not_modified`
   - `scope_resolve`
3. `remem`
   - duplicate-injection gating
   - host-level explicit hook activation
4. `code-session-memory`
   - restart handoff 文档结构
5. `mex`
   - scaffold + drift repair
6. `swarmvault`
   - durable context pack artifact + wiki/graph 知识层

### 不建议直接照搬的

1. `agentmemory`
   - 整体过重，适合作为能力目录，不适合作为 OMX 的第一步形态
2. `OpenViking`
   - 平台太重，接入和许可证边界都不适合先行集成
3. `swarmvault` 的 Codex hooks
   - 它们是 graph-first workflow hooks，不是记忆热路径 hooks

## Bottom Line

二次尽调后，可以更有把握地说：

1. `context-mode` 是 T1 的技术标杆，但许可证不适合作为“直接内建依赖”。
2. `agentmemory` 是严格 OSS 里的全能方案，但整体偏重。
3. `remem` 比第一轮更值得重视，因为它对 Codex `SessionStart` 重复注入问题做了专门治理。
4. `codex-agent-mem` 是最值得拆解学习的低开销 continuity layer。
5. `code-session-memory` 的 restart handoff 产品形态很值得学，但 license 风险必须记住。
6. `swarmvault` 和 `mex` 应继续被视为 T3 长期知识层的主要灵感源，而不是 T1 会话压缩器。

这页应与 [[codex-memory-context-research-2026-07-05]] 一起看：前者给出主题分层与总体排序，这页负责纠偏并给出更可靠的项目级事实边界。
