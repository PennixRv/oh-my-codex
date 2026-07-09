import { existsSync } from "fs";
import { copyFile, cp, lstat, mkdir, readdir, readFile, rename, rm, writeFile } from "fs/promises";
import { dirname, join, resolve } from "path";
import { OMX_FIRST_PARTY_MCP_SERVER_NAMES } from "../config/omx-first-party-mcp.js";
import { teamModeEnabled, type SetupTeamMode } from "../config/team-mode.js";

export const OMX_LOCAL_MARKETPLACE_NAME = "oh-my-codex-local";
export const OMX_PLUGIN_NAME = "oh-my-codex";
export const OMX_LOCAL_PLUGIN_CONFIG_KEY = `${OMX_PLUGIN_NAME}@${OMX_LOCAL_MARKETPLACE_NAME}`;
export const OMX_LOCAL_PLUGIN_CACHE_KEY = "local";

export interface PackagedOmxMarketplace {
	marketplacePath: string;
	packageRoot: string;
	pluginRoot: string;
	pluginManifestPath: string;
}

interface MarketplaceManifest {
	name?: unknown;
	plugins?: Array<{
		name?: unknown;
		source?: { source?: unknown; path?: unknown };
	}>;
}

interface PluginManifest {
	name?: unknown;
	version?: unknown;
	skills?: unknown;
	hooks?: unknown;
}

const OMX_PLUGIN_HOOK_LAUNCHER_FILE = "omx-command.json";
const TEAM_MODE_PLUGIN_SKILL_NAMES = new Set(["team", "worker"]);

export async function resolvePackagedOmxMarketplace(
	packageRoot: string,
): Promise<PackagedOmxMarketplace | null> {
	const marketplacePath = join(
		packageRoot,
		".agents",
		"plugins",
		"marketplace.json",
	);
	if (!existsSync(marketplacePath)) return null;

	let marketplace: MarketplaceManifest;
	try {
		marketplace = JSON.parse(
			await readFile(marketplacePath, "utf-8"),
		) as MarketplaceManifest;
	} catch {
		return null;
	}

	if (marketplace.name !== OMX_LOCAL_MARKETPLACE_NAME) return null;
	const pluginEntry = marketplace.plugins?.find(
		(entry) =>
			entry.name === OMX_PLUGIN_NAME &&
			entry.source?.source === "local" &&
			typeof entry.source.path === "string",
	);
	if (!pluginEntry || typeof pluginEntry.source?.path !== "string") return null;

	const pluginRoot = resolve(packageRoot, pluginEntry.source.path);
	const pluginManifestPath = join(pluginRoot, ".codex-plugin", "plugin.json");
	if (!existsSync(pluginManifestPath)) return null;

	try {
		const pluginManifest = JSON.parse(
			await readFile(pluginManifestPath, "utf-8"),
		) as PluginManifest;
		if (
			pluginManifest.name !== OMX_PLUGIN_NAME ||
			pluginManifest.skills !== "./skills/" ||
			pluginManifest.hooks !== "./hooks/hooks.json"
		) {
			return null;
		}
		if (
			!existsSync(join(pluginRoot, "hooks", "hooks.json")) ||
			!existsSync(join(pluginRoot, "hooks", "codex-native-hook.mjs"))
		) {
			return null;
		}
	} catch {
		return null;
	}

	return { marketplacePath, packageRoot, pluginRoot, pluginManifestPath };
}

export async function requirePackagedOmxMarketplace(
	packageRoot: string,
): Promise<PackagedOmxMarketplace> {
	const packagedMarketplace = await resolvePackagedOmxMarketplace(packageRoot);
	if (!packagedMarketplace) {
		throw new Error(
			`Plugin install mode requires packaged ${OMX_LOCAL_MARKETPLACE_NAME} marketplace metadata under ${join(
				packageRoot,
				".agents",
				"plugins",
				"marketplace.json",
			)} and a valid ${OMX_PLUGIN_NAME} plugin manifest.`,
		);
	}

	const packagedVersion = await packagedOmxPluginVersion(packagedMarketplace);
	if (!packagedVersion) {
		throw new Error(
			`Plugin install mode requires a packaged ${OMX_PLUGIN_NAME} plugin manifest version at ${packagedMarketplace.pluginManifestPath}.`,
		);
	}

	return packagedMarketplace;
}

async function readPluginManifest(
	manifestPath: string,
): Promise<PluginManifest | null> {
	try {
		return JSON.parse(await readFile(manifestPath, "utf-8")) as PluginManifest;
	} catch {
		return null;
	}
}

