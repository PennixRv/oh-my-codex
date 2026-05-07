import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { readDirectContextPackStatus } from "../context-pack-status.js";

let tempDir: string;

function computeGitBlobSha1(content: string): string {
	const buffer = Buffer.from(content, "utf-8");
	const header = Buffer.from(`blob ${buffer.length}\0`, "utf-8");
	return createHash("sha1").update(header).update(buffer).digest("hex");
}

function relativeToRepo(path: string): string {
	return relative(tempDir, path).replaceAll("\\", "/");
}

function canonicalContextPackRelativePath(slug: string): string {
	return `.omx/context/context-20260507T120000Z-${slug}.json`;
}

function buildContextPackOutcome(relativePackPath: string): string {
	return [
		"## Context Pack Outcome",
		"",
		`- pack: created \`${relativePackPath}\``,
	].join("\n");
}

async function writeApprovedPlan(
	slug: string,
	bodyLines: string[],
): Promise<{
	prdPath: string;
	testSpecPath: string;
	packRelativePath: string;
}> {
	const plansDir = join(tempDir, ".omx", "plans");
	const contextDir = join(tempDir, ".omx", "context");
	await mkdir(plansDir, { recursive: true });
	await mkdir(contextDir, { recursive: true });

	const prdPath = join(plansDir, `prd-${slug}.md`);
	const testSpecPath = join(plansDir, `test-spec-${slug}.md`);
	const packRelativePath = canonicalContextPackRelativePath(slug);

	await writeFile(prdPath, bodyLines.join("\n"));
	await writeFile(testSpecPath, "# Test Spec\n");

	return { prdPath, testSpecPath, packRelativePath };
}

async function writeContextPack(
	slug: string,
	prdPath: string,
	testSpecPath: string,
	roles: string[],
): Promise<void> {
	const packPath = join(tempDir, canonicalContextPackRelativePath(slug));
	const prdActual = await readFile(prdPath, "utf-8");
	const testSpecActual = await readFile(testSpecPath, "utf-8");
	await writeFile(
		packPath,
		JSON.stringify(
			{
				slug,
				basis: {
					prd: {
						path: relativeToRepo(prdPath),
						sha1: computeGitBlobSha1(prdActual),
					},
					testSpecs: [
						{
							path: relativeToRepo(testSpecPath),
							sha1: computeGitBlobSha1(testSpecActual),
						},
					],
				},
				entries: roles.map((role, index) => ({
					path: `src/${role}-${index}.ts`,
					roles: [role],
				})),
			},
			null,
			2,
		),
	);
}

describe("direct context pack status", () => {
	beforeEach(async () => {
		tempDir = await mkdtemp(join(tmpdir(), "omx-direct-context-pack-status-"));
	});

	afterEach(async () => {
		if (tempDir && existsSync(tempDir)) {
			await rm(tempDir, { recursive: true, force: true });
		}
	});

	it("reports ready for a canonical pack with fresh basis, declaration, and required roles", async () => {
		const { prdPath, testSpecPath, packRelativePath } = await writeApprovedPlan(
			"direct-ready",
			[
				"# PRD",
				"",
				buildContextPackOutcome(
					canonicalContextPackRelativePath("direct-ready"),
				),
			],
		);
		await writeContextPack("direct-ready", prdPath, testSpecPath, [
			"scope",
			"build",
			"verify",
		]);

		const status = readDirectContextPackStatus(tempDir, packRelativePath);

		assert.equal(status.contextPackStatus, "ready");
		assert.equal(status.packRelativePath, packRelativePath);
		assert.equal(status.declarationState, "declared");
		assert.equal(status.basisState, "fresh");
		assert.equal(status.roleCoverage, "covered");
		assert.deepEqual(status.contextPackIssues, []);
	});

	it("rejects non-canonical pack paths before reading", () => {
		assert.throws(
			() =>
				readDirectContextPackStatus(tempDir, ".omx/context/not-a-pack.json"),
			/context-<timestamp>-<slug>\.json/,
		);
	});

	it("reports incomplete when a canonical pack is missing required roles", async () => {
		const { prdPath, testSpecPath, packRelativePath } = await writeApprovedPlan(
			"direct-roles",
			[
				"# PRD",
				"",
				buildContextPackOutcome(
					canonicalContextPackRelativePath("direct-roles"),
				),
			],
		);
		await writeContextPack("direct-roles", prdPath, testSpecPath, ["scope"]);

		const status = readDirectContextPackStatus(tempDir, packRelativePath);

		assert.equal(status.contextPackStatus, "incomplete");
		assert.deepEqual(status.missingRequiredContextPackRoles, [
			"build",
			"verify",
		]);
	});

	it("reports invalid when the basis PRD declares a different canonical pack", async () => {
		const { prdPath, testSpecPath, packRelativePath } = await writeApprovedPlan(
			"direct-mismatch",
			[
				"# PRD",
				"",
				buildContextPackOutcome(canonicalContextPackRelativePath("other-pack")),
			],
		);
		await writeContextPack("direct-mismatch", prdPath, testSpecPath, [
			"scope",
			"build",
			"verify",
		]);

		const status = readDirectContextPackStatus(tempDir, packRelativePath);

		assert.equal(status.contextPackStatus, "invalid");
		assert.equal(status.declarationState, "mismatch");
		assert.equal(
			status.declaredPackPath,
			canonicalContextPackRelativePath("other-pack"),
		);
		assert.ok(
			status.contextPackIssues.some((issue) => issue.includes("instead of")),
		);
	});
});
