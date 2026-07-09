---
title: "场景 1：会话内上下文压缩与恢复开源项目研究 2026-07-06"
tags: ["codex", "memory", "context-compaction", "restore", "checkpoint", "hooks", "research"]
created: 2026-07-06T10:45:00.000Z
updated: 2026-07-07T09:55:00.000Z
sources:
  - "https://github.com/mksglu/context-mode"
  - "https://github.com/aesirsystems/claude-breadcrumbs"
  - "https://github.com/sravan27/context-os"
  - "https://github.com/djannot/code-session-memory"
  - "https://github.com/blas0/UnseveredMemory"
  - "https://github.com/rlancemartin/claude-diary"
  - "https://github.com/rohitg00/agentmemory"
  - "https://github.com/MarceloCaporale/codex-agent-mem"
  - "https://github.com/majiayu000/remem"
  - "https://github.com/wbelk/claude-qmd-sessions"
  - "https://github.com/ramakay/claude-self-reflect"
links: ["codex-memory-context-research-2026-07-05.md", "codex-memory-project-due-diligence-2026-07-05.md", "agentmemory-suitability-and-deployment-evaluation-2026-07-05.md", "context-mode-codex-deployment-and-uninstall-due-diligence-2026-07-06.md"]
category: reference
confidence: high
schemaVersion: 1
---

# 场景 1：会话内上下文压缩与恢复开源项目研究 2026-07-06

## Scope

这页只研究一个问题：**单个长会话内部，agent 在上下文接近上限、发生 compact/压缩、或需要 resume/restart 时，如何尽可能精确保留并恢复当前工作状态**。

这里的“场景 1”比普通 memory/RAG 更严格：

1. 它不是长期知识库。
2. 它不是只保存偏好、事实、代码片段。
3. 它不是“下次搜索一下相关记忆”。
4. 它关心的是当前会话热路径中的任务状态、约束、决定、失败尝试、文件改动、下一步、打开工作、工具/仓库状态，在 compaction 前后是否仍能继续正确执行。

因此本页把候选项目分成三类：

- **真正贴近场景 1**：有 `PreCompact`、`PostCompact`、`SessionStart`、resume packet、checkpoint、restore hook、compaction survival eval 等机制。
- **部分贴近场景 1**：能生成 handoff/restart 文档，或能在每轮重新注入状态，但不提供严格恢复。
- **不是场景 1 的主解法**：主要是长期记忆、向量检索、知识库、MCP memory、会话档案搜索。

## Direct Conclusion

这个问题确实是 agent runtime 的关键问题，但开源社区里**成熟、流行、严格解决它的项目非常少**。原因不是它不重要，而是它位于多个系统边界之间：

- LLM provider/agent runtime 通常已经内置某种 compact，总结逻辑不可完全外部控制。
- 用户态插件通常只能通过 hooks 观察 `PreCompact`、`SessionStart`、`PostCompact` 等接缝，不能真正修改模型内部压缩算法。
- 精确恢复需要结构化状态模型、事件日志、token 预算、优先级排序、恢复验证，这比普通“记忆检索”难很多。
- 很多项目把问题简化成长期 memory/RAG，而不是“压缩前后执行等价性”。

截至本轮研究，最接近场景 1 的组合不是一个单一项目，而是四个方向：

1. **`mksglu/context-mode`**：最成熟、最流行、最接近“eventized runtime + PreCompact snapshot + SessionStart restore”的工程标杆，但许可证为 source-available/非严格 OSS。
2. **`aesirsystems/claude-breadcrumbs`**：语义上最像“准备压缩 -> 写恢复文件 -> 压缩后恢复”的项目，但非常早期、0 stars，成熟度不足。
3. **`sravan27/context-os`**：不是恢复系统本身，但它有少见的 `compaction_survival` benchmark，能把“压缩后是否保留关键状态”变成可测试目标。
4. **`djannot/code-session-memory`**：更像会话 restart/handoff 文档生成器，适合学习结构化交接包，不是自动 in-session restore。

`agentmemory`、`remem`、`codex-agent-mem` 对跨会话 memory 或 runtime continuity 有价值，但如果严格按“场景 1：单会话 compact 前后精确恢复”打分，它们不是最直接答案。