async function listChildDirectoryNames(dir: string): Promise<string[] | null> {
	try {
		const entries = await readdir(dir, { withFileTypes: true });
		return entries
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name)
			.sort();
	} catch {
		return null;
	}
}

export async function packagedOmxPluginVersion(
	packagedMarketplace: PackagedOmxMarketplace,
): Promise<string | null> {
	const manifest = await readPluginManifest(packagedMarketplace.pluginManifestPath);
	return typeof manifest?.version === "string" && manifest.version.trim()
		? manifest.version.trim()
		: null;
}

export async function expectedPackagedOmxSkillNames(
	packagedMarketplace: PackagedOmxMarketplace,
	options: { teamMode?: SetupTeamMode } = {},
): Promise<string[] | null> {
	const skillNames = await listChildDirectoryNames(join(packagedMarketplace.pluginRoot, "skills"));
	if (!skillNames) return null;
	return skillNames.filter((name) => (
		teamModeEnabled(options.teamMode) || !TEAM_MODE_PLUGIN_SKILL_NAMES.has(name)
	));
}

export function omxPluginCacheBase(codexHomeDir: string): string {
	return join(
		codexHomeDir,
		"plugins",
		"cache",
		OMX_LOCAL_MARKETPLACE_NAME,
		OMX_PLUGIN_NAME,
	);
}

export function omxLocalMarketplaceCacheRoot(codexHomeDir: string): string {
	return join(codexHomeDir, "plugins", "cache", OMX_LOCAL_MARKETPLACE_NAME);
}

export function omxLocalPluginCacheDir(codexHomeDir: string): string {
	return join(omxPluginCacheBase(codexHomeDir), OMX_LOCAL_PLUGIN_CACHE_KEY);
}

export async function discoverOmxPluginCacheDirs(
	codexHomeDir: string,
): Promise<string[]> {
	const cacheRoot = join(codexHomeDir, "plugins", "cache");
	if (!existsSync(cacheRoot)) return [];

	const queue: Array<{ path: string; depth: number }> = [
		{ path: cacheRoot, depth: 0 },
	];
	const maxDepth = 5;
	const matches: string[] = [];

	while (queue.length > 0) {
		const current = queue.shift();
		if (!current) break;

		const manifestPath = join(current.path, ".codex-plugin", "plugin.json");
		if (existsSync(manifestPath)) {
			const manifest = await readPluginManifest(manifestPath);
			if (manifest?.name === OMX_PLUGIN_NAME) {
				matches.push(current.path);
				continue;
			}
		}

		if (current.depth >= maxDepth) continue;

		let entries;
		try {
			entries = await readdir(current.path, { withFileTypes: true });
		} catch {
			continue;
		}

		for (const entry of entries) {
			if (!entry.isDirectory()) continue;
			if (entry.name === ".git" || entry.name === "node_modules") continue;
			queue.push({
				path: join(current.path, entry.name),
				depth: current.depth + 1,
			});
		}
	}

	return matches.sort();
}

export interface OmxPluginCacheState {
	cacheDir: string;
	manifestVersion: string | null;
	skillsPointer: string | null;
	skillNames: string[] | null;
	hooksPointer: string | null;
	hookLauncherPinned: boolean;
}

export async function readOmxPluginCacheState(
	cacheDir: string,
): Promise<OmxPluginCacheState | null> {
	const manifest = await readPluginManifest(
		join(cacheDir, ".codex-plugin", "plugin.json"),
	);
	if (manifest?.name !== OMX_PLUGIN_NAME) return null;
	return {
		cacheDir,
		manifestVersion:
			typeof manifest.version === "string" ? manifest.version : null,
		skillsPointer: typeof manifest.skills === "string" ? manifest.skills : null,
		skillNames: await listChildDirectoryNames(join(cacheDir, "skills")),
		hooksPointer: typeof manifest.hooks === "string" ? manifest.hooks : null,
		hookLauncherPinned: existsSync(
			join(cacheDir, "hooks", OMX_PLUGIN_HOOK_LAUNCHER_FILE),
		),
	};
}

