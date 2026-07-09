---
title: "场景 1：会话内上下文压缩与恢复补充候选研究 2026-07-06"
tags: ["codex", "memory", "context-compaction", "restore", "checkpoint", "hooks", "research"]
created: 2026-07-06T18:20:00.000Z
updated: 2026-07-06T18:20:00.000Z
sources:
  - "https://github.com/FlineDev/Recall"
  - "https://github.com/OthmanAdi/planning-with-files"
  - "https://github.com/parcadei/Continuous-Claude-v3"
  - "https://github.com/mkreyman/mcp-memory-keeper"
  - "https://github.com/microsoft/LLMLingua"
  - "https://github.com/VoxCore84/claude-code-compaction-keeper"
  - "https://github.com/GabrielMartinMoran/mind"
  - "https://github.com/Dicklesworthstone/post_compact_reminder"
  - "https://github.com/Claudate/claude-code-context-sync"
  - "https://github.com/obsfx/trekker-claude-code"
  - "https://github.com/b17z/sage"
  - "https://github.com/Ruya-AI/cozempic"
  - "https://github.com/OthmanAdi/planning-with-files/issues/195"
  - "https://github.com/mksglu/context-mode/issues/874"
  - "https://github.com/mksglu/context-mode/issues/902"
  - "https://github.com/mksglu/context-mode/issues/911"
  - "https://github.com/Ruya-AI/cozempic/issues/147"
  - "https://github.com/Ruya-AI/cozempic/issues/172"
links:
  - "scenario-1-context-compaction-restore-open-source-research-2026-07-06.md"
  - "token-optimizer-codex-deployment-and-centralization-research-2026-07-06.md"
  - "context-mode-codex-deployment-and-uninstall-due-diligence-2026-07-06.md"
category: reference
confidence: high
schemaVersion: 1
---

# 场景 1：会话内上下文压缩与恢复补充候选研究 2026-07-06

## Scope

这页只补充上一轮没有充分展开的新候选，继续严格围绕同一个问题：

**单个长会话逼近 context 上限、触发 compact/压缩后，怎样尽可能高保真地保留并恢复当前工作状态，让 agent 连续工作。**

本页不重新展开长期知识库、跨会话 wiki、普通 MCP memory 的一般性讨论，只关心它们是否真的服务这个热路径问题。

## Delta Summary

这一轮新增或补查的项目主要有七类：

1. **直接抓 compaction 生命周期的项目**
   - `VoxCore84/claude-code-compaction-keeper`
   - `b17z/sage`
   - `Ruya-AI/cozempic`
2. **工作状态外置 / 任务系统型**
   - `obsfx/trekker-claude-code`
   - `Claudate/claude-code-context-sync`
3. **可恢复 checkpoint / memory 平台，但不自动抓 compaction 边界**
   - `mkreyman/mcp-memory-keeper`
   - `GabrielMartinMoran/mind`
4. **极简 post-compact 提醒类**
   - `Dicklesworthstone/post_compact_reminder`

同时，这一轮也把上一页里的几个主候选重新作为参照系：

- `OthmanAdi/planning-with-files`
- `FlineDev/Recall`
- `mksglu/context-mode`
- `parcadei/Continuous-Claude-v3`
- `microsoft/LLMLingua`

## Direct Conclusion

新增候选并**没有推翻**上一轮的核心结论：开源社区里依然缺少一个同时满足下面四个条件的成熟项目：

1. 对 **Codex** 低侵入。
2. 对 **场景 1** 高保真。
3. 在真实用户环境里经过足够多的长期打磨。
4. 安装/卸载边界清晰，不强行接管整个 agent runtime。

这轮补查后的收敛更清楚了：