补充一条 `Codex` 专项判断：`alexgreensh/token-optimizer` 仍然不是“场景 1 的严格主解法”，但最新上游核查表明，它的 **marketplace mirror plugin** 已经具备比旧文档口径更强的 `PreCompact capture -> SessionStart(compact) restore -> PostCompact quality refresh` 链路。因此它现在值得作为 **Codex continuity 专项实机验证对象** 单独试装，不应再只按旧的 `codex-install` 保守路径评价。

## Strict Evaluation Criteria

| 维度 | 含义 | 为什么重要 |
| --- | --- | --- |
| Lifecycle hooks | 是否接入 `PreCompact` / `PostCompact` / `SessionStart` / `UserPromptSubmit` | 没有生命周期点，就只能靠事后总结或手工恢复 |
| Pre-compact capture | 压缩前是否保存当前状态 | compaction 之后再总结会丢失早期细节 |
| Post-compact restore | 压缩后是否自动或半自动重新注入 | 只保存不恢复，不能解决热路径连续性 |
| Structured checkpoint | 是否有事件、manifest、resume packet、状态字段 | 纯自然语言摘要难验证、难合并、难更新 |
| Token budget | 是否限制恢复包大小 | 直接 dump 历史会抵消 compact 的意义 |
| Eval / verification | 是否测试关键状态是否 survives compaction | 没有 eval 很容易变成“感觉恢复了” |
| Maturity / license | stars、更新频率、许可证、可部署性 | 决定能否直接采用或只能借鉴设计 |

## Ranked Matrix

| Rank | Project | 场景 1 契合度 | 成熟度 | License signal | 核心判断 |
| ---: | --- | --- | --- | --- | --- |
| 1 | `mksglu/context-mode` | 很高 | 很高，约 `18.6k` stars | `NOASSERTION` / source-available caveat | 最接近可运行标杆：事件捕获、SQLite、resume snapshot、Codex/Claude hooks、相关测试齐全 |
| 2 | `aesirsystems/claude-breadcrumbs` | 高 | 很低，`0` stars | `NOASSERTION`，README 声称 MIT | 生命周期语义最贴近：`prepare-compact` + `restore-context` + pre/post hooks，但实现很薄 |
| 3 | `sravan27/context-os` | 中到高 | 低，`11` stars | `NOASSERTION`，描述声称 MIT | 不负责自动恢复，但它把 compaction survival 做成 benchmark，很值得借鉴 |
| 4 | `djannot/code-session-memory` | 中 | 低，`15` stars | `NOASSERTION` | map-reduce 生成 restart document，适合跨会话交接，不是热路径自动恢复 |
| 5 | `blas0/UnseveredMemory` | 中 | 低，`47` stars | `NOASSERTION` | 用 `UserPromptSubmit` 每轮提醒来绕开 compaction 遗忘，有 PreCompact checkpoint，但不严格恢复 |
| 6 | `rlancemartin/claude-diary` | 低到中 | 中低，`379` stars | `NOASSERTION` | PreCompact 前生成 diary，偏审计/复盘，不是恢复系统 |
| 7 | `agentmemory` | 低到中 | 很高，约 `24.6k` stars | `NOASSERTION` | 强 runtime memory platform，但对场景 1 是辅助，不是严格 compact equivalence |
| 8 | `codex-agent-mem` | 低到中 | 低，`31` stars | `NOASSERTION` | context pack / MCP memory 很强，但 hooks-first compaction restore 不是主轴 |
| 9 | `remem` | 低到中 | 低，`18` stars | `NOASSERTION` | SessionStart/Stop warm-start 有价值，但不解决压缩前后精确恢复 |
| 10 | `claude-qmd-sessions` / `claude-self-reflect` | 低 | 中低 | `NOASSERTION` | 更偏 transcript/session search 或历史检索，不是严格场景 1 |

备注：本轮 `gh repo view` 返回的 license 多为 `NOASSERTION`，不能直接等价于“无许可证”。已有旧页曾记录部分项目 README 或仓库文件声称 MIT / Apache-2.0 / ELv2，但本页采用当前元数据结果作为保守信号。

## 1. `mksglu/context-mode`

### Why It Matters

`context-mode` 是本轮最重要的参考项目。它不是简单 memory 插件，而是围绕“context window optimization / session continuity”做了完整 runtime 设计：

- sandbox tool output，避免大工具输出直接污染上下文；
- 把文件操作、目标、错误、任务、决策等转成 session events；
- `PreCompact` 时从事件库构建 resume snapshot；
- `SessionStart` / compact source 后把 resume context 注入；
- 用 SQLite/FTS5 等本地索引承载连续性；
- 有 Codex compact 相关测试。

