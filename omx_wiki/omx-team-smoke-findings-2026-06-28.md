---
title: "OMX team smoke findings 2026-06-28"
tags: ["omx", "team", "smoke", "lifecycle", "prompt-injection", "fallback", "hud", "leader-mailbox"]
created: 2026-06-28T02:51:34.689Z
updated: 2026-06-28T02:51:34.689Z
sources: []
links: []
category: debugging
confidence: medium
schemaVersion: 1
---

# OMX team smoke findings 2026-06-28

# OMX team smoke findings 2026-06-28

## Scope
Real tmux-based smoke validation against the globally installed Pennix fork `oh-my-codex-pennix@0.18.35`, after GitHub Release and npm publish completed. The goal was to validate full `omx team` lifecycle behavior in the installed artifact rather than only source-local tests.

## Findings

### [Critical, environment bootstrap] Fresh untrusted repos can block worker startup before team orchestration actually begins
Evidence:
- In `/tmp/omx-smoke-a-bewyuc0z/repo`, worker pane `%6` died immediately during team startup.
- The worker pane capture showed the Codex directory trust prompt: `Do you trust the contents of this directory?`.
- `omx team status` showed `dead_workers=["worker-1"]` while the task remained pending.

### [Critical, environment bootstrap] Hook-review gating can also block worker startup in otherwise trusted repos
Evidence:
- In `/tmp/omx-smoke-b-mb678s92/repo`, manually opening `codex` first surfaced `⚠ 11 hooks need review before they can run`.
- Until the trust prompt and hook review prompt were manually cleared, the worker launch path was not fully usable.

### [Major] Startup still records `direct_fallback` in `startup-timing.json` even on a successful end-to-end run
Evidence:
- Successful smoke run persisted `startup-timing.json` with both `dispatch_queued` and `direct_fallback`.
- The recorded reason was `startup_direct_trigger_sent:ready_prompt`.

### [Major] HUD pane still auto-starts and persists after worker shutdown
Evidence:
- During the successful smoke, tmux showed a HUD pane started by `... omx.js hud --watch`.
- After `omx team shutdown`, the worker pane disappeared but the HUD pane remained.

### [Major, UX] Leader mailbox reminder injection still exists as a synthetic system-visible reminder
Evidence:
- The successful smoke produced `.omx/state/team/<team>/mailbox/leader-fixed.json`.
- That mailbox contained the real worker ACK plus a synthetic system reminder text telling the leader to read the mailbox file and decide the next step.
- This is not the old raw `[OMX_TMUX_INJECT]` marker path, but it is still a user-visible injected reminder layered on top of mailbox persistence.

## Ranked synthesis

| Rank | Explanation | Confidence | Basis |
| --- | --- | --- | --- |
| 1 | Worker-to-leader notification is mailbox-first, with leader-visible reminder surfacing layered on top. | High | Worker bootstrap, runtime send-message path, mailbox dispatch implementation, and notify-hook leader nudge code all agree. |
| 2 | The old direct tmux injection marker path has been partially removed for leader-directed mailbox sends, but a newer synthetic reminder path still exists through leader attention / notify-hook logic. | High | `team-dispatch` returns `leader_mailbox_notified` without touching tmux for `leader-fixed`, yet `team-leader-nudge` still synthesizes leader-facing reminder text from mailbox state. |
| 3 | The remaining failures are no longer only lifecycle bugs inside team runtime; some are now install-time / first-run Codex environment gates that the fork must account for explicitly. | Medium-high | Directory trust and hook review prompts are external gating surfaces seen in the installed artifact smoke. |

## Evidence paths
- `/tmp/omx-smoke-a-bewyuc0z/repo`
- `/tmp/omx-smoke-b-mb678s92/repo`
- installed package version `oh-my-codex-pennix@0.18.35`

## Follow-up questions
1. Can team worker launch proactively avoid directory trust / hook-review gating in fresh repos or worktrees?
2. Why does successful startup still record `direct_fallback`?
3. Why is HUD still auto-starting even though the fork intended HUD to stay disabled by default?
4. Should leader mailbox notifications remain mailbox-only, or should the synthetic reminder layer be removed entirely in the fork?