- **`cozempic`** 是新增候选里**成熟度最高**的一个，但它的主路线不是“更准确地恢复 Claude/Codex 官方 compact summary”，而是 **尽量在 hit compact 之前做 prune + reload，或者在 PostCompact 恢复团队检查点**。它更像“绕开劣质 compact”而不是“精确提升 compact 恢复质量”。
- **`sage`** 是新增候选里**概念上最贴近语义 checkpoint + continuity** 的一个，但成熟度证据明显不足，且强烈偏向 Claude Code 研究场景，不是通用 coding-agent 热路径恢复器。
- **`claude-code-compaction-keeper`** 的两阶段设计很值得借鉴，但它仍然过早，而且源码里有关键设计缺陷：**PreCompact 快照读取全局日志时只按时间窗口过滤，不按 session/cwd 过滤**，多会话污染风险很实际。
- **`trekker-claude-code`** 和 **`claude-code-context-sync`** 更像“把任务状态写到外部系统/外部文件再恢复”，而不是真正的 compaction restore。
- **`mcp-memory-keeper`** 和 **`mind`** 再次证明了一个事实：很多“memory”项目更擅长跨会话/长期记忆，而不是单会话 compaction 边界的高保真热恢复。尤其 `mind` 的 README 明确写出 **Codex 只有 L1/L2，L3 hooks/session/compaction automation 仍是 unsupported**。

因此，若只讨论“场景 1 的直接可用性”：

- 对 **Codex**，上一页的结论仍成立：**`planning-with-files` 依然是最实际的工程基线**，因为它通过文件把状态外置，不依赖内部 compact summary 的质量。
- 对 **Claude Code**，新增候选里真正值得继续跟踪的是：
  - `cozempic`
  - `sage`
  - `claude-code-compaction-keeper`

但它们三者分别代表三条不同路线，而不是同一类方案：

- `cozempic`：**prune / reload / guard**
- `sage`：**semantic checkpoints / watcher / continuity marker**
- `claude-code-compaction-keeper`：**transparent two-stage hook snapshot**

## Strict Matrix

| Project | 主要机制 | PreCompact capture | PostCompact / Resume restore | 更像“避免 compact”还是“恢复 compact 后状态” | 结构化程度 | Codex 贴合度 | 成熟度信号 | 结论 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Ruya-AI/cozempic` | prune + reload + team checkpoint + digest | 有 | 有 | 更偏避免/替代原生 compact，其次才是恢复 | 中 | 很低，Claude-only | `345` stars，活跃 changelog/测试/issue | 新增候选中最成熟，但不是纯 restore 项 |
| `b17z/sage` | semantic checkpoint + watcher + continuity marker | 有 | 有，但在下一次 Sage 工具调用时注入 | 恢复 | 高 | 很低，Claude-only | `1` star，测试多但用户面薄 | 设计有意思，成熟度不足 |
| `VoxCore84/claude-code-compaction-keeper` | PostToolUse 记日志 + PreCompact 快照 + SessionStart 重注入 | 有 | 有 | 恢复 | 中 | 很低，Claude-only | `0` stars | 适合借设计，不适合直接用 |
| `obsfx/trekker-claude-code` | 任务系统 + SessionStart/PreCompact 提醒 | 弱 | 弱 | 外置任务状态，不是严格恢复 | 中 | 很低 | `4` stars | 不是场景 1 主解法 |
| `Claudate/claude-code-context-sync` | 手工 save/resume 到 markdown | 无自动 | 手工恢复 | 手工交接，不是自动恢复 | 中 | 很低 | `18` stars | 更像场景 2 轻量版 |
| `mkreyman/mcp-memory-keeper` | MCP persistent context + checkpoint | 手工/显式 | 手工/显式，新 session 恢复 | 人工 checkpoint，不抓 lifecycle | 高 | 中等，MCP 可接 | `128` stars | 对场景 1 只是辅助层 |
| `GabrielMartinMoran/mind` | memory layer + checkpoints + 多 agent adapter | 有些 agent 有 | Codex 无 L3 | 更偏 memory/continuity 平台 | 高 | 中，Codex 仅 L1/L2 | `113` stars | 对 Codex 场景 1 仍不够直接 |
| `Dicklesworthstone/post_compact_reminder` | post-compact reread reminder | 无 | 极弱 | 只补规则记忆，不补工作状态 | 低 | 很低 | `48` stars | 可作最小补丁，但不是主解法 |

## 1. `Ruya-AI/cozempic`

### Why It Matters

这是这一轮最值得新增记录的候选。它和 `Recall`/`sage` 不同，不把重点放在“生成一个更好的恢复包”，而是直接对 Claude Code 会话 JSONL 做 **prune / treat / reload**。

这意味着它解决场景 1 的方式不是：

- “压缩之后我怎样更好地恢复”

而是：

- “我尽量不要落入原生 compact 的低保真路径”
- “即使 compact 已经发生，我也至少保留关键团队状态和行为约束”

### What It Actually Does

从 README 和源码看，它的主线是四层：

1. **Guard daemon**
   - `SessionStart` 自动拉起守护进程。
   - 在 `25% / 55% / 80%` 等阈值给出 prune / reload 策略。
2. **Transcript pruning**
   - `compact-summary-collapse`
   - `progress-collapse`
   - `tool-output-trim`
   - `tool-result-age`
   - `document-dedup`
   - `envelope-strip`
3. **Team checkpoint**
   - `PreCompact` 前写 checkpoint。
   - `PostCompact` 读取 `team-checkpoint.md` 恢复。
4. **Behavioral digest**
   - 抽取用户纠偏语句。
   - 同步到 Claude Code 原生 memory 目录，使其 survive compaction。

源码证据很明确：

- `plugin/hooks/hooks.json` 里同时有 `SessionStart`、`PreCompact`、`PostCompact`、`Stop` 等自动 wiring。
- `src/cozempic/cli.py` 里有 `post-compact` 命令，注释直接写明“Output recovery context after native compaction”。
- `tests/test_post_compact.py` 专门测了 **跨项目错误注入**、**全局 checkpoint 泄漏** 等问题。

### Fit For Scenario 1

优点：

- 这是少数真正把 **context 上限临界行为** 当成产品主轴的项目。
- 比单纯 summary/reinject 更激进，因为它试图在 compact 之前就减重或 reload。
- 对 agent team / subagent / workflow in-flight 这些易丢状态场景很认真，`safe-point protection` 是实打实的设计点。
- 有真实回归测试在保护 PostCompact 恢复的正确性。

局限：

- 它主要面向 **Claude Code session JSONL**，不是 Codex。
- 它的“高保真”更依赖 **不去用原生 compact**，而不是改善 compact summary 的语义质量。
- solo coding 场景下，它恢复得最强的是：
  - prune 后的较干净 transcript
  - behavioral digest
  - team checkpoint

  但它**不等于**为当前工作状态生成一个高语义密度、低噪音、明确 next-step 的独立恢复包。
- 安装侵入性高：会全局接管 hooks，自动拉守护进程，并默认 auto-update。

### Maturity / User Feedback

成熟度信号明显比本轮其他新增候选强：

- GitHub metadata 约 `345` stars，2026-07-05 仍在更新。
- CHANGELOG 连续记录了 compaction / reload / safe-point / auto-resume 的修复。
- 真实问题面可见：
  - `#147 "Can't resume session?"` 已关闭。
  - `#172 Record the resumed new session id or transcript path in reload-tier receipts` 仍在 open。
