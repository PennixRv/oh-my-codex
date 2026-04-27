import { randomUUID } from "crypto";
import { existsSync, readFileSync } from "fs";
import { appendFile, mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { isSessionStateUsable, readUsableSessionState } from "../hooks/session.js";

export interface ExecFollowupRecord {
  id: string;
  session_id: string;
  actor: string;
  prompt: string;
  created_at: string;
  delivered_at?: string;
  delivery_event?: "stop-hook";
}

export interface ExecFollowupQueue {
  version: 1;
  session_id: string;
  records: ExecFollowupRecord[];
}

export interface InjectExecFollowupOptions {
  cwd: string;
  sessionId: string;
  prompt: string;
  actor?: string;
  nowIso?: string;
}

export interface InjectExecFollowupResult {
  queued: ExecFollowupRecord;
  queuePath: string;
}

const QUEUE_FILE = "exec-followups.json";
const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

function stateDir(cwd: string): string {
  return join(cwd, ".omx", "state");
}

function sessionQueuePath(cwd: string, sessionId: string): string {
  return join(stateDir(cwd), "sessions", sessionId, QUEUE_FILE);
}

function auditLogPath(cwd: string, nowIso: string): string {
  return join(cwd, ".omx", "logs", `exec-followups-${nowIso.slice(0, 10)}.jsonl`);
}

function normalizeSessionId(sessionId: string): string {
  const normalized = sessionId.trim();
  if (!SESSION_ID_PATTERN.test(normalized)) {
    throw new Error("invalid_session_id");
  }
  return normalized;
}

function normalizePrompt(prompt: string): string {
  const normalized = prompt.trim();
  if (!normalized) throw new Error("missing_prompt");
  return normalized;
}

function normalizeActor(actor?: string): string {
  const normalized = (actor || process.env.USER || process.env.USERNAME || "unknown").trim();
  return normalized || "unknown";
}

async function readQueue(path: string, sessionId: string): Promise<ExecFollowupQueue> {
  if (!existsSync(path)) {
    return { version: 1, session_id: sessionId, records: [] };
  }
  const parsed = JSON.parse(await readFile(path, "utf-8")) as Partial<ExecFollowupQueue>;
  const records = Array.isArray(parsed.records) ? parsed.records : [];
  return {
    version: 1,
    session_id: typeof parsed.session_id === "string" && parsed.session_id.trim()
      ? parsed.session_id.trim()
      : sessionId,
    records: records.filter((record): record is ExecFollowupRecord => (
      typeof record === "object"
      && record !== null
      && typeof record.id === "string"
      && typeof record.session_id === "string"
      && typeof record.actor === "string"
      && typeof record.prompt === "string"
      && typeof record.created_at === "string"
    )),
  };
}

async function writeQueue(path: string, queue: ExecFollowupQueue): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(queue, null, 2) + "\n");
}

async function appendAudit(cwd: string, event: Record<string, unknown>, nowIso: string): Promise<void> {
  const path = auditLogPath(cwd, nowIso);
  await mkdir(dirname(path), { recursive: true });
  await appendFile(path, JSON.stringify({ ...event, timestamp: nowIso }) + "\n");
}

export async function injectExecFollowup(
  options: InjectExecFollowupOptions,
): Promise<InjectExecFollowupResult> {
  const sessionId = normalizeSessionId(options.sessionId);
  const prompt = normalizePrompt(options.prompt);
  const actor = normalizeActor(options.actor);
  const nowIso = options.nowIso ?? new Date().toISOString();

  const active = await readUsableSessionState(options.cwd);
  if (!active || !isSessionStateUsable(active, options.cwd)) {
    throw new Error("job_not_input_accepting:no_active_exec_session");
  }
  if (active.session_id !== sessionId && active.native_session_id !== sessionId) {
    throw new Error(`job_not_input_accepting:session_mismatch:${active.session_id}`);
  }

  const canonicalSessionId = active.session_id;
  const queuePath = sessionQueuePath(options.cwd, canonicalSessionId);
  const queue = await readQueue(queuePath, canonicalSessionId);
  const queued: ExecFollowupRecord = {
    id: randomUUID(),
    session_id: canonicalSessionId,
    actor,
    prompt,
    created_at: nowIso,
  };
  queue.session_id = canonicalSessionId;
  queue.records.push(queued);
  await writeQueue(queuePath, queue);
  await appendAudit(options.cwd, {
    event: "exec_followup_queued",
    followup_id: queued.id,
    session_id: canonicalSessionId,
    actor,
    prompt,
  }, nowIso);
  return { queued, queuePath };
}

export async function readPendingExecFollowups(
  cwd: string,
  sessionId: string,
): Promise<{ queuePath: string; pending: ExecFollowupRecord[] }> {
  const canonicalSessionId = normalizeSessionId(sessionId);
  const queuePath = sessionQueuePath(cwd, canonicalSessionId);
  const queue = await readQueue(queuePath, canonicalSessionId);
  return {
    queuePath,
    pending: queue.records.filter((record) => !record.delivered_at),
  };
}

