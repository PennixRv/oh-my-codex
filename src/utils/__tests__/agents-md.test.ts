import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  addGeneratedAgentsMarker,
  extractUserOmxPolicyBlocks,
  hasOmxAgentsContract,
  hasOmxManagedAgentsSections,
  isOmxGeneratedAgentsMd,
  OMX_AGENTS_CONTRACT_HEADING,
  OMX_GENERATED_AGENTS_MARKER,
  OMX_MANAGED_AGENTS_END_MARKER,
  OMX_MANAGED_AGENTS_START_MARKER,
  OMX_USER_POLICY_END_MARKER,
  OMX_USER_POLICY_START_MARKER,
  preserveUserAgentsPreamble,
  preserveUserOmxPolicyBlocks,
} from '../agents-md.js';

describe('agents-md helpers', () => {
  it('inserts the generated marker after the autonomy directive block', () => {
    const content = [
      '<!-- AUTONOMY DIRECTIVE — DO NOT REMOVE -->',
      'YOU ARE AN AUTONOMOUS CODING AGENT. EXECUTE TASKS TO COMPLETION WITHOUT ASKING FOR PERMISSION.',
      'DO NOT STOP TO ASK "SHOULD I PROCEED?" — PROCEED. DO NOT WAIT FOR CONFIRMATION ON OBVIOUS NEXT STEPS.',
      'IF BLOCKED, TRY AN ALTERNATIVE APPROACH. ONLY ASK WHEN TRULY AMBIGUOUS OR DESTRUCTIVE.',
      '<!-- END AUTONOMY DIRECTIVE -->',
      '# Pennix OMX - Intelligent Multi-Agent Orchestration',
    ].join('\n');

    const result = addGeneratedAgentsMarker(content);

    assert.match(
      result,
      /<!-- END AUTONOMY DIRECTIVE -->\n<!-- omx:generated:agents-md -->\n# Pennix OMX - Intelligent Multi-Agent Orchestration/,
    );
  });

  it('does not duplicate an existing generated marker', () => {
    const content = `header\n${OMX_GENERATED_AGENTS_MARKER}\nbody\n`;
    assert.equal(addGeneratedAgentsMarker(content), content);
  });

  it('does not treat a standalone generated marker as the full OMX contract', () => {
    const content = `header\n${OMX_GENERATED_AGENTS_MARKER}\nbody\n`;

    assert.equal(isOmxGeneratedAgentsMd(content), true);
    assert.equal(hasOmxAgentsContract(content), false);
  });

  it('treats autonomy-directive generated files as OMX-managed once marked', () => {
    const content = [
      '<!-- AUTONOMY DIRECTIVE — DO NOT REMOVE -->',
      'directive body',
      '<!-- END AUTONOMY DIRECTIVE -->',
      OMX_GENERATED_AGENTS_MARKER,
      OMX_AGENTS_CONTRACT_HEADING,
      'AGENTS.md is the top-level operating contract for the workspace.',
    ].join('\n');

    assert.equal(isOmxGeneratedAgentsMd(content), true);
    assert.equal(hasOmxAgentsContract(content), true);
  });

  it('does not treat title-only user AGENTS.md content as OMX-generated', () => {
    const content = [
      '# Pennix OMX - Intelligent Multi-Agent Orchestration',
      '',
      'User-authored guidance without any OMX ownership markers.',
    ].join('\n');

    assert.equal(isOmxGeneratedAgentsMd(content), false);
    assert.equal(hasOmxManagedAgentsSections(content), false);
    assert.equal(hasOmxAgentsContract(content), false);
  });

  it('recognizes explicit OMX-owned model table blocks as managed sections', () => {
    const content = [
      '# Shared ownership AGENTS',
      '',
      '<!-- OMX:MODELS:START -->',
      'managed table',
      '<!-- OMX:MODELS:END -->',
    ].join('\n');

    assert.equal(isOmxGeneratedAgentsMd(content), false);
    assert.equal(hasOmxManagedAgentsSections(content), true);
    assert.equal(hasOmxAgentsContract(content), false);
  });

  it('recognizes merged AGENTS blocks as carrying the OMX contract only when the generated marker is inside', () => {
    const content = [
      '# Shared ownership AGENTS',
      '',
      OMX_MANAGED_AGENTS_START_MARKER,
      '<!-- AUTONOMY DIRECTIVE — DO NOT REMOVE -->',
      '<!-- END AUTONOMY DIRECTIVE -->',
      OMX_GENERATED_AGENTS_MARKER,
      OMX_AGENTS_CONTRACT_HEADING,
      'AGENTS.md is the top-level operating contract for the workspace.',
      OMX_MANAGED_AGENTS_END_MARKER,
    ].join('\n');

    assert.equal(isOmxGeneratedAgentsMd(content), true);
    assert.equal(hasOmxManagedAgentsSections(content), true);
    assert.equal(hasOmxAgentsContract(content), true);
  });

  it('does not accept a generated marker plus heading without the semantic contract text', () => {
    const content = [
      OMX_GENERATED_AGENTS_MARKER,
      OMX_AGENTS_CONTRACT_HEADING,
      'User-authored text that happens to reuse the title.',
    ].join('\n');

    assert.equal(hasOmxAgentsContract(content), false);
  });

  it('does not accept a managed AGENTS block that lacks the generated contract marker', () => {
    const content = [
      '# Shared ownership AGENTS',
      '',
      OMX_MANAGED_AGENTS_START_MARKER,
      OMX_AGENTS_CONTRACT_HEADING,
      'AGENTS.md is the top-level operating contract for the workspace.',
      OMX_MANAGED_AGENTS_END_MARKER,
    ].join('\n');

    assert.equal(hasOmxAgentsContract(content), false);
  });

  it('accepts the new Pennix heading in generated AGENTS contracts', () => {
    const content = [
      '<!-- AUTONOMY DIRECTIVE — DO NOT REMOVE -->',
      'directive body',
      '<!-- END AUTONOMY DIRECTIVE -->',
      OMX_GENERATED_AGENTS_MARKER,
      '# Pennix OMX - Intelligent Multi-Agent Orchestration',
      'AGENTS.md is the top-level operating contract for the workspace.',
    ].join('\n');

    assert.equal(hasOmxAgentsContract(content), true);
  });

  it('extracts complete user-owned OMX policy blocks', () => {
    const content = [
      '# Local policy',
      OMX_USER_POLICY_START_MARKER,
      'Keep durable operator guidance.',
      OMX_USER_POLICY_END_MARKER,
      'after',
    ].join('\n');

    assert.deepEqual(extractUserOmxPolicyBlocks(content), [
      [
        OMX_USER_POLICY_START_MARKER,
        'Keep durable operator guidance.',
        OMX_USER_POLICY_END_MARKER,
      ].join('\n'),
    ]);
  });

  it('appends missing user-owned OMX policy blocks to regenerated content', () => {
    const existing = [
      '# Local policy',
      OMX_USER_POLICY_START_MARKER,
      'Keep durable operator guidance.',
      OMX_USER_POLICY_END_MARKER,
      '',
    ].join('\n');
    const regenerated = `${OMX_GENERATED_AGENTS_MARKER}\n# New defaults\n`;

    const result = preserveUserOmxPolicyBlocks(existing, regenerated);

    assert.match(result, /# New defaults\n\n<!-- USER:OMX:POLICY:START -->\nKeep durable operator guidance\.\n<!-- USER:OMX:POLICY:END -->\n$/);
  });

  it('does not duplicate a user-owned OMX policy block already present', () => {
    const policyBlock = [
      OMX_USER_POLICY_START_MARKER,
      'Keep durable operator guidance.',
      OMX_USER_POLICY_END_MARKER,
    ].join('\n');
    const existing = `# Local policy\n${policyBlock}\n`;
    const regenerated = `${OMX_GENERATED_AGENTS_MARKER}\n${policyBlock}\n`;

    assert.equal(preserveUserOmxPolicyBlocks(existing, regenerated), regenerated);
  });

  it('preserves an unmarked preamble before an otherwise generated document', () => {
    const canonicalPrefix = [
      '<!-- AUTONOMY DIRECTIVE — DO NOT REMOVE -->',
      '<!-- END AUTONOMY DIRECTIVE -->',
      '',
    ].join('\n');
    const preamble = '## Context Continuity\n\nKeep this local policy.\n\n';
    const existing = `${preamble}${canonicalPrefix}${OMX_GENERATED_AGENTS_MARKER}\n# Old defaults\n`;
    const refreshed = `${canonicalPrefix}${OMX_GENERATED_AGENTS_MARKER}\n# New defaults\n`;

    const result = preserveUserAgentsPreamble(existing, refreshed);

    assert.equal(
      result,
      `${preamble}${canonicalPrefix}${OMX_GENERATED_AGENTS_MARKER}\n# New defaults\n`,
    );
  });
});
