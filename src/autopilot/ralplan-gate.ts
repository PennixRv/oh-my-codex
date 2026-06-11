import {
  buildRalplanConsensusGateFromSources,
  RALPLAN_CONSENSUS_BLOCKED_REASONS,
  type RalplanConsensusSource,
  type RalplanConsensusGateEvidence,
} from '../ralplan/consensus-gate.js';

type JsonObject = Record<string, unknown>;

export interface AutopilotRalplanUltragoalGateInput {
  cwd: string;
  sessionId?: string;
  currentState?: JsonObject | null;
  nextState?: JsonObject | null;
}

export interface AutopilotRalplanUltragoalGateDecision {
  allowed: boolean;
  reason: string;
  evidence?: RalplanConsensusGateEvidence;
}

function safeObject(value: unknown): JsonObject | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonObject
    : null;
}

function nestedState(state: JsonObject | null | undefined): JsonObject | null {
  return safeObject(state?.state);
}

function handoffArtifacts(state: JsonObject | null | undefined): JsonObject | null {
  return safeObject(state?.handoff_artifacts) ?? safeObject(nestedState(state)?.handoff_artifacts);
}

function ralplanHandoff(state: JsonObject | null | undefined): JsonObject | null {
  return safeObject(handoffArtifacts(state)?.ralplan);
}

function returnToRalplanMeta(state: JsonObject | null | undefined): { reason: string; reviewCycle?: number } | null {
  const currentPhase = String(state?.current_phase ?? state?.currentPhase ?? '').toLowerCase();
  const reason = state?.return_to_ralplan_reason ?? state?.returnToRalplanReason;
  if (currentPhase !== 'ralplan' || typeof reason !== 'string' || reason.trim() === '') {
    return null;
  }
  const reviewCycleRaw = state?.review_cycle ?? state?.reviewCycle;
  const reviewCycle = typeof reviewCycleRaw === 'number' && Number.isInteger(reviewCycleRaw)
    ? reviewCycleRaw
    : typeof reviewCycleRaw === 'string' && Number.isInteger(Number(reviewCycleRaw))
      ? Number(reviewCycleRaw)
      : undefined;
  return {
    reason: reason.trim(),
    ...(reviewCycle !== undefined ? { reviewCycle } : {}),
  };
}

function returnToRalplanMetaWithContext(
  state: JsonObject | null | undefined,
  inherited?: { reason: string; reviewCycle?: number } | null,
): { reason: string; reviewCycle?: number } | null {
  const explicit = returnToRalplanMeta(state);
  if (explicit) return explicit;
  if (!inherited) return null;

  const parentReviewCycle = inherited.reviewCycle;
  if (parentReviewCycle == null) return { reason: inherited.reason };

  const raw = state?.review_cycle ?? state?.reviewCycle;
  const candidateReviewCycle = typeof raw === 'number' && Number.isInteger(raw)
    ? raw
    : typeof raw === 'string' && Number.isInteger(Number(raw))
      ? Number(raw)
      : undefined;
  if (candidateReviewCycle === undefined) return inherited;
  if (candidateReviewCycle > parentReviewCycle) return null;
  return inherited;
}

function gateSources(input: AutopilotRalplanUltragoalGateInput) {
  const sources: RalplanConsensusSource[] = [];
  for (const [label, state] of [
    ['next-autopilot-state', input.nextState],
    ['current-autopilot-state', input.currentState],
  ] as const) {
    if (!state) continue;
    sources.push({ source: label, value: state });
    const inheritedReturnToRalplanContext = returnToRalplanMeta(state);
    const handoffs = handoffArtifacts(state);
    const handoffReturnToRalplanContext = returnToRalplanMetaWithContext(
      handoffs,
      inheritedReturnToRalplanContext ? { reason: inheritedReturnToRalplanContext.reason, reviewCycle: inheritedReturnToRalplanContext.reviewCycle } : null,
    );
    const handoffRalplanReturnContext = returnToRalplanMetaWithContext(
      handoffs,
      inheritedReturnToRalplanContext ? { reason: inheritedReturnToRalplanContext.reason, reviewCycle: inheritedReturnToRalplanContext.reviewCycle } : null,
    );
    if (handoffs) {
      sources.push({
        source: `${label}:handoff_artifacts`,
        value: handoffs,
        returnToRalplanReason: handoffReturnToRalplanContext?.reason,
        returnToRalplanReviewCycle: handoffReturnToRalplanContext?.reviewCycle,
      });
    }
    const ralplan = ralplanHandoff(state);
    if (ralplan) {
      sources.push({
        source: `${label}:handoff_artifacts.ralplan`,
        value: ralplan,
        returnToRalplanReason: handoffRalplanReturnContext?.reason,
        returnToRalplanReviewCycle: handoffRalplanReturnContext?.reviewCycle,
      });
    }
  }
  return sources;
}

export function canAdvanceAutopilotRalplanToUltragoal(
  input: AutopilotRalplanUltragoalGateInput,
): AutopilotRalplanUltragoalGateDecision {
  const evidence = buildRalplanConsensusGateFromSources(gateSources(input), {
    cwd: input.cwd,
    sessionId: input.sessionId,
    requireNativeSubagents: true,
  });
  if (evidence.complete) {
    return {
      allowed: true,
      reason: 'tracker-backed native ralplan architect and critic consensus evidence',
      evidence,
    };
  }
  return {
    allowed: false,
    reason: ralplanConsensusBlockedReason(evidence),
    evidence,
  };
}

function ralplanConsensusBlockedReason(evidence: RalplanConsensusGateEvidence): string {
  if (evidence.blockedReason === RALPLAN_CONSENSUS_BLOCKED_REASONS.nativeSubagentEvidenceMissing) {
    return 'ralplan consensus lacks tracker-backed native architect and critic lanes';
  }
  if (evidence.blockedReason === RALPLAN_CONSENSUS_BLOCKED_REASONS.nonApprovingReview) {
    return 'ralplan consensus gate contains non-approving architect or critic review evidence';
  }
  return 'missing ralplan consensus gate with tracker-backed native architect and critic lanes';
}

export function buildAutopilotRalplanUltragoalGateError(
  decision: AutopilotRalplanUltragoalGateDecision,
): string {
  const details = decision.evidence?.blockedDetails?.length
    ? ` Details: ${decision.evidence.blockedDetails.join('; ')}.`
    : '';
  return `Cannot transition ralplan -> ultragoal: ${decision.reason}.${details}`;
}
