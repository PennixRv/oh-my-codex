---
name: omx-supervisor
description: Supervise oh-my-codex ready-bead implementation lanes from bd task selection through Autopilot execution, PR creation, CI/review follow-up, merge detection, and tmux cleanup. Use when asked to run or oversee OMX agents, supervise ready-bead implementation, keep PRs healthy, monitor tmux Autopilot phases, or coordinate sequential/parallel bead-to-PR work.
---

# OMX Supervisor

Supervise lanes; do not implement project code unless explicitly taking over a lane. Fix only supervisor-local setup issues.

## Defaults and routing

Resolve env vars first, then defaults:

- `PROJECT_PATH`: `/home/tools/oh-my-codex`
- `OMX_BEADS_PATH`: `/home/tools/omx-beads/.beads/*.db`
- `PROJECT_BEADS_PATH`: first existing `<PROJECT_PATH>/.beads/*.db`, else `OMX_BEADS_PATH`
- `TMUX_SESSION`: `comfy`
- `OMX_AGENT_LINES`: `1`
- `OMX_DOGFOOD_MODE`: `stacked-prs` (`stacked-prs` or `dev-channel`)
- Poll interval: `300` seconds

Use `PROJECT_BEADS_PATH` for project implementation tasks. Use `OMX_BEADS_PATH` for Autopilot, hooks, supervisor-flow, or broader oh-my-codex defects, even when supervising another project such as `/home/tools/mediagen-comfy`. For `/home/tools/oh-my-codex`, the two paths may intentionally coincide.

## Dev preflight

Run once before lane launch. Always update Codex itself, then choose the OMX source by `OMX_DOGFOOD_MODE`:

```bash
codex update
if [ "${OMX_DOGFOOD_MODE:-stacked-prs}" = dev-channel ]; then
  omx update --dev
else
  # stacked-prs: install/use the local cumulative stack branch (dev + this operator's open PR heads), not the remote dev channel
  cd "$PROJECT_PATH"
  git fetch origin dev
  # fetch operator PR head branches in creation order, checkout the current stack head, then use the repo-local omx/runtime from that checkout/worktree
fi
codex doctor && omx doctor
```

`dev-channel` intentionally exposes fresh `omx update --dev` regressions. `stacked-prs` dogfoods the cumulative local PR stack and must not blindly replace it with `omx update --dev`. Treat warnings as supervisor risks: fix local environment/config only, otherwise record blockers. For OMX-caused defects, register evidence in `OMX_BEADS_PATH`:

```bash
bd create --db "$OMX_BEADS_PATH" "<title>" --type bug --description "<repro/evidence>"
```

## Select and launch lanes

1. Inspect ready project work: `bd ready --db "$PROJECT_BEADS_PATH" --json`.
2. Choose by severity, DAG unblock value, and dependency coherence. Pass a tightly coupled epic as one target when one PR is cleaner than splitting children.
3. Avoid deferred work or another author's active PR unless the user overrides.
4. For each lane up to `OMX_AGENT_LINES`, resolve `issue_id`, `issue_type`, and `issue_json`:

```bash
bd --db "$PROJECT_BEADS_PATH" show "$issue_id" --json
```

5. Create or reuse a task-owned tmux window in `TMUX_SESSION` named exactly `<issue_id>`; keep uniqueness/timestamps in metadata, not the visible window name. Record `issue_id`, `issue_type`, window id, pane id, cwd, PR URL when known, and current phase.
6. Resolve the dogfood stack before launch: fetch `dev`, list this operator's open PRs in creation order, and treat `dev + open PR head branches` as the current stack. Launch new work from the stack head, not necessarily raw `dev`; when opening the PR, set its GitHub base to `dev` unless the user explicitly requests a stacked branch base:

```bash
cd "$PROJECT_PATH"
git fetch origin dev
# optionally fetch this operator's open PR head branches in review/dogfood order
# use stack heads only for local dogfood validation; create PR branches as clean/self-contained commits against dev
git checkout "<dogfood-stack-head-or-dev>"
git pull --ff-only origin "<dogfood-stack-head-or-dev>" 2>/dev/null || true
omx --madmax-spark --worktree "$issue_type/$issue_id"
```

7. Send the lane task only after the Codex UI prompt is visible (`›` prompt or equivalent SessionStart/UserPromptSubmit-ready marker), not merely after the shell command prints runtime setup lines. Use precomputed JSON pasted inline, including the resolved stack head and explicit PR base `dev`. For multiline tmux handoff, always clear the composer first with `C-u` to remove stale prompts, then use `tmux load-buffer` plus `tmux paste-buffer -p -d` for bracketed paste, wait briefly, and send a bare `Enter` (not `C-m`). Re-capture the pane and, when possible, compare Codex JSONL/event offsets until Codex/OMX accepts the turn (`UserPromptSubmit`, `Working`, new assistant output, or another processing marker). If the composer still shows draft/pasted content or a confirmation prompt, send the required extra `Enter`/confirmation or report the blocker; do not treat paste/keypress success as task start.
If a lane was launched from a stacked dogfood checkout, require it to cherry-pick/rebase only its own issue commit(s) onto `origin/dev` before `gh pr create --base dev`; never publish accumulated stack history unless the user explicitly asks for a branch-base stack.

