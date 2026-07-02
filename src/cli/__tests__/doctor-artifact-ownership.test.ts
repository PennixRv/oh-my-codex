import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
	checkRepoArtifactOwnership,
	repairRepoArtifactOwnership,
} from "../doctor.js";

function makeStat(
	options: {
		uid: number;
		gid?: number;
		directory?: boolean;
		symlink?: boolean;
	} = { uid: 0 },
): {
	uid: number;
	gid: number;
	isDirectory(): boolean;
	isSymbolicLink(): boolean;
} {
	return {
		uid: options.uid,
		gid: options.gid ?? options.uid,
		isDirectory: () => options.directory === true,
		isSymbolicLink: () => options.symlink === true,
	};
}

describe("repo artifact ownership checks", () => {
	it("warns when a non-root user encounters root-owned repo artifacts", async () => {
		const repoRoot = await mkdtemp(join(tmpdir(), "omx-doctor-artifacts-"));
		try {
			const omxDir = join(repoRoot, ".omx");
			const stateFile = join(omxDir, "state.json");
			await mkdir(omxDir, { recursive: true });
			await writeFile(stateFile, "{}\n");

			const stats = new Map<string, ReturnType<typeof makeStat>>([
				[omxDir, makeStat({ uid: 0, directory: true })],
				[stateFile, makeStat({ uid: 0 })],
			]);

			const check = await checkRepoArtifactOwnership(repoRoot, {
				currentUid: 1000,
				statPath: async (path) => {
					const stat = stats.get(path);
					assert.ok(stat, `unexpected stat path: ${path}`);
					return stat;
				},
				readDir: async (path) => {
					assert.equal(path, omxDir);
					return ["state.json"];
				},
				accessPath: async () => undefined,
			});

			assert.equal(check.status, "warn");
			assert.match(check.message, /\.omx \(root-owned uid=0 gid=0\)/);
			assert.match(check.message, /omx doctor --force/);
		} finally {
			await rm(repoRoot, { recursive: true, force: true });
		}
	});

	it("does not warn when doctor runs as root against root-owned artifacts", async () => {
		const repoRoot = await mkdtemp(join(tmpdir(), "omx-doctor-artifacts-root-"));
		try {
			const omxDir = join(repoRoot, ".omx");
			const stateFile = join(omxDir, "state.json");
			await mkdir(omxDir, { recursive: true });
			await writeFile(stateFile, "{}\n");

			const stats = new Map<string, ReturnType<typeof makeStat>>([
				[omxDir, makeStat({ uid: 0, directory: true })],
				[stateFile, makeStat({ uid: 0 })],
			]);

			const check = await checkRepoArtifactOwnership(repoRoot, {
				currentUid: 0,
				statPath: async (path) => {
					const stat = stats.get(path);
					assert.ok(stat, `unexpected stat path: ${path}`);
					return stat;
				},
				readDir: async (path) => {
					assert.equal(path, omxDir);
					return ["state.json"];
				},
				accessPath: async () => undefined,
			});

			assert.equal(check.status, "pass");
			assert.match(check.message, /writable by the current user/);
		} finally {
			await rm(repoRoot, { recursive: true, force: true });
		}
	});

	it("repairs ownership issues only when the repo root belongs to the current user", async () => {
		const repoRoot = await mkdtemp(join(tmpdir(), "omx-doctor-artifacts-repair-"));
		try {
			const omxDir = join(repoRoot, ".omx");
			const stateFile = join(omxDir, "state.json");
			await mkdir(omxDir, { recursive: true });
			await writeFile(stateFile, "{}\n");

			const stats = new Map<string, ReturnType<typeof makeStat>>([
				[repoRoot, makeStat({ uid: 1000, gid: 1000, directory: true })],
				[omxDir, makeStat({ uid: 0, directory: true })],
				[stateFile, makeStat({ uid: 0 })],
			]);
			const repaired: Array<{ path: string; uid: number; gid: number }> = [];

			const result = await repairRepoArtifactOwnership(repoRoot, {
				currentUid: 1000,
				currentGid: 1000,
				statPath: async (path) => {
					const stat = stats.get(path);
					assert.ok(stat, `unexpected stat path: ${path}`);
					return stat;
				},
				readDir: async (path) => {
					if (path === omxDir) return ["state.json"];
					return [];
				},
				accessPath: async () => undefined,
				chownPath: async (path, uid, gid) => {
					repaired.push({ path, uid, gid });
				},
			});

			assert.equal(result.repaired, 2);
			assert.deepEqual(repaired, [
				{ path: omxDir, uid: 1000, gid: 1000 },
				{ path: stateFile, uid: 1000, gid: 1000 },
			]);
			assert.deepEqual(result.skipped, []);
		} finally {
			await rm(repoRoot, { recursive: true, force: true });
		}
	});
});
