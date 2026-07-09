---
title: "Token Optimizer 在 Codex 中的实际行为、侵入性与 NAS 中心化部署评估 2026-07-06"
tags: ["token-optimizer", "codex", "context", "continuity", "deployment", "nas", "research"]
created: 2026-07-06T15:10:00.000Z
updated: 2026-07-07T10:25:00.000Z
sources:
  - "https://github.com/alexgreensh/token-optimizer"
  - "https://github.com/alexgreensh/token-optimizer/blob/main/docs/codex.md"
  - "https://github.com/alexgreensh/token-optimizer/blob/main/docs/uninstall.md"
  - "https://github.com/alexgreensh/token-optimizer/blob/main/LICENSE"
  - "https://github.com/alexgreensh/token-optimizer/blob/main/SECURITY.md"
  - "https://github.com/alexgreensh/token-optimizer/issues/53"
  - "https://github.com/alexgreensh/token-optimizer/issues/75"
  - "https://github.com/alexgreensh/token-optimizer/issues/79"
  - "https://github.com/alexgreensh/token-optimizer/issues/81"
  - "https://github.com/alexgreensh/token-optimizer/issues/83"
links:
  - "scenario-1-context-compaction-restore-open-source-research-2026-07-06.md"
  - "context-mode-vs-lean-ctx-vs-headroom-for-scenario-1-2026-07-06.md"
  - "agentmemory-suitability-and-deployment-evaluation-2026-07-05.md"
  - "token-optimizer-codex-proven-deployment-and-fidelity-first-config-2026-07-07.md"
category: reference
confidence: high
schemaVersion: 1
---

# Token Optimizer 在 Codex 中的实际行为、侵入性与 NAS 中心化部署评估 2026-07-06

## Scope

这页只回答和当前工作直接相关的问题：

1. `token-optimizer` 在 `Codex` 下到底实际做了什么。
2. 它对本地 `~/.codex` 环境的侵入性有多大。
3. 它的安装、卸载、回滚面到底是什么。
4. 它提到的 “dashboard daemon / backend” 到底是什么。
5. 它是否适合放在 `NAS` 上做一个多台 `Codex` 共享的中心化后端。

本页不讨论 Claude Code 主路径，也不把它泛化成抽象 “AI memory” 研究。

## Related Pages

- [[token-optimizer-codex-proven-deployment-and-fidelity-first-config-2026-07-07]]

## Executive Summary

## 结论先行

1. `Token Optimizer` 在 `Codex` 下更像 **本地 hook + 本地状态数据库 + 本地 dashboard daemon** 的组合，不是一个可直接中心化复用的 `memory backend`。
2. 它对 `Codex` 的支持是认真做过适配的，且上游最近仍在持续修补 `Codex` 相关问题；但它在 `Codex` 下并不具备 Claude 路径那种完整的 `PreCompact + PostCompact` 生命周期。
3. 对 `场景 1` 而言，它确实提供 continuity / checkpoint / compact guidance，但更准确地说是 **“压缩边界前后的本地连续性补强”**，不是“严格精确恢复”的强保证系统。
4. 它的安装侵入性是 **中等**：默认会改 `~/.codex/hooks.json`，改 `~/.codex/config.toml`，写 `~/.codex/token-optimizer/`，并在 plugin data / legacy backup 目录下写本地数据库与 dashboard 产物；如果启用 daemon，还会安装一个 `systemd --user` / `launchd` / `Task Scheduler` 服务。
5. 它的卸载故事比很多项目清楚，但官方 `Codex` 文档里的 “删掉 `~/.codex/token-optimizer/` 即可清理数据” 这个说法 **不完整**；真实数据常常还在 `~/.codex/plugins/data/token-optimizer-*/data/` 或 `~/.codex/_backups/token-optimizer/`。
6. 它不适合干净地做 “NAS 上一个中心化后端，供多台 Codex 共用” 这件事。你可以把某一台机器的 dashboard 暴露出来远程访问，但那只是暴露那台机器自己的本地数据，不等于多客户端共享一个统一 Token Optimizer 服务。
7. 还有一个现实边界：它的许可证是 `PolyForm Noncommercial 1.0.0`，不是标准开源许可证。对公司环境或商业使用，这是实质性的采用风险。

## Upstream Status

截至 `2026-07-06` 核验到的上游情况：

