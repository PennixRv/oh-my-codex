---
title: "Upstream Integration Wave 3D Matrix 2026-07-01"
tags: ["upstream", "integration", "wave-3d", "resume", "session-search", "madmax", "history"]
created: 2026-07-01T17:17:13.000Z
updated: 2026-07-01T17:17:13.000Z
sources: []
links: ["upstream-integration-wave-3b-matrix-2026-07-01.md", "upstream-integration-wave-3c-matrix-2026-07-01.md"]
category: architecture
confidence: high
schemaVersion: 1
---

# Upstream Integration Wave 3D Matrix 2026-07-01

## Scope

This bounded wave absorbs the remaining upstream resume/session-history correctness fixes that were still missing in the Pennix fork:

- `9da99f4d` — preserve project codex transcripts on cleanup
- `24294fc2` — improve project resume/search discovery
- `62a6b783` — discover madmax run histories for resume search
- `27742da5` — dedupe symlinked runtime history

Wave 3D stays inside the user-approved boundary:

- no publish/tag/reinstall
- no release-flow changes
- no leader/worker mailbox behavior changes
- no HUD/default hook behavior changes

## Decisions

| Upstream commit/theme | Area | Decision | Notes |
| --- | --- | --- | --- |
| `9da99f4d` preserve project transcripts on cleanup | project-scope runtime `CODEX_HOME` cleanup | `adapt` | Implemented. Runtime `sessions`, `history.jsonl`, and `session_index.jsonl` now persist back into durable project scope instead of being discarded with the temporary runtime home. |
| `24294fc2` improve project resume/search discovery | `omx resume`, `omx session search` | `adapt` | Implemented. Project runtime Codex homes are now included in resume/search discovery. `--codex-home` and `--project` resume/search selection now work as explicit surfaces instead of leaking through to Codex. |
| `62a6b783` discover madmax run histories | `resume`, `session search` | `adapt` | Implemented. Associated madmax boxed run roots are discovered through the run registry/metadata and merged into resume/search without exposing raw run-root paths in search output. |
| `27742da5` dedupe symlinked runtime history | runtime history merge | `adapt` | Implemented. Runtime history merges now dedupe by source realpath and handle symlinked `history.jsonl` / `session_index.jsonl` safely, avoiding duplicate lines and `EISDIR`-style merge failures. |

## Implemented changes

- `src/cli/project-runtime-codex-homes.ts`
  - added bounded discovery of generated project runtime Codex homes under `.omx/runtime/codex-home`
  - added associated madmax run-root discovery through:
    - `OMX_RUNS_DIR/registry.jsonl`
    - per-run `.omxbox-run.json`
  - normalized associated madmax sources to public labels like `madmax:omx-...`
- `src/cli/index.ts`
  - added durable runtime history handling for project-scope launches:
    - `sessions`
    - `history.jsonl`
    - `session_index.jsonl`
  - persisted runtime transcripts/history back into durable project scope during cleanup
  - added `parseResumeCodexHomeSelection(...)`
  - added `prepareResumeCodexHomeForLaunch(...)`
  - `resume` now supports:
    - `--codex-home <path>` explicit escape hatch
    - `--project` project-runtime-only resume selection
    - inclusion of associated project/madmax runtime histories for plain resume
  - hardened history merge against symlinked duplicate sources via source realpath tracking
- `src/session-history/search.ts`
  - added multi-source session history search across:
    - default `CODEX_HOME`
    - generated project runtime homes
    - associated madmax run-root homes
  - added explicit `codexHomeDirs` support
  - added `sources` to the structured report
  - preserved friendly/public transcript source labels rather than leaking raw madmax run-root paths
- `src/cli/session-search.ts`
  - added `--codex-home <path>` parsing/help
- tests
  - `src/cli/__tests__/resume.test.ts`
    - added coverage for cleanup persistence
    - project runtime inclusion
    - symlinked runtime merge safety
    - repeated runtime dedupe
    - `--codex-home`
    - `--project`
    - madmax associated runtime inclusion
  - `src/cli/__tests__/session-search.test.ts`
    - added runtime home discovery coverage
    - added madmax search coverage
    - added explicit `--codex-home` coverage
  - `src/cli/__tests__/session-search-help.test.ts`
    - updated help expectations for `resume` / `session`
  - `src/session-history/__tests__/search.test.ts`
    - added multi-home discovery coverage
    - added source-report/limit behavior coverage
    - added explicit escape-hatch coverage

## Findings First

1. The pre-wave fork only mirrored history into the temporary runtime `CODEX_HOME`; it did not reliably persist newly created transcripts/history back into durable project scope.
   - That meant `resume` could see old project history at launch time but silently lose new history at cleanup time.
2. Resume/search discovery was still effectively single-home unless the user manually pointed `CODEX_HOME` at the right place.
   - Generated runtime homes and madmax-associated run roots were not first-class search/resume sources yet.
3. Symlinked runtime homes are not a cosmetic edge case.
   - Without realpath-based dedupe, repeated merges can duplicate history lines or collide with directory-vs-file expectations when a runtime source is actually a symlink into the durable project home.
4. Search output needs a privacy-safe/public source surface for madmax runs.
   - The useful operator signal is that the match came from an associated madmax runtime lane, not the raw filesystem path to the run root.

## Validation

- `npm run build`
- `node dist/scripts/run-test-files.js dist/cli/__tests__/resume.test.js dist/cli/__tests__/session-search.test.js dist/cli/__tests__/session-search-help.test.js dist/session-history/__tests__/search.test.js`

All targeted Wave 3D suites passed after the adaptation.

## Exit status

Wave 3D is complete and locally validated.

Practical outcome:

- `omx resume` now sees and preserves the right history surfaces for project scope, project-generated runtimes, and associated madmax runs
- `omx session search` now searches the same effective history surface with an explicit `--codex-home` escape hatch
- symlinked runtime history no longer creates duplicate merge artifacts or file/directory merge hazards
