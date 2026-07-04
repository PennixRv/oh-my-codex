import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { setup } from "../setup.js";

const TEST_CODEX_PROBES = {
  codexFeaturesProbe: () => null,
  codexVersionProbe: () => "codex-cli 0.142.5",
} satisfies Parameters<typeof setup>[0];

async function runSetupInTempDir(
  wd: string,
  options: Parameters<typeof setup>[0],
): Promise<void> {
  const previousCwd = process.cwd();
  process.chdir(wd);
  try {
    await setup({ ...TEST_CODEX_PROBES, ...options });
  } finally {
    process.chdir(previousCwd);
  }
}

describe("setup native status line management", () => {
  it("writes an empty [tui].status_line on fresh setup to suppress the Codex default footer", async () => {
    const wd = await mkdtemp(join(tmpdir(), "omx-setup-native-status-"));
    try {
      await mkdir(join(wd, ".omx", "state"), { recursive: true });

      await runSetupInTempDir(wd, { scope: "project" });

      const config = await readFile(join(wd, ".codex", "config.toml"), "utf-8");
      assert.match(config, /^\[tui\]$/m);
      assert.match(config, /^# omx:managed-status-line$/m);
      assert.match(config, /^status_line = \[\]$/m);
      assert.doesNotMatch(
        config,
        /^status_line = \["model-with-reasoning", "context-remaining", "current-dir"\]$/m,
      );
    } finally {
      await rm(wd, { recursive: true, force: true });
    }
  });

  it("replaces only OMX-managed status_line values and preserves user customizations", async () => {
    const wd = await mkdtemp(join(tmpdir(), "omx-setup-native-status-"));
    try {
      await mkdir(join(wd, ".omx", "state"), { recursive: true });
      await mkdir(join(wd, ".codex"), { recursive: true });
      await writeFile(
        join(wd, ".codex", "config.toml"),
        [
          '[tui]',
          'theme = "night"',
          '# omx:managed-status-line',
          'status_line = ["model-with-reasoning", "git-branch"]',
          "",
        ].join("\n"),
      );

      await runSetupInTempDir(wd, { scope: "project" });

      const managedRefresh = await readFile(
        join(wd, ".codex", "config.toml"),
        "utf-8",
      );
      assert.match(managedRefresh, /^theme = "night"$/m);
      assert.match(managedRefresh, /^status_line = \[\]$/m);
      assert.doesNotMatch(
        managedRefresh,
        /^status_line = \["model-with-reasoning", "git-branch"\]$/m,
      );

      await writeFile(
        join(wd, ".codex", "config.toml"),
        [
          '[tui]',
          'theme = "night"',
          'status_line = ["git-branch"]',
          "",
        ].join("\n"),
      );

      await runSetupInTempDir(wd, { scope: "project" });

      const userOwned = await readFile(join(wd, ".codex", "config.toml"), "utf-8");
      assert.match(userOwned, /^theme = "night"$/m);
      assert.match(userOwned, /^status_line = \["git-branch"\]$/m);
      assert.doesNotMatch(userOwned, /^status_line = \[\]$/m);
    } finally {
      await rm(wd, { recursive: true, force: true });
    }
  });
});