1. 仓库：`alexgreensh/token-optimizer`
2. Stars：`1557`
3. Forks：`124`
4. 最近 push：`2026-07-05T21:33:41Z`
5. 当前本地核验 commit：`0f429ee93408852ad39873852ede3b5116f5cf04`
6. 许可证：GitHub 识别为 `Other`，源码中实际是 `PolyForm Noncommercial License 1.0.0`

这个项目不是“无人维护的小实验”。相反，它在 `2026-07` 仍有持续迭代，而且 Codex 适配相关的 issue 最近确实在被修：

1. `#75`：版本升级后 hooks 路径指向旧版本，导致每次 tool call 失败，已关闭。
2. `#81`：`SessionStart` 钩子输出纯文本而不是 Codex 期望的 JSON，已关闭。
3. `#83`：Codex 不支持 async hooks，但 plugin hook 文件里仍带 async，导致启动警告，已关闭。
4. `#53`：`UserPromptSubmit` 重复输出大段 advisory，造成每轮 prompt 膨胀，已关闭。
5. `#79`：first-read skeleton 替换导致 progressive disclosure 不可信，已关闭。

这里有一个重要判断：

- 从维护活跃度看，它值得研究。
- 从许可证边界看，它不能被轻率视为“普通开源依赖”。

## License Boundary

这是这次尽调里必须先讲清楚的一点。

`LICENSE` 不是 `MIT` / `Apache-2.0` / `GPL`，而是：

- `PolyForm Noncommercial 1.0.0`

并且仓库公开材料里有明显的商业授权语义。

这意味着：

1. 个人研究、实验、非商业测试通常问题不大。
2. 如果你的 `Codex` 使用场景带有公司或商业性质，必须把许可证视为实质性风险，而不是注脚。
3. 所以它即便技术上成立，也未必能成为你最终的生产方案。

## Codex Integration Model

## 安装入口

`Codex` 侧官方推荐路径是：

```bash
codex plugin marketplace add alexgreensh/token-optimizer
```

然后在 `Codex TUI` 的 `/plugins` 中安装 plugin，再执行：

```bash
TOKEN_OPTIMIZER_RUNTIME=codex \
python3 skills/token-optimizer/scripts/measure.py codex-install
```

这一步不是 “只启用 plugin 即可”，而是 **额外运行一个 Codex 专用安装器**，由它把本地 `hooks.json` 和 `config.toml` 接上。

## Codex 适配的真实形态

源码显示，`Codex` 不是走 Claude 那种原生完整 hook surface，而是：

1. 使用 `codex_hook_bridge.py` 把可消费的内容包成 `hookSpecificOutput.additionalContext`
2. 使用 `codex_install.py` 把 Token Optimizer 管理的 hook group 合并进 `hooks.json`
3. 使用 `codex_compact_prompt.py` 把一个 managed compact prompt block 注入 `config.toml`
4. 可选用 `codex_statusline.py` 改写原生 `[tui].status_line`

也就是说，它不是：

- 一个远端服务
- 一个纯 MCP server
- 一个只读观察器

它是一个 **明确写入本地 Codex 运行面** 的适配层。

## 文档、源码与实际安装路径存在重要口径偏差

`docs/codex.md` 写的是：

- default profile = `balanced`

但当前源码 `codex_install.py` 的 parser 默认值是：

- `--profile aggressive`

而且源码对 profile 的解释也比文档更细。

这个差异很重要，因为如果用户直接按文档理解“默认是低噪音 balanced”，实际执行时可能落到更激进的 profile 逻辑上。当前 commit 下，**应当以源码为准**。

但这还不是最大的口径偏差。更关键的是：上游当前同时存在两条不同的 `Codex` 接入路径。

### 路径 A：`codex-install` 写入 `~/.codex/hooks.json`

这是 `docs/codex.md` 和 `install/codex-cli.mdx` 明确推荐的路径。它的特征是：

1. 通过 `codex_install.py` merge managed hook groups 到 `~/.codex/hooks.json`
2. 默认 profile 只安装 `3-5` 类事件
3. 走 `codex_hook_bridge.py`
4. 语义上偏“Codex-safe approximate continuity”

### 路径 B：Codex marketplace mirror plugin 自带 `hooks/hooks.json`

这是这次补查后确认到、之前容易漏掉的路径。其特征是：

