/**
 * omx uninstall - Remove oh-my-codex-pennix configuration and installed artifacts
 */

import { readFile, writeFile, readdir, rm } from "fs/promises";
import { existsSync } from "fs";
import { join, basename, dirname } from "path";
import TOML from "@iarna/toml";
import {
  formatTomlStringArray,
  getRootTomlArray,
  isOmxManagedNotifyCommand,
  sanitizePreviousNotifyCommand,
  stripExistingOmxBlocks,
  stripManagedOmxDeveloperInstructions,
  stripManagedLegacyRootReasoning,
  stripOmxEnvSettings,
  stripOmxTopLevelKeys,
  stripOmxFeatureFlags,
  upsertCodexHooksFeatureFlag,
  stripOmxSeededBehavioralDefaults,
  stripManagedCodexHookTrustState,
} from "../config/generator.js";
import {
  hasUserCodexHooksAfterManagedRemoval,
  parseCodexHooksConfig,
  removeManagedCodexHooks,
} from "../config/codex-hooks.js";
import {
  OMX_LOCAL_PLUGIN_CONFIG_KEY,
  omxPluginCacheBase,
  stripLocalOmxMarketplaceRegistration,
  stripLocalOmxPluginRegistrations,
} from "./plugin-marketplace.js";
import {
  OMX_DISPLAY_NAME,
  getPackageRoot,
} from "../utils/package.js";
import { AGENT_DEFINITIONS } from "../agents/definitions.js";
import { detectLegacySkillRootOverlap } from "../utils/paths.js";
import { resolveScopeDirectories, type SetupScope } from "./setup.js";
import { resolveCodexHookFeatureFlagForCli } from "./codex-feature-probe.js";
import { readPersistedSetupScope } from "./index.js";
import { isOmxGeneratedAgentsMd } from "../utils/agents-md.js";
import { OMX_FIRST_PARTY_MCP_SERVER_NAMES } from "../config/omx-first-party-mcp.js";
import { removeManagedTmuxStatusArtifacts } from "../tmux-status/install.js";

export interface UninstallOptions {
  codexFeaturesProbe?: () => string | null;
  codexVersionProbe?: () => string | null;
  dryRun?: boolean;
  keepConfig?: boolean;
  verbose?: boolean;
  purge?: boolean;
  scope?: SetupScope;
}

interface UninstallSummary {
  configCleaned: boolean;
  mcpServersRemoved: string[];
  agentEntriesRemoved: number;
  tuiSectionRemoved: boolean;
  topLevelKeysRemoved: boolean;
  featureFlagsRemoved: boolean;
  hooksFileRemoved: boolean;
  tmuxConfigCleaned: boolean;
  tmuxStatusArtifactsRemoved: number;
  promptsRemoved: number;
  skillsRemoved: number;
  agentConfigsRemoved: number;
  installArtifactsRemoved: number;
  agentsMdRemoved: boolean;
  cacheDirectoryRemoved: boolean;
  pluginCacheRemoved: boolean;
  legacySkillRootWarning: string | null;
}

function detectOmxConfigArtifacts(config: string): {
  hasMcpServers: string[];
  hasAgentEntries: number;
  hasTuiSection: boolean;
  hasTopLevelKeys: boolean;
  hasFeatureFlags: boolean;
  hasExploreRoutingEnv: boolean;
} {
  const hasMcpServers = OMX_FIRST_PARTY_MCP_SERVER_NAMES.filter((name) =>
    new RegExp(`\\[mcp_servers\\.${name}\\]`).test(config),
  );

  const agentNames = Object.keys(AGENT_DEFINITIONS);
  let hasAgentEntries = 0;
  for (const name of agentNames) {
    const tableKey = name.includes("-") ? `agents."${name}"` : `agents.${name}`;
    if (config.includes(`[${tableKey}]`)) {
      hasAgentEntries++;
    }
  }

  const hasTuiSection =
    /^\[tui\]/m.test(config) &&
    /oh-my-codex(?:-pennix)? \(OMX\) Configuration/.test(config);

  const hasTopLevelKeys =
    /^\s*notify\s*=.*node/m.test(config) ||
    /# oh-my-codex(?:-pennix)? top-level settings \(must be before any \[table\]\)\r?\n(?:\s*notify\s*=.*\r?\n)?\s*model_reasoning_effort\s*=\s*"medium"/m.test(config) ||
    /^\s*developer_instructions\s*=/m.test(config);

  const hasFeatureFlags =
    /^\s*multi_agent\s*=\s*true/m.test(config) ||
    /^\s*child_agents_md\s*=\s*true/m.test(config) ||
    /^\s*plugin_hooks\s*=\s*true/m.test(config) ||
    /^\s*hooks\s*=\s*true/m.test(config) ||
    /^\s*codex_hooks\s*=\s*true/m.test(config) ||
    /^\s*goals\s*=\s*true/m.test(config) ||
    /^\s*goal\s*=\s*true/m.test(config);
  const hasExploreRoutingEnv = /^\s*USE_OMX_EXPLORE_CMD\s*=/m.test(config);

  return {
    hasMcpServers,
    hasAgentEntries,
    hasTuiSection,
    hasTopLevelKeys,
    hasFeatureFlags,
    hasExploreRoutingEnv,
  };
}

