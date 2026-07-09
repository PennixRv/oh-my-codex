export const CODEX_HOOK_FEATURE_FLAGS = ["hooks", "codex_hooks"] as const;
export const CODEX_PLUGIN_SCOPED_HOOKS_FEATURE_FLAG = "plugin_hooks";

export type CodexHookFeatureFlag = (typeof CODEX_HOOK_FEATURE_FLAGS)[number];

interface ParsedCodexFeatureRow {
  effective: boolean;
  name: string;
  stage: string;
}

/**
 * Current Codex CLI releases expose lifecycle hooks as `[features].hooks`.
 * Older releases used `[features].codex_hooks`. Keep the default on the
 * current canonical name while allowing setup to probe and select the legacy
 * spelling when it is the only feature reported by the installed Codex.
 */
export const DEFAULT_CODEX_HOOK_FEATURE_FLAG: CodexHookFeatureFlag = "hooks";

export function isCodexHookFeatureFlagName(
  name: string,
): name is CodexHookFeatureFlag {
  return (CODEX_HOOK_FEATURE_FLAGS as readonly string[]).includes(name);
}

export function normalizeCodexHookFeatureFlag(
  value: string | null | undefined,
): CodexHookFeatureFlag {
  return value === "codex_hooks" ? "codex_hooks" : DEFAULT_CODEX_HOOK_FEATURE_FLAG;
}

export function parseCodexFeatureNames(
  featuresListOutput: string | null | undefined,
): Set<string> {
  const names = new Set<string>();
  for (const feature of parseCodexFeatureRows(featuresListOutput).values()) {
    names.add(feature.name);
  }
  return names;
}

function parseCodexFeatureRows(
  featuresListOutput: string | null | undefined,
): Map<string, ParsedCodexFeatureRow> {
  const rows = new Map<string, ParsedCodexFeatureRow>();
  for (const rawLine of (featuresListOutput ?? "").split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    const match = trimmed.match(/^([A-Za-z0-9_]+)\s+(.+?)\s+(true|false)$/);
    if (!match) continue;
    const feature = {
      effective: match[3] === "true",
      name: match[1],
      stage: match[2].trim(),
    };
    rows.set(feature.name, feature);
  }
  return rows;
}

export function parseCodexCliVersion(
  versionOutput: string | null | undefined,
): [number, number, number] | null {
  const match = (versionOutput ?? "").match(/\b(\d+)\.(\d+)\.(\d+)\b/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function isCodexCliVersionAtLeast(
  versionOutput: string | null | undefined,
  minimum: [number, number, number],
): boolean {
  const parsed = parseCodexCliVersion(versionOutput);
  if (!parsed) return false;
  for (let i = 0; i < minimum.length; i++) {
    if (parsed[i] > minimum[i]) return true;
    if (parsed[i] < minimum[i]) return false;
  }
  return true;
}

export function supportsCodexPluginScopedHooks(options: {
  featuresListOutput?: string | null;
} = {}): boolean {
  const feature = parseCodexFeatureRows(options.featuresListOutput).get(
    CODEX_PLUGIN_SCOPED_HOOKS_FEATURE_FLAG,
  );
  if (!feature) return false;
  return feature.stage.toLowerCase() !== "removed";
}

export function resolveCodexHookFeatureFlag(options: {
  featuresListOutput?: string | null;
  versionOutput?: string | null;
  fallback?: CodexHookFeatureFlag;
} = {}): CodexHookFeatureFlag {
  const featureNames = parseCodexFeatureNames(options.featuresListOutput);

  if (featureNames.has("hooks")) return "hooks";
  if (featureNames.has("codex_hooks")) return "codex_hooks";

  if (isCodexCliVersionAtLeast(options.versionOutput, [0, 130, 0])) {
    return "hooks";
  }

  return options.fallback ?? DEFAULT_CODEX_HOOK_FEATURE_FLAG;
}

export function formatCodexHookFeatureFlagLine(
  featureFlag: CodexHookFeatureFlag,
): string {
  return `${normalizeCodexHookFeatureFlag(featureFlag)} = true`;
}