1. 仓库里存在专门的 `scripts/sync-codex-marketplace-plugin.sh`
2. 它会把根目录的 `hooks/` 镜像到 `plugins/token-optimizer/`
3. 并在镜像阶段专门为 `Codex` 去掉 `async`
4. 镜像后的 `plugins/token-optimizer/hooks/hooks.json` 明确包含 `PreCompact`、`SessionStart(compact matcher)`、`Stop`、`PostCompact`

因此不能再笼统地说：

- “Token Optimizer 在 Codex 下只有 `compact prompt + Stop checkpoint`”

更准确的说法应当是：

- `codex-install` 路径是更保守的近似方案
- marketplace mirror plugin 路径已经具备更强的 compact continuity wiring

## 2026-07-07 实机安装观察

本页结论已经做过一轮 live 验证。当前环境直接按 marketplace plugin 路径完成了实机安装。

### 实际执行的命令

```bash
codex plugin marketplace add alexgreensh/token-optimizer --json
codex plugin add token-optimizer@alexgreensh-token-optimizer --json
```

安装结果：

1. marketplace 名称：`alexgreensh-token-optimizer`
2. plugin id：`token-optimizer@alexgreensh-token-optimizer`
3. version：`5.11.37`
4. installed cache path：

```text
/home/penn/.codex/plugins/cache/alexgreensh-token-optimizer/token-optimizer/5.11.37
```

### 对 live `~/.codex` 的真实改动面

这次 marketplace plugin 安装后，直接观察到的 live 改动比 `codex-install` 路径小得多：

1. `~/.codex/config.toml`
   - 新增 `[plugins."token-optimizer@alexgreensh-token-optimizer"]`
   - 新增 `[marketplaces.alexgreensh-token-optimizer]`
2. `~/.codex/hooks.json`
   - **未发生直接改写**

这说明当前这次实装拿到的是：

- **plugin-scoped hooks**
- **不是先改全局 `~/.codex/hooks.json` 的 `codex-install` 路径**

这一点非常重要，因为它意味着：

1. 当前试装的侵入性低于 `codex-install`
2. 插件行为主要通过 plugin cache 中的 mirror hooks 生效
3. 如果后续要回滚，第一优先级是 `codex plugin remove`，而不是先清全局 hook merge

### 已确认拿到的是“更强的 mirror hooks”

对 live cache 中实际安装下来的：

```text
/home/penn/.codex/plugins/cache/alexgreensh-token-optimizer/token-optimizer/5.11.37/hooks/hooks.json
```

核对结果如下：

1. 包含 `PreCompact`
2. 包含 `SessionStart`
3. 包含 `Stop`
4. 包含 `PostCompact`
5. 不包含 `"async": true`

因此，这次 live 安装已经实际证明：

- 当前环境拿到的就是前文分析的 **Codex marketplace mirror plugin**
- 不是只有 `codex-install` 的保守桥接路径
- upstream 为 `Codex` 剥离 `async` 的镜像构建逻辑已经真实体现在本机安装产物中

### 当前应如何理解这次安装状态

截至这一步，可以确认三件事：

1. plugin 已安装并 enabled
2. plugin cache 中的 hooks 已落地到本机
3. 还**没有**额外执行 `codex-install`

所以现在最合理的下一步不是立刻补跑 `codex-install`，而是：

1. 先观察 plugin-only 路径在真实 `Codex` 会话中的行为
2. 重点验证 compaction 后是否稳定触发 `SessionStart(source=compact)` restore
3. 只有当 plugin-only 路径证据不足时，再考虑是否补充 `codex-install`

## 它在 Codex 下实际做了什么

## 1. `SessionStart`

这里必须先区分两条路径，否则很容易误判恢复到底发生在什么时候。

### 路径 A：`codex_hook_bridge.py`

`handle_session_start()` 的核心行为是：

1. 先调用 `measure.run_ensure_health`
2. 然后根据启动来源决定是否注入 continuity context

具体分支：

1. `source == "resume"` 且存在匹配 checkpoint
   - 调 `measure.compact_restore(..., is_compact=True)`
2. `source == "clear"`
   - 调 `measure.compact_restore(..., new_session_only=True)`
3. 其他情况
   - 不注入 continuity context

