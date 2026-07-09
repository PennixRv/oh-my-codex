---
title: "Pennix OMX Fork Design Inventory 2026-07-04"
tags: ["omx", "fork", "architecture", "upstream", "team", "setup", "plugin-mode", "tmux-status", "developer-instructions"]
created: 2026-07-04T15:26:48.389Z
updated: 2026-07-04T15:26:48.389Z
sources: []
links: ["codex-memory-context-research-2026-07-05.md", "omx-leader-mailbox-notification-chain-analysis-2026-06-28.md", "omx-role-routing-and-model-mapping-analysis-2026-06-29.md", "upstream-integration-wave-1-matrix-2026-07-01.md", "upstream-integration-wave-2a-matrix-2026-07-01.md", "upstream-integration-wave-2b-matrix-2026-07-01.md", "upstream-integration-wave-2c-matrix-2026-07-01.md", "upstream-integration-wave-3a-matrix-2026-07-01.md", "upstream-integration-wave-3b-matrix-2026-07-01.md", "upstream-integration-wave-3c-matrix-2026-07-01.md", "upstream-integration-wave-3d-matrix-2026-07-01.md", "upstream-integration-wave-4-matrix-2026-07-02.md", "omx-team-smoke-findings-2026-06-28.md", "omx-team-lifecycle-restart-smoke-failures-2026-06-24.md", "tmux-status-bar-recovery-analysis-2026-07-03.md"]
category: architecture
confidence: medium
schemaVersion: 1
---

# Pennix OMX Fork Design Inventory 2026-07-04

## Scope

这页补齐一个长期缺口：现有 wiki 已经记录了若干单点事故、运行时烟测、以及多波次 upstream integration matrix，但还没有一页把 Pennix fork 自分叉以来真正形成的设计面统一列出来。

相关外部研究前提见 [[codex-memory-context-research-2026-07-05]]，那一页专门整理了 Codex 记忆、上下文压缩、跨会话交接和长期知识层的社区候选项目。

这页只记录两类内容：

- 当前源码里能直接看到、而且已经构成 Pennix fork 稳定行为的设计面。
- 现有 wiki 虽然零散提到过，但还没有被提升为“整体 fork 设计账本”的内容。

这页不重复展开已有 incident / wave 页面中的全部细节，而是把它们抽象成当前 Pennix OMX 的设计 inventory，并给出源码锚点。

## Findings First

1. Pennix OMX 已经不是“上游之上的少量 patch”，而是一个有自己产品边界的分发面：npm 包、GitHub Release、Codex plugin bundle、native agent TOML、Rust workspace 身份都已经明确 fork 化。
2. 安装 / setup 设计不是单一路径，而是明确分成 `legacy` 和 `plugin` 两种交付模式；`plugin` 模式依赖 Codex plugin discovery，但仍保留 native agent TOML 刷新，用于 `agent_type` 路由。
3. Pennix 对 setup 的所有权是刻意收窄的：setup 不再强行接管 `model_reasoning_effort`、`developer_instructions`、`model_context_window`、`model_auto_compact_token_limit` 这些用户侧模型调优面。
4. team runtime 的核心设计已经转成“非破坏性重启 + owner-aware tmux 资源治理”，而不是早期那种更容易误删历史状态/面板的做法。
5. mailbox-first 仍然是 leader/worker 通讯主轴；leader 可见提醒只是 nudge 层，不是主传输层，也不是任意 prompt inject。
6. 角色与模型策略不是单文件硬编码，而是分层设计：角色定义、worker launch contract、heuristic router、setup 生成的能力表共同组成。
7. tmux status bar 已经是 OMX 自己拥有的观测面，不再只是零散 shell 脚本；它有独立配置面、缓存面、会话指标面。
8. 当前最重要的未闭环设计债务仍然是 `developer_instructions`：对外话术是“optional bootstrap”，但实际 plugin-mode setup 对已有 custom instructions 仍会追加 OMX fragment。

