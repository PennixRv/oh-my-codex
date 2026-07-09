---
title: "context-mode 在 Codex 本地环境中的部署与卸载尽调 2026-07-06"
tags: ["context-mode", "codex", "deployment", "uninstall", "hooks", "plugin", "due-diligence"]
created: 2026-07-06T03:22:00.000Z
updated: 2026-07-06T03:22:00.000Z
sources:
  - "https://github.com/mksglu/context-mode"
links: ["scenario-1-context-compaction-restore-open-source-research-2026-07-06.md", "codex-memory-project-due-diligence-2026-07-05.md", "environment-agent-role-intrusion-observation-2026-07-06.md"]
category: reference
confidence: high
schemaVersion: 1
---

# context-mode 在 Codex 本地环境中的部署与卸载尽调 2026-07-06

## Scope

这页只回答一个问题：

`context-mode` 如果未来要落地到当前这台机器的 `Codex CLI` 环境，真实的部署行为、升级行为、卸载行为分别是什么，会改动什么，是否足够优雅，是否贴合当前环境。

本页不是做一个功能 demo，也不是讨论它的算法设计优劣，而是做 deployment / uninstall due diligence。

研究基于两类证据：

1. `context-mode` 上游源码与 README。
2. 当前机器同版本 `codex-cli 0.142.5` 的隔离 `CODEX_HOME` 实测，不碰真实 `~/.codex`。

## 结论先行

结论可以先说清楚：

1. `context-mode` 在当前 `Codex` 环境里**可以部署**，但最佳路径只应该是 **Codex 原生 plugin 路径**，不应该选 standalone/manual fallback。
2. 它对当前环境**不是零侵入、也不是完全优雅**。真正轻量的是 `codex plugin marketplace add` + `codex plugin add` 这一步；真正有侵入性的是它自己的 `context-mode upgrade` 修复流，以及 standalone 路径对 `~/.codex/config.toml`、`~/.codex/hooks.json`、`AGENTS.md` 的写入。
3. 对当前这台机器而言，它**不完全贴合**现状，但也不是不可接受。更准确的判断是：它技术兼容，但会作为“第二套完整 hooks/runtime 连续性层”叠加到已有的 `oh-my-codex` 和现有用户 hooks 之上，因此必须把部署边界收紧在 plugin-only 模式。
4. 它的卸载**不干净**。`Codex` 原生 `plugin remove` 只能移除安装态，不能顺手清掉 marketplace、hook trust state、context-mode 数据目录、也不能回滚你一旦走过的 standalone 手工配置。

一句话版：

- **可装，但应只走 plugin path。**
- **不要先跑 standalone。**
- **不要先跑 `context-mode upgrade`。**
- **不要复制它的 `AGENTS.md` 到当前全局 `~/.codex/AGENTS.md`。**

## 当前本机基线

这页判断必须建立在当前机器不是“空白 Codex 家目录”这个事实之上。

当前本机关键状态：

1. `codex-cli` 版本是 `0.142.5`。
2. `~/.codex/config.toml` 已经是重度自定义配置，包含自定义 provider、feature flags、trust state、history、memories、developer instructions。
3. `~/.codex/hooks.json` 已存在，并承载独立于 `context-mode` 的现有自动化 hooks。
4. `~/.codex/AGENTS.md` 已存在，而且是明显的 OMX-heavy 全局指令层。
5. 现有 Codex plugin 环境里已经启用了 `oh-my-codex@oh-my-codex-local`。
6. 当前 `config.toml` 已开启 `plugin_hooks = true` 与 `hooks = true`。
7. 当前 `oh-my-codex` plugin 本身就占用了 `SessionStart`、`PreToolUse`、`PostToolUse`、`UserPromptSubmit`、`PreCompact`、`PostCompact`、`Stop` 这一整套 hook 面。

因此本页的判断标准不是“它在干净环境能不能工作”，而是“它在一个已经存在 plugin hooks + user hooks + global AGENTS 的 Codex home 中，会不会把边界搅乱”。