```text
$autopilot <issue_json> with Scholastic advisory passes at ralplan and code-review phases; dogfood locally on the resolved stack if useful, but publish a clean self-contained PR onto dev based on dev
```

## Supervise execution

Expected phase order:

`deep-interview => ralplan => ultragoal => code-review => ultraqa`

Require explicit evidence for each phase transition. Compare two evidence classes before allowing PR publication:

- pane transcript/progress evidence: tmux output showing implementation, tests, review text, commit, push, or `gh pr create` intent;
- hook-visible Autopilot/HUD state: the lane's current phase plus required handoff and gate artifacts recorded by hooks/HUD state.

If pane transcript progress has advanced to implementation, review, commit, push, or PR work while hook-visible Autopilot/HUD state remains in an earlier phase, is stale, or lacks the required gate artifacts for the claimed phase, mark a supervisor blocker, route corrective feedback to the lane, and prevent PR publication. Do not treat transcript progress as a substitute for formal Autopilot gate evidence.

Minimum gate checks before `gh pr create`:

- current phase has advanced through `ultragoal`, `code-review`, and `ultraqa` or the user explicitly waived the missing phase;
- deep-interview handoff artifacts are present when the lane started in Autopilot;
- ralplan architect/critic consensus artifacts are present;
- code-review evidence exists, including the separate Scholastic/ontology advisory pass;
- validation evidence is fresh and tied to the lane checkout;
- branch history is clean and self-contained against `origin/dev`, even if dogfood used a local stack.

A missing or stale hook/HUD artifact is a publication blocker unless the user explicitly waives that specific gate. When blocked, send the lane concise feedback naming the transcript signal, the missing/stale state artifact, and the repair required before PR creation.

At `ralplan` and `code-review`, run a separate Scholastic/ontology advisory pass, record evidence, and treat BLOCK/ITERATE findings as blockers.

Watch for known OMX failure classes: invalid hook JSON or Stop-hook blocking, Autopilot state stuck active, ralplan read-only false positives, quality-gate/review loops without evidence, plugin/cache/setup drift, wrong PR base/draft/rebase/maintainer instructions, CI/review feedback not routed to its lane. Register OMX defects in `OMX_BEADS_PATH`; keep project product work in `PROJECT_BEADS_PATH`.

## PR follow-up and terminal states

Keep the tmux window alive until PR terminal state or explicit blocker. Every 300 seconds inspect lane PRs:

```bash
gh pr view "$pr_url" --json url,state,isDraft,mergeStateStatus,reviewDecision,comments,reviews,statusCheckRollup
gh pr checks "$pr_url"
```

Route actionable feedback only through the recorded `issue_id -> pr_url -> tmux_pane_id` mapping, then require fresh evidence.

Terminal handling:

- Merged: send `exit` to the verified lane pane, close the captured tmux window, and update the project bead in `PROJECT_BEADS_PATH` with PR URL and merge evidence.
- Closed unmerged: record failure/blocker evidence in the project bead, then close the verified pane/window unless the user requests recovery.
- Superseded: link replacement PR/bead before closing the old lane.
- Changes requested or CI failed: keep the lane alive and route feedback back to the agent.

Before `exit` or window close, verify captured pane/window id, window name, `pane_current_path`, and current command still match the lane. Never close the currently selected tmux window by assumption.

## Output

Report selected bead, lane/window, current phase, PR URL/state, blockers, and next poll/follow-up. Do not claim completion until PR merge or explicit blocker/closed-unmerged terminal state is recorded.

## Intentional debug/dev tradeoffs

Do not raise these as review findings unless the user asks for a production-safe variant:

- `OMX_BEADS_PATH` and `PROJECT_BEADS_PATH` may be glob-like defaults resolved operationally in the local shell/context.
- `OMX_DOGFOOD_MODE=dev-channel` intentionally uses `omx update --dev`; `OMX_DOGFOOD_MODE=stacked-prs` intentionally uses the cumulative local PR stack instead.
- `omx --madmax-spark` is intentional for trusted local debug lanes in isolated worktrees.
- Dogfood worktrees may start from the cumulative stack head, but PRs normally target `dev`; use a non-`dev` PR base only when the user explicitly requests stacked branch bases.
