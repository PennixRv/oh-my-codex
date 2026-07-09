---
title: "lean-ctx 在当前 Codex/OMX 环境中的部署方式与影响研究 2026-07-06"
tags: ["lean-ctx", "codex", "deployment", "proxy", "hooks", "AGENTS", "environment", "due-diligence"]
created: 2026-07-06T09:40:00.000Z
updated: 2026-07-06T12:35:00.000Z
sources:
  - "https://github.com/yvgude/lean-ctx"
  - "https://github.com/yvgude/lean-ctx/blob/main/docs/reference/01-setup-and-onboarding.md"
  - "https://github.com/yvgude/lean-ctx/blob/main/docs/guides/codex-cli.md"
  - "https://github.com/yvgude/lean-ctx/blob/main/docs/reference/05-advanced.md"
  - "https://github.com/yvgude/lean-ctx/blob/main/docs/reference/06-lifecycle.md"
  - "https://github.com/yvgude/lean-ctx/blob/main/docs/integrations/installation-matrix.md"
links: ["context-mode-codex-deployment-and-uninstall-due-diligence-2026-07-06.md", "scenario-1-context-compaction-restore-open-source-research-2026-07-06.md", "environment-agent-role-intrusion-observation-2026-07-06.md", "omx-current-install-uninstall-shape-and-reinstall-flow-2026-07-06.md"]
category: reference
confidence: high
schemaVersion: 1
---

# lean-ctx 在当前 Codex/OMX 环境中的部署方式与影响研究 2026-07-06

## Scope

这页只回答 deployment / uninstall 相关问题：

1. `lean-ctx` 到底有哪几种部署方式。
2. 它们分别会改动什么。
3. 放到当前这台已经深度定制过的 `Codex + OMX + AOE` 环境里，哪一种最贴合，哪一种不够优雅。
4. 如果未来要做 home 下的 Codex 环境部署/卸载脚本，这一层应该如何拆分职责。

本页不是要现在落地部署，也不是评估 `lean-ctx` 的算法优劣，而是把 deployment surface 和 impact surface 先做清楚。

## 结论先行

可以先把结论说清楚：

1. `lean-ctx` 的“部署”不是一件事，而是三层：
   - **binary install 层**：把 `lean-ctx` 二进制装到机器上。
   - **Codex wiring 层**：把 `lean-ctx` 接到 `~/.codex/config.toml`、`hooks.json`、规则/说明文件上。
   - **proxy 层**：把模型请求本身也放到 `lean-ctx proxy` 前面压缩。
2. 在修正一个关键前提之后，本页结论需要更新：
   - 当前 `cch` **不是第三方自实现的 OpenAI-compatible API**。
   - 当前 `cch` 更准确地说是：**一个指向 OpenAI 的中转入口，只是通过自定义 `base_url + key` 暴露出来**。
   - 这意味着 `lean-ctx proxy` 在协议层面对当前环境是**可行的**，不再需要把它当成“很可能因为兼容层差异而不适合首选”的路径。
3. 对当前机器来说，如果目标是**尽可能发挥 lean-ctx 在 Codex 中的能力**，最值得考虑的不是 `onboard`，也不是“盲跑 `proxy enable` 默认接线”，而是：
   - **targeted Codex-only wiring**
   - **rules_injection=dedicated**
   - **保留 `model_provider = "cch"` 的前提下，把 `cch` 的 `base_url` 改指向本地 lean-ctx proxy**
   - **再让 lean-ctx proxy 的 `openai_upstream` 指回真实的 `cch` 中转地址**
4. `lean-ctx` 比 `context-mode` 更适合当前环境做“可回滚试部署”，因为它的 uninstall 明显更强调只删自己的块、自己的文件、自己的 MCP entry，而不是把全局配置混成一个不容易回滚的状态。
5. 它也不是零侵入。尤其会触碰：
   - `~/.codex/config.toml`
   - `~/.codex/hooks.json`
   - `~/.codex/AGENTS.md`
   - `~/.codex/LEAN-CTX.md`
   - shell RC / shell hook
   - 可选的 proxy provider wiring