这说明这条桥接路径下的恢复逻辑不是“每次启动都强行恢复整段记忆”，而是依赖：

- `resume`
- `clear`
- 本地 checkpoint

所以它更像 **条件式 continuity restore**。

### 路径 B：marketplace mirror plugin 的 shared hooks

补查 `plugins/token-optimizer/hooks/hooks.json` 后可以确认：

1. 存在 `PreCompact -> compact-capture --trigger auto`
2. 存在 `SessionStart` 的 `matcher: "compact"` -> `compact-restore --compact`
3. 存在普通 `SessionStart` -> `compact-restore --new-session-only`
4. 存在 `PostCompact`，但它只做 `quality-cache --force`

这里最重要的结论是：

- **恢复不是由 `PostCompact` 完成的**
- **恢复发生在 compaction 之后随即进入的 `SessionStart(source=compact)`**

`measure.py` 自己的注释也写得很直白：

1. `compact_restore()` 是 “Called by SessionStart hook”
2. 其中一类是 “Post-compaction ... injects full checkpoint”

所以，若使用 marketplace mirror plugin 这条更强路径，它并不是“等以后手动重启会话再恢复”，而是：

- compaction 触发
- 新上下文启动
- `SessionStart(compact)` 立刻注入恢复内容

## 2. `UserPromptSubmit`

`handle_user_prompt_submit()` 会做几件事：

1. 调 `measure.quality_cache(...)`
2. 从输出中提取 system message
3. 调 `measure.codex_prompt_hints(...)`
4. 额外叠加 `verbosity steer`
5. 最终把这些内容通过 `additionalContext` 注回 Codex

这部分不是“恢复旧上下文”，而是 **质量提示、prompt hint、简洁性导向**。

## 3. `Stop`

默认安装的一定有 `Stop` hook：

- `measure.py session-end-flush --trigger stop --quiet --defer`

它承担的是：

1. continuity checkpointing
2. dashboard refresh / session flush

这也是为什么在 Codex 路径里，很多 continuity 能力最终是依靠 `Stop` 时机落盘，而不是 `PostCompact`。

## 4. `PostToolUse`

是否启用取决于 profile。

启用后主要接：

1. `context_intel.py`
2. `archive_result.py`

但当前实现只匹配 `Bash`。

所以它不是一个“所有工具统一 archive”的绝对全覆盖层，而是一个以热路径和 shell/tool output 为重点的采样面。

## 5. `SubagentStart / SubagentStop`

启用后会写一个本地 JSONL 计数日志，用于：

- open subagent count
- sprawl nudge

它是一个本地会话期提醒机制，不是长期记忆。

## 6. Compact 相关的真实边界

这一块是本页需要纠偏最大的地方。

上游文档的旧口径写的是：

- Claude：`PreCompact + PostCompact`
- Codex：`compact prompt guidance + Stop checkpoints`

如果只看 `codex-install` 路径，这个说法大体成立。

但如果看当前仓库里真正提交出来的 `Codex marketplace mirror plugin`，则事实已经更强：

1. 有真实的 `PreCompact` capture
2. 有 `SessionStart(compact matcher)` restore
3. 有 `Stop` capture / flush
4. 有 `PostCompact`，但该事件只做 quality cache re-warm，不做恢复

因此，当前最准确的表述不是：

- “Codex 下完全没有 `PreCompact` / `PostCompact` 生命周期”

而是：

- `Codex` 当前存在一条 **`PreCompact capture -> SessionStart(compact) restore -> PostCompact quality refresh`** 的连续链路
- 但它**不是** Claude 语义下那种 “`PreCompact -> PostCompact` 对称恢复”

所以在 `Codex` 下它依然没有真正的：

1. compaction 前完整捕获
2. 由 `PostCompact` 自身完成的对称恢复

更准确地说，它现在分成两种能力等级：

### 保守等级：`codex-install` / bridge 路径

通过：

1. managed compact prompt
2. Stop 时落 checkpoint
3. SessionStart 条件恢复

来逼近 continuity。

### 更强等级：marketplace mirror plugin 路径

通过：

1. `PreCompact` 时生成 compact guidance 并 capture checkpoint
2. `SessionStart(source=compact)` 立刻 restore full checkpoint
3. `PostCompact` 做 quality cache re-warm

来提供比文档描述更强的 compaction continuity。