## 1. Fork Identity And Productization

当前源码已经把 Pennix fork 作为独立产品面来维护，而不是单纯本地定制：

- `package.json:2-4` 将 npm 包名定为 `oh-my-codex-pennix`，描述里直接写明 `Pennix fork`。
- `package.json:19-20` 的 `prepack` / `postinstall` 说明打包生命周期是受控发布面，而不是只面向源码仓库开发。
- `package.json:53-56` 增加 `sync:plugin`、`verify:plugin-bundle`、`verify:native-agents`，说明 plugin bundle 与 native agents 都被视为 release contract。
- `Cargo.toml:12-19` Rust workspace package 元数据也指向 `https://github.com/PennixRv/oh-my-codex`。
- `plugins/oh-my-codex/.codex-plugin/plugin.json:23-30` 直接把 plugin UI 身份定义为 `Pennix OMX`，并明确 plugin = workflow/skills surface，setup = runtime wiring。

结论：Pennix 在源码层面已经形成“npm package + plugin bundle + native routing assets + runtime wiring”的复合产品边界。

## 2. Release Model Is Part Of The Design

发布方式本身已经是 fork 设计的一部分，不只是 CI 杂项：

- `.github/workflows/release.yml:1-7` 采用 tag-driven `v*` 触发。
- `.github/workflows/release.yml:30-40` 在 release job 里先 build、`sync:plugin`、verify native agents/plugin bundle、再跑 tests。
- `.github/workflows/release.yml:42-59` 发布 npm 包 `oh-my-codex-pennix`，并对 provenance/Sigstore 失败做降级处理。
- `.github/workflows/release.yml:61-112` 生成 release notes，并创建 GitHub Release。

这说明 Pennix fork 的 release contract 不再只是“把源码 push 出去”，而是“tag -> build -> plugin/native verify -> npm publish -> GitHub Release”的完整可发布链路。

## 3. Dual Install-Mode Design: Legacy Vs Plugin

源码已经明确支持两条安装/交付路径，而且这不是临时兼容，而是明确设计：

- `plugins/oh-my-codex/skills/omx-setup/SKILL.md:44-49` 直接写出 plugin mode 与 legacy mode 的职责差异。
- `plugins/oh-my-codex/skills/omx-setup/SKILL.md:54-67` 写明 user-scope 下会单独选择 skill delivery mode；发现 plugin cache 时，plugin mode 成为默认。
- `plugins/oh-my-codex/skills/omx-setup/SKILL.md:61-64` 明确 plugin mode 依赖 Codex plugin discovery，但仍会刷新 setup-owned native agent TOMLs，用于 `agent_type` 路由，同时清理 stale generated non-installable agents。

这背后的设计含义是：

- plugin mode 不再把所有 skill/prompt/hook 都扁平复制到传统位置。
- 但 Pennix 也没有把 native role routing 完全交给 plugin；它保留了本地可安装 TOML 这一层，以保持 `agent_type` 路由和 Codex native subagent surface 的稳定性。
- `AGENTS.md`、runtime wiring、feature flags、HUD 配置仍由 setup 维护；技能发现则尽量走插件能力。

这是 Pennix 相比上游/早期本地安装模式最关键的架构分叉之一。

## 4. Setup Ownership Is Deliberately Narrowed

Pennix fork 明确收窄了 setup 对模型和 UI 配置的接管范围：

- `src/config/generator.ts:232-245` 定义了 `status_line = []` 的 managed hidden mode，并通过 marker 区分 OMX-owned 与 user-owned status line。
- `src/config/generator.ts:747-770` 直接写了三个 Pennix policy comment：
  - never override user `model_reasoning_effort`
  - never override `developer_instructions`
  - never write `model_context_window` / `model_auto_compact_token_limit`

这代表当前 Pennix 的 setup 设计不是“尽可能接管 Codex config”，而是：