### Evidence From Source

关键文件：

- `hooks/codex/precompact.mjs`
- `hooks/precompact.mjs`
- `tests/hooks/codex-goal-compact.test.ts`
- `tests/hooks/precompact-snapshot-event.test.ts`

`hooks/codex/precompact.mjs` 的行为非常明确：

- 从 stdin 解析 hook input；
- 根据 project dir 找到 session DB；
- 读取当前 session events；
- 调用 `buildResumeSnapshot(events, { compactCount })`；
- `db.upsertResume(sessionId, snapshot, events.length)`；
- `db.incrementCompactCount(sessionId)`；
- 写入 `compaction_summary` 事件。

`hooks/precompact.mjs` 的注释直接写明目标：在 conversation compact 前读取 captured session events，生成 priority-sorted resume snapshot，并存起来供 compact 后注入。它还额外写入 `snapshot-built` 事件，带 `bytes_avoided`，说明它不是只做“保存文本”，而是把 compaction 当成可观测生命周期事件。

`tests/hooks/codex-goal-compact.test.ts` 更关键：测试名就是 “`/goal survives compact resume context`”。测试流程是：

1. `UserPromptSubmit` 捕获 `/goal keep codex slash goal alive through compact`；
2. 运行 Codex `PreCompact` hook；
3. 以 `{ source: "compact" }` 运行 `SessionStart` hook；
4. 断言 `additionalContext` 包含 `<session_goal>` 和原始 objective。

这说明 `context-mode` 至少对“goal directive survive compact”做了明确测试。

### Fit For Scenario 1

优点：

- 有真正的 `PreCompact` 热路径。
- 有 structured session DB 和 events。
- 有 resume snapshot，而不是只靠自由文本 summary。
- 有 compact 后 `SessionStart` 注入路径。
- 有针对 compact survival 的测试。
- 成熟度和流行度显著高于其他候选。

局限：

- 不是严格可逆恢复。它恢复的是 priority-sorted snapshot，不是原始上下文的 bijective reconstruction。
- license/source-available 风险较大，不适合作为 OMX 直接内建依赖。
- 它更像“外部运行时连续性层”，不是修改 Codex 官方 compact 算法。

结论：如果只选一个项目研究设计，优先研究 `context-mode`。如果要直接采用，先解决 license 和集成边界。

## 2. `aesirsystems/claude-breadcrumbs`

### Why It Matters

`claude-breadcrumbs` 的规模很小，但它的产品语义最接近用户说的场景 1：

- `/breadcrumbs:prepare-compact`
- `/breadcrumbs:restore-context`
- `PreCompact` hook
- `PostCompact` hook
- recovery file

README 明确写：这是 Claude Code plugin for context preservation across compactions，压缩前 drop breadcrumbs，压缩后 pick them up。

### Evidence From Source

`scripts/pre-compact-save-state.sh`：

- 只在 `.beads` 项目中运行；
- 写 `.beads/recovery-context.md`；
- 记录 branch、last commit、uncommitted files、ready work；
- 提醒运行完整 `/workflow-tools:prepare-compact`。

`scripts/post-compact-restore-state.sh`：

- 只在 `.beads` 项目中运行；
- 读取 `.beads/recovery-context.md` 并输出到 Claude context；
- 显示 `bd ready`；
- 执行 `bd prime`。

`skills/prepare-compact/SKILL.md` 要求创建完整 strategic recovery file，包含：

- Current Epic / Phase；
- Success Criteria；
- Completed this session；
- In progress；
- Files；
- Next concrete action；
- Key Decisions；
- Scope Guard Rails；
- Git State；
- Recovery Commands。

`skills/restore-context/SKILL.md` 要求：

- 读取 recovery prompt；
- 读取 recovery file；
- sync/review beads；
- verify git state；
- 输出恢复摘要。

### Fit For Scenario 1

优点：

- lifecycle shape 很正确：prepare -> compact -> restore。
- 明确有 recovery file 和 recovery prompt。
- 有 pre/post hook 自动化雏形。
- 对 scope guard rails、git state、ready work 的选择很贴近 coding agent 场景。

局限：

