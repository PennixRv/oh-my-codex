---
title: "Token Optimizer 在当前 Codex 环境中的已验证部署形态与保真优先配置 2026-07-07"
tags: ["token-optimizer", "codex", "deployment", "configuration", "continuity", "context", "environment", "playbook"]
created: 2026-07-07T07:30:00.000Z
updated: 2026-07-07T07:48:00.000Z
sources:
  - "https://github.com/alexgreensh/token-optimizer"
  - "https://github.com/alexgreensh/token-optimizer/blob/main/docs/codex.md"
  - "https://github.com/alexgreensh/token-optimizer/blob/main/docs/uninstall.md"
links:
  - "token-optimizer-codex-deployment-and-centralization-research-2026-07-06.md"
  - "scenario-1-context-compaction-restore-open-source-research-2026-07-06.md"
  - "omx-current-install-uninstall-shape-and-reinstall-flow-2026-07-06.md"
category: environment
confidence: high
schemaVersion: 1
---

# Token Optimizer 在当前 Codex 环境中的已验证部署形态与保真优先配置 2026-07-07

## Purpose

这页只记录两类信息：

1. **当前机器上已经实机证明的 `token-optimizer` 部署与行为**
2. **下一轮准备执行的、以“更稳更保真”为目标的配置方案**

这页的用途不是做泛泛研究，而是作为后续脚本化和跨设备部署的事实基线。

## Recommendation Snapshot

当前最稳妥的方向已经收敛：

1. **保持 plugin hooks 模式为唯一控制面**
2. **不要在现有 plugin 模式上再叠一层 `measure.py codex-install`**
3. **补装 compact prompt**
4. **关闭 `first_read_active`，保留 `first_read_shadow`**
5. **关闭 verbosity steer**
6. **将 dashboard/systemd 视为可选旁路，不作为场景 1 成败前提**

## 2026-07-07 落地结果

本页中的保真优先方案已在当前机器上执行完成，当前已确认落盘的变更如下：

1. `~/.codex/.env`
   - 已写入：
   - `TOKEN_OPTIMIZER_RUNTIME=codex`
   - `TOKEN_OPTIMIZER_STAR_ASK=0`
   - `TOKEN_OPTIMIZER_VERBOSITY_STEER=0`
   - `TOKEN_OPTIMIZER_CHECKPOINT_RETENTION_DAYS=14`
   - `TOKEN_OPTIMIZER_CHECKPOINT_RETENTION_MAX=100`
   - `TOKEN_OPTIMIZER_QUALITY_CACHE_RETENTION_DAYS=14`
2. `measure.py codex-compact-prompt --install`
   - 已成功执行
   - 产物路径：
   - `~/.codex/token-optimizer/codex-compact-prompt.md`
3. `measure.py v5 disable first_read_active`
   - 已成功执行
   - 当前 `~/.codex/token-optimizer/config.json` 中已出现：
   - `v5_first_read_active = false`

当前没有执行 `measure.py codex-install`，因此本机仍保持：

1. plugin hooks 为唯一控制面
2. 不新增全局 Token Optimizer hooks 到 `~/.codex/hooks.json`

## Evidence Boundary

本页结论基于 `2026-07-07` 的 live inspection，而不是只看文档推断。已核验的主要证据面如下：

1. `~/.codex/.env`
2. `~/.codex/config.toml`
3. `~/.codex/token-optimizer/config.json`
4. `~/.codex/plugins/cache/alexgreensh-token-optimizer/token-optimizer/5.11.37/hooks/hooks.json`
5. `measure.py v5 status`
6. `measure.py codex-doctor --project /home/penn/devel --json`
7. `systemctl --user show/cat token-optimizer-codex-dashboard.service`

需要明确区分：

1. **上游文档怎么写**
2. **当前本机实际装成了什么**
3. **下一轮准备执行什么**

这三者不能混写。

## 当前已验证安装形态

