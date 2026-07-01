import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { setup } from "../setup.js";
import { readUserInstallStamp } from "../update.js";

const packageRoot = process.cwd();
let previousPathForFakeCodex: string | undefined;
let fakeCodexBinDir: string | null = null;

async function readActivePackageVersion(): Promise<string> {
  const pkg = JSON.parse(
    await readFile(join(packageRoot, "package.json"), "utf-8"),
  ) as { version?: string };
  if (typeof pkg.version !== "string" || pkg.version.length === 0) {
    throw new Error("package.json version is missing");
  }
  return pkg.version;
}

async function withIsolatedUserHome<T>(
  wd: string,
  fn: (codexHomeDir: string) => Promise<T>,
): Promise<T> {
  const previousHome = process.env.HOME;
  const previousCodexHome = process.env.CODEX_HOME;
  const homeDir = join(wd, "home");
  const codexHomeDir = join(homeDir, ".codex");
  await mkdir(codexHomeDir, { recursive: true });
  process.env.HOME = homeDir;
  process.env.CODEX_HOME = codexHomeDir;
  try {
    return await fn(codexHomeDir);
  } finally {
    if (typeof previousHome === "string") process.env.HOME = previousHome;
    else delete process.env.HOME;
    if (typeof previousCodexHome === "string") process.env.CODEX_HOME = previousCodexHome;
    else delete process.env.CODEX_HOME;
  }
}

async function withTempCwd(wd: string, fn: () => Promise<void>): Promise<void> {
  const previousCwd = process.cwd();
  process.chdir(wd);
  try {
    await fn();
  } finally {
    process.chdir(previousCwd);
  }
}

describe("omx setup install stamp", () => {
  it("writes setup_completed_version after a successful explicit plugin-mode setup", async () => {
    const wd = await mkdtemp(join(tmpdir(), "omx-setup-install-stamp-"));
    try {
      const activePackageVersion = await readActivePackageVersion();
      previousPathForFakeCodex = process.env.PATH;
      fakeCodexBinDir = await mkdtemp(join(tmpdir(), "omx-fake-codex-"));
      const fakeCodexPath = join(fakeCodexBinDir, "codex");
      await writeFile(
        fakeCodexPath,
        [
          "#!/usr/bin/env node",
          "if (process.argv[2] === 'features' && process.argv[3] === 'list') {",
          "  console.log('hooks                                   stable             true');",
          "  console.log('plugin_hooks                            experimental       true');",
          "  console.log('goals                                   experimental       true');",
          "  process.exit(0);",
          "}",
          "if (process.argv.includes('--version') || process.argv[2] === '--version') {",
          "  console.log('codex-cli 0.999.0');",
          "  process.exit(0);",
          "}",
          "process.exit(0);",
          "",
        ].join("\n"),
      );
      await chmod(fakeCodexPath, 0o755);
      process.env.PATH = `${fakeCodexBinDir}${process.env.PATH ? `:${process.env.PATH}` : ""}`;

      await withIsolatedUserHome(wd, async (codexHomeDir) => {
        await withTempCwd(wd, async () => {
          const stampPath = join(codexHomeDir, ".omx", "install-state.json");
          await mkdir(join(codexHomeDir, ".omx"), { recursive: true });
          await writeFile(
            stampPath,
            JSON.stringify(
              {
                installed_version: "0.18.58",
                install_channel: "stable",
                install_source: "oh-my-codex-pennix@latest",
                updated_at: "2026-06-30T00:00:00.000Z",
              },
              null,
              2,
            ),
          );

          await setup({ scope: "user", installMode: "plugin" });

          const stamp = await readUserInstallStamp(stampPath);
          assert.equal(typeof stamp?.setup_completed_version, "string");
          assert.equal(stamp?.installed_version, activePackageVersion);
          assert.equal(stamp?.setup_completed_version, activePackageVersion);
          assert.equal(stamp?.install_channel, "stable");
          assert.equal(stamp?.install_source, "oh-my-codex-pennix@latest");
        });
      });
    } finally {
      if (previousPathForFakeCodex === undefined) delete process.env.PATH;
      else process.env.PATH = previousPathForFakeCodex;
      if (fakeCodexBinDir !== null) {
        await rm(fakeCodexBinDir, { recursive: true, force: true });
      }
      await rm(wd, { recursive: true, force: true });
    }
  });
});
