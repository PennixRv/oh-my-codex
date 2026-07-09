---
title: "context-mode vs lean-ctx vs headroom：场景 1 适配性与部署侵入性对比 2026-07-06"
tags: ["context-mode", "lean-ctx", "headroom", "codex", "compaction", "deployment", "proxy", "research"]
created: 2026-07-06T12:28:52.000Z
updated: 2026-07-06T12:28:52.000Z
sources:
  - "https://github.com/mksglu/context-mode"
  - "https://github.com/mksglu/context-mode/issues/46"
  - "https://github.com/yvgude/lean-ctx"
  - "https://github.com/yvgude/lean-ctx/issues/202"
  - "https://github.com/yvgude/lean-ctx/issues/367"
  - "https://github.com/headroomlabs-ai/headroom"
  - "https://github.com/headroomlabs-ai/headroom/issues/883"
  - "https://github.com/headroomlabs-ai/headroom/issues/1215"
  - "https://github.com/headroomlabs-ai/headroom/issues/1483"
  - "https://github.com/headroomlabs-ai/headroom/issues/1614"
  - "https://github.com/headroomlabs-ai/headroom/issues/1709"
  - "https://github.com/headroomlabs-ai/headroom/issues/1788"
links: ["scenario-1-context-compaction-restore-open-source-research-2026-07-06.md", "context-mode-codex-deployment-and-uninstall-due-diligence-2026-07-06.md", "lean-ctx-codex-deployment-modes-and-local-fit-2026-07-06.md", "lean-ctx-cleanup-and-non-deployment-decision-2026-07-06.md", "environment-agent-role-intrusion-observation-2026-07-06.md"]
category: reference
confidence: high
schemaVersion: 1
---

# context-mode vs lean-ctx vs headroom：场景 1 适配性与部署侵入性对比 2026-07-06

## Scope

这页只回答当前最关键的三个问题：

1. `context-mode`、`lean-ctx`、`headroom` 三者到底不是一类东西，它们各自解决的是哪一层问题。
2. 对“场景 1”来说，谁最接近需求本体。
3. 如果未来要落地到当前这台已经存在 `Codex + OMX + AOE + 自定义 provider` 的机器上，谁的部署更优雅，谁更容易粗暴接管 `~/.codex`。

这里说的“场景 1”是指：

- 会话逼近 compact / compression 边界时，压缩后的状态尽量不失真。
- agent 压缩后还能连续工作。
- 不希望额外代理层制造噪音、错位、假记忆、误摘要。
- token 节省只是附加收益，不是第一目标。

## 结论先行

结论可以先直接给出：

1. **最贴近场景 1 的仍然是 `context-mode`。**
2. **`context-mode` 不等于 `lean-ctx` 那种 owner-style 接管。** 但这个结论只在 **Codex plugin-only 路径** 下成立；如果走 manual fallback，它同样会写 `~/.codex/config.toml`、`hooks.json`、`AGENTS.md`。
3. **`lean-ctx` 更像 context intelligence + read compression + shell hook + optional proxy 层。** 它对减少 token、优化读取路径、给 agent 加更多本地上下文能力很强，但不是围绕“PreCompact 精确保活 + compact 后恢复执行状态”设计的。
4. **`headroom` 是另一层东西。** 它的主轴是 proxy / wrap / compression / shared memory，不是“会话 compaction 前状态快照 + compaction 后恢复”。它适合解决 live-zone token 暴涨和多 agent 共享压缩/记忆，不适合作为场景 1 的第一主解。
5. 结合当前机器约束，推荐顺序是：
   - **第一优先：`context-mode`，且仅考虑 Codex 原生 plugin 路径。**
   - **第二优先：保留 `lean-ctx` 作为后续 token / read-path 优化候选，不作为当前场景 1 主工具。**
   - **不建议当前把 `headroom` 作为 Codex 场景 1 主解直接落地。**

一句话版：

- **场景 1 看 `context-mode`。**
- **token / read 压缩看 `lean-ctx`。**
- **代理压缩基础设施看 `headroom`。**

## 三者的本质区别