这和你关心的“场景 1 严格精确恢复”之间有一个重要距离：

- 它是有帮助的 continuity enhancer
- 它比“只靠 Stop checkpoint”更强
- 但它仍不是一个可以严肃宣称“精确恢复”的强闭环系统

根本原因有三点：

1. restore 注入的是 checkpoint/snapshot，不是原始上下文的可逆重建
2. `PostCompact` 本身不承担恢复
3. 文档、安装器、插件镜像三者目前仍然口径不统一

## 7. 某些更激进的能力在 Codex 下明确不可用

上游自己列出的 Codex gap 包括：

1. `Read updatedInput` 不支持，所以不能做 silent read rewrite
2. Bash 输入不能 silent rewrite
3. 没有 `StopFailure`
4. skill telemetry 不完整

因此，像 `#79` 那类 first-read skeleton / substitution 风险，虽然说明 upstream 曾经尝试过更激进的上下文裁剪设计，但 **当前 Codex 路径并不具备同等静默改写能力**。

换句话说：

- `Codex` 版本的风险主要不是“它在你不知道时静默重写所有读取”
- 而是“它虽然已经有了更强的 compact continuity wiring，但仍没有形成文档层面清晰承诺的、稳定统一的恢复语义”

## 8. 为什么现在值得优先试 marketplace mirror plugin

这次补查之后，部署优先级应该调整。

此前如果只看 `codex-install`，判断会是：

- 它只有较保守的 `Stop + SessionStart` continuity
- 对场景 1 的直接价值有限

但现在确认 marketplace mirror plugin 已经具备：

1. `PreCompact` capture
2. `SessionStart(compact)` immediate restore
3. Codex-specific async stripping
4. `SessionStart` JSON wrapping等兼容性修复已经在 `#81`、`#83` 收敛

因此，若要验证 `Token Optimizer` 在 `Codex` 下到底有没有比文档更强的实际价值，**优先尝试 marketplace mirror plugin 路径比优先尝试 `codex-install` 降级路径更有意义**。

当前更合理的实验顺序应是：

1. 先用 marketplace plugin 安装
2. 重点验证 compaction 后是否触发 `SessionStart(source=compact)` restore
3. 再单独判断是否还需要额外运行 `codex-install`
4. 若两条路径叠加会造成重复 hook / 重复注入，再决定是否只保留其中一条

这里的关键不是“它一定比别的方案好”，而是：

- 它现在终于值得做一次 **面向真实 compaction continuity 的实机验证**
- 这次验证对象应当是 **marketplace mirror plugin 的真实行为**
- 不是再沿用旧印象，只测 `codex-install` 的保守模式

## Hook Profiles

当前源码下 profile 的真实语义更接近下面这样：

### `quiet`

- `Stop` only

### `balanced`

- `Stop`
- `SessionStart`
- `UserPromptSubmit`
- `SubagentStart`
- `SubagentStop`

### `telemetry`

- `Stop`
- `PostToolUse`

### `aggressive`

- `Stop`
- `SessionStart`
- `UserPromptSubmit`
- `PostToolUse`
- `SubagentStart`
- `SubagentStop`

另一个关键点：

- `Bash compression` 仍然是 **显式 opt-in**
- 即便是 `aggressive`，当前也不会默认开启 `PreToolUse Bash` 压缩

原因是上游自己承认：

- Codex 现在不能真正无声重写工具输入

所以这一块被保留为实验性的“可见 hook”。

## 安装侵入面

## 默认写入面

默认 `codex-install` 是 **global install**，也就是写：

1. `~/.codex/hooks.json`
2. `~/.codex/config.toml`
3. `~/.codex/token-optimizer/codex-compact-prompt.md`

如果启用 status line，还会改：

4. `~/.codex/config.toml` 中的 `[tui]`

可以用 `--project "$PWD"` 做项目局部安装，但官方文档主路径和默认值都指向全局。

## `hooks.json` 的改写方式

这部分相对克制，不是粗暴覆盖。

安装器会：

1. 读取现有 `hooks.json`
2. 只移除自己能识别出的 Token Optimizer managed hook groups
3. 把新的 managed groups merge 进去
4. 保留其他工具或用户自己的 hook groups

它通过 `token-optimizer/scripts` 这个 marker 判断“哪些 group 属于自己”。

所以它的 `hooks.json` 行为是：

