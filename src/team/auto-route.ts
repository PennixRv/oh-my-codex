import { readTeamModeConfig } from "../config/team-mode.js";
import type { TeamReasoningEffort } from "./model-contract.js";
import { buildFollowupStaffingPlan, type FollowupAllocation, type FollowupStaffingPlan } from "./followup-planner.js";
import { resolveAgentReasoningEffort } from "./model-contract.js";
import { routeTaskToRole, type RoleRouterResult } from "./role-router.js";

export type AutoRouteMode = "solo" | "team";
export type AutoRouteReviewShape = "none" | "single" | "dual-lane";
export type AutoRouteSurface = "attached-tmux" | "outside-tmux-guidance";

export interface AutoRouteDecision {
  mode: AutoRouteMode;
  primaryRole: string;
  confidence: RoleRouterResult["confidence"];
  routingReason: string;
  reviewShape: AutoRouteReviewShape;
  headcount: number;
  fallbackRole: string;
  canAutoLaunchHere: boolean;
  launchSurface: AutoRouteSurface;
  allocations: FollowupAllocation[];
  staffingSummary: string;
  preferredLaunchRole: string;
  preferredSkillKeyword?: "team";
}

export interface ResolveAutoRouteDecisionOptions {
  availableAgentTypes?: readonly string[];
  codexHomeOverride?: string;
  fallbackRole?: string;
  attachedTmux?: boolean;
  teamEnabled?: boolean;
}

function normalizeTaskText(task: string): string {
  return task.trim().replace(/\s+/g, " ");
}

