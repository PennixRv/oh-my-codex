import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setup } from "../setup.js";
import {
	upsertLocalOmxMarketplaceRegistration,
	upsertLocalOmxPluginEnablement,
} from "../plugin-marketplace.js";

const packageRoot = process.cwd();
let previousPathForFakeCodex: string | undefined;
let fakeCodexBinDir: string | null = null;

before(async () => {
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
});

after(async () => {
	if (previousPathForFakeCodex === undefined) {
		delete process.env.PATH;
	} else {
		process.env.PATH = previousPathForFakeCodex;
	}
	if (fakeCodexBinDir !== null) {
		await rm(fakeCodexBinDir, { recursive: true, force: true });
	}
});

async function withTempCwd<T>(wd: string, fn: () => Promise<T>): Promise<T> {
	const previousCwd = process.cwd();
	process.chdir(wd);
	try {
		return await fn();
	} finally {
		process.chdir(previousCwd);
	}
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
		if (typeof previousCodexHome === "string") {
			process.env.CODEX_HOME = previousCodexHome;
		} else {
			delete process.env.CODEX_HOME;
		}
	}
}

async function captureConsoleOutput(fn: () => Promise<void>): Promise<string> {
	const previousConsoleLog = console.log;
	const lines: string[] = [];
	console.log = (...args: unknown[]) => {
		lines.push(args.map((arg) => String(arg)).join(" "));
	};
	try {
		await fn();
	} finally {
		console.log = previousConsoleLog;
	}
	return lines.join("\n");
}