## context-mode 提供的两条 Codex 安装路径

上游仓库对 Codex 提供两种路径。

### 路径 A：Codex 原生 plugin 路径

README 的 Codex 段落给出的方向是：

1. `codex plugin marketplace add mksglu/context-mode`
2. 启用 `[features].plugin_hooks = true` 与 `[features].hooks = true`
3. 重启 Codex
4. 信任 plugin hooks

从插件清单可以确认它确实带了 Codex 所需三件套：

1. `.codex-plugin/plugin.json`
2. `.codex-plugin/mcp.json`
3. `.codex-plugin/hooks.json`

另外仓库根目录还带了 `.agents/plugins/marketplace.json`，说明它本身兼容被 Codex 作为 marketplace source 添加。

### 路径 B：standalone / manual fallback

README 也提供了无 `plugin_hooks` 时的回退路径：

1. `npm install -g context-mode`
2. 手工给 `~/.codex/config.toml` 增加 `[mcp_servers.context-mode]`
3. 手工创建 `~/.codex/hooks.json`
4. 可选手工复制 `configs/codex/AGENTS.md`

这条路径在“空白环境”里能用，但在当前机器上优雅度最低。

## 与当前 Codex CLI 的命令面差异

这里有一处必须记录的现实差异。

`context-mode` README 对 Codex 的措辞更像是“plugin marketplace + plugin UI 安装”。但当前本机 `codex-cli 0.142.5` 的实际 CLI 子命令是：

- `codex plugin marketplace add`
- `codex plugin add`
- `codex plugin remove`
- `codex plugin marketplace remove`

而不是 `plugin install / uninstall` 这种表述。

这不影响总体兼容性，但意味着：

1. README 不是当前本机上的逐字命令手册。
2. 真正执行前应以本机 CLI 的 help 和行为为准。

## 隔离环境实测：Codex 原生 plugin 安装/移除到底改了什么

为了避免碰真实 `~/.codex`，我在临时 `CODEX_HOME` 下做了安装/卸载实测。

### 实测结论 A：纯 Codex plugin add 很克制

在隔离环境中，执行：

```bash
codex plugin marketplace add /tmp/context-mode-src
codex plugin add context-mode@context-mode
```

结果非常明确：

1. `config.toml` 新增了 `[marketplaces.context-mode]`。
2. `config.toml` 新增了 `[plugins."context-mode@context-mode"] enabled = true`。
3. 插件缓存目录被创建到：
   `CODEX_HOME/plugins/cache/context-mode/context-mode/1.0.169`
4. **没有自动生成 `hooks.json`。**
5. **没有自动写入任何 `AGENTS.md`。**
6. **没有自动补上 `[features].plugin_hooks` 或 `[features].hooks`。**

也就是说，`Codex` 原生 plugin 安装本身是相对优雅的。它只做 marketplace / plugin 注册与缓存落盘，不直接改你的 hooks 或全局指令文件。

### 实测结论 B：插件缓存不是精简 runtime 包，而是一整份仓库

隔离环境里的已安装缓存目录大小约 `20M`，内容不是“仅运行时 bundle”，而是几乎一整份仓库：

1. `.git`
2. `docs/`
3. `tests/`
4. `configs/`
5. `hooks/`
6. `server.bundle.mjs`
7. `cli.bundle.mjs`

这说明它的安装足迹不是极简插件模式，而是“完整仓库镜像式缓存”。

优点是自带文档与恢复材料，缺点是：

1. 体积不小。
2. 升级/修复逻辑天然更像“仓库自愈器”，而不是最小插件。

### 实测结论 C：首次运行依赖自举不是完全前置完成

Codex plugin add 后的缓存目录里一开始没有 `node_modules`。

`start.mjs` 的实现表明：