- 测试覆盖不是摆设，`tests/test_post_compact.py` 明确在守：
  - 当前项目 checkpoint 不得被别的项目污染
  - 全局 `~/.claude/team-checkpoint.md` 不得跨项目注入

### Bottom Line

`cozempic` 是新增候选里**最成熟**的一个，但它不是“最纯粹的恢复器”，而是“会话减重/守护/检查点/恢复”的混合体。  
如果未来要吸收设计，最值得借的是：

- **compaction 之前先减重，而不是坐等劣质 compact**
- **PostCompact 恢复必须做 cross-project isolation**
- **恢复/重启动作要有 safe-point 保护**

## 2. `b17z/sage`

### Why It Matters

`sage` 是这一轮新增候选里**语义上最贴近“checkpoint -> compaction -> auto-restore”** 的一个。  
它的定位不是任务系统，也不是 transcript cleaner，而是：

- semantic checkpoint
- continuity marker
- compaction watcher
- proactive recall

### What It Actually Does

源码和文档给出的机制很完整：

- 在高 context 使用率或某些语义时刻自动 checkpoint。
- watcher daemon 轮询 transcript，检测 `isCompactSummary: true`。
- compaction 后写 `~/.sage/continuity.json` marker。
- **下一次 Sage 工具调用** 时，把最近 checkpoint + compaction summary 一起注入。

这条链路在 `docs/continuity.md` 和 `docs/features/continuity.md` 里写得很清楚。

它保存的 checkpoint 结构也比普通 TODO/state file 更“研究语义化”：

- thesis
- confidence
- open questions
- sources
- tensions
- reasoning trace

### Fit For Scenario 1

优点：