- **additive merge**
- **scoped replace**
- 不是整个文件接管

## `config.toml` 的改写方式

它会注入两个 managed block 体系：

### compact prompt block

写入：

- `# BEGIN token-optimizer compact prompt`
- `experimental_compact_prompt_file = ".../codex-compact-prompt.md"`
- `# END token-optimizer compact prompt`

如果用户已有：

- `experimental_compact_prompt_file`
- `compact_prompt`

则默认报错，`--force` 才会把旧行 comment out，而不是直接删掉。

### status line block

只有 `--enable-status-line` 才会写。

写入：

- `# BEGIN token-optimizer status line`
- `status_line = [...]`
- `terminal_title = [...]`
- `# END token-optimizer status line`

若已有原生 `[tui].status_line` / `terminal_title`，默认也不会强行覆盖，只有 `--force` 才会 comment out 原值。

## 本地数据落盘面

这是官方 `Codex` 文档里最容易被低估的一块。

真实落盘至少分三层：

### 1. runtime config / checkpoint 层

在 `~/.codex/token-optimizer/` 下：

1. `checkpoints/`
2. `checkpoint-events.jsonl`
3. `quality-cache*.json`
4. `config.json`
5. `codex-compact-prompt.md`

### 2. plugin data / snapshot 层

如果 plugin data 解析成功，主数据面会走：

- `~/.codex/plugins/data/token-optimizer-<marketplace>/data/`

里面会有：

1. `trends.db`
2. `session-store/`
3. `tool-archive/`
4. `dashboard.html`
5. `dashboard-server.py`
6. `logs/`
7. `daemon-token`
8. `dashboard-host`
9. 其他 snapshot / cache / marker 文件

### 3. legacy fallback 层

若 plugin data 没解析到，则 fallback 到：

- `~/.codex/_backups/token-optimizer/`

## 侵入性定级

如果按你最近对 `lean-ctx`、`context-mode` 的标准来评估：

### 它不是低侵入

因为它确实会：

1. 改 `hooks.json`
2. 改 `config.toml`
3. 写本地数据库和状态目录
4. 可选安装常驻 dashboard 服务

### 但它也不是 owner-style 接管

它不会：

1. 替换 `codex` 可执行入口
2. 改 shell rc
3. 改 `AGENTS.md`
4. 接管整个 `~/.codex` 目录结构
5. 粗暴覆盖整份配置

所以它更准确的级别是：

- **中等侵入**
- **本地运行面注入**
- **不是环境接管器**

这点和 `lean-ctx` 的 owner-style 初始化有明显区别。

## 卸载、回滚与清理

## 标准卸载命令

Codex 侧官方卸载命令：

```bash
TOKEN_OPTIMIZER_RUNTIME=codex \
python3 skills/token-optimizer/scripts/measure.py codex-install --uninstall
```

它会做这些事：

1. 从 `~/.codex/hooks.json` 删除 Token Optimizer 自己的 hook groups
2. 从 `~/.codex/config.toml` 删除 compact prompt managed block
3. 删除 `~/.codex/token-optimizer/codex-compact-prompt.md`
4. 删除 status line managed block
5. 恢复它在 `--force` 时 comment out 的 `compact_prompt` / `status_line` / `terminal_title` 原行
6. 若 `[tui]` 是它创建且已空，可顺手删空表头

这个卸载路径整体上是干净、可逆、边界明确的。

## daemon 卸载

如果安装过 dashboard daemon，还需要：

```bash
TOKEN_OPTIMIZER_RUNTIME=codex \
python3 skills/token-optimizer/scripts/measure.py setup-daemon --uninstall
```

在 Linux 上，这会处理：

1. `systemctl --user disable --now token-optimizer-codex-dashboard.service`
2. 删除 user unit
3. 删除生成的 launcher / daemon script 等产物
4. 写 sticky opt-out，防止后续自愈逻辑把 daemon 又拉起来

注意一个细节：

- Codex runtime 下的 daemon ensure 逻辑不像 Claude 那样默认自装，所以 “sticky opt-out” 在 Codex 上不是最核心问题，但卸载流程仍会写这个状态位。

## plugin 本体移除

还要再做一步：

```bash
codex plugin marketplace remove alexgreensh/token-optimizer
```

或在 `/plugins` 里移除 plugin。