1. 它会在启动时 `import "./hooks/ensure-deps.mjs"`，处理 SQLite 相关依赖。
2. 对 `turndown`、`turndown-plugin-gfm`、`@mixmark-io/domino` 这类用于抓取/转 markdown 的依赖，首次运行会后台 `npm install`。
3. 这样做是为了避免 Codex MCP 启动超时。

这意味着 plugin path 虽然不要求你先全局 `npm install -g`，但也不是“装完立即完全热态”。第一次启动时它会做一定的自举工作。

### 实测结论 D：Codex 原生卸载不是彻底清理

隔离环境里：

1. `codex plugin remove context-mode@context-mode`
   会移除 `[plugins."context-mode@context-mode"]`，并删除版本目录。
2. 但它**不会**移除 `[marketplaces.context-mode]`。
3. 还需要再执行 `codex plugin marketplace remove context-mode`。
4. 即便做完 marketplace remove，仍会留下空的上级缓存目录，例如：
   `plugins/cache/context-mode`
5. 更重要的是，**hook trust state 不会被 Codex 自动清理**。

我用两种 key 形态分别做了隔离验证：

1. `context-mode@context-mode:hooks/hooks.json:...`
2. `context-mode@context-mode:.codex-plugin/hooks.json:...`

在两种情况下，`plugin remove` 与 `marketplace remove` 之后，`[hooks.state."..."]` 条目都仍然留在 `config.toml` 里。

这意味着 plugin uninstall 不是完整 rollback。

## 源码级观察：真正有侵入性的不是 plugin add，而是 context-mode upgrade

如果只看 Codex 原生 `plugin add`，它其实算克制。

真正值得警惕的是 `context-mode` 自己的 `upgrade` 流程。

### upgrade 不是“小修小补”，而是完整 repair / reconcile 流

`src/cli.ts` 中的 `upgrade()` 会做这些事：

1. 从 GitHub clone 最新上游到临时目录。
2. `npm install`。
3. `npm run build`。
4. 把文件原地复制回当前 plugin root。
5. 运行 adapter 级别的 hooks / config 归一化。
6. 备份现有设置文件。
7. 跑 doctor 做收尾验证。

对 Codex 而言，它不是一个“只检查插件状态”的命令，而是一个会主动修补配置的命令。

### Codex adapter 会触达哪些文件

`src/adapters/codex/index.ts` 表明，Codex adapter 真实会触达这些面：

1. `~/.codex/config.toml`
2. `~/.codex/hooks.json`
3. `~/.codex/context-mode/sessions/` 或 override 后的 sessions 目录
4. `~/.codex/context-mode/content/` 或 override 后的 content 目录
5. `~/.codex/memories/<projectHash>/` 或 `CONTEXT_MODE_DATA_DIR` 对应 memories 目录

### Codex adapter 的 hooks/config 行为

`configureAllHooks()` 的真实逻辑是：

1. 读取 `hooks.json`
2. 如果 `hooks.json` 缺失，则从空对象开始
3. 如果 `hooks.json` 是非法 JSON，会先备份为带时间戳的 `.broken-*.bak`
4. 如果判定 “plugin owns hooks”，则：
   - 从 `hooks.json` 里删掉用户态重复的 context-mode hook 条目
   - 从 `config.toml` 里删掉 standalone 的 `[mcp_servers.context-mode]`
   - 修剪已经失效的用户态 hook trust entries
5. 如果不判定 plugin owns hooks，则：
   - 把 context-mode 的原生命令 hooks upsert 到 `~/.codex/hooks.json`
6. 无论哪种路径，都会确保 `[features].hooks = true`

重点是：它不是全量覆盖，而是“尽量只操作自己识别到的 context-mode managed entries”。

这比粗暴覆盖要好，但仍然意味着：

1. 它会改全局 `hooks.json`
2. 它会改全局 `config.toml`
3. 它会改信任状态相关 TOML sections

### 备份与损坏恢复

Codex adapter 的 `backupSettings()` 会备份：

1. `hooks.json.bak`
2. `config.toml.bak`

如果 `hooks.json` 非法，还会额外生成：

