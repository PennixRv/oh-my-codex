import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { isAbsolute, join } from 'path';
import { constants as osConstants } from 'os';
import { getPackageRoot } from '../utils/package.js';
import {
  activeRolePromptDirs,
  listAvailableRolesFromPromptDirs,
  resolveRolePrompt,
} from '../team/role-router.js';

export const ASK_USAGE = [
  'Usage: omx ask <claude|gemini> <question or task>',
  '   or: omx ask <claude|gemini> -p "<prompt>"',
  '   or: omx ask claude --print "<prompt>"',
  '   or: omx ask gemini --prompt "<prompt>"',
  '   or: omx ask <claude|gemini> --agent-prompt <role> "<prompt>"',
  '   or: omx ask <claude|gemini> --agent-prompt=<role> --prompt "<prompt>"',
].join('\n');

const ASK_PROVIDERS = ['claude', 'gemini'] as const;
type AskProvider = typeof ASK_PROVIDERS[number];
const ASK_PROVIDER_SET = new Set<string>(ASK_PROVIDERS);
const ASK_ADVISOR_SCRIPT_ENV = 'OMX_ASK_ADVISOR_SCRIPT';
const ASK_AGENT_PROMPT_FLAG = '--agent-prompt';
const ASK_ORIGINAL_TASK_ENV = 'OMX_ASK_ORIGINAL_TASK';
const SAFE_ROLE_PATTERN = /^[a-z][a-z0-9-]*$/;

export interface ParsedAskArgs {
  provider: AskProvider;
  prompt: string;
  agentPromptRole?: string;
}

function askUsageError(reason: string): Error {
  return new Error(`${reason}\n${ASK_USAGE}`);
}

async function resolveAgentPromptContent(
  role: string,
  promptDirs: readonly string[],
): Promise<string> {
  const normalizedRole = role.trim().toLowerCase();
  if (!SAFE_ROLE_PATTERN.test(normalizedRole)) {
    throw new Error(`[ask] invalid --agent-prompt role "${role}". Expected lowercase role names like "executor" or "test-engineer".`);
  }

  const content = await resolveRolePrompt(normalizedRole, promptDirs);
  if (content) return content;

  const availableRoles = await listAvailableRolesFromPromptDirs(promptDirs);
  const availableSuffix = availableRoles.length > 0
    ? ` Available roles: ${availableRoles.join(', ')}.`
    : '';
  const searchedDirs = promptDirs.join(', ');
  throw new Error(
    `[ask] --agent-prompt role "${normalizedRole}" not found in active role prompt sources (${searchedDirs}).${availableSuffix}`,
  );
}

function resolveAskPromptDirs(cwd: string): string[] {
  return activeRolePromptDirs(cwd);
}

export async function resolveAskAgentPromptContent(
  role: string,
  cwd: string,
): Promise<string> {
  return resolveAgentPromptContent(role, resolveAskPromptDirs(cwd));
}

export function parseAskArgs(args: readonly string[]): ParsedAskArgs {
  const [providerRaw, ...rest] = args;
  const provider = (providerRaw || '').toLowerCase();

  if (!provider || !ASK_PROVIDER_SET.has(provider)) {
    throw askUsageError(`Invalid provider "${providerRaw || ''}". Expected one of: ${ASK_PROVIDERS.join(', ')}.`);
  }

  if (rest.length === 0) {
    throw askUsageError('Missing prompt text.');
  }

  let agentPromptRole: string | undefined;
  let prompt = '';

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (token === ASK_AGENT_PROMPT_FLAG) {
      const role = rest[i + 1]?.trim();
      if (!role || role.startsWith('-')) {
        throw askUsageError('Missing role after --agent-prompt.');
      }
      agentPromptRole = role;
      i += 1;
      continue;
    }
    if (token.startsWith(`${ASK_AGENT_PROMPT_FLAG}=`)) {
      const role = token.slice(`${ASK_AGENT_PROMPT_FLAG}=`.length).trim();
      if (!role) {
        throw askUsageError('Missing role after --agent-prompt=');
      }
      agentPromptRole = role;
      continue;
    }
    if (token === '-p' || token === '--print' || token === '--prompt') {
      prompt = rest.slice(i + 1).join(' ').trim();
      break;
    }
    if (token.startsWith('-p=') || token.startsWith('--print=') || token.startsWith('--prompt=')) {
      const inlinePrompt = token.split('=').slice(1).join('=').trim();
      const remainder = rest.slice(i + 1).join(' ').trim();
      prompt = [inlinePrompt, remainder].filter(Boolean).join(' ').trim();
      break;
    }
    prompt = [prompt, token].filter(Boolean).join(' ').trim();
  }

  if (!prompt) {
    throw askUsageError('Missing prompt text.');
  }

  return {
    provider: provider as AskProvider,
    prompt,
    ...(agentPromptRole ? { agentPromptRole } : {}),
  };
}

export function resolveAskAdvisorScriptPath(
  packageRoot = getPackageRoot(),
  env: NodeJS.ProcessEnv = process.env,
): string {
  const override = env[ASK_ADVISOR_SCRIPT_ENV]?.trim();
  if (override) {
    return isAbsolute(override) ? override : join(packageRoot, override);
  }
  return join(packageRoot, 'dist', 'scripts', 'run-provider-advisor.js');
}

function resolveSignalExitCode(signal: NodeJS.Signals | null): number {
  if (!signal) return 1;
  const signalNumber = osConstants.signals[signal];
  if (typeof signalNumber === 'number' && Number.isFinite(signalNumber)) {
    return 128 + signalNumber;
  }
  return 1;
}

export async function askCommand(args: string[]): Promise<void> {
  if (args[0] === '--help' || args[0] === '-h') {
    console.log(ASK_USAGE);
    return;
  }

  const parsed = parseAskArgs(args);
  const packageRoot = getPackageRoot();
  const advisorScriptPath = resolveAskAdvisorScriptPath(packageRoot);

  if (!existsSync(advisorScriptPath)) {
    throw new Error(`[ask] advisor script not found: ${advisorScriptPath}`);
  }

  let finalPrompt = parsed.prompt;
  if (parsed.agentPromptRole) {
    const agentPromptContent = await resolveAskAgentPromptContent(
      parsed.agentPromptRole,
      process.cwd(),
    );
    finalPrompt = `${agentPromptContent}\n\n${parsed.prompt}`;
  }

  const child = spawnSync(
    process.execPath,
    [advisorScriptPath, parsed.provider, finalPrompt],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        [ASK_ORIGINAL_TASK_ENV]: parsed.prompt,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  if (child.stdout && child.stdout.length > 0) {
    process.stdout.write(child.stdout);
  }
  if (child.stderr && child.stderr.length > 0) {
    process.stderr.write(child.stderr);
  }

  if (child.error) {
    throw new Error(`[ask] failed to launch advisor script: ${child.error.message}`);
  }

  const status = typeof child.status === 'number'
    ? child.status
    : resolveSignalExitCode(child.signal);

  if (status !== 0) {
    process.exitCode = status;
  }
}