## 官方文档遗漏的清理盲区

`docs/codex.md` 里写：

```bash
rm -rf ~/.codex/token-optimizer
```

但按当前源码，这个只清掉了 runtime config / checkpoint 层，不足以清理全部本地数据。

更完整的 full wipe 还应检查：

1. `~/.codex/plugins/data/token-optimizer-*/data/`
2. `~/.codex/_backups/token-optimizer/`
3. `~/.config/systemd/user/token-optimizer-codex-dashboard.service`
4. daemon 相关 launcher / logs / token 文件

所以如果未来真要在本机试装再彻底回滚，比较可靠的顺序应是：

1. `codex-install --uninstall`
2. `setup-daemon --uninstall`
3. plugin remove
4. 删除 `~/.codex/token-optimizer/`
5. 删除 `~/.codex/plugins/data/token-optimizer-*/data/`
6. 若存在，再删 `~/.codex/_backups/token-optimizer/`
7. 最后检查 `systemctl --user status token-optimizer-codex-dashboard.service`

## dashboard daemon / “backend” 到底是什么

## 它不是中心化 memory service

这个项目确实有一个 “后端” 感很强的东西，但从代码看，那个东西本质上是：

- **本地 dashboard HTTP server**

不是：

- 多客户端共享 memory API
- 统一写入入口
- 中心化 retrieval service

## 它实际做什么

执行：

```bash
TOKEN_OPTIMIZER_RUNTIME=codex \
python3 skills/token-optimizer/scripts/measure.py setup-daemon
```

会在当前 runtime 的本地 snapshot dir 下生成：

1. `dashboard-server.py`
2. `logs/`
3. `daemon-token`
4. `dashboard-host`
5. Linux 下还会有 `codex-dashboard-launcher.sh`

然后用：

1. `systemd --user`
2. `launchd`
3. `Task Scheduler`

启动一个本地 HTTP server，默认端口：

- `Codex = 24843`

URL：

- `http://localhost:24843/token-optimizer`

## 它的安全模型说明了它的设计意图

当前实现说明它是为 **本机单用户 dashboard** 设计的：

1. 默认 bind `127.0.0.1` / `localhost`
2. 允许 `0.0.0.0`，但这是显式 network mode
3. `token endpoint` 在 network mode 下仍然限制 loopback
4. 通过本地 `daemon-token` + `Host/Origin` 检查保护 mutation 行为

这套设计很像：

- “让你从浏览器方便看本机 dashboard”

而不是：

- “搭一个正式可共享的中心化服务给很多 Codex client 写入”

## NAS 中心化部署可行性

## 可以做的事

如果只问“能不能放在 NAS 主机上跑”，答案是：

- **可以，但意义有限**

你可以在 NAS 或家里常开 Linux 主机上：

1. 自己装一套 `Codex + Token Optimizer`
2. 让它处理那台机器自己的本地 `Codex` session
3. 用 `TOKEN_OPTIMIZER_DASHBOARD_HOST=0.0.0.0` 暴露 dashboard
4. 通过局域网 / VPN / Tailscale 从别处浏览它

这成立。

## 不能等价推出的事

但这 **不等于**：

- 多台笔记本 / 公司机器 / 家里机器上的 Codex 都共享同一个 Token Optimizer 后端

因为它没有内建以下能力：

1. 多客户端写入协议
2. 统一远端 session ingest API
3. 多租户或多机器身份边界
4. 跨主机 SQLite 并发协调
5. 基于远端存储的统一 checkpoint / retrieval contract

## 为什么不适合做共享中心

核心原因有五个：

### 1. hooks 在本地执行

它的关键逻辑都假设：

- 当前会话所在机器本地触发 hook
- 当前机器本地可读 transcript / path / runtime home

### 2. 数据库是本地 SQLite / WAL

`session-store/<session>.db`、`trends.db` 都是本地小型 SQLite store。

这不天然适合：

- 多机共享同一路径
- NFS / SMB 并发写
- 一个 NAS 目录被多台 Codex 同时拿来当主状态库

### 3. runtime home 假设很强

它围绕：

- `CODEX_HOME`
- `~/.codex`
- plugin cache
- plugin data
- local service manager

构建。

这是一种“每个 runtime 自己有本地家目录”的架构，不是“所有 client 连远端服务”的架构。