6. 对当前环境最不建议的路径是：
   - **`lean-ctx onboard` 直接全工具接入**
   - **`lean-ctx setup` 交互式一路默认到底**
   - **直接相信 `lean-ctx proxy enable` 自动写出的 Codex OpenAI rail 就能接住当前 `model_provider = "cch"` 的流量**

一句话版：

- **可以研究并试部署。**
- **但如果目标是最大化 Codex 场景下的 lean-ctx 能力，proxy 应当进入候选主路径。**
- **不要先让它改全工具，也不要直接相信默认 `proxy enable` 会自动接好当前 `cch` provider。**

## 上游项目快照

基于 `2026-07-06` 的上游快照，`lean-ctx` 当前状态大致如下：

1. 仓库：`yvgude/lean-ctx`
2. 许可证：`Apache-2.0`
3. GitHub stars：约 `3.1k`
4. 最新更新时间：`2026-07-06`
5. 项目定位：
   - local-first context engineering layer
   - 支持 `Codex`、`Claude Code`、`Cursor` 等多种 agent host
   - 同时覆盖 MCP、shell hooks、session memory、optional proxy

这意味着它不是只做“单会话 memory”的单点工具，而是更像一个完整的 context layer。

## 一个需要先纠正的本机前提

本页早先有一个关键前提需要纠正：

1. 之前曾把当前 `cch` 理解成“第三方 OpenAI-compatible 实现”。
2. 这个理解不准确。
3. 当前本机的 `cch` 更接近：
   - **OpenAI 官方接口的中转入口**
   - 只是通过你自己的 `base_url` 和认证路径来接入

这个修正非常重要，因为它直接改变对 `lean-ctx proxy` 的判断：

1. 如果 `cch` 是某个自实现兼容层，那么担心 `Responses API`、`WebSocket /responses`、header 透传、usage 统计、`reasoning` 字段、streaming 细节不完全一致，是合理的。
2. 但如果 `cch` 实际上只是 OpenAI 上游的中转入口，那么 `lean-ctx proxy` 面对的仍然是 **OpenAI 形状的真实上游**。
3. 在这种语义下，当前风险的重心就不再是：
   - “协议是否兼容”
4. 而变成：
   - “当前 Codex 里的 `cch` provider 要怎样接到本地 proxy 前面，才最优雅、最可回滚”

## 部署方式不是一条，而是多条

`lean-ctx` 的部署方式至少要按两维来理解：

1. **怎么把二进制装到机器上**
2. **怎么把它接到 Codex 上**

### 1. Binary install 层

上游 README 当前给出的安装通道有：

1. `curl -fsSL https://leanctx.com/install.sh | sh`
2. `brew tap yvgude/lean-ctx && brew install lean-ctx`
3. `npm install -g lean-ctx-bin`
4. `cargo install lean-ctx`
5. `pi install npm:pi-lean-ctx`

这里要特别注意：

- **这些命令只解决“机器上有没有 `lean-ctx` 可执行文件”**。
- **它们本身不等于已经接到了 Codex 上。**

也就是说，安装二进制和接入 `~/.codex` 是两步，不是一体。

### 2. Codex wiring 层

上游实际给了四种入口，但它们的侵入范围差异很大：

| 入口 | 典型命令 | 范围 | 主要改动面 | 适合度 |
| --- | --- | --- | --- | --- |
| 全工具零提示接入 | `lean-ctx onboard` | 机器上检测到的所有 AI 工具 | MCP config、shell hook、`~/.lean-ctx/`、可能的 rules/skills 续接 | 不适合当前机器作为首轮 |
| 全功能交互式向导 | `lean-ctx setup` | 全局 setup engine | shell hook、MCP、rules、skills、可选 proxy、可选 update scheduler | 不适合当前机器作为首轮 |
| 单 agent 定向接入 | `lean-ctx init --agent codex` | 只接 `Codex` | `~/.codex/config.toml`、`hooks.json`、`AGENTS.md` / `LEAN-CTX.md`、可选 skills | **最适合当前机器首轮研究** |
| 非交互 automation | `lean-ctx bootstrap` | 脚本 / CI | 用 setup engine 非交互修复/安装 | 适合未来脚本，不适合当前手工首装 |

