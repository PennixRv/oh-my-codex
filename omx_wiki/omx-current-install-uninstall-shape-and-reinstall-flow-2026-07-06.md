---
title: "当前本机 OMX 安装形态与卸载/重装流 inventory 2026-07-06"
tags: ["omx", "codex", "installation", "uninstall", "reinstall", "plugin-mode", "environment", "tracked"]
created: 2026-07-06T09:40:00.000Z
updated: 2026-07-06T09:40:00.000Z
sources:
  - "https://github.com/Yeachan-Heo/oh-my-codex"
  - "https://github.com/Yeachan-Heo/oh-my-codex/blob/main/skills/omx-setup/SKILL.md"
  - "https://github.com/Yeachan-Heo/oh-my-codex/blob/main/docs/troubleshooting.md"
  - "https://github.com/Yeachan-Heo/oh-my-codex/blob/main/docs/release-notes-0.18.68.md"
  - "https://github.com/Yeachan-Heo/oh-my-codex/blob/main/docs/release-notes-0.18.62.md"
links: ["lean-ctx-codex-deployment-modes-and-local-fit-2026-07-06.md", "pennix-omx-fork-design-inventory-2026-07-04.md", "context-mode-codex-deployment-and-uninstall-due-diligence-2026-07-06.md"]
category: environment
confidence: high
schemaVersion: 1
---

# 当前本机 OMX 安装形态与卸载/重装流 inventory 2026-07-06

## Scope

这页记录两件事：

1. **当前这台机器上的 OMX 实际安装形态**
2. **当前应当采用的 OMX 卸载 / 重装 / clean reinstall 流**

这不是在讲“理论上 OMX 可以怎么装”，而是在讲：

- 这台机器现在到底是什么样
- 哪些命令属于 package layer
- 哪些命令属于 setup layer
- 哪些内容进入 tracked
- 哪些内容应保持 untracked

## 证据边界

这里有一个需要明确的事实：

- shell 历史里没有完整保留当时每一步 OMX 安装命令。

因此本页结论不是“完全还原每一次历史操作”，而是基于：

1. 当前 live environment
2. 当前已安装 OMX 包路径与版本
3. 当前 `~/.codex/config.toml`
4. 当前 home-root tracked 仓库
5. 当前 `omx setup` / `omx uninstall` CLI help
6. 仓库内 `setup` / `uninstall` 文档与 release QA 记录

这足够支持“以后如何正确维护和重装这套环境”的结论。

## 当前 live shape

当前机器上的 OMX 形态已经可以明确判定如下：

| 项 | 当前状态 |
| --- | --- |
| OMX launcher | `~/.npm-global/bin/omx` |
| OMX package root | `~/.npm-global/lib/node_modules/oh-my-codex-pennix` |
| OMX version | `0.18.81` |
| Codex version | `codex-cli 0.142.5` |
| Package manager layer | `npm -g` 安装 |
| Setup scope | `user` |
| Install mode | `plugin mode` |
| Plugin key | `oh-my-codex@oh-my-codex-local` |
| Marketplace key | `oh-my-codex-local` |
| Hook mode | `plugin_hooks = true` |
| Goals | `goals = true` |

所以当前不是：

- project-scope 安装
- legacy prompt/skill 扁平复制模式
- source checkout 临时直跑模式

而是：

- **global npm package**
- **user-scope setup**
- **plugin-mode Codex integration**

## 当前本机上的 OMX 分层模型

当前这台机器上，OMX 需要被拆成三层理解：

### 1. Package layer

解决“机器上有没有 `omx` 命令”：

```bash
npm install -g oh-my-codex-pennix
```

当前 live path 明确证明本机就是这一层：

- `~/.npm-global/bin/omx`
- `~/.npm-global/lib/node_modules/oh-my-codex-pennix`

### 2. Setup layer

解决“Codex 环境被不被 OMX 接管/接好”：

```bash
omx setup --scope user --plugin --force
```

这一步才负责：

