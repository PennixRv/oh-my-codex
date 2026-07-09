---
title: "lean-ctx 清理结果与当前不部署决策 2026-07-06"
tags: ["lean-ctx", "codex", "cleanup", "environment", "decision", "uninstall"]
created: 2026-07-06T12:14:33.000Z
updated: 2026-07-06T12:14:33.000Z
sources:
  - "https://github.com/yvgude/lean-ctx/blob/main/docs/reference/appendix-paths-and-config.md"
  - "https://github.com/yvgude/lean-ctx/issues/202"
  - "https://github.com/yvgude/lean-ctx/issues/350"
  - "https://github.com/yvgude/lean-ctx/issues/367"
links: ["lean-ctx-codex-deployment-modes-and-local-fit-2026-07-06.md", "omx-current-install-uninstall-shape-and-reinstall-flow-2026-07-06.md"]
category: environment
confidence: high
schemaVersion: 1
---

# lean-ctx 清理结果与当前不部署决策 2026-07-06

## 结论

截至 `2026-07-06`，当前机器上的 `lean-ctx` **活跃接入面已经全部清理**，并且当前决策是：

1. **不在这台现有 `Codex + OMX + AOE` 环境里继续部署 `lean-ctx`。**
2. 之前关于 deployment / proxy / provider wiring 的研究页仍保留，但它现在是**尽调记录**，不是当前执行计划。
3. 如果未来重新评估，必须从**隔离测试面**重新开始，不能直接对真实 `~/.codex` 跑 `onboard` / `setup` / `init --agent codex`。

## 为什么停止部署

这次停下来的核心原因不是 `lean-ctx` 能力不足，而是它当前的安装/初始化模型和这台机器的环境原则不匹配：

1. 这台机器的 `~/.codex` 已经是一个被显式审计和跟踪的配置面。
2. `lean-ctx` 的官方安装器对 `Codex` 更像是 **owner-style 接管**，而不是细粒度 merge。
3. 它会生成或重写自己拥有的一套文件面，例如 `config.toml`、`hooks.json`、`AGENTS.md`、`LEAN-CTX.md`、skills、shell hook。
4. 这种行为和当前“尽可能少地让第三方工具接管 `~/.codex`”的目标相冲突。

## 本次已清理的活跃痕迹

以下内容已经被移除或恢复：

1. 二进制与安装入口：
   - `/home/penn/bin/lean-ctx`
   - `/home/penn/.npm-global/bin/lean-ctx`
   - `/home/penn/.npm-global/lib/node_modules/lean-ctx-bin`
2. XDG 配置与运行态目录：
   - `/home/penn/.config/lean-ctx`
   - `/home/penn/.local/share/lean-ctx`
   - `/home/penn/.local/state/lean-ctx`
3. shell 接入：
   - 从 `/home/penn/.zshrc` 中删除了 `lean-ctx` shell hook 注入块
   - 删除了 `/home/penn/.zshrc.lean-ctx.bak`
4. 工作目录 stray 文件：
   - `/home/penn/devel/AGENTS.md`
   - `/home/penn/devel/LEAN-CTX.md`
5. 临时测试/研究目录：
   - `/tmp/leanctx-codex-home-test`
   - `/tmp/lean-ctx*` 相关下载、解压、研究目录
6. OMX 运行态残留：
   - `/home/penn/devel/.omx/state/native-stop-state.json`

## 清理后验证结果

清理完成后，本机已经验证：

1. 没有 `lean-ctx` 常驻进程。
2. 没有 `4444` 端口上的 `lean-ctx proxy` 监听。
3. 没有 `lean-ctx` 相关的 `systemd --user` unit。
4. `~/.zshrc`、`~/.codex/config.toml`、`~/.codex/hooks.json` 中都不再包含 `lean-ctx` 字样。
5. 以文件名搜索 `/home/penn` 与 `/tmp` 后，仅剩 wiki 研究页仍以 `lean-ctx` 命名。

## 有意保留的历史记录

下面两类内容**没有清理**，这是刻意保留，不是遗漏：

1. `/home/penn/.codex/history.jsonl`
   - 这里保留了本次研究和决策的会话历史。
   - 它是审计日志，不是活跃配置。
2. `omx_wiki/` 中已有的 `lean-ctx` 研究页、索引与日志引用
   - 这些内容是长期研究记录。
   - 当前新增这页的目的，就是明确“研究存在，但部署已停止并已清理”。

## 对后续工作的约束

如果未来要重新评估 `lean-ctx`，建议遵守以下边界：

1. 不对真实 `~/.codex` 直接运行 `lean-ctx onboard`。
2. 不对真实 `~/.codex` 直接运行 `lean-ctx setup`。
3. 不对真实 `~/.codex` 直接运行 `lean-ctx init --agent codex`。
4. 如需再次验证，只在隔离目录、隔离 `CODEX_HOME`、隔离 shell rc 下测试。
5. 重新评估时，优先验证“是否存在真正可控的最小接入模式”，而不是先验证 token 节省率。

## 和既有研究页的关系

`[[lean-ctx-codex-deployment-modes-and-local-fit-2026-07-06]]` 仍然保留，因为它记录了：

1. 上游项目形态与 deployment surface。
2. `cch` 作为 OpenAI 中转时，proxy 理论上如何接线。
3. 为什么它在能力层面值得研究。

但从这页开始，当前环境的操作口径已经明确更新为：

- **研究保留**
- **部署取消**
- **环境已清理回无活跃接入状态**