这四条不是同义词。

当前环境如果要保持边界清晰，**唯一合理的第一候选是 `lean-ctx init --agent codex`**。

## Codex 上它到底会写哪些文件

这里必须以源码为准，不能只看 marketing README。

### 当前源码与文档能确认的 Codex 侧改动面

`lean-ctx` 当前对 `Codex` 的主要静态改动面是：

1. `~/.codex/config.toml`
   - upsert `[mcp_servers.lean-ctx]`
   - 确保 `features.hooks = true` 或兼容键开启
   - proxy 模式下还可能写入 provider/base_url 相关内容
2. `~/.codex/hooks.json`
   - upsert `SessionStart`
   - upsert `PreToolUse`
   - upsert若干 `observe` hooks
3. `~/.codex/LEAN-CTX.md`
   - 这是它自己的 full rules 文档
   - 明显是 lean-ctx-owned 文件
4. `~/.codex/AGENTS.md`
   - shared mode 下会插入一个 marker block
   - dedicated mode 下会主动移除自己以前写过的 block
5. `~/.codex/skills/lean-ctx/SKILL.md`
   - 属于可选 skill surface，不是所有模式都一定写
6. `~/.lean-ctx/`
   - 数据目录，放 stats、sessions、caches、config 衍生内容
7. shell RC / shell hook
   - `~/.zshenv`、`~/.bashenv`、相关 shell profile
8. optional proxy autostart
   - 只有启用 proxy 时才触发

### 一个必须记录的文档漂移

上游 `docs/guides/codex-cli.md` 里仍然提到：

- `~/.codex/instructions.md`

但当前源码和 `installation-matrix` 更明确显示，Codex 侧真实使用的是：

1. `~/.codex/LEAN-CTX.md`
2. `~/.codex/AGENTS.md`
3. `~/.codex/hooks.json`
4. `~/.codex/config.toml`

所以：

- **`codex-cli.md` 有一定口径滞后。**
- 真正落盘研究时，应该以当前源码和 `installation-matrix` 为准，而不是照抄 guide 文案。

## 规则注入有三档，这决定了它是否会继续侵入 AGENTS

`lean-ctx` 不是只有“装”与“不装”两态。它还有一个很关键的配置轴：

- `rules_injection = shared | dedicated | off`

### `shared`

行为：

1. 写 `LEAN-CTX.md`
2. 在 `~/.codex/AGENTS.md` 里插一个 lean-ctx marker block
3. 后续 refresh/uninstall 依靠 marker 做局部更新或局部清理

优点：

- Agent 能稳定看到 lean-ctx guidance

缺点：

- 会继续占用 `AGENTS.md` 这个当前已经被 OMX 重度占用的全局控制面

### `dedicated`

行为：

1. 保留 `LEAN-CTX.md`
2. 不再依赖共享 `AGENTS.md` 块
3. Codex `SessionStart` hook / 说明注入承担 compact summary 路由
4. 如果之前 shared mode 留过 AGENTS block，会把该 block strip 掉

优点：

- **显著更适合当前环境**
- 避免继续把 `~/.codex/AGENTS.md` 做成多工具混写的共享垃圾场

缺点：

- 依赖它自己的 hook/instruction path，更需要确认 Codex surface 行为稳定

### `off`

行为：

1. 不写共享 rules 文件
2. 只保留更窄的 MCP / hooks / shell capability

优点：

- 最低侵入

缺点：

- guidance 能力下降
- 容易退化成“只有工具，没有明确行为约束”

### 对当前环境的判断

当前机器最适合的是：

- **`rules_injection = dedicated`**

原因很直接：

1. 你已经明确感受到 OMX 对主 agent 角色和环境口径的侵入偏重。
2. 当前 `~/.codex/AGENTS.md` 已是重度 OMX surface。
3. 如果 lean-ctx 再以 shared mode 往里塞一层，会进一步放大“多系统争夺一个全局指令面”的问题。

