import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(testDir, "..", "..", "..");
const cliIndex = readFileSync(join(repoRoot, "src", "cli", "index.ts"), "utf-8");

describe("launch startup contract", () => {
	it("does not invoke the interactive GitHub star prompt on launch paths", () => {
		assert.doesNotMatch(cliIndex, /maybePromptGithubStar\s*\(/);
		assert.doesNotMatch(cliIndex, /from "\.\/star-prompt\.js"/);
	});
});