| 项 | 当前状态 |
| --- | --- |
| Codex 集成方式 | marketplace plugin + plugin-scoped hooks |
| Plugin id | `token-optimizer@alexgreensh-token-optimizer` |
| Plugin version | `5.11.37` |
| Plugin cache root | `~/.codex/plugins/cache/alexgreensh-token-optimizer/token-optimizer/5.11.37` |
| Runtime env file | `~/.codex/.env` |
| Runtime data dir | `~/.codex/token-optimizer/` |
| 当前 `.env` | `TOKEN_OPTIMIZER_RUNTIME=codex` + `TOKEN_OPTIMIZER_STAR_ASK=0` |
| 当前 runtime config | `enterprise_consent_shown=true`, `v5_welcome_shown=true`, `autoupdate_nudge_shown=true`, `daemon_disabled=false` |
| 全局 `~/.codex/hooks.json` | **没有** Token Optimizer hooks |
| `~/.codex/config.toml` | 已启用 plugin，并记录了 `token-optimizer@alexgreensh-token-optimizer:hooks/hooks.json:*` 的 trusted hashes |
| systemd 用户服务 | `token-optimizer-codex-dashboard.service`，当前 `enabled` 且 `running` |

这里最关键的事实是：

1. 当前环境不是 `codex-install` 写全局 hooks 的模式。
2. 当前环境是 **plugin hooks 直接生效** 的模式。
3. 因此不能把 `codex-doctor` 中 “Global hooks 缺失” 误判为“token-optimizer 没装好”。

## 当前已验证 hooks 行为

当前 plugin cache 中的 `hooks/hooks.json` 已确认包含这些关键事件：

1. `PreCompact`
2. `SessionStart`
3. `PostCompact`
4. `Stop`
5. `UserPromptSubmit`
6. `PreToolUse`
7. `PostToolUse`

其中和场景 1 最相关的链路已经明确是：

1. `PreCompact` 执行 `dynamic-compact-instructions`
2. `PreCompact` 执行 `compact-capture --trigger auto`
3. `SessionStart` 在 `matcher: "compact"` 时执行 `compact-restore --compact`
4. `PostCompact` 只做 `quality-cache --force`
5. `Stop` 时做 `compact-capture --trigger stop` 和 `session-end-flush`

因此当前最准确的理解是：

1. **恢复不是由 `PostCompact` 完成的**
2. **恢复发生在 compaction 后进入的新上下文 `SessionStart(compact)`**
3. `PostCompact` 更像质量缓存回暖，不是恢复入口

这对后续脚本化很重要，因为如果以后做自检，不能只盯 `PostCompact`。

## 当前已验证的诊断结论

### 1. `v5 status` 在 plugin 模式下会低报部分特性

当前实测 `measure.py v5 status` 的输出是：

1. `quality_nudges` 显示 `off (codex opt-in)`
2. `loop_detection` 显示 `off (codex opt-in)`
3. `first_read_shadow` 显示 `ON`
4. `first_read_active` 显示 `ON`

但这个输出不能被直接理解成“plugin hooks 下完全没有 quality nudges / loop detection”，因为当前 `v5 status` 的 Codex 分支仍主要看 `cwd/.codex/hooks.json`，而不是 plugin cache hooks。

结论：

1. `v5 status` 对 `first_read_*` 的判断可直接参考
2. `v5 status` 对部分 plugin-hook 特性的结论要保留怀疑

### 2. `codex-doctor` 里有一个是真问题，一个是口径问题

当前 `codex-doctor --project /home/penn/devel --json` 给出的关键信息：

1. `Compact prompt` = `FAIL`
2. `Global hooks` = `WARN`

这两个不能等价看待。

#### `Compact prompt = FAIL`

这是真正需要处理的项。它说明：

1. 当前还没有安装 token-optimizer 的 compact prompt block
2. 这是当前“保真优先”路径里最值得补齐的一个缺口

#### `Global hooks = WARN`

这在当前机器上更多是 **诊断口径偏差**，因为：

