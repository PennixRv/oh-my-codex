import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveAutoRouteDecision } from "../auto-route.js";

describe("auto-route", () => {
  it("returns solo when team mode is disabled even for review prompts", () => {
    const decision = resolveAutoRouteDecision(
      "Review this authentication refactor for security regressions and verification gaps",
      {
        availableAgentTypes: ["architect", "code-reviewer", "quality-reviewer", "security-reviewer", "verifier"],
        attachedTmux: true,
        teamEnabled: false,
      },
    );

    assert.equal(decision.mode, "solo");
    assert.equal(decision.reviewShape, "none");
    assert.equal(decision.canAutoLaunchHere, false);
  });

  it("keeps exploration-style check prompts out of Team review routing", () => {
    const decision = resolveAutoRouteDecision(
      "check how we use this SDK today",
      {
        availableAgentTypes: ["dependency-expert", "executor", "explore", "verifier"],
        attachedTmux: true,
        teamEnabled: true,
      },
    );

    assert.equal(decision.mode, "solo");
    assert.equal(decision.reviewShape, "none");
    assert.equal(decision.primaryRole, "explore");
  });

  it("propagates the actual review launch role consistently for specialist review prompts", () => {
    const decision = resolveAutoRouteDecision(
      "Review this authentication refactor for security regressions and verification gaps",
      {
        availableAgentTypes: ["architect", "code-reviewer", "executor", "quality-reviewer", "security-reviewer", "verifier"],
        attachedTmux: true,
        teamEnabled: true,
      },
    );

    assert.equal(decision.mode, "team");
    assert.equal(decision.reviewShape, "dual-lane");
    assert.equal(decision.preferredLaunchRole, "security-reviewer");
    assert.equal(decision.primaryRole, "security-reviewer");
    assert.match(decision.staffingSummary, /security-reviewer x1 \(primary review lane/);
    assert.match(decision.staffingSummary, /architect x1 \(architecture challenge lane/);
  });
});