### 4. daemon 只是展示层

daemon 服务的不是统一 session bus，而是：

- 该 runtime 的本地 `dashboard.html`
- 少量本地管理接口

### 5. 上游安全声明本身也把它定义成 single-user workstation 工具

`SECURITY.md` 直接写了：

- `Single-user. Designed for individual developer workstations, not multi-tenant servers.`

这句话已经很接近上游的自我定位结论。

## 对 NAS 的正确理解

如果你非要把它和 `NAS` 联系起来，比较合理的方式只有两类：

### 1. 把 NAS 当宿主机

在 NAS 上单独跑一份 Token Optimizer，只服务那台宿主机自己的 Codex 工作。

### 2. 把 NAS 当展示入口

通过反向代理 / VPN / Tailscale 暴露 dashboard 页面给远端浏览。

但这两种都不是：

- “中心化 memory backend for all Codex environments”

## 对场景 1 的真实价值判断

如果只看你最关心的 `场景 1`：

- 会话逼近压缩边界时，压缩后状态尽量不失真
- agent 尽量连续工作
- 不要因为额外压缩层带来噪音、错位、假记忆、误摘要
- token 节省只是附带收益

那么 `Token Optimizer` 的位置应当这样看：

### 它的优点

1. 它在 `Codex` 下确实有 session continuity / checkpoint / prompt guidance。
2. 它不是单纯“压缩 shell 输出”，而是也做质量审计、趋势、cost、checkpoint。
3. 它的安装与卸载边界比很多项目更清晰。
4. 它对 `Codex` 是真适配，不是只在 README 里顺带提一句。

### 它的局限

1. `Codex` 下没有真正的 `PreCompact + PostCompact` 对称闭环。
2. 它更偏 “continuity + coaching + audit” 的组合，而不是专门为“高保真压缩恢复”单点极致优化。
3. 它的 daemon/backend 不是多端共享后端。
4. 许可证对真实采用是硬约束。

所以最终判断是：

- **它值得作为单机 Codex continuity 研究对象**
- **但它不是你想找的中心化多端记忆底座**
- **它也不是当前最理想的“严格场景 1 完美解”**

## 与之前几个项目的关系

如果把它放回前面的比较框架里：

### 相比 `lean-ctx`

1. 它对 `~/.codex` 的接管感明显更弱。
2. 它不会 owner-style 初始化整套环境。
3. 但它在 Codex 下也没有 lean-ctx proxy 那种更主动的中间层能力。

### 相比 `context-mode`

1. 它不是 plugin-only MCP + hooks 组合那种低接触路径。
2. 它会显式改本地 hooks/config。
3. 但它的卸载和本地数据面比很多实验项目更可解释。

### 相比 `agentmemory`

1. 它更轻。
2. 它更接近单机本地优化器。
3. 但它不具备 `agentmemory` 那种“真 memory platform / shared system”方向的形态。

## 对当前环境的建议

基于当前这轮尽调，结论非常明确：

1. **不建议把 Token Optimizer 当成 NAS 上统一部署、供多台 Codex 共用的中心化后端。**
2. 如果未来只想在某一台本地 Codex 机器上做 continuity / quality / dashboard 研究，它仍然值得做一次隔离测试。
3. 但在进入任何实装前，必须先决定是否接受 `PolyForm Noncommercial` 许可证边界。
4. 如果目标仍然是 “多端统一长期记忆 / 可共享知识后端 / 会话交接系统”，优先级应继续放在别的项目或组合上，而不是把 `Token Optimizer` 勉强改造成中心化服务。
5. 如果未来真的试装，建议在隔离 `CODEX_HOME` 下进行，并按本页列出的 full wipe 范围验证卸载，不要只删 `~/.codex/token-optimizer/`。

## 最终结论

一句话总结：

`Token Optimizer` 在 `Codex` 下是一套 **本地连续性增强与上下文质量审计工具**，不是一个 **可优雅中心化部署到 NAS 并让多台 Codex 共用的后端系统**。

如果你的问题是：

- “它能不能帮单机 Codex 做 continuity / checkpoint / dashboard？”

答案是：

- **能，而且实现并不敷衍。**

如果你的问题是：

- “它能不能作为我们未来多端 Codex 共享的统一记忆后端？”

答案是：

- **不合适，架构方向就不是这一类。**