1. 当前环境确实没有把 Token Optimizer 写进 `~/.codex/hooks.json`
2. 但 plugin-scoped hooks 已经存在并且被 Codex 信任

所以这个 `WARN` 不应推动我们去补跑 `codex-install`。

## 当前不应做的事

### 1. 不要在当前机器上叠加 `measure.py codex-install`

原因很直接：

1. 当前已经有 plugin hooks 控制面
2. 再跑 `codex-install` 会引入第二套全局 hooks 控制面
3. 后续排错时会分不清到底是哪套 hooks 在生效

对于后续脚本化，这条应当视为硬约束：

- **plugin mode 和 `codex-install` 模式不能混成双轨常态**

### 2. 不要继续保留 `first_read_active`

当前目标不是极限省 token，而是 compaction 边界附近的连续性和保真。

`first_read_active` 的问题在于：

1. 它会在第一次读代码时优先给结构 skeleton
2. 这会引入“首读不是完整原文”的风险
3. 对“更稳更保真”的目标不利

保留 `first_read_shadow` 没问题，因为它只是测量，不直接替换返回内容。

### 3. 不要把 dashboard/service 当成场景 1 的核心依赖

当前用户服务确实在运行，但它的职责是 dashboard/daemon 侧辅助，不是 compaction restore 的核心闭环。

已验证的服务信息：

1. unit 名称：`token-optimizer-codex-dashboard.service`
2. unit 路径：`~/.config/systemd/user/token-optimizer-codex-dashboard.service`
3. `ExecStart`：`~/.codex/_backups/token-optimizer/codex-dashboard-launcher.sh`
4. 日志路径：`~/.codex/_backups/token-optimizer/logs/stdout.log` 和 `stderr.log`

这意味着后续脚本化时应把它归类为：

1. **可选辅助组件**
2. **不是主配置闭环的一部分**

## 本轮已执行的保真优先配置

以下动作已经在当前机器执行完成。

### A. 保持 plugin 模式单控制面

不执行：

```bash
TOKEN_OPTIMIZER_RUNTIME=codex python3 "$MEASURE" codex-install
```

### B. 安装 compact prompt

执行：

```bash
MEASURE="/home/penn/.codex/plugins/cache/alexgreensh-token-optimizer/token-optimizer/5.11.37/skills/token-optimizer/scripts/measure.py"
TOKEN_OPTIMIZER_RUNTIME=codex python3 "$MEASURE" codex-compact-prompt --install
```

目标：

1. 让 `codex-doctor` 中的 `Compact prompt` 从 `FAIL` 变成 `OK`
2. 补齐 Codex compaction 前后的 compact guidance

### C. 关闭 `first_read_active`

执行：

```bash
MEASURE="/home/penn/.codex/plugins/cache/alexgreensh-token-optimizer/token-optimizer/5.11.37/skills/token-optimizer/scripts/measure.py"
TOKEN_OPTIMIZER_RUNTIME=codex python3 "$MEASURE" v5 disable first_read_active
```

目标：

1. 保留 `first_read_shadow`
2. 禁止首读 skeleton 直接替代完整代码返回

### D. 将 `~/.codex/.env` 收敛到保真优先值

目标文件内容：

```bash
TOKEN_OPTIMIZER_RUNTIME=codex
TOKEN_OPTIMIZER_STAR_ASK=0
TOKEN_OPTIMIZER_VERBOSITY_STEER=0
TOKEN_OPTIMIZER_CHECKPOINT_RETENTION_DAYS=14
TOKEN_OPTIMIZER_CHECKPOINT_RETENTION_MAX=100
TOKEN_OPTIMIZER_QUALITY_CACHE_RETENTION_DAYS=14
```

这些值的意图如下：

1. `TOKEN_OPTIMIZER_RUNTIME=codex`
   - 保证 hooks/runtime 走 Codex 路径
2. `TOKEN_OPTIMIZER_STAR_ASK=0`
   - 保持当前行为，不额外引入交互噪音