- 项目非常早期，当前 stars 为 `0`。
- 实现主要是 shell + markdown，并且强依赖或偏向 beads workflow。
- `PreCompact` 自动脚本只写 basic recovery，完整恢复依赖 agent 主动执行 skill。
- 没有看到测试、benchmark、状态一致性校验。
- README 声称 PostCompact，但实际脚本文件注释写 “SessionStart after compact”，需要进一步确认具体 hook registration。

结论：不适合作为直接生产依赖，但非常适合借鉴用户体验和恢复文件 schema。

## 3. `sravan27/context-os`

### Why It Matters

`context-os` 的主目标不是“压缩后恢复”，而是减少会话早期和长会话中的 token waste：通过 repo graph、auto context、smart read，让 agent 不把无关大文件直接放进上下文。

但它对场景 1 有一个独特价值：它把 “compaction survival” 做成了可运行 benchmark。

### Evidence From Source

`python/evals/reports/compaction-survival-report.md` 显示：

- benchmark 名为 Compaction Survival；
- dataset 是 `python/evals/datasets/compaction_survival_cases.json`；
- Passed cases: `2/2`；
- gates 包含 pinned fact retention、current subtask retention、latest decision retention、modified file retention、packet token budget。

`python/evals/runners/compaction_survival_runner.py` 的流程：

- 为每个 case 创建临时 `.context-os/session.json`；
- 运行 `cargo run -p context-os -- resume --root <temp_root> --max-tokens <case max_tokens>`；
- 写出 `restart-packet.txt`；
- 估算 token；
- 用 scorer 评分。

`python/evals/scorers/compaction_survival.py` 的评分项包括：

- decision retention；
- failed approach retention；
- modified file retention；
- next step retention；
- pinned fact retention；
- current subtask retention；
- latest decision retention；
- packet token budget。

### Fit For Scenario 1

优点：

- 对“压缩后能否保留关键状态”有明确 eval。
- 评分维度非常接近 OMX 应该关心的状态模型。
- token budget 是硬门槛，而不是无限注入。
- 其 `smart_read` 思路也能减少后续 compaction 压力。

局限：

- 它主要生成 `resume` / `restart packet`，不是完整 hook-based restore runtime。
- 当前 benchmark case 数只有 `2/2`，覆盖面很小。
- 项目成熟度低，stars 低。
- 更适合作为测试思想和 packet schema 参考，而不是直接替代 memory runtime。

结论：`context-os` 不应被当成场景 1 的完整实现，但它的 eval 思路非常重要。OMX 如果做自己的方案，应强制引入类似 survival gates。

## 4. `djannot/code-session-memory`

### Why It Matters

`code-session-memory` 更像“会话压缩成 restart document”的工具。它不解决同一会话 compact 后自动恢复，但很适合研究“交接包应该长什么样”。

### Evidence From Source

`src/session-compactor.ts` 明确写：

- summarizing a session's chunks into a compact restart document；
- 使用 OpenAI chat completions；
- 支持单 pass；
- 长会话用 map-reduce；
- 需要 `OPENAI_API_KEY`；
- 默认 `OPENAI_SUMMARY_MODEL=gpt-5-nano`；
- final output 是 “session restart document”。

它的 prompts 要求保留：

- key decisions and rationale；
- failed attempts and why they failed；
- constraints and requirements；
- file paths / function names / data structures；
- unresolved issues；
- current state。

### Fit For Scenario 1

优点：

- restart 文档结构正确。
- map-reduce 适合超长 transcript。
- 对失败尝试、约束、文件路径、未解决问题的保留要求明确。

局限：

- 需要外部 LLM API，总结本身有误差。
- 不是 hooks-first，不是自动 compact lifecycle。
- 更偏场景 2：跨会话交接。
- 当前 license 元数据为 `NOASSERTION`，直接集成风险较高。

结论：适合借鉴 restart/handoff 文档生成结构，不适合作为场景 1 主实现。

## 5. `blas0/UnseveredMemory`

### Why It Matters

`UnseveredMemory` 提出一个朴素但有效的判断：只在 `SessionStart` 注入 memory 不够，因为 compaction 会丢掉早期指令。因此它用 `UserPromptSubmit` 每轮注入状态提醒。

### Evidence From Source

README 直接指出：

- context compaction loses early instructions；
- `SessionStart` loads full context；
- `UserPromptSubmit` injects state reminder every prompt；
- `UserPromptSubmit` survives context compaction by being injected fresh on every message。

`hooks/memory-precompact.sh`：

