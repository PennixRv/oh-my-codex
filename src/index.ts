/**
 * oh-my-codex - Multi-agent orchestration for OpenAI Codex CLI
 *
 * This package provides:
 * - 30+ packaged role prompt assets plus native agent templates
 * - 35+ workflow skills as SKILL.md files
 * - AGENTS.md bootstrap contract
 * - MCP servers for state management, project memory, and notepad
 * - CLI tool (omx) for setup, diagnostics, and management
 * - Notification hooks for workflow tracking
 */

export { setup } from './cli/setup.js';
export { doctor } from './cli/doctor.js';
export { version } from './cli/version.js';
export { mergeConfig } from './config/generator.js';
export { AGENT_DEFINITIONS, type AgentDefinition } from './agents/definitions.js';
export { generateAgentToml, installNativeAgentConfigs } from './agents/native-config.js';
export { hudCommand } from './hud/index.js';