## Proxy 在当前 CCH 语义下是可行的，但不能按默认 OpenAI rail 盲接

这是这次修正后的核心结论。

`lean-ctx proxy enable` 和普通的 Codex wiring 不是一回事。

它会做的是：

1. 在 shell RC 写入 proxy 相关环境
2. 在某些 agent config 中写入 provider/base_url
3. 启动或配置 autostart
4. 把模型请求流量本身导到本地 proxy

### 协议层面：当前 proxy 是能接住 Codex 的

按当前 upstream 文档与源码，`lean-ctx proxy` 现在已经明确支持：

1. `OpenAI Responses API`
2. `Codex` 默认使用的 `WebSocket /responses`
3. HTTP/SSE fallback

上游文档明确写了：

```toml
[model_providers.lean-ctx]
name = "lean-ctx"
base_url = "http://127.0.0.1:4444/v1"
```

并且说明：

1. Codex 默认可以直接走 `ws://127.0.0.1:4444/responses`
2. proxy 会把该 WebSocket turn bridge 到上游 HTTP/SSE
3. 只有你想强制退回 HTTP/SSE 时，才需要：
   - `supports_websockets = false`

所以：

- **当前不需要把 `supports_websockets = false` 当默认配置。**
- **`cch` 既然本质上是 OpenAI 中转，上下游 wire shape 是对得上的。**

### 但默认 `proxy enable` 的 Codex 自动接线，不是当前环境的最佳接法

这里要非常明确。

`lean-ctx` 当前对 Codex API-key rail 的自动 proxy 写法，核心是往 `~/.codex/config.toml` 顶层写：

```toml
openai_base_url = "http://127.0.0.1:4444/v1"
```

这条路径明显是围绕 **Codex 内建的 OpenAI rail** 设计的。

而当前本机不是这个形态，而是：

1. `model_provider = "cch"`
2. `[model_providers.cch].base_url = "https://cch.141242.xyz:9999/v1"`
3. `wire_api = "responses"`
4. `requires_openai_auth = true`

因此对当前环境最重要的判断不是“proxy 能不能工作”，而是：

- **`proxy enable` 自动写出的 `openai_base_url`，很可能并不能自然接管当前 `model_provider = "cch"` 的真实流量。**

这里本页的判断是源码证据 + 当前配置结构上的**高置信推断**：

1. `lean-ctx` 自动接管 Codex API-key rail 时，写的是顶层 `openai_base_url`
2. 你当前真实使用的是自定义 provider `cch`
3. 因此更优雅的接法不是“切回默认 OpenAI rail”，而是：
   - **保留 `cch` provider 身份**
   - **只把 `cch.base_url` 改成本地 proxy**

### `openai_upstream` 应该怎么写

这一点必须写死，因为写错就会直接坏掉。

对于当前环境，`lean-ctx` 的真实上游配置应该是：

```toml
[proxy]
openai_upstream = "https://cch.141242.xyz:9999"
allow_custom_upstream = true
```

注意：

1. **这里不应写 `/v1`**
2. 也就是应写：
   - `https://cch.141242.xyz:9999`
3. 不应写：
   - `https://cch.141242.xyz:9999/v1`

原因是 `lean-ctx proxy` 会在该 upstream base 上继续拼接：

1. `/v1/responses`
2. `/v1/chat/completions`
3. 相关 sub-path

如果你把 upstream 直接写成带 `/v1` 的地址，就会形成：

- `/v1/v1/responses`

这不是本页推测，而是当前源码转发路径的直接结果。

### 为什么需要 `allow_custom_upstream = true`

这同样不是可选装饰，而是当前环境的必要条件。

按 upstream 当前实现：

1. `openai_upstream` 默认只允许内建 allowlist host
2. 内建 OpenAI host 默认是：
   - `api.openai.com`
3. `cch.141242.xyz` 显然不是该 allowlist host
4. 因此若要把 built-in OpenAI rail 的 upstream 改成 `cch` 这样的自定义 HTTPS host，就必须显式 opt-in：
   - `[proxy] allow_custom_upstream = true`

