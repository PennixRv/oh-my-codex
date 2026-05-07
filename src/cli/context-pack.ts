import { readDirectContextPackStatus } from "../planning/context-pack-status.js";

export const CONTEXT_PACK_HELP = `Usage: omx context-pack status <pack> [--json]

Read-only context-pack inspection:
  omx context-pack status .omx/context/context-20260507T120000Z-example.json

<pack> must be a canonical .omx/context/context-<timestamp>-<slug>.json path.
Only status is implemented in this first slice; query/view are intentionally out of scope.`;

export interface ContextPackCommandDependencies {
	cwd?: string;
	stdout?: (line: string) => void;
}

function renderHumanStatus(
	status: ReturnType<typeof readDirectContextPackStatus>,
): string {
	const lines = [
		`Context pack status: ${status.contextPackStatus}`,
		`- pack: ${status.packRelativePath}`,
		`- slug: ${status.slug}`,
		`- declaration: ${status.declarationState}`,
		`- declared pack: ${status.declaredPackPath ?? "(none)"}`,
		`- pack state: ${status.packState}`,
		`- basis: ${status.basisState}`,
		`- role coverage: ${status.roleCoverage}`,
	];
	if (status.missingRequiredContextPackRoles.length > 0) {
		lines.push(
			`- missing roles: ${status.missingRequiredContextPackRoles.join(", ")}`,
		);
	}
	if (status.contextPackIssues.length > 0) {
		lines.push("- issues:");
		for (const issue of status.contextPackIssues) {
			lines.push(`  - ${issue}`);
		}
	}
	return lines.join("\n");
}

export async function contextPackCommand(
	args: string[],
	deps: ContextPackCommandDependencies = {},
): Promise<void> {
	const stdout = deps.stdout ?? ((line: string) => console.log(line));
	const cwd = deps.cwd ?? process.cwd();
	const subcommand = args[0];

	if (
		!subcommand ||
		subcommand === "--help" ||
		subcommand === "-h" ||
		subcommand === "help"
	) {
		stdout(CONTEXT_PACK_HELP);
		return;
	}

	if (subcommand !== "status") {
		throw new Error(
			`Unknown context-pack subcommand: ${subcommand}\n${CONTEXT_PACK_HELP}`,
		);
	}

	let json = false;
	let pack: string | undefined;
	for (let index = 1; index < args.length; index += 1) {
		const arg = args[index];
		if (arg === "--json") {
			json = true;
			continue;
		}
		if (!pack) {
			pack = arg;
			continue;
		}
		throw new Error(`Unknown context-pack status argument: ${arg}`);
	}

	if (!pack) {
		throw new Error(`Missing context-pack path.\n${CONTEXT_PACK_HELP}`);
	}

	const status = readDirectContextPackStatus(cwd, pack);
	stdout(json ? JSON.stringify(status) : renderHumanStatus(status));
}