- 只写 OMX 运行真正需要的最小 root-level behavior。
- 把模型推理强度、上下文窗口、自动 compact 策略这类高主观性调优面留给用户。
- 把 Codex native footer 的可见性处理收敛到受控 `status_line` surface，而不是零散 hack。

## 5. `AGENTS.md` Is The Persistent Contract; `developer_instructions` Is Supposed To Be Optional Bootstrap

当前设计意图在 setup 文案里已经很清楚：

- `src/cli/setup.ts:3243-3252` 明确告诉用户，plugin-mode 下 `AGENTS.md` defaults 提供 persistent orchestration guidance，而 `developer_instructions` 只是 optional bootstrap。
- `plugins/oh-my-codex/.codex-plugin/plugin.json:24-26` 的 longDescription 也在强调 plugin/setup/runtime wiring 的边界，而不是要求所有行为都固化在 `developer_instructions`。

这说明 Pennix 的目标设计是：

- 长期稳定 orchestration contract 放在 repo-level `AGENTS.md`。
- `developer_instructions` 只用于给 Codex 提供一个轻量启动引导。

但是这块设计目前没有完全闭环，详见后面的设计债务章节。

## 6. Current `developer_instructions` Behavior Is Still Internally Inconsistent

这是当前源码里最值得明确记录的设计债务。

现状不是“完全不动 `developer_instructions`”，而是“setup 的总原则说不接管，但 plugin-mode 仍保留一个 append-managed-fragment 路径”：

- `src/cli/setup.ts:931-978`：当现有 `developer_instructions` 被分类为 `custom` 时，decision 是 `action: "update"`，reason 直接写的是 `append OMX developer_instructions fragment to custom instructions`。
- `src/cli/setup.ts:2050-2078`：真正应用时，如果当前值是字符串，就走 `appendManagedOmxDeveloperInstructions(currentValue)`，不是 preserve。
- `src/cli/uninstall.ts:129-143`：uninstall 会 strip managed OMX fragment，并尽量保留 user-owned remainder。
- `src/cli/uninstall.ts:732-735`：但 uninstall summary 仍把 `developer_instructions` 放在可移除的 managed top-level keys 一组里。

因此当前状态更准确的表述是：

- 设计话术：`developer_instructions` 是 optional bootstrap，不应成为主合同。
- 实际 setup 行为：custom string instructions 仍会被追加 OMX managed fragment。
- 实际 uninstall 行为：会尝试清理 OMX fragment，但对外 summary 仍像是在处理一个 setup-owned root key。

这应该被视为当前 Pennix fork 最显著的一处“设计意图与实现行为未完全一致”的区域。

## 7. Team Runtime Startup Philosophy: Archive Before Restart, Not Blind Cleanup

team runtime 的生命周期管理已经从“破坏性清理”转向“先归档，再判冲突/重启”：

- `src/team/runtime.ts:310-353` 的 `assertTeamStartupIsNonDestructive(...)` 会先检查 leader session 相关 active teams，而不是直接覆盖。
- `src/team/runtime.ts:319-321` 对 stale team 走 `archiveStaleTeamIfNeeded(..., "leader-session-stale-restart")`。
- `src/team/runtime.ts:338-341` 对 terminal previous run 走 `archiveTeamArtifacts(..., "previous-terminal-run")`。
- `src/team/runtime.ts:349-353` 如果当前 teamName 仍然活着，会显式抛出 conflict，并提示用 `status` / `resume` / `shutdown`，而不是启动重复 team。

结论：Pennix 现在把历史 artifact 保留、可诊断、可恢复，视为 runtime correctness 的一部分。

## 8. Tmux Ownership Identity Is Persisted In Team State

Pennix 已经把 tmux 资源所有权建模成 team state 的一部分，而不是临时运行时变量：

- `src/team/runtime.ts:375-385` 创建 interactive session 后，会把 `tmux_pane_owner_id` 写回 config。
- `src/team/state.ts:850-868` 新建 team config 时持久化 `tmux_pane_owner_id`。
- `src/team/state.ts:882-915` manifest v2 也持久化同一字段。
- `src/team/state.ts:978-1001` 从 manifest 恢复和 normalize 时，如果缺失会回退到 `defaultTmuxPaneOwnerId(...)`。

