import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  materializePackagedOmxPluginCache,
  OMX_LOCAL_PLUGIN_CACHE_KEY,
  OMX_LOCAL_MARKETPLACE_NAME,
  OMX_PLUGIN_NAME,
  omxLocalPluginCacheDir,
  resolvePackagedOmxMarketplace,
  upsertLocalOmxPluginEnablement,
  upsertLocalOmxPluginMcpServerEnablement,
} from "../plugin-marketplace.js";

function repoRoot(): string {
  const testDir = dirname(fileURLToPath(import.meta.url));
  return join(testDir, "..", "..", "..");
}

async function packagedPluginVersion(): Promise<string> {
  const manifest = JSON.parse(
    await readFile(
      join(repoRoot(), "plugins", "oh-my-codex", ".codex-plugin", "plugin.json"),
      "utf-8",
    ),
  ) as { version?: unknown };
  if (typeof manifest.version !== "string") {
    assert.fail("packaged plugin manifest version must be a string");
  }
  return manifest.version;
}

async function packagedMarketplace() {
  const packaged = await resolvePackagedOmxMarketplace(repoRoot());
  assert.ok(packaged, "expected packaged OMX marketplace metadata");
  return packaged;
}

function versionScopedCacheDir(codexHomeDir: string, version: string): string {
  return join(
    codexHomeDir,
    "plugins",
    "cache",
    OMX_LOCAL_MARKETPLACE_NAME,
    OMX_PLUGIN_NAME,
    version,
  );
}

describe("plugin marketplace cache lifecycle", () => {
  it("preserves historical version-scoped plugin caches when materializing the stable local cache", async () => {
    const wd = await mkdtemp(join(tmpdir(), "omx-plugin-marketplace-"));
    try {
      const codexHomeDir = join(wd, "home", ".codex");
      const historicalDir = versionScopedCacheDir(codexHomeDir, "0.0.0-still-running");
      await mkdir(join(historicalDir, ".codex-plugin"), { recursive: true });
      await mkdir(join(historicalDir, "hooks"), { recursive: true });
      await writeFile(
        join(historicalDir, ".codex-plugin", "plugin.json"),
        JSON.stringify(
          {
            name: OMX_PLUGIN_NAME,
            version: "0.0.0-still-running",
            skills: "./skills/",
            hooks: "./hooks/hooks.json",
          },
          null,
          2,
        ),
      );
      await writeFile(join(historicalDir, "hooks", "codex-native-hook.mjs"), "// historical\n");
      await writeFile(join(historicalDir, "hooks", "hooks.json"), "{\"hooks\":{}}\n");
      await writeFile(join(historicalDir, "hooks", "omx-command.json"), "{}\n");

      const result = await materializePackagedOmxPluginCache(
        codexHomeDir,
        await packagedMarketplace(),
      );

      assert.equal(result.status, "materialized");
      assert.equal(existsSync(join(historicalDir, "hooks", "codex-native-hook.mjs")), true);
      const localCacheDir = omxLocalPluginCacheDir(codexHomeDir);
      assert.equal(
        existsSync(join(localCacheDir, "hooks", "codex-native-hook.mjs")),
        true,
      );
      const manifest = JSON.parse(
        await readFile(join(localCacheDir, ".codex-plugin", "plugin.json"), "utf-8"),
      ) as { version?: unknown };
      assert.equal(manifest.version, OMX_LOCAL_PLUGIN_CACHE_KEY);
    } finally {
      await rm(wd, { recursive: true, force: true });
    }
  });

  it("refreshes the stable local cache in place without dropping the hook entrypoint path", async () => {
    const wd = await mkdtemp(join(tmpdir(), "omx-plugin-marketplace-"));
    try {
      const codexHomeDir = join(wd, "home", ".codex");
      await packagedPluginVersion();
      const cacheDir = omxLocalPluginCacheDir(codexHomeDir);
      await mkdir(dirname(cacheDir), { recursive: true });
      await cp(join(repoRoot(), "plugins", "oh-my-codex"), cacheDir, {
        recursive: true,
      });
      await writeFile(
        join(cacheDir, ".codex-plugin", "plugin.json"),
        JSON.stringify(
          {
            name: OMX_PLUGIN_NAME,
            version: OMX_LOCAL_PLUGIN_CACHE_KEY,
            skills: "./skills/",
            hooks: "./hooks/hooks.json",
          },
          null,
          2,
        ) + "\n",
      );
      await writeFile(
        join(cacheDir, "hooks", "omx-command.json"),
        JSON.stringify({ command: "/stale/node", argsPrefix: ["/stale/omx.js"] }, null, 2) + "\n",
      );
      const hookPath = join(cacheDir, "hooks", "codex-native-hook.mjs");
      assert.equal(existsSync(hookPath), true);

      const result = await materializePackagedOmxPluginCache(
        codexHomeDir,
        await packagedMarketplace(),
      );

      assert.equal(result.status, "materialized");
      assert.equal(existsSync(hookPath), true);
      const launcher = JSON.parse(
        await readFile(join(cacheDir, "hooks", "omx-command.json"), "utf-8"),
      ) as { command?: string; argsPrefix?: string[] };
      assert.equal(launcher.command, process.execPath);
      assert.deepEqual(launcher.argsPrefix, [join(repoRoot(), "dist", "cli", "omx.js")]);
      const manifest = JSON.parse(
        await readFile(join(cacheDir, ".codex-plugin", "plugin.json"), "utf-8"),
      ) as { version?: unknown };
      assert.equal(manifest.version, OMX_LOCAL_PLUGIN_CACHE_KEY);
    } finally {
      await rm(wd, { recursive: true, force: true });
    }
  });

  it("dedupes repeated local plugin enablement tables into one canonical table", () => {
    const next = upsertLocalOmxPluginEnablement(
      [
        '[plugins."oh-my-codex@oh-my-codex-local"]',
        "enabled = false",
        "",
        '[plugins."oh-my-codex@oh-my-codex-local"]',
        "enabled = true",
        "",
      ].join("\n"),
    );

    assert.equal(
      next.split(/\r?\n/).filter((line) => /\[plugins\."oh-my-codex@oh-my-codex-local"\]/.test(line)).length,
      1,
    );
    assert.equal(next.split(/\r?\n/).filter((line) => /^\s*enabled\s*=/.test(line)).length, 1);
    assert.match(next, /enabled = true/);
  });

  it("dedupes repeated first-party MCP server tables before rewriting plugin compat enablement", () => {
    const next = upsertLocalOmxPluginMcpServerEnablement(
      [
        '[plugins."oh-my-codex@oh-my-codex-local".mcp_servers.omx_state]',
        "enabled = false",
        "",
        '[plugins."oh-my-codex@oh-my-codex-local".mcp_servers.omx_state]',
        "enabled = true",
        "",
      ].join("\n"),
      true,
    );

    assert.equal(
      next.split(/\r?\n/).filter((line) => /mcp_servers\.omx_state\]/.test(line)).length,
      1,
    );
    assert.equal(next.split(/\r?\n/).filter((line) => /^\s*enabled\s*=/.test(line)).length >= 1, true);
    assert.match(next, /enabled = true/);
  });
});
