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
  it("writes the model-only native status line on fresh setup", async () => {
    const wd = await mkdtemp(join(tmpdir(), "omx-setup-native-status-"));
    try {
      await mkdir(join(wd, ".omx", "state"), { recursive: true });

      await runSetupInTempDir(wd, { scope: "project" });

      const config = await readFile(join(wd, ".codex", "config.toml"), "utf-8");
      const omxConfig = JSON.parse(
        await readFile(join(process.env.HOME ?? "", ".codex", ".omx-config.json"), "utf-8"),
      ) as {
        tmuxStatusBar?: { cch?: { sessionsCacheSeconds?: number } };
      };
      assert.match(config, /^\[tui\]$/m);
      assert.match(config, /^# omx:managed-status-line$/m);
      assert.match(config, /^status_line = \["model-with-reasoning"\]$/m);
      assert.doesNotMatch(
        config,
        /^status_line = \["model-with-reasoning", "git-branch"\]$/m,
      );
      assert.equal(omxConfig.tmuxStatusBar?.cch?.sessionsCacheSeconds, 5);
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
      assert.match(managedRefresh, /^status_line = \["model-with-reasoning"\]$/m);
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
      assert.doesNotMatch(userOwned, /^status_line = \["model-with-reasoning"\]$/m);
    } finally {
      await rm(wd, { recursive: true, force: true });
    }
  });

  it("migrates the marked legacy hidden status line to the model-only value", async () => {
    const wd = await mkdtemp(join(tmpdir(), "omx-setup-native-status-"));
    try {
      await mkdir(join(wd, ".omx", "state"), { recursive: true });
      await mkdir(join(wd, ".codex"), { recursive: true });
      await writeFile(
        join(wd, ".codex", "config.toml"),
        [
          "[tui]",
          "# omx:managed-status-line",
          "status_line = []",
          "",
        ].join("\n"),
      );

      await runSetupInTempDir(wd, { scope: "project" });

      const migrated = await readFile(join(wd, ".codex", "config.toml"), "utf-8");
      assert.match(migrated, /^status_line = \["model-with-reasoning"\]$/m);
      assert.doesNotMatch(migrated, /^status_line = \[\]$/m);
    } finally {
      await rm(wd, { recursive: true, force: true });
    }
  });

  it("migrates the unmarked legacy focused status line to the model-only value", async () => {
    const wd = await mkdtemp(join(tmpdir(), "omx-setup-native-status-"));
    try {
      await mkdir(join(wd, ".omx", "state"), { recursive: true });
      await mkdir(join(wd, ".codex"), { recursive: true });
      await writeFile(
        join(wd, ".codex", "config.toml"),
        [
          "[tui]",
          'status_line = ["model-with-reasoning", "git-branch", "context-remaining", "total-input-tokens", "total-output-tokens", "five-hour-limit", "weekly-limit"]',
          "",
        ].join("\n"),
      );

      await runSetupInTempDir(wd, { scope: "project" });

      const migrated = await readFile(join(wd, ".codex", "config.toml"), "utf-8");
      assert.match(migrated, /^status_line = \["model-with-reasoning"\]$/m);
      assert.doesNotMatch(migrated, /"weekly-limit"/);
    } finally {
      await rm(wd, { recursive: true, force: true });
    }
  });
});