export async function hasExpectedOmxPluginCache(
	codexHomeDir: string,
	packagedMarketplace: PackagedOmxMarketplace,
	options: { teamMode?: SetupTeamMode } = {},
): Promise<boolean> {
	const expectedSkillNames = await expectedPackagedOmxSkillNames(
		packagedMarketplace,
		options,
	);
	if (!expectedSkillNames) return false;
	const state = await readOmxPluginCacheState(
		omxLocalPluginCacheDir(codexHomeDir),
	);
	if (
		state?.manifestVersion !== OMX_LOCAL_PLUGIN_CACHE_KEY ||
		state.skillsPointer !== "./skills/" ||
		state.hooksPointer !== "./hooks/hooks.json" ||
		!state.hookLauncherPinned ||
		!existsSync(join(state.cacheDir, "hooks", "hooks.json")) ||
		!existsSync(join(state.cacheDir, "hooks", "codex-native-hook.mjs")) ||
		JSON.stringify(state.skillNames) !== JSON.stringify(expectedSkillNames)
	) {
		return false;
	}

	return pluginHookCacheMatchesPackaged(state.cacheDir, packagedMarketplace);
}

async function rewritePluginManifestVersion(
	cacheDir: string,
): Promise<void> {
	const manifestPath = join(cacheDir, ".codex-plugin", "plugin.json");
	const manifest = await readPluginManifest(manifestPath);
	if (!manifest || manifest.name !== OMX_PLUGIN_NAME) {
		throw new Error(`invalid OMX plugin manifest at ${manifestPath}`);
	}
	await writeFile(
		manifestPath,
		`${JSON.stringify(
			{
				...manifest,
				version: OMX_LOCAL_PLUGIN_CACHE_KEY,
				skills: "./skills/",
				hooks: "./hooks/hooks.json",
			},
			null,
			2,
		)}\n`,
	);
}

async function fileContentsEqual(leftPath: string, rightPath: string): Promise<boolean> {
	try {
		const [left, right] = await Promise.all([
			readFile(leftPath),
			readFile(rightPath),
		]);
		return left.equals(right);
	} catch {
		return false;
	}
}

/**
 * Compares only plugin-scoped hook assets that Codex executes from the cache.
 * Manifest pointers and skill lists are validated by callers before using this
 * as a hook/launcher freshness predicate.
 */
export async function pluginHookCacheMatchesPackaged(
	cacheDir: string,
	packagedMarketplace: PackagedOmxMarketplace,
): Promise<boolean> {
	return await fileContentsEqual(
		join(cacheDir, "hooks", "hooks.json"),
		join(packagedMarketplace.pluginRoot, "hooks", "hooks.json"),
	) && await fileContentsEqual(
		join(cacheDir, "hooks", "codex-native-hook.mjs"),
		join(packagedMarketplace.pluginRoot, "hooks", "codex-native-hook.mjs"),
	) && await pinnedHookLauncherMatchesPackaged(
		cacheDir,
		packagedMarketplace,
	);
}

function buildPinnedHookLauncherContent(
	packagedMarketplace: PackagedOmxMarketplace,
): string {
	return `${JSON.stringify(
		{
			command: process.execPath,
			argsPrefix: [join(packagedMarketplace.packageRoot, "dist", "cli", "omx.js")],
		},
		null,
		2,
	)}\n`;
}

async function pinnedHookLauncherMatchesPackaged(
	cacheDir: string,
	packagedMarketplace: PackagedOmxMarketplace,
): Promise<boolean> {
	try {
		return await readFile(
			join(cacheDir, "hooks", OMX_PLUGIN_HOOK_LAUNCHER_FILE),
			"utf-8",
		) === buildPinnedHookLauncherContent(packagedMarketplace);
	} catch {
		return false;
	}
}

async function writePinnedHookLauncher(
	cacheDir: string,
	packagedMarketplace: PackagedOmxMarketplace,
): Promise<void> {
	await writeFile(
		join(cacheDir, "hooks", OMX_PLUGIN_HOOK_LAUNCHER_FILE),
		buildPinnedHookLauncherContent(packagedMarketplace),
	);
}

async function applyTeamModeToPluginCache(
	cacheDir: string,
	teamMode: SetupTeamMode | undefined,
): Promise<void> {
	if (teamModeEnabled(teamMode)) return;
	for (const skillName of TEAM_MODE_PLUGIN_SKILL_NAMES) {
		await rm(join(cacheDir, "skills", skillName), { recursive: true, force: true });
	}
}

export interface OmxPluginCacheMaterializeResult {
	status: "unavailable" | "unchanged" | "materialized";
	cacheDir?: string;
	version?: string;
}