### 当前环境下最优雅的 proxy 接法

对这台机器，最优雅的接法不是新增一个新的 `lean-ctx` provider 身份，也不是切回内建 `openai` provider，而是：

1. 保留：
   - `model_provider = "cch"`
2. 保留：
   - `wire_api = "responses"`
3. 保留：
   - `requires_openai_auth = true`
4. 只把：
   - `[model_providers.cch].base_url`
   - 从 `https://cch.141242.xyz:9999/v1`
   - 改成 `http://127.0.0.1:4444/v1`
5. 同时在 `lean-ctx` 侧把真实 upstream 指回：
   - `https://cch.141242.xyz:9999`

这种接法的好处是：

1. **保留当前 `cch` provider 语义**
   - 不改变当前环境里已经广泛存在的 provider 名称
2. **保留当前 Codex + OMX + AOE 的口径**
   - 不额外引入一个新的 provider identity
3. **回滚简单**
   - 只要把 `cch.base_url` 改回原地址即可
4. **能真正让 proxy 接住当前流量**
   - 而不是指望 `openai_base_url` 自动接管一个你当前并未使用的 rail

## 与当前本机环境的贴合度

### 1. 它比 context-mode 更适合作为“可回滚试部署”对象

这是 `lean-ctx` 的一个明显优点。

对比 `context-mode`：

1. `context-mode` 更强调 plugin + upgrade + storage + compact/resume runtime 一体化
2. `lean-ctx` 更强调：
   - marker-based rules injection
   - shared file surgical cleanup
   - dedicated owned files
   - `uninstall` 明确只删自己的 block / 自己的 entry

所以如果只看 deployment hygiene：

- **`lean-ctx` 明显比 `context-mode` 更适合当前环境先做试部署。**

### 2. 它仍然会和当前 OMX / AOE surface 发生真实耦合

主要冲突面如下：

1. `~/.codex/config.toml`
   - 现在已经是高密度手工定制 + OMX 管理块并存
   - lean-ctx 还会往里加 `[mcp_servers.lean-ctx]` 和 hooks / proxy 相关项
2. `~/.codex/hooks.json`
   - 当前已经承载 AOE hooks
   - lean-ctx 还会追加自己的 `SessionStart` / `PreToolUse` / `observe`
3. `~/.codex/AGENTS.md`
   - 如果用 shared mode，会和 OMX 继续争用同一控制面
4. shell RC
   - 当前 home-root tracked 白名单并不包含 `.zshrc` / `.zshenv`
   - 但 lean-ctx shell hook 默认就是会改这层

这意味着它不是“完全无缝接入”，而是：

- **可控接入**
- **但必须先选窄路径**

### 3. 当前 tracked/untracked 模型对它也提出了约束

按现在 home-root whitelist 的原则：

应当 tracked 的 lean-ctx 面将包括：

1. `~/.codex/config.toml` 中的 lean-ctx MCP / hook / provider static config
2. `~/.codex/hooks.json` 中 lean-ctx managed hook entries
3. `~/.codex/LEAN-CTX.md`
4. 若采用 shared mode，则 `~/.codex/AGENTS.md` 中 lean-ctx marker block

不应 tracked 的面包括：

1. `~/.lean-ctx/` 数据目录
2. 各类 cache / stats / sessions / graph artifacts
3. proxy runtime state

这里有一个很实际的后续问题：

- 如果未来真要启用 shell hook，那么 `.zshenv` / `.bashrc` 是否进入 tracked，需要单独决策。

本轮不实现这个策略，但必须先记录下来。

### 3.1 这次 proxy 方案下，应该 tracked 的最终集合

上面那一版只覆盖了最基础的 `~/.codex` 面。

在这次已经修正为：

1. 保留 `model_provider = "cch"`
2. 把 `cch.base_url` 指向本地 proxy
3. 把 `lean-ctx` 的真实 upstream 指回 `cch`

之后，**最终建议的 tracked 集合** 应该更完整地写成下面这样。