- 明确把 compaction continuity 作为一等问题。
- 比 `post_compact_reminder` 强太多，因为它真的有 checkpoint schema。
- 比 `claude-code-context-sync` 强太多，因为它不是手工 save/resume，而是自动检测 continuity marker。
- 它的“reasoning trace / open questions / tensions”对研究、调研、方案论证类会话尤其友好。

局限：

- 自动恢复不是全局无条件发生，而是要等 **下一次 Sage 工具调用**。
- 它更偏“研究/理解状态”而不是“代码工作状态”，比如：
  - 最近失败的命令
  - 精确 git 状态
  - 正在编辑的具体文件集
  - 最后一个工具调用副作用

  这些都不是它最强的建模对象。
- 对 Codex 没有现实贴合度，基本是 Claude Code 体系。
- adoption 极弱，issue/discussion 面几乎没有，难以证明真实复杂场景下的可靠性。

### Maturity Signal

有两点需要分开看：

1. **设计成熟度**
   - 文档很多。
   - 架构清楚。
   - 自称测试数不少。
2. **社区成熟度**
   - GitHub metadata 只有 `1` star。
   - issue 面几乎是空的。
   - 缺少真实用户反馈。

这意味着它目前更像“有想法、实现也较完整的早期项目”，还不是经过大量生产用户洗礼的方案。

### Bottom Line

`sage` 是一个**很值得借鉴的 checkpoint schema / continuity marker 设计样本**。  
但如果目标是直接拿来做当前环境的主方案，证据仍然不够。

## 3. `VoxCore84/claude-code-compaction-keeper`

### Why It Matters

这个项目的 README 非常直接，几乎就是场景 1 的字面描述：

- PreCompact 前抓动态状态
- SessionStart(compact) 后重新注入
- 区分 static rules 和 dynamic work state

它也是新增候选里**最透明、最容易一眼看懂**的实现之一。

### What It Actually Does

三段式：

1. `session-stats.py`
   - `PostToolUse` 每次把工具使用记录到 `~/.claude/session-stats.jsonl`
2. `precompact-snapshot.py`
   - `PreCompact` 读取最近工具历史
   - 生成 `~/.claude/precompact-state.json`
3. `compact-reinject.py`
   - `SessionStart` with `matcher: "compact"`
   - 输出动态工作信号和静态提醒

### Critical Limitation

源码里有一个比 README 严重得多的问题：

- `session-stats.py` 明明记录了 `session_id`
- 但 `precompact-snapshot.py` 在读取日志时**完全没有按 session_id 或 cwd 过滤**
- 它只按 `lookback_hours` 过滤时间窗口

这意味着：

- 你如果在 2 小时内开了多个 Claude 会话
- 或者在多个项目里交替工作
- PreCompact 生成的 snapshot 可能混入别的会话/别的项目的工具痕迹

这是非常实质性的恢复污染风险。

### Fit For Scenario 1

优点：

- 非常贴用户需求。
- 生命周期设计正确。
- 快照内容包括最近文件、工具使用、子 agent 次数、shell 活跃度。
- 很适合作为自研时的最小可解释样板。

局限：

- 仍是 Claude-only。
- 全局文件路径设计非常粗。
- 无测试、无真实 issue 面、无成熟用户反馈。
- 当前实现离“可靠”还差关键一步：**严格的 session/project isolation**。

### Bottom Line

它是非常好的**最小原型级参考实现**，但不是可直接采用的成熟项目。

## 4. `obsfx/trekker-claude-code`

### What It Really Is

这不是 compaction restore engine，而是 **AI-friendly issue tracker + hooks**。

它的 `SessionStart` 会加载 in-progress tasks，`PreCompact` 会提醒保存 checkpoint comments，`Stop` 会自动完成任务状态。

### Why It Still Matters

它证明了一种很实际的路线：

- 不去修补 compact 本身
- 把工作状态写进外部任务系统
- 每次 session start / compact 前后通过任务评论恢复

### Limitation For Scenario 1

它恢复的是：

- 任务状态
- 评论
- ready queue

而不是：

- 当前推理状态
- 最近失败尝试
- 工作上下文中的细颗粒动态关系

因此它更适合作为 **任务 continuity 外层**，不是场景 1 主解法。

## 5. `Claudate/claude-code-context-sync`

### What It Really Is

这是一个手工 `/save-session` 和 `/resume-session` 插件，把会话摘要写到 `docs/context-sessions/*.md`。

### Fit For Scenario 1