这项设计的意义在于：shutdown、HUD 清理、pane 回收、shared-session 安全性不再只能靠 pane id 猜测，而是有明确 owner identity。

## 9. Mailbox-First Coordination Remains A Fork Invariant

虽然现有 wiki 已经有单页分析，但它值得被提升为 Pennix fork 的总体设计不变量：

- `[[omx-leader-mailbox-notification-chain-analysis-2026-06-28]]` 已经证明 worker -> leader 的主路径是 mailbox-first，而不是直接向 leader pane 注入正文。
- `src/scripts/notify-hook/team-leader-nudge.ts:857-897` 说明 leader 可见提醒主要是 stale-leader / idle / new-mailbox-message 的 nudge 层，而且 stale follow-up 才是唯一周期性 visible nudge path。

这意味着 Pennix 的设计约束不是“完全没有 leader 提示”，而是：

- mailbox 是主传输层；
- visible prompt 只做提醒，不做主载荷；
- 不恢复 inject spam，不把 synthetic reminder 当正式通信机制。

这也是多页 upstream integration matrix 反复保持不变的 Pennix policy。

## 10. Role Routing And Model Policy Are Layered, Not Single-File

当前角色/模型架构至少分成三层：

- `src/agents/definitions.ts:7-27` 与 `:52-240`：定义 agent posture、model class、routingRole、reasoningEffort、exactModel、tool posture。
- `src/team/model-contract.ts:17-58` 与 `:108-145`、`:205-245`：定义 team worker launch args 的继承、解析、diagnostics、env/inherited/fallback 分层来源。
- `src/team/role-router.ts:1-58` 与 `:60-220`：prompt-file role loading + heuristic role routing 并存。

由此可以确认几件事：

- Pennix 不是单纯“写几个 prompt 文件”那么简单，而是把 prompt role、runtime launch contract、router heuristics 分层实现。
- `planner` / `architect` 等 exact model pin 是显式设计，不是 incidental default。
- `worker` 不应被当成通用业务角色；它更接近 team runtime protocol surface。
- team worker 的 model 选择不是硬编码一个默认值，而是 `env -> inherited -> fallback` 的层叠解析。

更详细的拆解见 `[[omx-role-routing-and-model-mapping-analysis-2026-06-29]]`。

## 11. Tmux Status Bar Is Now A First-Class OMX Surface

tmux status bar 在当前源码里已经是 OMX 自己的产品面，而不是用户自己维护的外部脚本：

- `src/tmux-status/config.ts:34-46` 定义默认配置，包括 `refreshSeconds = 2` 和 `cch.sessionsCacheSeconds = 5`。
- `src/tmux-status/config.ts:85-133` 允许从 `${CODEX_HOME}/.omx-config.json` 读取 `tmuxStatusBar` 配置，并合并 env fallback。
- `src/tmux-status/config.ts:142-151` 将状态栏资产根目录固定到 `${CODEX_HOME}/.omx/tmux-status`。
- `src/tmux-status/render.ts:139-151` 显式定义 `Model / Effort / Cost / Ctx / Total / Cache / Team / Wrk / Sess / Path / Git` 等标签。

这表明 Pennix 已经把以下内容产品化：

- Codex session / model / cost / context / cache rate 的持续观测。
- team supplement 的状态整合。
- 面向 `CCH` 的缓存与指标面，而不只是静态 tmux theme。

结合 `src/config/generator.ts:232-245` 的 managed `status_line = []`，可以把当前 Pennix 理解为：既在 Codex 原生 footer 上提供弱隐藏能力，也在 tmux 上提供自有状态面。

## 12. HUD Reconciliation Is Session-Scoped And Owner-Aware

