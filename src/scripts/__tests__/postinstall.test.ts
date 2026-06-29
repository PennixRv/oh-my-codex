import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { writeUserInstallStamp } from "../../cli/update.js";
import {
  isGlobalInstallLifecycle,
  runPostinstall,
} from "../postinstall.js";

describe("isGlobalInstallLifecycle", () => {
  it("accepts npm_config_global=true", () => {
    assert.equal(isGlobalInstallLifecycle({ npm_config_global: "true" }), true);
  });

  it("accepts npm_config_location=global", () => {
    assert.equal(isGlobalInstallLifecycle({ npm_config_location: "global" }), true);
  });

  it("rejects local installs", () => {
    assert.equal(isGlobalInstallLifecycle({ npm_config_global: "false" }), false);
  });
});

describe("runPostinstall", () => {
  it("runs automatic plugin setup and marks setup completed for bumped global installs", async () => {
    const root = await mkdtemp(join(tmpdir(), "omx-postinstall-"));
    const stampPath = join(root, ".codex", ".omx", "install-state.json");
    const logs: string[] = [];
    let setupCalls = 0;

    try {
      const result = await runPostinstall({
        env: { npm_config_global: "true" },
        getCurrentVersion: async () => "0.14.1",
        log: (message) => logs.push(message),
        readStamp: async () => ({
          installed_version: "0.14.0",
          setup_completed_version: "0.14.0",
          updated_at: "2026-04-20T00:00:00.000Z",
        }),
        runSetup: async () => {
          setupCalls += 1;
        },
        writeStamp: async (stamp) => writeUserInstallStamp(stamp, stampPath),
      });

      assert.equal(result.status, "setup-completed");
      assert.equal(setupCalls, 1);
      assert.match(logs.join("\n"), /completed automatic plugin setup/);

      const stamp = JSON.parse(await readFile(stampPath, "utf-8")) as {
        installed_version: string;
        setup_completed_version: string;
      };
      assert.equal(stamp.installed_version, "0.14.1");
      assert.equal(stamp.setup_completed_version, "0.14.1");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("preserves prior setup state when automatic setup fails", async () => {
    const root = await mkdtemp(join(tmpdir(), "omx-postinstall-"));
    const stampPath = join(root, ".codex", ".omx", "install-state.json");
    const logs: string[] = [];

    try {
      const result = await runPostinstall({
        env: { npm_config_global: "true" },
        getCurrentVersion: async () => "0.14.1",
        log: (message) => logs.push(message),
        readStamp: async () => ({
          installed_version: "0.14.0",
          setup_completed_version: "0.14.0",
          updated_at: "2026-04-20T00:00:00.000Z",
        }),
        runSetup: async () => {
          throw new Error("boom");
        },
        writeStamp: async (stamp) => writeUserInstallStamp(stamp, stampPath),
      });

      assert.equal(result.status, "setup-failed");
      assert.match(logs.join("\n"), /automatic plugin setup did not complete/i);
      assert.match(logs.join("\n"), /Run `omx setup` or `omx doctor`/i);

      const stamp = JSON.parse(await readFile(stampPath, "utf-8")) as {
        installed_version: string;
        setup_completed_version: string;
      };
      assert.equal(stamp.installed_version, "0.14.1");
      assert.equal(stamp.setup_completed_version, "0.14.0");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("skips local installs", async () => {
    const result = await runPostinstall({
      env: { npm_config_global: "false" },
      getCurrentVersion: async () => "0.14.1",
    });

    assert.equal(result.status, "noop-local");
  });

  it("does not rerun setup when the installed version matches the saved stamp", async () => {
    const result = await runPostinstall({
      env: { npm_config_global: "true" },
      getCurrentVersion: async () => "0.14.1",
      readStamp: async () => ({
        installed_version: "0.14.1",
        setup_completed_version: "0.14.1",
        updated_at: "2026-04-20T00:00:00.000Z",
      }),
    });

    assert.equal(result.status, "noop-same-version");
  });
});