| 项目 | 核心层级 | 主要机制 | 是否直接坐在模型请求路径上 | 是否有显式 PreCompact / restore 设计 | 对场景 1 的判断 |
| --- | --- | --- | --- | --- | --- |
| `context-mode` | runtime continuity / session state layer | hooks + session DB + resume snapshot + SessionStart restore | 否，plugin/MCP/hook 为主 | 有，且是设计主轴 | **最贴近** |
| `lean-ctx` | context intelligence / read-path optimization / optional proxy | MCP reads + shell hooks + rules + optional proxy | 可选，proxy 模式会进入请求路径 | 有部分 session continuity，但不是 Codex compact restore 主轴 | **次优，偏题半步** |
| `headroom` | transport/proxy compression + shared memory infra | proxy + wrap + RTK + MCP + memory | 是，wrap/proxy 是主路径之一 | 没有看到面向 Codex 的 PreCompact snapshot + restore 闭环 | **不适合作为主解** |

这里最关键的不是 “谁更火”，而是 “谁在哪一层工作”。

场景 1 需要的不是纯压缩，而是：

1. 在 compact 前捕获当前任务态。
2. 在 compact 后恢复一个足够准确的执行态。
3. 尽量不要把恢复准确性建立在额外代理层的推测、摘要或线协议改写上。

这正好解释了为什么 `context-mode` 比另外两个更对题。

## 1. `context-mode`

### 为什么它最接近场景 1

`context-mode` 当前在上游已经不是 “只有 Claude 的实验项目” 了。最新仓库里对 Codex 已经明确存在：

1. `.codex-plugin/plugin.json`
2. `.codex-plugin/mcp.json`
3. `.codex-plugin/hooks.json`
4. `src/adapters/codex/index.ts`
5. `hooks/codex/precompact.mjs`
6. `hooks/codex/posttooluse.mjs`
7. `hooks/codex/userpromptsubmit.mjs`
8. `hooks/codex/stop.mjs`

并且源码明确把 Codex 这条线建模为：

- `PreToolUse`
- `PostToolUse`
- `PreCompact`
- `SessionStart`
- `UserPromptSubmit`
- `Stop`

这和场景 1 的需求几乎是正对齐的。

更重要的是，它做的不是“请求压缩代理”，而是“会话状态连续性层”：

1. 记录 session events。
2. 在 `PreCompact` 构建 resume snapshot。
3. 在 `SessionStart(source=compact)` 或 resume 路径重新注入恢复上下文。
4. 把 compaction survival 视为 runtime lifecycle 的一部分，而不是普通 memory 检索。

这使它在原则上比 `lean-ctx proxy` 或 `headroom proxy` 更不容易引入以下问题：

1. wire-level 协议噪音。
2. provider base URL 误接线。
3. 代理层对模型响应 item 形状的误改写。
4. “为了省 token 而压掉了真正关键的任务态”。

### 它和 `lean-ctx` 的关键差异

和 `lean-ctx` 相比，`context-mode` 的主问题意识是：

- “如何让 agent 在 context boundary 前后不断档。”

而 `lean-ctx` 的主问题意识更像：

- “如何让 agent 少读、读对、压缩读、少浪费 token。”

这两个方向可以协作，但不是同一件事。

`context-mode` 的优势在于：

1. 它直接围绕 compaction lifecycle 建模。
2. 它对 `PreCompact -> snapshot -> SessionStart restore` 这个闭环有明确实现与测试。
3. 它默认不需要把整个 Codex 流量都放到一个本地代理前面。

它的代价在于：

1. license signal 不是标准 OSI 开源许可。
2. 它对当前环境不是零侵入。
3. 如果走错安装路径，仍然会碰 `~/.codex`。

### 部署是否像 `lean-ctx` 一样粗暴

**不完全像，但也不能说完全优雅。**

要严格分两条路：

### 路径 A：Codex plugin-only

这是当前唯一值得考虑的路径。

本地隔离 `CODEX_HOME` 实测已经确认：

1. `codex plugin marketplace add` + `codex plugin add` 主要改动的是 plugin / marketplace 注册。
2. 不会像 `lean-ctx init --agent codex` 那样立刻生成自己的 `hooks.json` / `AGENTS.md` / rules 文件面。
3. 它更接近 “注册一个原生插件 + 信任 plugin hooks”，而不是“把 `~/.codex` 改造成它自己的家目录布局”。

所以只比较最优路径：

- **`context-mode plugin-only` 明显比 `lean-ctx init/setup/onboard` 更克制。**

### 路径 B：manual fallback

这条路就不优雅了。

上游 README 仍明确给出：

1. 手动写 `~/.codex/config.toml`
2. 手动写 `~/.codex/hooks.json`
3. 可选复制 `configs/codex/AGENTS.md`

