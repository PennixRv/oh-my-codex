---
title: "环境偏差：OMX 指令对主 Agent 角色的过度侵入 2026-07-06"
tags: ["environment", "codex", "agents-md", "prompt-intrusion", "role-boundary", "memory-research"]
created: 2026-07-06T11:05:00.000Z
updated: 2026-07-06T11:05:00.000Z
sources: []
links: ["scenario-1-context-compaction-restore-open-source-research-2026-07-06.md", "codex-memory-context-research-2026-07-05.md"]
category: environment
confidence: high
schemaVersion: 1
---

# 环境偏差：OMX 指令对主 Agent 角色的过度侵入 2026-07-06

## Observation

在讨论 Codex / Claude Code / CLI agent 的通用 memory 与 context continuity 方案时，主 agent 多次把分析主语拉回 OMX，导致研究对象发生偏移：

- 用户真正关注的是“为 Codex 环境增强 memory / context continuity”。
- OMX 只是当前 workspace 中已有的多 agent 编排工具，以及暂时存放研究笔记的项目。
- OMX 不应成为该研究主题的默认主语，也不应默认被视为最终架构核心。

## Likely Cause

当前 workspace 的 `AGENTS.md` 与相关 runtime 指令大量描述 Pennix OMX 的操作契约、技能、角色路由、team/swarm 工作流、wiki 写入方式和模型表。这些内容对 OMX 源码开发是有效上下文，但对通用 Codex memory research 会产生明显的 framing bias：

1. 把“记录位置在 OMX wiki”误解成“方案必须围绕 OMX 设计”。
2. 把“OMX 是当前仓库”误解成“OMX 是研究对象”。
3. 把“OMX 可以消费 memory 能力”误解成“OMX 应该主导 memory 能力”。

## Corrected Boundary

后续研究和方案讨论应使用以下主语：

- Primary subject: Codex / Claude Code / CLI agent context continuity layer.
- Secondary subject: open-source projects for compaction checkpoint, restore, handoff, and memory.
- Optional integration target: any local agent workflow, including but not limited to OMX.

OMX 只能在以下场景出现：

- 讨论当前研究资料暂存在哪里。
- 讨论已有本地工具如何接入通用 memory layer。
- 讨论多 agent 编排系统如何消费 checkpoint / restore / memory 能力。

## Practical Rule

当用户询问 memory、上下文压缩、恢复、长期知识库、跨会话交接时，默认不要以 OMX 开头。先回答通用 agent / Codex 环境问题，再在最后单独说明“如果要接入 OMX，可以如何作为消费者集成”。

## Impact

如果不修正该偏差，会造成：

- 研究结论过早绑定到单一工具；
- 忽略更通用的 Codex / Claude Code / MCP agent 生态；
- 把本应作为基础设施的 memory layer 错误降格为 OMX 的内部功能；
- 让用户误以为方案选择是为了服务 OMX，而不是为了服务其各处 Codex 工作环境。

## Status

本记录用于约束后续会话中的 framing。当前结论是：OMX 是可能的消费者和记录载体，不是 memory/context continuity 研究的默认中心。