#### A. 必须 tracked

这些是当前方案里最核心、最值得审计的静态面：

1. `~/.codex/config.toml`
   - 包括：
   - `[mcp_servers.lean-ctx]`
   - hooks feature 开关
   - 当前 `model_provider = "cch"`
   - `[model_providers.cch].base_url = "http://127.0.0.1:4444/v1"`
2. `~/.codex/hooks.json`
   - lean-ctx managed hooks 会写这里
3. `~/.codex/LEAN-CTX.md`
   - 这是 lean-ctx own 的规则文件
4. `~/.config/lean-ctx/config.toml`
   - 这次 proxy 方案里这是**必须进入 tracked** 的新增核心文件
   - 因为这里承载：
   - `[proxy].openai_upstream = "https://cch.141242.xyz:9999"`
   - `[proxy].allow_custom_upstream = true`
   - 以及 `history_mode` / `live_compress` 等静态策略

#### B. 条件 tracked

这些不是每次都必须 tracked，但一旦启用对应模式，就建议纳入：

1. `~/.codex/AGENTS.md`
   - 当前本机本来就应 tracked
   - 但对 lean-ctx 而言，只有 `rules_injection = shared` 时它才会直接改这里
   - 当前推荐是 `dedicated`，所以它不是 lean-ctx 这条链路的核心新增面
2. `~/.codex/skills/lean-ctx/SKILL.md`
   - 如果 init/setup 实际生成了这层，并且它参与稳定工作流，就建议 tracked
   - 它属于“静态行为 surface”，不是 runtime 噪音
3. `~/.config/systemd/user/lean-ctx-proxy.service`
   - 只有你从 foreground proof 进入 steady-state managed proxy 时才出现
   - 如果你决定长期使用 `lean-ctx proxy enable`，我建议把**主 unit 文件本体**纳入 tracked
   - 这样能感知 proxy 启动命令、端口、二进制路径等静态漂移
4. shell RC 中的 lean-ctx 注入块
   - 如 `.zshenv` / `.zshrc` / `.bashrc`
   - 只有当你明确接受 shell hook / proxy env 由仓库审计时才建议 tracked
   - 按当前这台机器的“白名单尽量窄”原则，我不建议在 proof 阶段就把整份 shell RC 拉进 tracked

#### C. 明确不应 tracked

这些内容即使和 lean-ctx 有关，也应视为 runtime 或副产物：

1. `~/.lean-ctx/`
   - 数据目录整体不应 tracked
2. `~/.config/lean-ctx/` 下除 `config.toml` 之外的 runtime 内容
3. proxy stats / usage / journal / archive / graph / BM25 / session artifacts
4. systemd 的启用态符号链接目录
   - `~/.config/systemd/user/default.target.wants/`
   - `~/.config/systemd/user/graphical-session.target.wants/`
5. proxy runtime token / 临时文件 / lock / logs

### 3.2 proof 阶段和 steady-state 阶段的 tracked 结论不同

这一点值得单独说清楚。

#### foreground proof 阶段

如果你先按本页推荐做：

- `lean-ctx proxy start --port=4444`

那么建议 tracked 的新增面其实只有：

1. `~/.codex/config.toml`
2. `~/.codex/hooks.json`
3. `~/.codex/LEAN-CTX.md`
4. `~/.config/lean-ctx/config.toml`

这阶段**不需要** tracked：

1. systemd user unit
2. shell RC 注入块

这是最干净的 proof 形态。

#### managed proxy 阶段

如果后面进入：

- `lean-ctx proxy enable`

那么 tracked policy 最好升级为：

1. 继续 tracked：
   - `~/.codex/config.toml`
   - `~/.codex/hooks.json`
   - `~/.codex/LEAN-CTX.md`
   - `~/.config/lean-ctx/config.toml`
2. 新增 tracked：
   - `~/.config/systemd/user/lean-ctx-proxy.service`
3. 可选 tracked：
   - shell RC 中 lean-ctx 注入块

### 3.3 和当前 `/home/penn` 仓库现状的差异