3. `TOKEN_OPTIMIZER_VERBOSITY_STEER=0`
   - 不让“更简洁输出导向”去干扰保真优先目标
4. `TOKEN_OPTIMIZER_CHECKPOINT_RETENTION_*`
   - 让 checkpoint 有足够留存窗口，方便恢复和回查
5. `TOKEN_OPTIMIZER_QUALITY_CACHE_RETENTION_DAYS=14`
   - 保留质量缓存一段时间，减少频繁波动

## 执行后的验证标准

配置执行完成后，应至少跑这组验证：

```bash
MEASURE="/home/penn/.codex/plugins/cache/alexgreensh-token-optimizer/token-optimizer/5.11.37/skills/token-optimizer/scripts/measure.py"
TOKEN_OPTIMIZER_RUNTIME=codex python3 "$MEASURE" v5 status
TOKEN_OPTIMIZER_RUNTIME=codex python3 "$MEASURE" codex-doctor --project /home/penn/devel --json
rg -n "compact|token-optimizer@alexgreensh-token-optimizer|alexgreensh-token-optimizer" ~/.codex/config.toml
```

预期解释：

1. `first_read_active` 应变为 `OFF`
2. `first_read_shadow` 应保持 `ON`
3. `Compact prompt` 应变为 `OK`
4. `Global hooks` 仍可能继续 `WARN`
5. 只要 plugin hooks 和 trusted hashes 仍在，这个 `WARN` 不代表安装失败

最后还需要一次真实 compaction 事件来做行为级验证：

1. 看 compaction 后的新上下文是否出现 checkpoint/restore 相关提示
2. 看连续工作时是否比当前更少失真

## 2026-07-07 实际验证结果

这轮落地后，已实机确认：

1. `measure.py v5 status`
   - `first_read_shadow = ON`
   - `first_read_active = off (config)`
2. `measure.py codex-doctor --project /home/penn/devel --json`
   - `Compact prompt = OK`
   - 路径：`~/.codex/token-optimizer/codex-compact-prompt.md`
3. `~/.codex/config.toml`
   - 新增 managed block：
   - `# BEGIN token-optimizer compact prompt`
   - `experimental_compact_prompt_file = "/home/penn/.codex/token-optimizer/codex-compact-prompt.md"`
   - `# END token-optimizer compact prompt`
4. `Global hooks = WARN` 仍然存在
   - 这是当前 plugin-only 模式下的预期诊断口径
   - 不应因此补跑 `codex-install`

这一轮仍未完成的，只剩行为级验证：

1. 在真实 compaction 之后观察恢复质量
2. 判断新的 compact prompt + 关闭 `first_read_active` 是否确实改善连续工作保真

## 脚本化前的拆分建议

如果后续要把这套逻辑脚本化，建议至少拆成三层：

### 1. 安装层

负责：

1. marketplace 注册
2. plugin 安装
3. plugin enabled 校验

### 2. 配置层

负责：

1. `~/.codex/.env`
2. compact prompt 安装
3. `v5` 开关收敛

### 3. 可选辅助层

负责：

1. dashboard/systemd
2. 日志轮转
3. daemon 清理

这样才能避免把“保真闭环必须项”和“可视化辅助项”混在一段安装脚本里。

## Current Bottom Line

截至 `2026-07-07`，当前最合理的执行策略已经可以明确写死：

1. **保留 plugin-only 路径**
2. **不要补跑 `codex-install`**
3. **先补 compact prompt**
4. **关闭 `first_read_active`**
5. **关闭 verbosity steer**
6. **把 dashboard/service 视为可选附属面**

这就是当前这台机器上，`token-optimizer` 面向“场景 1，稳定优先、保真优先”时最值得执行的一组配置。

## Related Pages

- [[token-optimizer-codex-deployment-and-centralization-research-2026-07-06]]
- [[scenario-1-context-compaction-restore-open-source-research-2026-07-06]]