describe("omx setup install mode regressions", () => {
	it("defaults to plugin mode when existing Codex config already advertises OMX plugin mode", async () => {
		const wd = await mkdtemp(join(tmpdir(), "omx-setup-install-mode-regression-"));
		try {
			await withIsolatedUserHome(wd, async (codexHomeDir) => {
				const configPath = join(codexHomeDir, "config.toml");
				const pluginCacheDir = join(
					codexHomeDir,
					"plugins",
					"cache",
					"oh-my-codex-local",
					"oh-my-codex",
					"local",
				);
				const config = upsertLocalOmxMarketplaceRegistration(
					upsertLocalOmxPluginEnablement('hooks = true\ngoals = true\n'),
					packageRoot,
				);
				await writeFile(configPath, config);

				await withTempCwd(wd, async () => {
					await setup({ scope: "user" });
				});

				const persisted = JSON.parse(
					await readFile(join(wd, ".omx", "setup-scope.json"), "utf-8"),
				) as { scope: string; installMode?: string; mcpMode?: string };
				assert.deepEqual(persisted, {
					scope: "user",
					installMode: "plugin",
					mcpMode: "none",
				});
				assert.equal(
					existsSync(join(codexHomeDir, "skills", "ask", "SKILL.md")),
					false,
					"plugin-mode inference must not reinstall legacy skill copies",
				);
				assert.equal(
					existsSync(join(pluginCacheDir, ".codex-plugin", "plugin.json")),
					true,
					"plugin-mode inference should still materialize the local plugin cache",
				);
			});
		} finally {
			await rm(wd, { recursive: true, force: true });
		}
	});

	it("preserves user root/provider config while plugin setup cleans malformed Codex NUX tables", async () => {
		const wd = await mkdtemp(join(tmpdir(), "omx-setup-plugin-nux-repair-"));
		try {
			await withIsolatedUserHome(wd, async (codexHomeDir) => {
				const configPath = join(codexHomeDir, "config.toml");
				await writeFile(
					configPath,
					[
						'model = "gpt-5.4"',
						'model_provider = "cch"',
						'model_reasoning_summary = "detailed"',
						'plan_mode_reasoning_effort = "xhigh"',
						"",
						"[model_providers.cch]",
						'name = "cch"',
						'base_url = "https://cch.example.test/v1"',
						'wire_api = "responses"',
						"requires_openai_auth = true",
						"",
						"[agents]",
						"max_threads = 6",
						"max_depth = 2",
						"",
						"[tui]",
						'theme = "dark"',
						"",
						"[tui.model_availability_nux]",
						'"gpt-5.5" = 4',
						"",
						"[tui.model_availability_nux.gpt-5]",
						"5 = 1",
						"",
					].join("\n"),
				);

				await withTempCwd(wd, async () => {
					await setup({ scope: "user", installMode: "plugin", force: true });
				});

				const config = await readFile(configPath, "utf-8");
				assert.match(config, /^model = "gpt-5\.4"$/m);
				assert.match(config, /^model_provider = "cch"$/m);
				assert.match(config, /^model_reasoning_summary = "detailed"$/m);
				assert.match(config, /^\[model_providers\.cch\]$/m);
				assert.match(
					config,
					/^base_url = "https:\/\/cch\.example\.test\/v1"$/m,
				);
				assert.doesNotMatch(config, /^\[tui\.model_availability_nux\]$/m);
				assert.doesNotMatch(config, /^\[tui\.model_availability_nux\./m);
				assert.doesNotMatch(config, /^"gpt-5\.5" = 4$/m);
				assert.doesNotMatch(config, /^5 = 1$/m);
				assert.match(config, /^hooks = true$/m);
				assert.match(config, /^goals = true$/m);
			});
		} finally {
			await rm(wd, { recursive: true, force: true });
		}
	});

	it("keeps plugin-mode setup on the bootstrap surfaces by default", async () => {
		const wd = await mkdtemp(join(tmpdir(), "omx-setup-plugin-bootstrap-"));
		try {
			await withIsolatedUserHome(wd, async (codexHomeDir) => {
				await withTempCwd(wd, async () => {
					const output = await captureConsoleOutput(async () => {
						await setup({ scope: "user", installMode: "plugin" });
					});

					assert.equal(existsSync(join(codexHomeDir, "hooks.json")), false);
					assert.equal(
						existsSync(join(codexHomeDir, "skills", "ask", "SKILL.md")),
						false,
					);
					assert.equal(
						existsSync(join(codexHomeDir, "prompts", "executor.md")),
						false,
					);
					assert.equal(
						existsSync(join(codexHomeDir, "agents", "planner.toml")),
						true,
					);
					assert.equal(existsSync(join(codexHomeDir, "AGENTS.md")), true);

					const config = await readFile(
						join(codexHomeDir, "config.toml"),
						"utf-8",
					);
					assert.match(config, /^hooks = true$/m);
					assert.match(config, /^goals = true$/m);
					assert.doesNotMatch(config, /^developer_instructions\s*=/m);
					assert.doesNotMatch(config, /^\s*\[mcp_servers[.\]]/m);

					const agentsMd = await readFile(
						join(codexHomeDir, "AGENTS.md"),
						"utf-8",
					);
					assert.match(agentsMd, /<!-- omx:generated:agents-md -->/);
					assert.match(
						agentsMd,
						/Plugin setup resolves bundled workflows through the registered Codex marketplace\/plugin while still installing native-agent TOMLs for `agent_type` routing/,
					);
					assert.match(
						agentsMd,
						/Role prompts, skill instructions, hook-injected routing context, and developer_instructions are narrower execution surfaces/,
					);
					assert.match(
						agentsMd,
						/Do not assume plugin mode copies bundled prompt\/skill files into local `.codex\/` directories/,
					);

					assert.match(
						output,
						/Registered Codex marketplace oh-my-codex-local supplies OMX skills and workflow surfaces/,
					);
					assert.match(
						output,
						/Plugin-mode AGENTS\.md defaults provide the persistent OMX bootstrap; developer_instructions stays user-owned and is not injected by default/,
					);
					assert.doesNotMatch(
						output,
						/Use role\/workflow keywords like \$architect, \$executor, and \$plan/,
					);
				});
			});
		} finally {
			await rm(wd, { recursive: true, force: true });
		}
	});

	it("can opt into plugin-mode developer_instructions without reviving local prompt copies", async () => {
		const wd = await mkdtemp(join(tmpdir(), "omx-setup-plugin-developer-instructions-"));
		try {
			await withIsolatedUserHome(wd, async (codexHomeDir) => {
				await withTempCwd(wd, async () => {
					await setup({
						scope: "user",
						installMode: "plugin",
						pluginDeveloperInstructionsPrompt: async () => true,
					});

					const config = await readFile(
						join(codexHomeDir, "config.toml"),
						"utf-8",
					);
					assert.match(config, /^developer_instructions\s*=/m);
					assert.match(
						config,
						/<omx version=\\"1\\">You have Pennix OMX installed through Codex plugin mode/,
					);
					assert.equal(
						existsSync(join(codexHomeDir, "prompts", "executor.md")),
						false,
					);
					assert.equal(
						existsSync(join(codexHomeDir, "skills", "ask", "SKILL.md")),
						false,
					);
				});
			});
		} finally {
			await rm(wd, { recursive: true, force: true });
		}
	});

	it("uses project-scope plugin AGENTS wording without legacy prompt or agent home paths", async () => {
		const wd = await mkdtemp(join(tmpdir(), "omx-setup-plugin-project-wording-"));
		try {
			await withIsolatedUserHome(wd, async () => {
				await withTempCwd(wd, async () => {
					const output = await captureConsoleOutput(async () => {
						await setup({ scope: "project", installMode: "plugin" });
					});

					const agentsMd = await readFile(join(wd, "AGENTS.md"), "utf-8");
					assert.match(
						agentsMd,
						/Plugin setup resolves bundled workflows through the registered Codex marketplace\/plugin while still installing native-agent TOMLs for `agent_type` routing/,
					);
					assert.match(
						agentsMd,
						/User-installed skills may still live under `\.\/\.codex\/skills` for project scope, or `~\/\.codex\/skills` for separately installed user-level skills/,
					);
					assert.doesNotMatch(agentsMd, /`~\/\.codex\/prompts`/);
					assert.doesNotMatch(agentsMd, /`~\/\.codex\/agents`/);

					assert.match(output, /Using setup install mode: plugin/);
					assert.match(
						output,
						/Registered Codex marketplace oh-my-codex-local supplies OMX skills and workflow surfaces/,
					);
					assert.doesNotMatch(
						output,
						/Native agent defaults configured.*TOML files written to \.codex\/agents\//,
					);
				});
			});
		} finally {
			await rm(wd, { recursive: true, force: true });
		}
	});
});