当前 home-root whitelist 实际已经放进 tracked 的相关面只有：

1. `.codex/config.toml`
2. `.codex/hooks.json`
3. `.codex/AGENTS.md`
4. `.tmux.conf`
5. 现有 OMX / Codex agents / rules 等静态面

当前**还没有**把下面两类路径纳入白名单：

1. `~/.config/lean-ctx/config.toml`
2. `~/.config/systemd/user/lean-ctx-proxy.service`

所以如果按本页推荐真的部署这套 proxy 方案，那么 home-root whitelist 需要随之扩大到这两个静态面；否则你的 git tracked 视角会漏掉本次方案里最关键的 proxy 配置。

## 最贴合当前机器的部署建议

如果未来要试部署 `lean-ctx`，当前最贴合这台机器、且最能发挥能力的推荐顺序，已经不再是“永远先不碰 proxy”，而是下面这条更精确的路径：

1. **只安装 binary**
   - 先把“有没有 `lean-ctx` 命令”与“是否接入 Codex”分离
2. **只做 `Codex` 单 agent 接入**
   - 用 `lean-ctx init --agent codex`
   - 不用 `onboard`
3. **设置 `rules_injection = dedicated`**
   - 避免继续污染 `~/.codex/AGENTS.md`
4. **保留 `shell_activation = agents-only`**
   - 这是上游当前默认值，也更符合当前机器
5. **启用 proxy，但不要依赖默认 Codex 自动接线**
   - 先在 `lean-ctx` 侧配置 `[proxy] openai_upstream`
   - 再手工把现有 `cch.base_url` 改到本地 proxy
6. **优先先做 foreground proof，再决定是否转 managed service**
   - proof 阶段：`lean-ctx proxy start --port=4444`
   - steady-state 阶段：`lean-ctx proxy enable`
7. **部署前先定义 tracked policy**
   - 至少把 `LEAN-CTX.md`、`hooks.json`、`config.toml`、shell RC 是否 tracked 说清楚

### 如果目标是尽可能发挥 lean-ctx 在 Codex 中的能力

当前最合理的“高能力 profile”大致应是：

1. `lean-ctx init --agent codex`
2. `rules_injection = dedicated`
3. `Codex MCP + hooks` 启用
4. `lean-ctx proxy` 启用
5. 保留当前 `cch` provider 身份，不额外新增 provider identity
6. `wire_api = "responses"` 保持不变
7. WebSocket 默认保持开启

对应的配置形态应接近：

```toml
# ~/.lean-ctx/config.toml
[proxy]
openai_upstream = "https://cch.141242.xyz:9999"
allow_custom_upstream = true
history_mode = "cache-aware"
live_compress = true
verbosity_steer = false
effort = "off"
```

```toml
# ~/.codex/config.toml
model_provider = "cch"

[model_providers.cch]
name = "cch"
base_url = "http://127.0.0.1:4444/v1"
wire_api = "responses"
requires_openai_auth = true
```

这个 profile 的判断逻辑是：

1. `history_mode = "cache-aware"`
   - 最贴近你对“尽量不要因为压缩而错位”的偏好
   - 相比 `rolling`，它更强调不破坏 provider cache 边界
2. `live_compress = true`
   - 这是 proxy 真正产生收益的主开关之一
   - 没有它，proxy 更像“过路统计器”
3. `verbosity_steer = false`
   - 你当前更关心 fidelity，而不是额外的输出风格压缩
   - Codex 这边已经有明确 instructions / reasoning / verbosity 设定，不宜再叠一层 wire-level “be concise” steer
4. `effort = "off"`
   - 当前 Codex 已有明确 reasoning effort 设定
   - 再让 proxy 统一改 effort，收益不明显，反而增加变量

### `supports_websockets = false` 在当前环境不是默认必需项

在这次修正前，容易误以为因为 `cch` 是“兼容后端”，所以要保守地强制 HTTP/SSE。

修正后应改成：

1. 默认不需要加：
   - `supports_websockets = false`