1. `~/.codex/config.toml`
2. `~/.codex/hooks.json`
3. `~/.codex/AGENTS.md`
4. `~/.codex/agents/*.toml`
5. plugin marketplace registration
6. plugin cache materialization / verification
7. tmux status assets

### 3. Home tracking layer

解决“哪些静态面进入 git tracked”：

当前已经采用 home-root whitelist 模型，git root 在：

- `/home/penn`

tracked 的主要静态面是：

1. `.codex/config.toml`
2. `.codex/hooks.json`
3. `.codex/AGENTS.md`
4. `.codex/agents/*.toml`
5. `.codex/.omx-config.json`
6. `.codex/.omx/tmux-status/render.sh`
7. `.codex/.omx/tmux-status/tmux-status.conf`
8. `.tmux.conf`
9. `.agent-of-empires/config.toml`
10. `.gitignore`

这层不是 OMX 官方的一部分，而是当前机器的运维策略。

## 当前 source-supported 的 OMX 安装模式

从当前 `omx setup` 文档和源码语义看，OMX 现在至少有两条正统 setup 路径：

### 1. legacy mode

特点：

1. 扁平安装 prompts / skills / native agents
2. 不依赖 Codex plugin discovery
3. 更像传统 setup

### 2. plugin mode

特点：

1. 依赖 Codex plugin discovery 提供 bundled skills / hooks
2. 仍然会刷新 setup-owned native agent TOMLs
3. 会清理 stale generated non-installable agents
4. `config.toml` 中注册 marketplace / plugin enablement

### 当前本机应坚持哪条

答案已经明确：

- **当前机器应坚持 user-scope + plugin-mode**

原因：

1. 当前 live config 已明确处在 plugin-mode
2. 当前 fork 的很多设计就是围绕 plugin-mode 稳定化展开
3. 当前 `doctor` / setup / uninstall / tmux-status 都已经按 plugin-mode 收敛

所以未来重装时，不应再回到 legacy mode，除非做明确的兼容性实验。

## 当前应该采用的标准 flows

这里把“刷新”“重装”“卸载”分开。

### Flow A：只刷新 setup，不换包

适用场景：

1. `config.toml` / `hooks.json` / native agents 漂了
2. plugin cache 或 marketplace registration 漂了
3. 发布后需要重新收敛安装面

推荐命令：

```bash
omx setup --scope user --plugin --force
omx doctor
```

这是当前环境最常见的 repair / converge 路径。

### Flow B：更新已安装包，再刷新 setup

适用场景：

1. 版本升级
2. 修 bug 后重新发布
3. 当前 package root 仍然有效，只需要更新包内容

推荐命令：

```bash
npm install -g oh-my-codex-pennix@<version>
omx setup --scope user --plugin --force
omx doctor
```

这条流比“先卸载再装”更轻。

### Flow C：clean reinstall，但保留配置

这是当前仓库 release QA 曾经明确使用过的典型 flow。

适用场景：

1. plugin cache / install stamp / managed artifacts 已经乱掉
2. 需要验证 published package 的 clean reinstall
3. 需要尽量保留已有用户配置和 tracked 静态面

推荐命令：

```bash
omx uninstall --keep-config --purge
npm uninstall -g oh-my-codex-pennix
npm install -g oh-my-codex-pennix@<version>
omx setup --scope user --plugin --force
omx doctor
```

这里要注意两点：

1. `omx uninstall` 解决的是 **environment artifacts**
2. `npm uninstall -g` 解决的是 **package layer**

这两者不是同一步。

### Flow D：完全 teardown

适用场景：

1. 明确想把 OMX 从机器上拿掉
2. 要重新设计 Codex 环境基线

候选命令：

```bash
omx uninstall --purge
npm uninstall -g oh-my-codex-pennix
```

但要强调：

- 这条流会影响当前 tracked 的静态文件面。
- 在 home-root tracked 模型下，做 full teardown 前应该先评估：
  - tracked 文件是否要保留
  - 是否要先提交或备份当前静态面

因此它不应该是默认维护路径。