1. `hooks.json.broken-<timestamp>.bak`

所以它不是无回退，但回退机制是“备份文件级回退”，不是“声明式 uninstall / rollback”。

### 升级流还有额外副作用

对 Codex 这种非 in-process plugin 平台，`upgrade()` 还会做额外动作：

1. `npm install --production` 到 plugin root
2. 校验/修复 SQLite 相关依赖
3. 尝试执行 `npm install -g <pluginRoot>`

最后这一条很重要。

这意味着在 Codex 平台上，`context-mode upgrade` 并不是纯插件内修复，它还倾向于顺手更新全局 npm 包。

这件事对“当前机器是否优雅”影响很大，因为它会把部署从 “Codex plugin” 拖回 “全局 npm + plugin 双轨”。

## storage 行为与删除范围

### 主要数据目录

从 `src/session/db.ts` 与 `src/server.ts` 看，核心持久化面包括：

1. session DB
2. content FTS5 DB
3. session stats
4. session events markdown

默认对 Codex 的路径是：

1. `~/.codex/context-mode/sessions/`
2. `~/.codex/context-mode/content/`

### 环境变量覆盖有两个层次

这里存在一个需要特别记录的实现细节。

`context-mode` 对 storage root 的覆盖并不是只有一个变量：

1. README 明确文档化的是 `CONTEXT_MODE_DIR`
2. adapter 层同时还保留了 `CONTEXT_MODE_DATA_DIR`

更准确的理解是：

1. `CONTEXT_MODE_DIR` 是 runtime 主路径解析使用的主入口，文档也是按它写的
2. `CONTEXT_MODE_DATA_DIR` 是 adapter 级别的额外 override，当前 Codex adapter 的 `getSessionDir()` / `getMemoryDir()` 会认它
3. 在 server 路径里，`CONTEXT_MODE_DIR` 的优先级更高；如果它未设置，adapter 返回的 `CONTEXT_MODE_DATA_DIR` 路径仍然会生效

这不一定会阻塞部署，但它说明 storage override 语义不是最简洁的一元设计。

### ctx_purge 能删什么，不能删什么

`ctx_purge` 在 project scope 下会删：

1. knowledge base FTS5
2. session events DB
3. session events markdown
4. session stats

但它**不是卸载命令**。

它不会负责：

1. 卸载 Codex plugin
2. 删除 marketplace 配置
3. 清掉 hook trust state
4. 回滚你写入过的 `[mcp_servers.context-mode]`
5. 回滚你复制过的 `AGENTS.md`

所以 `ctx_purge` 只能叫“项目数据清空”，不能叫“产品卸载”。

## 与当前环境的贴合度判断

### 1. plugin-only 路径是可接受的

如果坚持以下边界，它和当前环境是兼容的：

1. 只用 Codex plugin path
2. 不走 standalone MCP block
3. 不把它的 `configs/codex/AGENTS.md` 复制到当前全局 `~/.codex/AGENTS.md`
4. 不把 `context-mode upgrade` 当成首装步骤

在这个边界内，它对真实 `~/.codex` 的首轮侵入主要会是：

1. plugin marketplace/source 注册
2. plugin enable 状态
3. 后续用户信任 plugin hooks 后产生的 trust state
4. 运行时会生成自己的 sessions/content 数据

### 2. standalone 路径与当前环境明显不贴合

原因很直接：

1. 当前 `~/.codex/hooks.json` 不是空的
2. 当前 `~/.codex/AGENTS.md` 不是空的
3. 当前已经有 `oh-my-codex` plugin hooks
4. 当前开发环境有大量全局行为约束，不适合再把另一个产品的全局 `AGENTS.md` 生硬复制进去

更准确地说，standalone 路径不是“不能工作”，而是它会把当前环境从多层协同变成多层互相抢主语。

### 3. hook stacking 是真实风险，不是理论风险

当前机器已经存在三层 hook 面：

1. `oh-my-codex` plugin hooks
2. `~/.codex/hooks.json` 用户 hooks
3. 如果装 `context-mode` plugin，再加一套 plugin hooks

