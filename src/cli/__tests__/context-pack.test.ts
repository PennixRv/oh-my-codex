import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { CONTEXT_PACK_HELP, contextPackCommand } from "../context-pack.js";

let tempDir: string;

function gitBlobSha1(content: string): string {
	const buffer = Buffer.from(content, "utf-8");
	return createHash("sha1")
		.update(Buffer.from(`blob ${buffer.length}\0`, "utf-8"))
		.update(buffer)
		.digest("hex");
}

function rel(path: string): string {
	return relative(tempDir, path).replaceAll("\\", "/");
}

async function writeReadyPack(slug: string): Promise<string> {
	const plansDir = join(tempDir, ".omx", "plans");
	const contextDir = join(tempDir, ".omx", "context");
	await mkdir(plansDir, { recursive: true });
	await mkdir(contextDir, { recursive: true });
	const packRelativePath = `.omx/context/context-20260507T120000Z-${slug}.json`;
	const prdPath = join(plansDir, `prd-${slug}.md`);
	const testSpecPath = join(plansDir, `test-spec-${slug}.md`);
	await writeFile(
		prdPath,
		[
			"# PRD",
			"",
			"## Context Pack Outcome",
			"",
			`- pack: created \`${packRelativePath}\``,
		].join("\n"),
	);
	await writeFile(testSpecPath, "# Test Spec\n");
	const prdContent = await readFile(prdPath, "utf-8");
	const testSpecContent = await readFile(testSpecPath, "utf-8");
	await writeFile(
		join(tempDir, packRelativePath),
		JSON.stringify(
			{
				slug,
				basis: {
					prd: { path: rel(prdPath), sha1: gitBlobSha1(prdContent) },
					testSpecs: [
						{ path: rel(testSpecPath), sha1: gitBlobSha1(testSpecContent) },
					],
				},
				entries: ["scope", "build", "verify"].map((role) => ({
					path: `src/${role}.ts`,
					roles: [role],
				})),
			},
			null,
			2,
		),
	);
	return packRelativePath;
}

describe("contextPackCommand", () => {
	beforeEach(async () => {
		tempDir = await mkdtemp(join(tmpdir(), "omx-context-pack-cli-"));
	});

	afterEach(async () => {
		if (tempDir && existsSync(tempDir)) {
			await rm(tempDir, { recursive: true, force: true });
		}
	});

	it("prints local help", async () => {
		const out: string[] = [];
		await contextPackCommand(["--help"], {
			cwd: tempDir,
			stdout: (line) => out.push(line),
		});
		assert.deepEqual(out, [CONTEXT_PACK_HELP]);
	});

	it("emits JSON status for a canonical pack", async () => {
		const pack = await writeReadyPack("cli-ready");
		const out: string[] = [];

		await contextPackCommand(["status", pack, "--json"], {
			cwd: tempDir,
			stdout: (line) => out.push(line),
		});

		assert.equal(out.length, 1);
		const parsed = JSON.parse(out[0]!);
		assert.equal(parsed.contextPackStatus, "ready");
		assert.equal(parsed.packRelativePath, pack);
		assert.equal(parsed.declarationState, "declared");
	});

	it("keeps query and view out of the first status-only slice", async () => {
		await assert.rejects(
			contextPackCommand(
				["query", ".omx/context/context-20260507T120000Z-cli-ready.json"],
				{ cwd: tempDir },
			),
			/Unknown context-pack subcommand: query/,
		);
	});
});
