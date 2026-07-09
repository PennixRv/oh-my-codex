---
title: "tmux-status-bar-recovery-analysis-2026-07-03"
tags: ["tmux", "status-bar", "recovery", "forensics", "claude-config"]
created: 2026-07-03T06:36:16.263Z
updated: 2026-07-03T06:36:16.263Z
sources: []
links: []
category: debugging
confidence: medium
schemaVersion: 1
---

# tmux-status-bar-recovery-analysis-2026-07-03

结论：tmux 状态栏并非被全局关闭，当前症状来自 ~/.tmux.conf 仍引用 ~/.claude/status-bar.sh，同时 window-status-format 和 window-status-current-format 被清空；在脚本缺失后，整条 bar 会看起来像消失。

已验证证据：
1. ~/.tmux.conf:55 附近仍保留空的 window status format 和指向 ~/.claude/status-bar.sh 的 status-left/status-right。
2. 当前 ~/.claude 目录只剩 settings.json 与 settings.json.lock，旧状态栏脚本已不存在。
3. 2026-06-02 / 2026-06-03 的 Codex 会话日志中仍能找到以下 4 个脚本的完整历史正文，因此旧方案并未彻底丢失，可恢复：status-bar-common.sh、status-bar.sh、statusline-native.sh、tmux-theme.sh。
4. ~/.zsh_history:220 出现 rm -rf .claude 记录，这与脚本消失高度一致，但不能仅凭该行断言执行时 cwd 一定是 /home/penn。

后续建议：恢复时不要继续依赖 ~/.claude 这种可能被外部工具清理的路径，应先把脚本迁移到更稳定的位置，再调整 ~/.tmux.conf 指向。