function cleanupDeveloperInstructionsRootKey(config: string): string {
  const parsed = parseRootDeveloperInstructions(config);
  if (!parsed) return config;
  const { cleaned, removed, removedHistorical } = stripManagedOmxDeveloperInstructions(
    parsed.value,
  );
  if (!removed && !removedHistorical) return config;
  if (cleaned.length === 0) {
    return removeRootTomlKeyCompat(config, "developer_instructions");
  }
  return replaceRootTomlKeyCompat(
    config,
    "developer_instructions",
    `developer_instructions = ${JSON.stringify(cleaned)}`,
  );
}

function parseRootDeveloperInstructions(
  config: string,
): { value: string } | null {
  try {
    const parsed = TOML.parse(config) as Record<string, unknown>;
    return typeof parsed.developer_instructions === "string"
      ? { value: parsed.developer_instructions }
      : null;
  } catch {
    return null;
  }
}

function findRootTomlKeyRangeCompat(
  config: string,
  key: string,
): { start: number; end: number } | null {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const keyPattern = new RegExp(`^\\s*${escapedKey}\\s*=`);
  const nextRootKeyPattern = /^\s*[A-Za-z0-9_-]+\s*=/;
  const tablePattern = /^\s*\[/;
  const linePattern = /.*(?:\r?\n|$)/g;
  let match: RegExpExecArray | null;
  let found: { start: number; end: number } | null = null;
  let inMultiline = false;
  let multilineDelimiter: '"""' | "'''" | null = null;

  while ((match = linePattern.exec(config)) && match[0] !== "") {
    const line = match[0];
    const lineStart = match.index;
    const lineEnd = lineStart + line.length;
    const trimmedLine = line.replace(/\r?\n$/, "");

    if (!found) {
      if (tablePattern.test(trimmedLine)) return null;
      if (keyPattern.test(trimmedLine)) {
        found = { start: lineStart, end: lineEnd };
        const valuePart = trimmedLine.slice(trimmedLine.indexOf("=") + 1);
        const delimiter = valuePart.includes('"""')
          ? '"""'
          : valuePart.includes("'''")
            ? "'''"
            : null;
        if (delimiter && valuePart.split(delimiter).length - 1 === 1) {
          inMultiline = true;
          multilineDelimiter = delimiter;
        } else {
          return found;
        }
      }
      continue;
    }

    found.end = lineEnd;
    if (inMultiline && multilineDelimiter) {
      if (trimmedLine.includes(multilineDelimiter)) {
        return found;
      }
      continue;
    }
    if (tablePattern.test(trimmedLine) || nextRootKeyPattern.test(trimmedLine)) {
      found.end = lineStart;
      return found;
    }
  }

  return found;
}

function removeRootTomlKeyCompat(config: string, key: string): string {
  const range = findRootTomlKeyRangeCompat(config, key);
  if (!range) return config;
  const before = config.slice(0, range.start);
  const after = config.slice(range.end).replace(/^\r?\n?/, "\n");
  return `${before}${after}`;
}

function replaceRootTomlKeyCompat(config: string, key: string, line: string): string {
  const range = findRootTomlKeyRangeCompat(config, key);
  if (!range) return config;
  const before = config.slice(0, range.start);
  const after = config.slice(range.end).replace(/^\r?\n?/, "\n");
  return `${before}${line}${after}`.replace(/\n?$/, "\n");
}

function hasNativeHooksFeatureFlag(config: string): boolean {
  const lines = config.split(/\r?\n/);
  const featuresStart = lines.findIndex((line) =>
    /^\s*\[features\]\s*$/.test(line),
  );
  if (featuresStart < 0) return false;

  let sectionEnd = lines.length;
  for (let i = featuresStart + 1; i < lines.length; i++) {
    if (/^\s*\[\[?[^\]]+\]?\]\s*$/.test(lines[i])) {
      sectionEnd = i;
      break;
    }
  }

  return lines
    .slice(featuresStart + 1, sectionEnd)
    .some((line) => /^\s*(?:plugin_hooks|hooks|codex_hooks)\s*=\s*true/.test(line));
}