export async function markExecFollowupsDelivered(
  cwd: string,
  sessionId: string,
  followupIds: string[],
  options: { nowIso?: string; deliveryEvent?: "stop-hook" } = {},
): Promise<void> {
  const canonicalSessionId = normalizeSessionId(sessionId);
  const nowIso = options.nowIso ?? new Date().toISOString();
  const queuePath = sessionQueuePath(cwd, canonicalSessionId);
  const queue = await readQueue(queuePath, canonicalSessionId);
  const ids = new Set(followupIds);
  let changed = false;
  for (const record of queue.records) {
    if (!ids.has(record.id) || record.delivered_at) continue;
    record.delivered_at = nowIso;
    record.delivery_event = options.deliveryEvent ?? "stop-hook";
    changed = true;
    await appendAudit(cwd, {
      event: "exec_followup_delivered",
      followup_id: record.id,
      session_id: canonicalSessionId,
      actor: record.actor,
      delivery_event: record.delivery_event,
    }, nowIso);
  }
  if (changed) await writeQueue(queuePath, queue);
}

export async function buildExecFollowupStopOutput(
  cwd: string,
  sessionId: string | undefined | null,
): Promise<Record<string, unknown> | null> {
  const normalizedSessionId = typeof sessionId === "string" ? sessionId.trim() : "";
  if (!normalizedSessionId) return null;
  const { pending } = await readPendingExecFollowups(cwd, normalizedSessionId);
  if (pending.length === 0) return null;

  const ids = pending.map((record) => record.id);
  await markExecFollowupsDelivered(cwd, normalizedSessionId, ids, {
    deliveryEvent: "stop-hook",
  });

  const rendered = pending.map((record, index) => (
    `Follow-up ${index + 1} (${record.id}) from ${record.actor} at ${record.created_at}:\n${record.prompt}`
  )).join("\n\n");
  const systemMessage =
    `OMX exec has ${pending.length} queued follow-up instruction${pending.length === 1 ? "" : "s"} for this non-interactive job. ` +
    "Treat them as the newest user instructions, continue the same run, and include the follow-up id(s) in your final audit summary.\n\n" +
    rendered;

  return {
    decision: "block",
    reason: `exec_followup_pending:${ids.join(",")}`,
    systemMessage,
  };
}

export function formatInjectExecFollowupSuccess(result: InjectExecFollowupResult): string {
  return [
    `Queued exec follow-up ${result.queued.id} for session ${result.queued.session_id}.`,
    `Queue: ${result.queuePath}`,
    "Delivery: next Stop hook checkpoint; no tmux pane input was sent.",
  ].join("\n");
}

export function parseExecInjectArgs(args: string[]): {
  sessionId: string;
  prompt: string;
  actor?: string;
  json: boolean;
} {
  const [, sessionIdRaw, ...rest] = args;
  const sessionId = sessionIdRaw?.trim();
  if (!sessionId) throw new Error("Usage: omx exec inject <session-id> --prompt <text> [--actor <name>] [--json]");

  let prompt = "";
  let actor: string | undefined;
  let json = false;
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i]!;
    if (arg === "--json") {
      json = true;
    } else if (arg === "--prompt") {
      const value = rest[i + 1];
      if (!value) throw new Error("Missing value after --prompt");
      prompt = value;
      i += 1;
    } else if (arg.startsWith("--prompt=")) {
      prompt = arg.slice("--prompt=".length);
    } else if (arg === "--prompt-file") {
      const value = rest[i + 1];
      if (!value) throw new Error("Missing path after --prompt-file");
      prompt = readFileSyncForCli(value);
      i += 1;
    } else if (arg.startsWith("--prompt-file=")) {
      prompt = readFileSyncForCli(arg.slice("--prompt-file=".length));
    } else if (arg === "--actor") {
      const value = rest[i + 1];
      if (!value) throw new Error("Missing value after --actor");
      actor = value;
      i += 1;
    } else if (arg.startsWith("--actor=")) {
      actor = arg.slice("--actor=".length);
    } else if (!arg.startsWith("-") && !prompt) {
      prompt = [arg, ...rest.slice(i + 1)].join(" ");
      break;
    } else {
      throw new Error(`Unknown exec inject argument: ${arg}`);
    }
  }
  return { sessionId, prompt, actor, json };
}

function readFileSyncForCli(path: string): string {
  return readFileSync(path, "utf-8");
}

export async function execInjectCommand(args: string[], cwd = process.cwd()): Promise<void> {
  const parsed = parseExecInjectArgs(args);
  const result = await injectExecFollowup({
    cwd,
    sessionId: parsed.sessionId,
    prompt: parsed.prompt,
    actor: parsed.actor,
  });
  if (parsed.json) {
    console.log(JSON.stringify({
      ok: true,
      queued: result.queued,
      queue_path: result.queuePath,
    }, null, 2));
  } else {
    console.log(formatInjectExecFollowupSuccess(result));
  }
}