- 在 `.claude/memory/checkpoints/` 下创建 checkpoint；
- 从 `context.md` 提取 active task；
- 从 `scratchpad.md` tail 最近进展；
- 从 git diff 获取 modified files；
- 保存 active tags。

### Fit For Scenario 1

优点：

- 明确意识到 `SessionStart` 不足。
- `UserPromptSubmit` 每轮刷新对 compaction survival 有现实价值。
- markdown + bash 简单、可审计、低运维。
- 有 PreCompact checkpoint。

局限：

- 每轮提醒不是恢复，只是持续施压。
- checkpoint 来源依赖 agent 是否及时维护 `context.md` / `scratchpad.md`。
- 没有 PostCompact restore 和 survival eval。
- README 的可靠性百分比是自述，不是可验证 benchmark。

结论：适合作为“每轮轻量状态提醒”层，但不能单独满足严格场景 1。

## 6. `rlancemartin/claude-diary`

### Why It Matters

`claude-diary` 是一个会话 diary / reflection 项目。它和场景 1 的交集是 `PreCompact` 前自动生成 diary entry。

### Evidence From Source

`hooks/pre-compact.sh` 非常短：

- 输出 “Auto-generating diary entry before compact...”；
- 输出 `/diary`。

`commands/diary.md` 的模板要求保留：

- task summary；
- work summary；
- design decisions；
- actions taken；
- code review / PR feedback；
- challenges；
- solutions；
- user preferences；
- code patterns。

它明确说 PreCompact hook trigger 时优先用 current context，因为 session still in memory。

### Fit For Scenario 1

优点：

- 捕获时机正确：compact 前。
- diary 模板对长期复盘和偏好提取有价值。

局限：

- 目标是 diary/reflection，不是热路径 restore。
- 没有 structured checkpoint manifest。
- 没有自动恢复或恢复验证。

结论：适合补充长期学习/复盘，不是场景 1 主解法。

## 7. `agentmemory`

### Why It Is Not The Scenario 1 Answer

`agentmemory` 是强 runtime memory platform，但严格说不完全满足场景 1。

已有单独页面 [[agentmemory-suitability-and-deployment-evaluation-2026-07-05]] 记录过它的真实定位：它适合 `AI memory / runtime handoff` 层，不适合作为 markdown-first 长期知识主库。对本页而言，关键点是：

- 它有 Codex hooks，包括 `SessionStart`、`UserPromptSubmit`、`PreToolUse`、`PostToolUse`、`PreCompact`、`Stop`。
- `PreCompact` 可以输出 budgeted context。
- 它通过压缩 observation、profile、lessons、summaries、recent sessions 等生成上下文。
- 但它没有证明“压缩前后状态等价恢复”。
- 它的核心强项是长期/跨会话 memory、hybrid retrieval、central service，而不是 strict checkpoint/restore。

结论：`agentmemory` 可以作为场景 1 的辅助层，尤其是保存可复用事实和跨会话 continuity；但场景 1 的核心仍应另建 checkpoint + survival eval。

## 8. `codex-agent-mem` / `remem` / `qmd` / `self-reflect`

这些项目在更大的 memory 版图里有价值，但不是本页主角。

### `codex-agent-mem`

它的 `context_pack.py` 显示了很好的 context pack 设计：

- `micro` / `normal` / `full` budgets；
- objective、stable decisions、constraints、DoD gaps、pending work、blockers、recent continuity；
- 估算 source tokens / pack tokens；
- 给出 compression ratio。

但它是 pull-based MCP/local memory layer，不是 hooks-first compaction restore runtime。

### `remem`

它支持 local-first memory、Codex/Claude hooks、MCP、SQLite/SQLCipher 等，但本轮没有看到它对 `PreCompact -> PostCompact` 精确恢复的强实现证据。它更适合作为轻量 warm-start / session memory。

### `claude-qmd-sessions`

它把 Claude session 转成 markdown 并用 qmd 维护检索，适合 session archive / historical search。对场景 1 来说，它是事后检索工具，不是热路径 checkpoint。

### `claude-self-reflect`

它的定位更偏“Claude forgets everything, this fixes that”式历史检索/反思。它可以辅助恢复历史信息，但不是针对 compaction boundary 的严格机制。

## Why Popular Projects Avoid This Exact Problem

这个现象本身值得记录：最流行的 memory 项目往往不直接处理场景 1。

原因大致是：