export async function materializePackagedOmxPluginCache(
	codexHomeDir: string,
	packagedMarketplace: PackagedOmxMarketplace | null,
	options: { dryRun?: boolean; teamMode?: SetupTeamMode } = {},
): Promise<OmxPluginCacheMaterializeResult> {
	if (!packagedMarketplace) return { status: "unavailable" };
	const version = await packagedOmxPluginVersion(packagedMarketplace);
	if (!version) return { status: "unavailable" };
	const cacheDir = omxLocalPluginCacheDir(codexHomeDir);
	if (await hasExpectedOmxPluginCache(codexHomeDir, packagedMarketplace, options)) {
		return { status: "unchanged", cacheDir, version };
	}
	if (!options.dryRun) {
		await materializePackagedOmxPluginCacheInPlace(
			cacheDir,
			packagedMarketplace,
			options,
		);
	}
	return { status: "materialized", cacheDir, version };
}

async function materializePackagedOmxPluginCacheInPlace(
	cacheDir: string,
	packagedMarketplace: PackagedOmxMarketplace,
	options: { teamMode?: SetupTeamMode } = {},
): Promise<void> {
	const stagingDir = `${cacheDir}.staging-${process.pid}-${Date.now()}`;
	await rm(stagingDir, { recursive: true, force: true });
	await mkdir(dirname(cacheDir), { recursive: true });
	try {
		await cp(packagedMarketplace.pluginRoot, stagingDir, { recursive: true });
		await applyTeamModeToPluginCache(stagingDir, options.teamMode);
		await rewritePluginManifestVersion(stagingDir);
		await writePinnedHookLauncher(stagingDir, packagedMarketplace);
		await mergePluginCacheIntoExistingDir(stagingDir, cacheDir);
	} finally {
		await rm(stagingDir, { recursive: true, force: true });
	}
}

async function mergePluginCacheIntoExistingDir(
	stagingDir: string,
	cacheDir: string,
): Promise<void> {
	if (!existsSync(cacheDir)) {
		await rename(stagingDir, cacheDir);
		return;
	}

	await syncPluginCacheTree(stagingDir, cacheDir);
}

async function syncPluginCacheTree(
	sourceDir: string,
	destinationDir: string,
): Promise<void> {
	await mkdir(destinationDir, { recursive: true });
	const sourceEntries = await readdir(sourceDir, { withFileTypes: true });
	const sourceEntryNames = new Set(sourceEntries.map((entry) => entry.name));
	const destinationEntries = await readdir(destinationDir, { withFileTypes: true }).catch(() => []);

	for (const destinationEntry of destinationEntries) {
		if (sourceEntryNames.has(destinationEntry.name)) continue;
		await rm(join(destinationDir, destinationEntry.name), {
			recursive: true,
			force: true,
		});
	}

	for (const sourceEntry of sourceEntries) {
		const sourcePath = join(sourceDir, sourceEntry.name);
		const destinationPath = join(destinationDir, sourceEntry.name);
		if (sourceEntry.isDirectory()) {
			await syncPluginCacheTree(sourcePath, destinationPath);
			continue;
		}

		await mkdir(dirname(destinationPath), { recursive: true });
		const destinationStat = await lstat(destinationPath).catch(() => null);
		if (destinationStat?.isDirectory()) {
			await rm(destinationPath, { recursive: true, force: true });
		}
		await copyFile(sourcePath, destinationPath);
	}
}

function marketplaceTableHeaderPattern(): RegExp {
	return new RegExp(
		`^\\s*\\[marketplaces\\.${OMX_LOCAL_MARKETPLACE_NAME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]\\s*$`,
	);
}