function stripPluginScopedHookTrustState(config: string): string {
  const lines = config.split(/\r?\n/);
  const kept: string[] = [];
  const managedPrefix = `${OMX_LOCAL_PLUGIN_CONFIG_KEY}:`;

  for (let i = 0; i < lines.length;) {
    const match = lines[i]?.match(
      /^\s*\[hooks\.state\."((?:\\.|[^"\\])*)"\]\s*(?:#.*)?$/,
    );
    if (!match || !(match[1] ?? "").startsWith(managedPrefix)) {
      kept.push(lines[i] ?? "");
      i += 1;
      continue;
    }

    let tableEnd = lines.length;
    for (let next = i + 1; next < lines.length; next += 1) {
      if (/^\s*\[\[?[^\]]+\]?\]\s*(?:#.*)?$/.test(lines[next] ?? "")) {
        tableEnd = next;
        break;
      }
    }
    i = tableEnd;
  }

  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
}

async function shouldPreserveHooksFeatureFlag(
  hooksFilePath: string,
): Promise<boolean> {
  if (!existsSync(hooksFilePath)) return false;

  try {
    const existing = await readFile(hooksFilePath, "utf-8");
    return hasUserCodexHooksAfterManagedRemoval(existing);
  } catch {
    return false;
  }
}