它和严格的场景 1 关系不大：

- 没有 `PreCompact`
- 没有 `PostCompact`
- 没有自动生命周期钩子
- 更像“窗口切换保存”

它可以作为轻量的场景 2/手工交接工具，但不是当前问题的核心答案。

## 6. `mkreyman/mcp-memory-keeper` 与 `GabrielMartinMoran/mind`

### Re-confirmed Finding

这一轮再次确认，这两者都更擅长：

- 持久 memory
- checkpoint
- 检索
- 多 session continuity

而不是：

- 自动抓住 compact 临界点
- 在 compact 后无缝热恢复当前工作流

### `mcp-memory-keeper`

它的 README 已经把模式说得很直白：

- “当你觉得上下文快满了，你让 Claude 创建 checkpoint”
- “当 Claude 重置后，你再让它 restore”

这说明它的核心流程是 **人工 checkpoint / 人工恢复**。  
这当然有价值，但不是严格的 lifecycle automation。

### `mind`

`mind` 的 README 现在反而给了一个很重要的负面证据：

| Agent | Capability reality |
| --- | --- |
| `Claude Code` | L1 supported, L2 supported, L3 supported (opt-in hooks) |
| `Codex` | L1 supported, L2 supported, L3 unsupported |

也就是说，`mind` 自己都明确承认：

- 对 Claude Code，它可以做 hooks/session/compaction automation
- 对 Codex，它**还没有**这层能力

这对我们当前的问题非常关键。它说明就算 `mind` 本身很像一个通用 memory substrate，**对 Codex 的场景 1 仍然不够直接**。

## 7. 极简补丁类：`post_compact_reminder`

这类项目的价值非常有限，但也不应完全忽略。

它们做的是：

- compact 后提醒 agent 重新读 `AGENTS.md`
- 防止规则遗忘

它们不解决：

- 动态工作状态恢复
- 最近任务/约束/失败尝试恢复
- 当前 next-step 恢复

所以它们只能算场景 1 的一个**极小子集补丁**。

## How These New Candidates Change The Overall Ranking

## 直接可继续关注的路线

1. **Codex 当前最现实的工程路线**
   - `planning-with-files`
   - 原因：对 Codex 有明确支持，状态外置明确，成熟度最高，issue #195 这类边界问题也在修。

2. **Claude Code 里最成熟的“避免失真”路线**
   - `cozempic`
   - 原因：它不是最优雅，但它最接近“我不信任原生 compact，所以我要主动 prune / reload / checkpoint / recover”。

3. **最值得借 schema 的语义 checkpoint 路线**
   - `sage`
   - 原因：checkpoint 内容比普通 progress/todo 更像“认知状态快照”。

4. **最值得借最小实现的两阶段 hook 路线**
   - `claude-code-compaction-keeper`
   - 原因：非常直白，但必须补 session isolation。

## 只适合借设计，不适合直接采用

- `context-mode`
  - 设计 richness 极高，但复杂度、license 和 open issues 都说明它不是一个轻量主解。
- `Continuous-Claude-v3`
  - continuity 能力强，但太重。
- `LLMLingua`
  - 适合做底层压缩积木，不是完整方案。

## 对场景 1 只有辅助作用

- `mcp-memory-keeper`
- `mind`
- `trekker-claude-code`
- `claude-code-context-sync`
- `post_compact_reminder`

## Final Takeaway

这轮新增研究后的最终判断比上一轮更明确：

1. **没有发现一个新的、成熟的、低侵入的、Codex-native 的全能选手。**
2. 新候选里最有现实意义的是 `cozempic`，但它代表的是 **“预防/替代原生 compact”** 路线，而不是“更高保真地理解和恢复 compact summary”。
3. 如果未来要自研或拼装，最值得吸收的设计点分别来自：
   - `planning-with-files`：状态外置
   - `sage`：语义 checkpoint schema
   - `claude-code-compaction-keeper`：透明的两阶段 hook 流程
   - `cozempic`：safe-point reload、cross-project isolation、PostCompact 回归测试
4. 对当前目标而言，开源社区的现实仍然是：
   - **严格的场景 1 是一个真正困难的问题**
   - 很多流行项目都在绕开它、弱化它，或只解决其中的一半
   - 真正高保真、低噪音、低侵入、跨 agent runtime 的现成方案，仍然稀缺