HUD 相关逻辑不是“只要看见旧 pane 就杀”，而是显式做 owner-aware、session-scoped 回收：

- `src/hud/reconcile.ts:26-48` 定义 `OMX_TMUX_HUD_OWNER` 环境标记，并在注释里明确说明只回收当前 session 自己遗留的 orphan HUD panes。
- `src/hud/reconcile.ts:49-83` 的 `reapOrphanedSessionHudPanes(...)` 只在 pane owner.sessionId 属于当前 session 且 recorded leader 已死时才回收。
- `src/hud/reconcile.ts:91-113` 的 `reapStaleCurrentLeaderHudPanes(...)` 还要求存在 explicit owner marker，避免误伤其他 session。

这个设计直接服务于 shared tmux session 安全性，也解释了为什么若干 upstream merge 都必须“适配”而不是“直接拿来”。

## 13. “Since Upstream Divergence” Means Bounded Integration, Not Blind Catch-Up

现有一组 matrix 页面已经把“自分叉以来到底做了什么”记录得很清楚，但之前缺的是总纲。综合这些页面，当前 Pennix 的 upstream 策略可以概括为：

- 不是盲目追平 upstream/main。
- 以 bounded wave 方式逐批判定 `integrate / adapt / defer / reject`。
- 任何 upstream 变更都要先过 Pennix 自己的设计边界：mailbox-first、AGENTS.md contract、plugin-mode policy、shared-tmux safety、HUD 默认策略、roleModels / role routing policy。

相关记录见：

- `[[upstream-integration-wave-1-matrix-2026-07-01]]`
- `[[upstream-integration-wave-2a-matrix-2026-07-01]]`
- `[[upstream-integration-wave-2b-matrix-2026-07-01]]`
- `[[upstream-integration-wave-2c-matrix-2026-07-01]]`
- `[[upstream-integration-wave-3a-matrix-2026-07-01]]`
- `[[upstream-integration-wave-3b-matrix-2026-07-01]]`
- `[[upstream-integration-wave-3c-matrix-2026-07-01]]`
- `[[upstream-integration-wave-3d-matrix-2026-07-01]]`
- `[[upstream-integration-wave-4-matrix-2026-07-02]]`

这组页面现在更适合作为“逐波次决策档案”，而本页作为“Pennix fork 总体设计账本”。

## 14. Existing Wiki Pages This Inventory Depends On

- `[[omx-role-routing-and-model-mapping-analysis-2026-06-29]]`
- `[[omx-team-smoke-findings-2026-06-28]]`
- `[[omx-leader-mailbox-notification-chain-analysis-2026-06-28]]`
- `[[omx-team-lifecycle-restart-smoke-failures-2026-06-24]]`
- `[[tmux-status-bar-recovery-analysis-2026-07-03]]`

## 15. Open Design Debts Worth Tracking Explicitly

### A. `developer_instructions` 的产品话术与实现行为还没有完全一致

这是当前最重要的未闭环项。若未来要继续收紧 setup 所有权，优先应该决定：plugin-mode 对 custom `developer_instructions` 到底是 preserve-only，还是继续 append-managed-fragment。

### B. 角色到模型的“单一真相源”仍然是分层拼接而非单点配置

这本身未必是 bug，但它意味着维护者必须同时理解 `definitions.ts`、`model-contract.ts`、config model defaults、以及 AGENTS.md 中展示的 capability table，才能完整解释最终行为。

### C. setup 收窄所有权之后，部分历史文档/测试心智仍可能沿用“OMX 会全量接管 config”的旧假设

这在后续 merge / cleanup 中仍然是回归风险来源。

## Bottom Line

如果只用一句话概括当前 Pennix OMX：它已经从“上游 Codex CLI 上的一组 prompt/hook patch”演变成“以 AGENTS.md 为主合同、以 plugin + native role assets 为交付面、以 mailbox-first team runtime 和 owner-aware tmux safety 为运行时核心、以 bounded upstream integration 为维护策略”的独立 orchestration fork。