## `omx uninstall` 和 `npm uninstall -g` 的边界

这是未来脚本最容易写错的地方，必须单列。

### `omx uninstall`

负责：

1. 移除 OMX-managed configuration
2. 清理 installed artifacts
3. 清理 plugin registration / managed wrappers / managed caches
4. 根据 flags 决定是否保留 config、是否 purge `.omx/`

不负责：

1. 卸载全局 npm 包本身

### `npm uninstall -g oh-my-codex-pennix`

负责：

1. 删全局 package 与 launcher

不负责：

1. 回滚 `~/.codex/config.toml`
2. 回滚 `hooks.json`
3. 清理 marketplace/plugin registration
4. 清理本地 runtime/static artifacts

所以：

- **它们必须成对看待，不能互相替代。**

## 当前 uninstall 的关键语义

结合当前 help、技能文档、release notes，可以把 OMX 的 uninstall 语义总结成：

1. **只删自己 managed 的内容**
2. **尽量保留用户内容**
3. **plugin-mode 下尽量保留官方 Codex 自己的 `plugin_hooks` / `goals`**
4. **shared ownership 的 `hooks.json` 只删 OMX wrapper，不清空用户 hooks**

当前 line 上还可以明确确认：

1. `~/.codex/.omx/install-state.json`
2. `~/.codex/.omx/native-agents.json`
3. `~/.codex/plugins/cache/oh-my-codex-local/oh-my-codex/...`

这类 managed install artifacts 都属于 uninstall 会处理的对象。

## 当前 tracked / untracked 边界与 OMX 的关系

这是当前这台机器和普通 OMX 用户最大的不同点。

### 当前 tracked 的 OMX 面

本机把以下内容视为应该被审计的静态 surface：

1. `config.toml`
2. `hooks.json`
3. `AGENTS.md`
4. native agent TOMLs
5. `.omx-config.json`
6. tmux status render/config
7. `.tmux.conf`

### 当前明确不 tracked 的 OMX 面

1. `install-state.json`
2. `native-agents.json`
3. plugin cache
4. runtime logs
5. session / sqlite / history
6. `.omx/` state / backups / receipts

### 这个边界的意义

它意味着未来任何部署脚本都不应该再去维护一套“镜像仓库”或大批量 snapshot，而应该直接围绕：

1. package install
2. setup converge
3. tracked static files
4. runtime cleanup

来工作。

## 对未来 home 部署/卸载脚本的要求

虽然这轮不实现脚本，但现在已经可以明确约束：

### 1. 先做 package，再做 setup

脚本必须显式分离：

1. `npm install -g oh-my-codex-pennix@...`
2. `omx setup ...`

不要把它们混成一步黑箱。

### 2. 默认 profile 必须是当前本机 profile

也就是：

1. `scope=user`
2. `install-mode=plugin`
3. home-root tracked whitelist 不被破坏

### 3. 卸载脚本必须区分“保留 tracked 配置”和“彻底 teardown”

至少应当有：

1. keep-config reinstall path
2. full teardown path

### 4. 脚本输出必须可审计

至少要明确打印：

1. 当前 package version
2. 当前 setup scope / install mode
3. marketplace / plugin key
4. 将要改动的 tracked 文件
5. 将要清理的 runtime 目录

## Final Verdict

最终结论如下：

1. 当前本机上的 OMX 不是“随手从源码跑起来”的状态，而是一个已经稳定在：
   - **global npm package**
   - **user-scope**
   - **plugin-mode**
   - **home-root tracked whitelist**
   上的环境。
2. 未来维护它时，最重要的是把：
   - package layer
   - setup layer
   - tracked home layer
   三层彻底分开。
3. 当前最标准的维护路径不是 full teardown，而是：
   - 包更新后 `omx setup --scope user --plugin --force`
   - 必要时 `omx uninstall --keep-config --purge` 再 clean reinstall
4. 未来如果要写 home 下的 Codex 环境部署/卸载脚本，应该严格围绕这套现状来做，而不是再回到旧的 `codex-config` mirror workflow。