function isTomlTableHeader(line: string): boolean {
	return /^\s*\[/.test(line);
}

export function stripLocalOmxMarketplaceRegistration(config: string): string {
	return stripTomlTablesByHeaderPattern(config, marketplaceTableHeaderPattern());
}

export function buildLocalOmxMarketplaceRegistration(
	packageRoot: string,
): string {
	return [
		`[marketplaces.${OMX_LOCAL_MARKETPLACE_NAME}]`,
		`source_type = "local"`,
		`source = ${JSON.stringify(packageRoot)}`,
	].join("\n");
}

export function upsertLocalOmxMarketplaceRegistration(
	config: string,
	packageRoot: string,
): string {
	const stripped = stripLocalOmxMarketplaceRegistration(config).trimEnd();
	const registration = buildLocalOmxMarketplaceRegistration(packageRoot);
	return `${stripped ? `${stripped}\n\n` : ""}${registration}\n`;
}

function localPluginTableHeaderPattern(): RegExp {
	return new RegExp(
		`^\\s*\\[plugins\\.${JSON.stringify(OMX_LOCAL_PLUGIN_CONFIG_KEY).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]\\s*$`,
	);
}

function localPluginTableOrSubtableHeaderPattern(): RegExp {
	return new RegExp(
		`^\\s*\\[plugins\\.${JSON.stringify(OMX_LOCAL_PLUGIN_CONFIG_KEY).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\]|\\.)`,
	);
}

function localPluginMcpServerTableHeaderPattern(serverName: string): RegExp {
	return new RegExp(
		`^\\s*\\[plugins\\.${JSON.stringify(OMX_LOCAL_PLUGIN_CONFIG_KEY).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.mcp_servers\\.${serverName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]\\s*$`,
	);
}

export function hasLocalOmxPluginMcpServerRegistrations(config: string): boolean {
	const lines = config.split(/\r?\n/);
	return OMX_FIRST_PARTY_MCP_SERVER_NAMES.some((serverName) =>
		lines.some((line) => localPluginMcpServerTableHeaderPattern(serverName).test(line)),
	);
}

export function stripLocalOmxPluginMcpServerRegistrations(config: string): string {
	let next = config;
	for (const serverName of OMX_FIRST_PARTY_MCP_SERVER_NAMES) {
		next = stripTomlTablesByHeaderPattern(
			next,
			localPluginMcpServerTableHeaderPattern(serverName),
		);
	}
	return next;
}

export function stripLocalOmxPluginRegistrations(config: string): string {
	return stripTomlTablesByHeaderPattern(
		config,
		localPluginTableOrSubtableHeaderPattern(),
	);
}

function stripTomlTablesByHeaderPattern(config: string, headerPattern: RegExp): string {
	let lines = config.split(/\r?\n/);
	while (true) {
		const start = lines.findIndex((line) => headerPattern.test(line));
		if (start < 0) break;
		let end = lines.length;
		for (let index = start + 1; index < lines.length; index += 1) {
			if (isTomlTableHeader(lines[index])) {
				end = index;
				break;
			}
		}
		lines = [...lines.slice(0, start), ...lines.slice(end)];
	}
	return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
}

function upsertTomlTableBooleanKey(
	config: string,
	header: string,
	headerPattern: RegExp,
	key: string,
	value: boolean,
	options: { create: boolean },
): string {
	const lines = config.split(/\r?\n/);
	const start = lines.findIndex((line) => headerPattern.test(line));

	if (start < 0) {
		if (!options.create) return config;
		const base = config.trimEnd();
		return `${base ? `${base}\n\n` : ""}${header}\n${key} = ${value ? "true" : "false"}\n`;
	}

	let end = lines.length;
	for (let index = start + 1; index < lines.length; index += 1) {
		if (isTomlTableHeader(lines[index])) {
			end = index;
			break;
		}
	}

	let keyIndex = -1;
	for (let index = start + 1; index < end; index += 1) {
		if (new RegExp(`^\\s*${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*=`).test(lines[index])) {
			if (keyIndex < 0) {
				keyIndex = index;
				lines[index] = `${key} = ${value ? "true" : "false"}`;
			} else {
				lines.splice(index, 1);
				index -= 1;
				end -= 1;
			}
		}
	}

	if (keyIndex < 0) {
		lines.splice(start + 1, 0, `${key} = ${value ? "true" : "false"}`);
	}

	return lines.join("\n").replace(/\n*$/, "\n");
}

export function upsertLocalOmxPluginEnablement(config: string): string {
	const stripped = stripTomlTablesByHeaderPattern(
		config,
		localPluginTableHeaderPattern(),
	).trimEnd();
	return `${stripped ? `${stripped}\n\n` : ""}[plugins.${JSON.stringify(OMX_LOCAL_PLUGIN_CONFIG_KEY)}]\nenabled = true\n`;
}

export function upsertLocalOmxPluginMcpServerEnablement(
	config: string,
	enabled: boolean,
	options: { removeWhenDisabled?: boolean } = {},
): string {
	if (!enabled && options.removeWhenDisabled) {
		const stripped = stripLocalOmxPluginMcpServerRegistrations(config);
		return stripped ? `${stripped}\n` : "";
	}
	if (!enabled) {
		return config;
	}
	let next = stripLocalOmxPluginMcpServerRegistrations(config);
	for (const serverName of OMX_FIRST_PARTY_MCP_SERVER_NAMES) {
		const header = `[plugins.${JSON.stringify(OMX_LOCAL_PLUGIN_CONFIG_KEY)}.mcp_servers.${serverName}]`;
		const headerPattern = localPluginMcpServerTableHeaderPattern(serverName);
		next = upsertTomlTableBooleanKey(next, header, headerPattern, "enabled", enabled, {
			create: enabled,
		});
	}
	return next;
}