1. **接口限制**：真正的 compaction 通常由 agent runtime 或 provider 控制，外部插件只能在 hooks 上做旁路。
2. **产品更容易讲成 memory/RAG**：长期记忆、向量搜索、知识库更容易商业化和泛化。
3. **评估困难**：恢复“当前工作状态”没有统一 benchmark，需要定义任务状态 schema 和 survival gates。
4. **token economics 冲突**：恢复越精确越容易变大；压缩越省 token 越容易丢细节。
5. **责任边界复杂**：哪些东西该恢复？用户约束、系统指令、工具输出、文件 diff、失败尝试、下一步、临时假设，优先级不同。
6. **agent 行为不可完全约束**：即使恢复包正确，模型也可能不使用或误读，所以需要每轮提醒、状态校验、DoD gates 等辅助机制。

所以，场景 1 不是伪问题；它更像一个 agent runtime reliability 问题，而不是普通 memory 产品问题。

## Recommended OMX Design Direction

如果 OMX 自己实现场景 1，不建议直接复制某个项目。更稳妥的组合是：

1. 学 `context-mode` 的 **eventized session DB + PreCompact resume snapshot + compact source SessionStart restore**。
2. 学 `claude-breadcrumbs` 的 **prepare/restore UX 和 recovery file schema**。
3. 学 `context-os` 的 **compaction survival benchmark 和 token-budget gates**。
4. 学 `code-session-memory` 的 **restart document sections**。
5. 学 `UnseveredMemory` 的 **UserPromptSubmit lightweight reminder**，但只注入极短状态摘要，避免污染每轮上下文。
6. 学 `codex-agent-mem` 的 **budgeted context pack**，把恢复包分成 `micro` / `normal` / `full`。

一个合理的 OMX 场景 1 MVP 应该包含：

```text
PostToolUse / UserPromptSubmit / Stop
  -> append structured session events

PreCompact
  -> build compact checkpoint:
     objective
     active task
     scope constraints
     key decisions
     failed approaches
     touched files
     open blockers
     next action
     git state
     validation state
     user explicit instructions

SessionStart(source=compact) / PostCompact
  -> inject only budgeted resume packet
  -> include checksum / checkpoint id
  -> require agent to acknowledge restored state

UserPromptSubmit
  -> inject tiny reminder only when active checkpoint exists

Eval
  -> compaction survival cases:
     pinned facts retained
     current subtask retained
     latest decision retained
     modified files retained
     failed approaches retained
     next action retained
     token budget respected
```

关键原则：

- 不要把向量记忆当作场景 1 的核心。
- 不要把完整 transcript 重新塞回上下文。
- 不要只依赖 LLM 自由文本总结。
- 不要只保存，不恢复。
- 不要只恢复，不验证。
- 恢复包应是结构化、可预算、可测试、可追踪 provenance 的。

## Final Recommendation

如果下一步要做 OMX 的场景 1 设计，我建议按这个优先级推进：

1. **先做研究型 spike**：复刻 `context-mode` 最小闭环，即 events -> `PreCompact` snapshot -> `SessionStart(source=compact)` injection。
2. **同时定义 checkpoint schema**：参考 `claude-breadcrumbs` 和 `code-session-memory`，但做成结构化 JSON + human-readable markdown 双输出。
3. **先写 survival eval**：参考 `context-os`，不要等实现完再补测试。
4. **把 `agentmemory` 放在旁路**：用于长期/跨会话 memory，不要让它承担 strict compact restore 的核心责任。
5. **做轻量 reminder**：参考 `UnseveredMemory`，但每轮只注入 checkpoint id、active task、next action、blocking guard，不注入大段上下文。
6. **对 `Codex` 单独做现实世界验证**：`Token Optimizer marketplace mirror plugin` 现在值得纳入一轮实机试验，重点验证 compaction 后是否稳定触发 `SessionStart(source=compact)` restore，以及是否会与 `codex-install` 路径产生重复 hook / 重复注入。

最短判断：

- **想学成熟工程结构**：看 `context-mode`。
- **想学恢复工作流语义**：看 `claude-breadcrumbs`。
- **想学怎么证明压缩后没丢关键状态**：看 `context-os`。
- **想学交接文档结构**：看 `code-session-memory`。
- **想学 compaction 后继续提醒机制**：看 `UnseveredMemory`。

没有一个严格 OSS 项目已经完美解决场景 1。真正可落地的路径是把以上几类设计收敛成 OMX 自己的 checkpoint/restore/eval 子系统。
