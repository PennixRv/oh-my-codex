---
title: "AgentMemory 0.9.27-r1 发布与 NAS 上线记录 2026-07-08"
tags: ["agentmemory", "release", "nas", "deployment", "gitea", "registry", "debugging"]
created: 2026-07-08T07:07:48.674Z
updated: 2026-07-08T07:07:48.674Z
sources: []
links: []
category: debugging
confidence: medium
schemaVersion: 1
---

# AgentMemory 0.9.27-r1 发布与 NAS 上线记录 2026-07-08

# AgentMemory 0.9.27-r1 发布与 NAS 上线记录 2026-07-08

> 历史说明：本页只记录 `0.9.27-r1` 这个首个上线节点。当前在线镜像、compose 命名收敛、`gpt-5.4-mini` 实际调用验证与增强建议，已由 [[agentmemory-已验证部署与增强路线-2026-07-08]] 接管。

## 本轮结果

本轮 `agentmemory` 包装发布已经完成，当前 NAS 在线运行镜像：

- `gitea.141242.xyz:9999/penn/agentmemory-deploy:0.9.27-r1`

当前 NAS 侧已确认：

- `RERANK_ENABLED=true`
- `OPENAI_MODEL=gpt-5.4-mini`
- `OPENAI_BASE_URL=https://cch.141242.xyz:9999/v1`
- `OPENAI_API_KEY_FOR_LLM=true`
- embedding 仍走 `router.tumuer.me` 的 `Qwen/Qwen3-Embedding-4B`
- `AGENTMEMORY_AUTO_COMPRESS=false`
- `CONSOLIDATION_ENABLED=false`
- `GRAPH_EXTRACTION_ENABLED=false`
- `AGENTMEMORY_INJECT_CONTEXT=false`

验收证据包括：

- 容器状态 `healthy`
- `/agentmemory/livez` 返回 `status=ok`
- `/agentmemory/health` 返回 `status=healthy`
- provider 检测为 `llm`
- 容器内成功导入 `@xenova/transformers` / `onnxruntime-node` / `onnxruntime-web`

## 这轮标准发布流程的异常

仓库侧标准发布流没有完全成功：

- action run `1043`
- tag: `0.9.27-r1`
- workflow: `docker-publish.yml`
- 结论：`failure`

但失败并不是构建逻辑错误，而是 registry 推送阶段的网络/连接问题。

已确认日志特征：

- `failed to copy: failed to do request: Put ... use of closed network connection`
- `failed to fetch oauth token: Post ... /v2/token: net/http: TLS handshake timeout`

也就是说：

- 镜像构建本身没有失败
- 失败点发生在 `buildx --push` 期间与 `gitea registry` 的长连接上传
- 这更像当前 runner 到 `gitea.141242.xyz:9999` 的网络稳定性问题，而不是 Dockerfile 或版本策略问题

## 本轮实际补救路径

为了不阻塞 NAS 上线，本轮使用了发布脚本和最朴素的 `docker push` 路径做兜底，最终把镜像成功推到 registry，因此：

- 包仓库中已经存在 `0.9.27-r1`
- NAS 已经成功 `pull` 并切换到新版本

## 对后续的直接启示

后续如果要把这条发布链路继续做稳，优先级最高的不是改 `agentmemory`，而是收敛包装仓库的发布面，例如：

1. 评估是否继续使用 `buildx --push`
2. 对单平台 `linux/amd64` 发布改成更朴素的 `docker build + docker push`
3. 或者继续保留 `buildx`，但专门处理 registry 长连接与 TLS 超时问题

截至本轮，服务已经上线成功，但“仓库 action 自动推镜像”这一步仍不算完全收敛。