这条路的侵入性会迅速接近 `lean-ctx`。

### 一条必须记录的更新

`context-mode` 在 `2026-03` 的旧 roadmap issue `#46` 里曾把 Codex 写成 `0/4` hooks、等待平台支持。但这已经是**过时状态**。该 issue 已关闭，而当前主分支已经有 Codex adapter、plugin manifest、Codex hooks 实现和 README 安装段落。

也就是说：

- 旧判断 “Codex 不能跑 context-mode” 已经过时。
- 当前应以主分支源码和 README 为准。

## 2. `lean-ctx`

### 它真正擅长什么

`lean-ctx` 当前上游定位已经很清楚：

1. local-first context intelligence layer
2. MCP reads / search / cache
3. shell output compression
4. rules / skill 注入
5. optional proxy
6. cross-session memory

它对 Codex 的默认集成模式在上游 `installation-matrix` 里也写得很直白：

- `Hybrid`
- `~/.codex/config.toml`
- `~/.codex/LEAN-CTX.md` + `~/.codex/AGENTS.md`
- `~/.codex/hooks.json`
- `SessionStart/PreToolUse`

这说明它对 Codex 的核心价值并不是 “完整 hook lifecycle continuity”，而是：

1. 让 agent 读取代码和文件时更节省。
2. 让 shell 输出先被压缩或重写。
3. 通过规则和技能把行为改到 lean-ctx 的工作流里。
4. 在需要时再用 proxy 吃更多 token 优化。

### 为什么它不是场景 1 的最佳主工具

不是说 `lean-ctx` 不能帮助场景 1，而是它不把场景 1 作为第一原则。

相对 `context-mode`，它的问题在于：

1. 对 Codex 当前公开集成面，最强调的是 `SessionStart/PreToolUse`，而不是完整 `PreCompact/PostCompact/UserPromptSubmit/Stop` 闭环。
2. 它的重点是减少无效上下文进入，而不是在 compact 发生时把“当前工作态”做成专门恢复包。
3. 它的 proxy 模式虽然可能进一步省 token，但也会引入代理层噪音与 provider 接线复杂度。

所以如果你的目标严格是：

- 压缩边界时尽量不失真
- 压缩后立即继续工作
- 尽量少让外部层改写真实任务态

那么 `lean-ctx` 仍然比 `context-mode` 更偏。

### 部署侵入性为什么更重

`lean-ctx` 现在的 Codex 安装矩阵仍然显示，它会显式占用这些面：

1. `~/.codex/config.toml`
2. `~/.codex/hooks.json`
3. `~/.codex/LEAN-CTX.md`
4. `~/.codex/AGENTS.md`
5. `~/.codex/skills/lean-ctx/SKILL.md`

这正是我们上一轮最终放弃其 live deployment 的根本原因：

1. 它不是轻量注入一个 plugin entry 就结束。
2. 它更像生成并维护一整套 lean-ctx-owned 文件面。
3. `setup` / `onboard` 还会进一步扩大影响面。

需要公平记录的是，一些更早期的 Codex 集成缺陷已经被修掉了，例如：

1. `CODEX_HOME` 安装路径问题对应的 `#202` 已关闭。
2. Codex hooks 使用裸 `lean-ctx` 命令导致非登录 shell `127` 的 `#367` 已关闭。

但这些修复并没有改变它的总体部署哲学：

- **它仍然偏 owner-style。**

## 3. `headroom`

### 它解决的是另一类问题

`headroom` 当前最强的点不是“会话连续性”，而是：

1. 压缩工具输出、日志、文件块、RAG chunk。
2. 作为 proxy / wrap 层减少 live-zone token。
3. 提供 MCP、retrieval、observability、shared memory。
4. 允许多个 agent 共用一个 proxy 和 memory store。

它非常强，也非常热门，当前 stars 量级远高于 `context-mode` 和 `lean-ctx`。

但对场景 1 来说，问题在于它工作在**另一层**：

1. 它重点压缩的是“进模型之前的内容”。
2. 它强调的是 lossless-first / live-zone-only compression。
3. 我没有在当前上游里看到针对 Codex 的 `PreCompact snapshot -> SessionStart restore` 主闭环。
4. 仓库里虽然有 `compaction` 相关实现，但那指向的是**内容压缩格式与 live-zone compaction**，不是 “会话任务态恢复”。

简化地说：

- `headroom` 更像“高性能压缩代理与共享记忆基础设施”。
- 它不是“compaction 前后任务态保活器”。