2. 因为 `lean-ctx` 当前已明确支持 Codex 默认的 `WebSocket /responses`
3. 只有在真实联调中发现：
   - WebSocket 行为异常
   - 中转层对 WS / SSE handling 有具体问题
4. 才把它当 fallback

### 明确不推荐的首轮路径

1. `lean-ctx onboard`
   - 会把当前机器上检测到的所有 AI 工具一起接入
   - 过宽
2. `lean-ctx setup`
   - 交互面太广，容易把 proxy、telemetry、autoupdate 一起带上
3. 单纯运行 `lean-ctx proxy enable`，然后假设它写出的默认 OpenAI rail 就已经接住当前 `cch`
   - 这对当前环境是不够精确的
4. 把 `[proxy].openai_upstream` 写成带 `/v1` 的地址
   - 这是明确错误接法

## 卸载/回滚研究结论

`lean-ctx` 当前官方 lifecycle 文档和源码对 uninstall 的定义比较清楚：

1. `lean-ctx uninstall`
   - 全量清理：进程、config、autostart、data、binary
2. `lean-ctx uninstall --keep-config`
   - 保留 MCP configs + rules
3. `lean-ctx uninstall --keep-binary`
   - 删环境，保留二进制
4. `lean-ctx uninstall --dry-run`
   - 只预演，不写盘

对 Codex 侧，官方意图和源码都显示它会尽量做 surgical cleanup：

1. 从 `config.toml` 中删掉 `[mcp_servers.lean-ctx]`
2. 从 `hooks.json` 中删掉 lean-ctx managed entries
3. 从 `AGENTS.md` 中删掉 lean-ctx marker block
4. 删除自己拥有的 `LEAN-CTX.md`
5. 清理 shell hook / proxy env / autostart / data dir

因此相对 `context-mode` 来说：

- **`lean-ctx` 的 uninstall hygiene 明显更好。**

## 对未来 home 部署脚本的启发

虽然这轮不实现脚本，但有几条要求已经可以提前冻结：

### 1. script 必须拆成至少三层

1. **binary install**
2. **Codex wiring**
3. **optional proxy**

不要把三层混成一个“全家桶一键安装”。

### 2. script 必须显式声明 deployment profile

至少要能表达：

1. `codex-only`
2. `all-tools`
3. `proxy-on`
4. `proxy-off`
5. `rules=shared|dedicated|off`

### 3. script 必须和 tracked policy 联动

尤其是：

1. `~/.codex/LEAN-CTX.md`
2. `~/.codex/AGENTS.md`
3. `~/.codex/hooks.json`
4. `~/.codex/config.toml`
5. shell RC 是否 tracked

### 4. uninstall script 也必须是显式 profile

至少区分：

1. remove wiring only
2. remove proxy too
3. keep binary
4. full remove

## Final Verdict

最终结论如下：

1. `lean-ctx` 值得继续研究，且比 `context-mode` 更适合作为当前环境的首个“可回滚部署候选”。
2. 在“`cch` 实际上是 OpenAI 中转”这个前提下，`lean-ctx proxy` 现在应被视为**当前环境里的主候选能力层**，而不是天然回避对象。
3. 但最优接法不是默认 `proxy enable` 的 OpenAI rail 自动接线，而是：
   - **`init --agent codex`**
   - **`rules_injection = dedicated`**
   - **保留当前 `model_provider = "cch"`**
   - **把 `cch.base_url` 改到 `http://127.0.0.1:4444/v1`**
   - **把 `[proxy].openai_upstream` 指回 `https://cch.141242.xyz:9999`**
   - **并显式开启 `[proxy] allow_custom_upstream = true`**
4. 当前环境里它最大的风险不再是“协议兼容性”，而是：
   - `AGENTS.md` / `hooks.json` / `config.toml`
   - shell RC / autostart
   - tracked policy
   这些共享所有权与回滚面的复杂度
5. 因此真正落地时，最稳的顺序是：
   - 先 `Codex-only + dedicated rules`
   - 再按 `cch` 保留方案接入 proxy
   - 先 foreground proof，确认无误后再转 managed service