function isReviewIntent(task: string): boolean {
  const normalizedTask = task.toLowerCase();
  const weakReviewVerb = /\b(?:check|inspect)\b/.test(normalizedTask);
  const explicitReviewVerb = /\b(?:audit|review|validate|verify)\b|(?:检视|审核|审查|验证|复核)/i.test(task);
  const localExplorationLike = (
    /\b(?:check|find|inspect|locate|look up|lookup|map|search|trace|understand|which files?|where(?:\s+is|\s+are)?)\b/.test(normalizedTask)
      && /\b(?:file|files|symbol|symbols|repo|repository|codebase|path|paths|usage|usages|reference|references|relationship|relationships|implementation|local)\b/.test(normalizedTask)
  ) || /\b(?:call sites?|current(?:ly)? use|how we use|integration points?|our usage|where we use|what it does)\b/.test(normalizedTask)
    || /(?:^|[\s(])(?:src|app|lib|packages|services|components|modules|tests?)\/\S+/.test(normalizedTask);
  const reviewSubject = /\b(?:code|change|changes|correctness|diff|gap|gaps|implementation|patch|patches|performance|quality|refactor|regression|security|verification|compatibility)\b/.test(normalizedTask);

  if (localExplorationLike) return false;
  return explicitReviewVerb || (weakReviewVerb && reviewSubject);
}

function isSecurityReviewIntent(task: string): boolean {
  return /\b(?:auth|authentication|authorization|cve|injection|owasp|security|vulnerability|xss)\b|(?:安全|认证|鉴权|注入|漏洞)/i.test(task);
}

function isApiReviewIntent(task: string): boolean {
  return /\b(?:api|backward compatibility|compatibility|contract|contracts|versioning)\b|(?:接口|兼容性|契约|版本)/i.test(task);
}

function isPerformanceReviewIntent(task: string): boolean {
  return /\b(?:benchmark|latency|memory|performance|profil(?:e|ing)|throughput)\b|(?:性能|延迟|吞吐|内存)/i.test(task);
}

function isParallelizableTeamIntent(task: string): boolean {
  return /\b(?:compare|evaluate|parallel|several|multiple|trade-?offs?)\b|(?:并行|多路|多线|多方面|对比|比较|评估)/i.test(task);
}

function isRoleAvailable(availableAgentTypes: readonly string[] | undefined, role: string): boolean {
  if (!availableAgentTypes || availableAgentTypes.length === 0) return true;
  return availableAgentTypes.includes(role);
}

function chooseLaunchRole(
  route: RoleRouterResult,
  availableAgentTypes: readonly string[] | undefined,
  fallbackRole: string,
): string {
  const preferred = route.role;
  if (isRoleAvailable(availableAgentTypes, preferred)) return preferred;
  if (isRoleAvailable(availableAgentTypes, fallbackRole)) return fallbackRole;
  return availableAgentTypes?.[0] ?? fallbackRole;
}

function chooseReviewDualLaneRole(
  task: string,
  availableAgentTypes: readonly string[] | undefined,
): string {
  if (isSecurityReviewIntent(task) && isRoleAvailable(availableAgentTypes, "security-reviewer")) {
    return "security-reviewer";
  }
  if (isApiReviewIntent(task) && isRoleAvailable(availableAgentTypes, "api-reviewer")) {
    return "api-reviewer";
  }
  if (isPerformanceReviewIntent(task) && isRoleAvailable(availableAgentTypes, "performance-reviewer")) {
    return "performance-reviewer";
  }
  if (isSecurityReviewIntent(task) && isRoleAvailable(availableAgentTypes, "code-reviewer")) {
    return "code-reviewer";
  }
  if (isRoleAvailable(availableAgentTypes, "quality-reviewer")) {
    return "quality-reviewer";
  }
  if (isRoleAvailable(availableAgentTypes, "code-reviewer")) {
    return "code-reviewer";
  }
  return availableAgentTypes?.[0] ?? "executor";
}

function buildReviewStaffingPlan(
  task: string,
  availableAgentTypes: readonly string[] | undefined,
  codexHomeOverride?: string,
): FollowupStaffingPlan {
  const roster = availableAgentTypes && availableAgentTypes.length > 0
    ? [...availableAgentTypes]
    : ["architect", "code-reviewer", "quality-reviewer", "verifier"];
  const primaryReviewRole = chooseReviewDualLaneRole(task, roster);
  const architectRole = isRoleAvailable(roster, "architect")
    ? "architect"
    : (isRoleAvailable(roster, "verifier") ? "verifier" : primaryReviewRole);
  const fallbackRole = primaryReviewRole;
  const plan = buildFollowupStaffingPlan("team", task, roster, {
    workerCount: 2,
    fallbackRole,
    codexHomeOverride,
  });

  const primaryReasoning = resolveAgentReasoningEffort(primaryReviewRole, codexHomeOverride);
  const architectReasoning = resolveAgentReasoningEffort(architectRole, codexHomeOverride);
  const allocations: FollowupAllocation[] = [
    {
      role: primaryReviewRole,
      count: 1,
      reason: "primary review lane",
      reasoningEffort: primaryReasoning as TeamReasoningEffort | undefined,
    },
    {
      role: architectRole,
      count: 1,
      reason: "architecture challenge lane",
      reasoningEffort: architectReasoning as TeamReasoningEffort | undefined,
    },
  ];

  const staffingSummary = allocations
    .map((allocation) => {
      const reasoning = allocation.reasoningEffort ? `, ${allocation.reasoningEffort} reasoning` : "";
      return `${allocation.role} x${allocation.count} (${allocation.reason}${reasoning})`;
    })
    .join("; ");

  return {
    ...plan,
    recommendedHeadcount: 2,
    allocations,
    staffingSummary,
    launchHints: {
      ...plan.launchHints,
      shellCommand: `omx team 2:${primaryReviewRole} ${JSON.stringify(task)}`,
      skillCommand: `$team 2:${primaryReviewRole} ${JSON.stringify(task)}`,
      rationale: "Launch a two-lane review team so the reviewer lane and architecture challenge lane return independent evidence before synthesis.",
      launchRole: primaryReviewRole,
    },
  };
}

export function resolveAutoRouteDecision(
  taskInput: string,
  options: ResolveAutoRouteDecisionOptions = {},
): AutoRouteDecision {
  const task = normalizeTaskText(taskInput);
  const fallbackRole = options.fallbackRole ?? "executor";
  const route = routeTaskToRole(task, task, "team-exec", fallbackRole);
  const teamEnabled = options.teamEnabled ?? readTeamModeConfig(process.cwd()).enabled;
  const attachedTmux = options.attachedTmux === true;
  const canAutoLaunchHere = teamEnabled && attachedTmux;
  const launchSurface: AutoRouteSurface = attachedTmux ? "attached-tmux" : "outside-tmux-guidance";
  const availableAgentTypes = options.availableAgentTypes;
  const primaryRole = chooseLaunchRole(route, availableAgentTypes, fallbackRole);
  const reviewIntent = isReviewIntent(task);
  const specialistTeamIntent = route.role === "team-executor" || isParallelizableTeamIntent(task);

  const shouldUseTeam = teamEnabled && route.confidence === "high" && (reviewIntent || specialistTeamIntent);

  if (!shouldUseTeam) {
    return {
      mode: "solo",
      primaryRole,
      confidence: route.confidence,
      routingReason: route.reason,
      reviewShape: "none",
      headcount: 0,
      fallbackRole,
      canAutoLaunchHere: false,
      launchSurface,
      allocations: [],
      staffingSummary: "",
      preferredLaunchRole: primaryRole,
    };
  }

  const staffingPlan = reviewIntent
    ? buildReviewStaffingPlan(task, availableAgentTypes, options.codexHomeOverride)
    : buildFollowupStaffingPlan("team", task, availableAgentTypes ?? [primaryRole, "verifier"], {
      workerCount: primaryRole === "executor" || primaryRole === "team-executor" ? 2 : 1,
      fallbackRole: primaryRole,
      codexHomeOverride: options.codexHomeOverride,
    });

  return {
    mode: "team",
    primaryRole: staffingPlan.launchHints.launchRole ?? primaryRole,
    confidence: route.confidence,
    routingReason: route.reason,
    reviewShape: reviewIntent ? "dual-lane" : "single",
    headcount: staffingPlan.recommendedHeadcount,
    fallbackRole,
    canAutoLaunchHere,
    launchSurface,
    allocations: staffingPlan.allocations,
    staffingSummary: staffingPlan.staffingSummary,
    preferredLaunchRole: staffingPlan.launchHints.launchRole ?? primaryRole,
    preferredSkillKeyword: "team",
  };
}