### 它为什么不适合作为当前场景 1 的首选

这里有两层原因。

### 第一层：目标不完全对题

如果当前主目标是“让 compact 后的状态尽量准确”，那么 `headroom` 的强项其实偏向：

1. 减少触发 compact 的概率。
2. 压缩 live-zone 大输出。
3. 给多 agent 共享记忆和检索。

这当然有价值，但不是同一问题。

### 第二层：当前 Codex 落地面仍然偏粗

`headroom` 官方文档当前明确存在两类 Codex 接入：

1. `headroom wrap codex`
2. `headroom install apply --preset persistent-task --target codex`

而 persistent install 文档明确写了：

- Codex -> managed block in `~/.codex/config.toml`

也就是说，它不是只加一个 MCP server 就结束，而是会管理 Codex 的 provider / runtime 接线。

更重要的是，旧问题虽然有一部分已经修掉，但 `2026-07-06` 这天仍然有多条直接相关的开放 issue：

1. `#1483`：希望避免 `wrap codex` 使用全局 `~/.codex/config.toml` 作为临时运行态，因为会影响并发的其他 Codex 会话。
2. `#1614`：在 custom `base_url` provider 下，`wrap codex` 先改配置再检查 proxy 依赖，失败后会把 Codex 留在坏状态，报告里还明确提到 session wipe。
3. `#1709`：最新 `codex-cli 0.142.5` + `gpt-5.5` 下，`wrap codex` 仍有开放 bug。
4. `#1788`：`Codex desktop` 的 proxy mode 清空历史上下文，仍是开放 bug。

这几条对当前环境尤其敏感，因为当前环境本来就：

1. 有自定义 provider。
2. 有多条并行 Codex 会话的真实需求。
3. 不接受工具为某一个会话临时污染全局 `~/.codex`。

### 需要公平记录的正向面

并不是说 `headroom` 一无是处。

需要记下它已经解决或收敛的点：

1. 旧的 `wrap codex` duplicate TOML key 问题 `#883` 已关闭。
2. Codex OAuth image route 修复 PR `#1215` 已合并。

这说明项目活跃度和修复速度都很强。

但这不改变当前判断：

- **它仍然不是场景 1 的最佳主工具。**
- **它当前的 Codex 集成面仍比 `context-mode plugin-only` 粗。**

## 部署侵入性排序

如果只按“对当前这台机器的 `~/.codex` 侵入风险”排序，当前建议是：

1. **最低：`context-mode` 的 Codex plugin-only 路径**
2. **中高：`lean-ctx init --agent codex`**
3. **最高：`headroom wrap codex` / persistent install for codex**

需要补一句：

- `context-mode` 的 manual fallback 不在第 1 档。
- 一旦走 manual fallback，它的侵入性会快速接近 `lean-ctx`。

## 最终建议

如果当前只围绕场景 1 做决策，建议非常明确：

1. **主研究对象与第一候选落地对象：`context-mode`**
2. **保留研究但不作为当前主解：`lean-ctx`**
3. **当前不建议用于 Codex 场景 1 落地：`headroom`**

更细一点：

### 什么时候选 `context-mode`

当你的第一优先级是：

1. compact 前后连续性
2. 任务态恢复准确性
3. 不想让请求代理层进入核心执行链

这就是当前最对题的选择。

### 什么时候再回头看 `lean-ctx`

当未来目标开始转向：

1. 更强的 read-path optimization
2. 更少 token 消耗
3. 更多本地智能读取 / 搜索 / 缓存能力

那时再重新评估它就合理。

### 什么时候再看 `headroom`

当未来目标变成：

1. 多 agent 共用压缩代理
2. 大规模 live-zone token 压缩
3. 统一 proxy / observability / shared memory 基础设施

这时 `headroom` 才更像正确问题的正确答案。

## 当前执行口径

截至本页，当前执行口径更新为：

1. **场景 1 的主线继续围绕 `context-mode`。**
2. **`lean-ctx` 保持研究态，不恢复 live deployment。**
3. **`headroom` 不进入当前 Codex 主环境落地计划。**

如果后续真的要做试部署，最合理的下一个动作也不是直接上真实 `~/.codex`，而是：

1. 仅针对 `context-mode`
2. 仅走 Codex plugin-only
3. 仅在隔离 `CODEX_HOME` 中验证
4. 先验证 hook trust、compact restore、卸载回滚，再考虑真实环境
