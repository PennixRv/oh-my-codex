import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mergeConfig } from "../generator.js";

describe("config generator root reasoning ownership", () => {
  it("strips historical OMX-managed root medium reasoning during merge", async () => {
    const wd = await mkdtemp(join(tmpdir(), "omx-root-reasoning-"));
    try {
      const configPath = join(wd, "config.toml");
      await writeFile(
        configPath,
        [
          "# oh-my-codex top-level settings (must be before any [table])",
          'notify = ["node", "/old/path/notify-hook.js"]',
          'model_reasoning_effort = "medium"',
          'developer_instructions = "old instructions"',
          "",
          "[features]",
          "multi_agent = true",
          "",
        ].join("\n"),
      );

      await mergeConfig(configPath, wd);
      const toml = await readFile(configPath, "utf-8");

      assert.doesNotMatch(toml, /^model_reasoning_effort = "medium"$/m);
      assert.match(toml, /^notify = \["node", ".*notify-hook\.js"\]$/m);
    } finally {
      await rm(wd, { recursive: true, force: true });
    }
  });

  it("preserves an existing root model_reasoning_effort across repeated mergeConfig runs", async () => {
    const wd = await mkdtemp(join(tmpdir(), "omx-root-reasoning-"));
    try {
      const configPath = join(wd, "config.toml");
      await writeFile(
        configPath,
        [
          "# oh-my-codex top-level settings (must be before any [table])",
          'notify = ["node", "/old/path/notify-hook.js"]',
          'model_reasoning_effort = "xhigh"',
          'developer_instructions = "old instructions"',
          "",
          "[features]",
          "multi_agent = true",
          "",
        ].join("\n"),
      );

      await mergeConfig(configPath, wd);
      await mergeConfig(configPath, wd);
      const toml = await readFile(configPath, "utf-8");

      assert.match(toml, /^model_reasoning_effort = "xhigh"$/m);
      assert.equal((toml.match(/^model_reasoning_effort\s*=/gm) ?? []).length, 1);
      assert.doesNotMatch(toml, /^model_reasoning_effort = "medium"$/m);
    } finally {
      await rm(wd, { recursive: true, force: true });
    }
  });
});