function insertRootTomlKey(config: string, line: string): string {
  const lines = config.split(/\r?\n/);
  const firstTableIndex = lines.findIndex((candidate) =>
    /^\s*\[/.test(candidate),
  );
  const insertAt = firstTableIndex >= 0 ? firstTableIndex : lines.length;
  lines.splice(insertAt, 0, line);
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

async function restorePreviousNotifyIfDispatcher(
  configPath: string,
  strippedConfig: string,
  originalConfig: string,
): Promise<string> {
  const currentNotify = getRootTomlArray(originalConfig, "notify");
  if (
    !isOmxManagedNotifyCommand(currentNotify, getPackageRoot()) ||
    !currentNotify?.some((part) =>
      /(?:^|[\\/])notify-dispatcher\.js$/.test(part),
    )
  ) {
    return strippedConfig;
  }

  const metadataPath = join(dirname(configPath), ".omx", "notify-dispatch.json");
  try {
    const metadata = JSON.parse(await readFile(metadataPath, "utf-8")) as {
      previousNotify?: unknown;
    };
    const previousNotify = metadata.previousNotify;
    if (
      Array.isArray(previousNotify) &&
      previousNotify.every((item) => typeof item === "string")
    ) {
      const sanitizedPreviousNotify = sanitizePreviousNotifyCommand(
        previousNotify,
        getPackageRoot(),
      );
      if (sanitizedPreviousNotify) {
        return insertRootTomlKey(
          strippedConfig,
          `notify = ${formatTomlStringArray(sanitizedPreviousNotify)}`,
        );
      }
    }
  } catch {
    // Missing or malformed metadata means uninstall falls back to removing OMX notify.
  }
  return strippedConfig;
}

async function cleanConfig(
  configPath: string,
  options: Pick<
    UninstallOptions,
    "dryRun" | "verbose" | "codexFeaturesProbe" | "codexVersionProbe"
  > & {
    preserveHooksFeatureFlag?: boolean;
  },
): Promise<
  Pick<
    UninstallSummary,
    | "configCleaned"
    | "mcpServersRemoved"
    | "agentEntriesRemoved"
    | "tuiSectionRemoved"
    | "topLevelKeysRemoved"
    | "featureFlagsRemoved"
  >
> {
  const result = {
    configCleaned: false,
    mcpServersRemoved: [] as string[],
    agentEntriesRemoved: 0,
    tuiSectionRemoved: false,
    topLevelKeysRemoved: false,
    featureFlagsRemoved: false,
  };

  if (!existsSync(configPath)) {
    if (options.verbose) console.log("  config.toml not found, skipping.");
    return result;
  }

  const original = await readFile(configPath, "utf-8");
  const detected = detectOmxConfigArtifacts(original);
  const shouldRestoreHooksFeatureFlag =
    options.preserveHooksFeatureFlag && hasNativeHooksFeatureFlag(original);

  result.mcpServersRemoved = detected.hasMcpServers;
  result.agentEntriesRemoved = detected.hasAgentEntries;
  result.tuiSectionRemoved = detected.hasTuiSection;
  result.topLevelKeysRemoved = detected.hasTopLevelKeys;
  result.featureFlagsRemoved = detected.hasFeatureFlags;

  // Strip OMX tables block (MCP servers, agents, tui)
  let config = original;
  const { cleaned } = stripExistingOmxBlocks(config);
  config = cleaned;
  config = stripManagedCodexHookTrustState(config);
  config = stripPluginScopedHookTrustState(config);
  config = stripLocalOmxPluginRegistrations(config);
  config = stripLocalOmxMarketplaceRegistration(config);

  // Strip OMX top-level keys, then restore a pre-existing user notify when
  // setup had wrapped it in the OMX dispatcher.
  config = stripManagedLegacyRootReasoning(config);
  config = cleanupDeveloperInstructionsRootKey(config);
  config = stripOmxTopLevelKeys(config, ["notify"]);
  config = await restorePreviousNotifyIfDispatcher(configPath, config, original);

  // Strip OMX-seeded behavioral defaults only when the seeded pair is unchanged.
  config = stripOmxSeededBehavioralDefaults(config);

  // Strip feature flags
  config = stripOmxFeatureFlags(config, {
    preserveCodexManagedFlags: true,
  });
  if (shouldRestoreHooksFeatureFlag) {
    config = upsertCodexHooksFeatureFlag(
      config,
      resolveCodexHookFeatureFlagForCli({
        codexFeaturesProbe: options.codexFeaturesProbe,
        codexVersionProbe: options.codexVersionProbe,
      }),
    );
  }

  // Strip OMX-managed env defaults
  config = stripOmxEnvSettings(config);

  // Normalize trailing whitespace
  config = config.trimEnd() + "\n";

  if (config !== original) {
    result.configCleaned = true;
    if (!options.dryRun) {
      await writeFile(configPath, config);
    }
    if (options.verbose) {
      console.log(
        `  ${options.dryRun ? "Would clean" : "Cleaned"} ${configPath}`,
      );
    }
  } else {
    if (options.verbose) console.log("  No OMX config entries found.");
  }

  return result;
}

async function removeInstalledPrompts(
  promptsDir: string,
  pkgRoot: string,
  options: Pick<UninstallOptions, "dryRun" | "verbose">,
): Promise<number> {
  const srcPromptsDir = join(pkgRoot, "prompts");
  if (!existsSync(srcPromptsDir) || !existsSync(promptsDir)) return 0;

  let removed = 0;
  const sourceFiles = await readdir(srcPromptsDir);

  for (const file of sourceFiles) {
    if (!file.endsWith(".md")) continue;
    const installed = join(promptsDir, file);
    if (!existsSync(installed)) continue;

    if (!options.dryRun) {
      await rm(installed, { force: true });
    }
    if (options.verbose)
      console.log(
        `  ${options.dryRun ? "Would remove" : "Removed"} prompt: ${file}`,
      );
    removed++;
  }

  return removed;
}

async function removeInstalledSkills(
  skillsDir: string,
  pkgRoot: string,
  options: Pick<UninstallOptions, "dryRun" | "verbose">,
): Promise<number> {
  const srcSkillsDir = join(pkgRoot, "skills");
  if (!existsSync(srcSkillsDir) || !existsSync(skillsDir)) return 0;

  let removed = 0;
  const sourceEntries = await readdir(srcSkillsDir, { withFileTypes: true });

  for (const entry of sourceEntries) {
    if (!entry.isDirectory()) continue;
    const installed = join(skillsDir, entry.name);
    if (!existsSync(installed)) continue;

    if (!options.dryRun) {
      await rm(installed, { recursive: true, force: true });
    }
    if (options.verbose)
      console.log(
        `  ${options.dryRun ? "Would remove" : "Removed"} skill: ${entry.name}/`,
      );
    removed++;
  }

  return removed;
}

async function removeAgentConfigs(
  agentsDir: string,
  options: Pick<UninstallOptions, "dryRun" | "verbose">,
): Promise<number> {
  if (!existsSync(agentsDir)) return 0;

  let removed = 0;
  const agentNames = Object.keys(AGENT_DEFINITIONS);

  for (const name of agentNames) {
    const configFile = join(agentsDir, `${name}.toml`);
    if (!existsSync(configFile)) continue;

    if (!options.dryRun) {
      await rm(configFile, { force: true });
    }
    if (options.verbose)
      console.log(
        `  ${options.dryRun ? "Would remove" : "Removed"} agent config: ${name}.toml`,
      );
    removed++;
  }

  // If the agents dir is now empty, remove it too
  if (!options.dryRun && existsSync(agentsDir)) {
    try {
      const remaining = await readdir(agentsDir);
      if (remaining.length === 0) {
        await rm(agentsDir, { recursive: true, force: true });
        if (options.verbose) console.log("  Removed empty agents directory.");
      }
    } catch {
      // Ignore errors when cleaning up empty dir
    }
  }

  return removed;
}

async function removeAgentsMd(
  agentsMdPath: string,
  options: Pick<UninstallOptions, "dryRun" | "verbose">,
): Promise<boolean> {
  if (!existsSync(agentsMdPath)) return false;

  try {
    const content = await readFile(agentsMdPath, "utf-8");
    if (!isOmxGeneratedAgentsMd(content)) {
      if (options.verbose)
        console.log("  AGENTS.md is not OMX-generated, skipping.");
      return false;
    }
  } catch {
    return false;
  }

  if (!options.dryRun) {
    await rm(agentsMdPath, { force: true });
  }
  if (options.verbose)
    console.log(`  ${options.dryRun ? "Would remove" : "Removed"} AGENTS.md`);
  return true;
}

async function removeHooksFile(
  hooksFilePath: string,
  options: Pick<UninstallOptions, "dryRun" | "verbose">,
): Promise<boolean> {
  if (!existsSync(hooksFilePath)) return false;

  const existing = await readFile(hooksFilePath, "utf-8");
  const { nextContent, removedCount } = removeManagedCodexHooks(existing);
  const parsed = parseCodexHooksConfig(existing);
  const emptyManagedArtifact =
    parsed !== null &&
    Object.keys(parsed.hooks).length === 0 &&
    Object.keys(parsed.root).every((key) => key === "hooks");

  if (removedCount === 0 && !emptyManagedArtifact) return false;

  if (!options.dryRun) {
    if (nextContent === null || emptyManagedArtifact) {
      await rm(hooksFilePath, { force: true });
    } else {
      await writeFile(hooksFilePath, nextContent);
    }
  }
  if (options.verbose) {
    console.log(
      `  ${options.dryRun ? "Would clean" : nextContent === null || emptyManagedArtifact ? "Removed" : "Cleaned"} ${basename(hooksFilePath)}`,
    );
  }
  return true;
}

async function removeCacheDirectory(
  projectRoot: string,
  options: Pick<UninstallOptions, "dryRun" | "verbose">,
): Promise<boolean> {
  const omxDir = join(projectRoot, ".omx");
  if (!existsSync(omxDir)) return false;

  if (!options.dryRun) {
    await rm(omxDir, { recursive: true, force: true });
  }
  if (options.verbose)
    console.log(`  ${options.dryRun ? "Would remove" : "Removed"} ${omxDir}`);
  return true;
}

async function removeManagedInstallArtifacts(
  codexHomeDir: string,
  options: Pick<UninstallOptions, "dryRun" | "verbose">,
): Promise<number> {
  const omxRoot = join(codexHomeDir, ".omx");
  const managedArtifacts = [
    join(omxRoot, "install-state.json"),
    join(omxRoot, "native-agents.json"),
  ];

  let removedCount = 0;
  for (const artifactPath of managedArtifacts) {
    if (!existsSync(artifactPath)) continue;
    if (!options.dryRun) {
      await rm(artifactPath, { force: true });
    }
    removedCount += 1;
    if (options.verbose) {
      console.log(
        `  ${options.dryRun ? "Would remove" : "Removed"} ${artifactPath}`,
      );
    }
  }

  if (!options.dryRun && existsSync(omxRoot)) {
    try {
      const remainingEntries = await readdir(omxRoot);
      if (remainingEntries.length === 0) {
        await rm(omxRoot, { recursive: true, force: true });
      }
    } catch {
      // Ignore empty-dir cleanup failures.
    }
  }

  return removedCount;
}

async function removePluginCacheDirectory(
  codexHomeDir: string,
  options: Pick<UninstallOptions, "dryRun" | "verbose">,
): Promise<boolean> {
  const pluginCacheRoot = omxPluginCacheBase(codexHomeDir);
  if (!existsSync(pluginCacheRoot)) return false;

  if (!options.dryRun) {
    await rm(pluginCacheRoot, { recursive: true, force: true });
    const marketplaceRoot = dirname(pluginCacheRoot);
    const cacheRoot = dirname(marketplaceRoot);
    try {
      const remainingMarketplaceEntries = await readdir(marketplaceRoot);
      if (remainingMarketplaceEntries.length === 0) {
        await rm(marketplaceRoot, { recursive: true, force: true });
      }
    } catch {
      // Ignore empty-dir cleanup failures.
    }
    try {
      const remainingCacheEntries = await readdir(cacheRoot);
      if (remainingCacheEntries.length === 0) {
        await rm(cacheRoot, { recursive: true, force: true });
      }
    } catch {
      // Ignore empty-dir cleanup failures.
    }
  }
  if (options.verbose) {
    console.log(
      `  ${options.dryRun ? "Would remove" : "Removed"} ${pluginCacheRoot}`,
    );
  }
  return true;
}

async function detectLegacySkillRootWarning(
  scope: SetupScope,
): Promise<string | null> {
  if (scope !== "user") return null;

  const overlap = await detectLegacySkillRootOverlap();
  if (!overlap.legacyExists || overlap.sameResolvedTarget) {
    return null;
  }

  if (overlap.overlappingSkillNames.length === 0) {
    return (
      `legacy ~/.agents/skills still exists (${overlap.legacySkillCount} skills). ` +
      "omx uninstall does not remove that historical root automatically; " +
      "archive or remove ~/.agents/skills if Codex still shows stale or duplicate skills"
    );
  }

  const mismatchMessage =
    overlap.mismatchedSkillNames.length > 0
      ? `; ${overlap.mismatchedSkillNames.length} differ in SKILL.md content`
      : "";
  return (
    `${overlap.overlappingSkillNames.length} overlapping skill names remain between ` +
    `${overlap.canonicalDir} and ${overlap.legacyDir}${mismatchMessage}. ` +
    "omx uninstall only removes the active canonical skill root; " +
    "archive or remove ~/.agents/skills if Codex still shows duplicates"
  );
}

function printSummary(summary: UninstallSummary, dryRun: boolean): void {
  const prefix = dryRun ? "[dry-run] Would remove" : "Removed";

  console.log("\nUninstall summary:");

  if (summary.configCleaned) {
    console.log(`  ${prefix} OMX configuration block from config.toml`);
    if (summary.mcpServersRemoved.length > 0) {
      console.log(`    MCP servers: ${summary.mcpServersRemoved.join(", ")}`);
    }
    if (summary.agentEntriesRemoved > 0) {
      console.log(`    Agent entries: ${summary.agentEntriesRemoved}`);
    }
    if (summary.tuiSectionRemoved) {
      console.log("    TUI status line section");
    }
    if (summary.topLevelKeysRemoved) {
      console.log(
        "    Top-level keys (notify, developer_instructions, managed legacy reasoning keys)",
      );
    }
    if (summary.featureFlagsRemoved) {
      console.log(
        "    Feature flags (multi_agent, child_agents_md, goals; hooks preserved when user hooks remain)",
      );
    }
  } else if (!summary.configCleaned && summary.mcpServersRemoved.length === 0) {
    console.log("  config.toml: no OMX entries found (or --keep-config used)");
  }

  if (summary.hooksFileRemoved) {
    console.log(`  ${prefix} OMX-managed entries in .codex/hooks.json`);
  }
  if (summary.tmuxConfigCleaned) {
    console.log(`  ${prefix} OMX-managed block in ~/.tmux.conf`);
  }
  if (summary.tmuxStatusArtifactsRemoved > 0) {
    console.log(
      `  ${prefix} ${summary.tmuxStatusArtifactsRemoved} tmux status asset(s)`,
    );
  }

  if (summary.promptsRemoved > 0) {
    console.log(`  ${prefix} ${summary.promptsRemoved} agent prompt(s)`);
  }
  if (summary.skillsRemoved > 0) {
    console.log(`  ${prefix} ${summary.skillsRemoved} skill(s)`);
  }
  if (summary.agentConfigsRemoved > 0) {
    console.log(
      `  ${prefix} ${summary.agentConfigsRemoved} native agent config(s)`,
    );
  }
  if (summary.installArtifactsRemoved > 0) {
    console.log(
      `  ${prefix} ${summary.installArtifactsRemoved} CODEX_HOME/.omx install artifact(s)`,
    );
  }
  if (summary.agentsMdRemoved) {
    console.log(`  ${prefix} AGENTS.md`);
  }
  if (summary.cacheDirectoryRemoved) {
    console.log(`  ${prefix} project .omx/ cache directory`);
  }
  if (summary.pluginCacheRemoved) {
    console.log(`  ${prefix} Codex plugin cache directory`);
  }
  if (summary.legacySkillRootWarning) {
    console.log(`  Warning: ${summary.legacySkillRootWarning}`);
  }

  const totalActions =
    (summary.configCleaned ? 1 : 0) +
    (summary.hooksFileRemoved ? 1 : 0) +
    (summary.tmuxConfigCleaned ? 1 : 0) +
    summary.tmuxStatusArtifactsRemoved +
    summary.promptsRemoved +
    summary.skillsRemoved +
    summary.agentConfigsRemoved +
    summary.installArtifactsRemoved +
    (summary.agentsMdRemoved ? 1 : 0) +
    (summary.cacheDirectoryRemoved ? 1 : 0) +
    (summary.pluginCacheRemoved ? 1 : 0);

  if (totalActions === 0) {
    console.log(
      `  Nothing to remove. ${OMX_DISPLAY_NAME} does not appear to be installed.`,
    );
  }
}

export async function uninstall(options: UninstallOptions = {}): Promise<void> {
  const {
    dryRun = false,
    keepConfig = false,
    verbose = false,
    purge = false,
  } = options;

  const projectRoot = process.cwd();
  const pkgRoot = getPackageRoot();

  // Resolve scope (explicit --scope overrides persisted scope)
  const scope = options.scope ?? readPersistedSetupScope(projectRoot) ?? "user";
  const scopeDirs = resolveScopeDirectories(scope, projectRoot);

  console.log(`${OMX_DISPLAY_NAME} uninstall`);
  console.log("=====================\n");
  if (dryRun) {
    console.log("[dry-run mode] No files will be modified.\n");
  }
  console.log(`Resolved scope: ${scope}\n`);

  const summary: UninstallSummary = {
    configCleaned: false,
    mcpServersRemoved: [],
    agentEntriesRemoved: 0,
    tuiSectionRemoved: false,
    topLevelKeysRemoved: false,
    featureFlagsRemoved: false,
    hooksFileRemoved: false,
    tmuxConfigCleaned: false,
    tmuxStatusArtifactsRemoved: 0,
    promptsRemoved: 0,
    skillsRemoved: 0,
    agentConfigsRemoved: 0,
    installArtifactsRemoved: 0,
    agentsMdRemoved: false,
    cacheDirectoryRemoved: false,
    pluginCacheRemoved: false,
    legacySkillRootWarning: null,
  };

  summary.legacySkillRootWarning = await detectLegacySkillRootWarning(scope);
  const preserveHooksFeatureFlag = await shouldPreserveHooksFeatureFlag(
    scopeDirs.codexHooksFile,
  );

  // Step 1: Clean config.toml
  if (keepConfig) {
    console.log("[1/5] Skipping config.toml cleanup (--keep-config).");
  } else {
    console.log("[1/5] Cleaning config.toml...");
    const configResult = await cleanConfig(scopeDirs.codexConfigFile, {
      dryRun,
      verbose,
      preserveHooksFeatureFlag,
      codexFeaturesProbe: options.codexFeaturesProbe,
      codexVersionProbe: options.codexVersionProbe,
    });
    Object.assign(summary, configResult);
  }
  console.log();

  // Step 2: Remove installed prompts
  console.log("[2/6] Removing native hooks artifact...");
  summary.hooksFileRemoved = await removeHooksFile(scopeDirs.codexHooksFile, {
    dryRun,
    verbose,
  });
  console.log(
    `  ${dryRun ? "Would clean" : "Cleaned"} ${summary.hooksFileRemoved ? 1 : 0} hooks artifact(s).`,
  );
  console.log();

  // Step 3: Remove installed prompts
  console.log("[3/6] Removing agent prompts...");
  summary.promptsRemoved = await removeInstalledPrompts(
    scopeDirs.promptsDir,
    pkgRoot,
    { dryRun, verbose },
  );
  console.log(
    `  ${dryRun ? "Would remove" : "Removed"} ${summary.promptsRemoved} prompt(s).`,
  );
  console.log();

  // Step 4: Remove native agent configs
  console.log("[4/6] Removing native agent configs...");
  summary.agentConfigsRemoved = await removeAgentConfigs(
    scopeDirs.nativeAgentsDir,
    { dryRun, verbose },
  );
  console.log(
    `  ${dryRun ? "Would remove" : "Removed"} ${summary.agentConfigsRemoved} agent config(s).`,
  );
  console.log();

  // Step 5: Remove installed skills
  console.log("[5/6] Removing skills...");
  summary.skillsRemoved = await removeInstalledSkills(
    scopeDirs.skillsDir,
    pkgRoot,
    { dryRun, verbose },
  );
  console.log(
    `  ${dryRun ? "Would remove" : "Removed"} ${summary.skillsRemoved} skill(s).`,
  );
  console.log();

  // Step 6: Remove AGENTS.md and optionally .omx/ cache directory
  console.log("[6/6] Cleaning up...");
  const agentsMdPath =
    scope === "project"
      ? join(projectRoot, "AGENTS.md")
      : join(scopeDirs.codexHomeDir, "AGENTS.md");
  summary.agentsMdRemoved = await removeAgentsMd(agentsMdPath, {
    dryRun,
    verbose,
  });
  if (purge) {
    summary.cacheDirectoryRemoved = await removeCacheDirectory(projectRoot, {
      dryRun,
      verbose,
    });
  } else {
    // Always clean up setup-scope.json and hud-config.json
    const scopeFile = join(projectRoot, ".omx", "setup-scope.json");
    const hudConfig = join(projectRoot, ".omx", "hud-config.json");
    for (const f of [scopeFile, hudConfig]) {
      if (existsSync(f)) {
        if (!dryRun) await rm(f, { force: true });
        if (verbose)
          console.log(
            `  ${dryRun ? "Would remove" : "Removed"} ${basename(f)}`,
          );
      }
    }
  }
  summary.pluginCacheRemoved = await removePluginCacheDirectory(
    scopeDirs.codexHomeDir,
    { dryRun, verbose },
  );
  const tmuxStatusRemoval = await removeManagedTmuxStatusArtifacts(
    scope,
    scopeDirs.codexHomeDir,
    { dryRun, verbose },
  );
  summary.tmuxConfigCleaned = tmuxStatusRemoval.tmuxConfigCleaned;
  summary.tmuxStatusArtifactsRemoved = tmuxStatusRemoval.assetEntriesRemoved;
  summary.installArtifactsRemoved = await removeManagedInstallArtifacts(
    scopeDirs.codexHomeDir,
    { dryRun, verbose },
  );
  console.log();

  printSummary(summary, dryRun);

  if (!dryRun) {
    console.log(
      `\n${OMX_DISPLAY_NAME} has been uninstalled. Run "omx setup" to reinstall.`,
    );
  } else {
    console.log("\nRun without --dry-run to apply changes.");
  }
}