这意味着 `PreToolUse`、`PostToolUse`、`SessionStart`、`UserPromptSubmit`、`PreCompact`、`Stop` 都会叠加触发。

这在 Codex 机制上是允许的，但带来的实际影响包括：

1. 更多事件开销
2. 更多 hook trust 条目
3. 更多行为交叉点
4. `PreToolUse` 阶段更容易出现“多层都想干预”的复杂语义

因此它和当前环境的关系应该理解为：

- **兼容**
- **但不是天然和谐**

### 4. 全局 AGENTS 复制在当前机器上应视为禁止动作

README 的 manual fallback 建议可以把 `configs/codex/AGENTS.md` 复制到：

1. 项目 `./AGENTS.md`
2. 或全局 `~/.codex/AGENTS.md`

对当前机器，这条建议应直接判定为不适用。

原因不是它的 AGENTS 内容不好，而是当前全局 `~/.codex/AGENTS.md` 已经承载了本机已有的高优先级工作流边界。把另一个产品的全局 AGENTS 直接覆盖上去，会让主语和路由进一步混乱。

## 部署优雅度评分

按当前环境来打分：

| 路径 | 兼容性 | 侵入性 | 可回退性 | 当前建议 |
| --- | --- | --- | --- | --- |
| Codex plugin path | 中到高 | 中 | 中偏低 | 可采用 |
| `context-mode upgrade` 首装即用 | 中 | 高 | 中 | 不建议 |
| standalone/manual path | 低 | 很高 | 低 | 不建议 |

## 推荐的后续落地顺序

如果后续真的要在真实环境落地，标准顺序应该是：

1. 先只做 **Codex 原生 plugin 安装**。
2. 只启用最小需要的 feature flags。
3. 先验证 plugin hooks 信任、MCP 可达、首轮启动是否稳定。
4. 不先跑 `context-mode upgrade`。
5. 不先引入 standalone `[mcp_servers.context-mode]`。
6. 不复制它的 `AGENTS.md` 到当前全局 AGENTS。
7. 只有在 plugin path 已经稳定、且确实需要它帮忙清理重复 managed entries 时，再评估是否允许执行 `context-mode upgrade`。

## 推荐的卸载顺序

如果以后要完整撤掉，推荐顺序应是：

1. `codex plugin remove context-mode@context-mode`
2. `codex plugin marketplace remove context-mode`
3. 手工检查并删除 `~/.codex/config.toml` 中残留的
   `[hooks.state."context-mode@context-mode:.codex-plugin/hooks.json:..."]`
4. 手工检查残留空目录，如：
   `~/.codex/plugins/cache/context-mode`
5. 如果曾经运行过并产生数据，再决定是否清理：
   `~/.codex/context-mode/sessions/`
   `~/.codex/context-mode/content/`
   以及任何 `CONTEXT_MODE_DIR` / `CONTEXT_MODE_DATA_DIR` 指向的自定义根
6. 如果历史上曾走过 standalone/manual path，再额外回滚：
   - `[mcp_servers.context-mode]`
   - `~/.codex/hooks.json` 中的 context-mode managed hooks
   - 任何被复制进去的 `AGENTS.md`

## 最终判断

最终判断不复杂：

1. `context-mode` 值得在 Codex 环境试部署。
2. 但当前机器上必须把它当成 **第二套完整 context/runtime hook layer** 来对待，而不是一个简单的 MCP 工具包。
3. 真正优雅的入口只有 **plugin-only**。
4. 真正不优雅的部分主要是：
   - standalone/manual path
   - `upgrade()` 的修复式全局写入
   - uninstall 不自动清 trust state
5. 因此如果进入实施阶段，第一轮方案应是：
   **只安装 plugin，不引入 standalone，不复制 AGENTS，不先跑 upgrade。**

这套边界下，它和当前环境是可控兼容；超出这套边界后，优雅度会迅速下降。
