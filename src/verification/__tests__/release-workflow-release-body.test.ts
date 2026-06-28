import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("release workflow release-body contract", () => {
  it("passes the previous tag when generating GitHub release notes", () => {
    const workflowPath = join(process.cwd(), ".github", "workflows", "release.yml");
    assert.equal(existsSync(workflowPath), true, `missing workflow: ${workflowPath}`);

    const workflow = readFileSync(workflowPath, "utf-8");
    assert.match(workflow, /PREVIOUS_TAG=\$\(git tag --sort=-creatordate \| grep -Fxv "\$GITHUB_REF_NAME" \| head -n 1 \|\| true\)/);
    assert.match(workflow, /ARGS=\(/);
    assert.match(workflow, /ARGS\+=\(--previous-tag "\$PREVIOUS_TAG"\)/);
    assert.match(
      workflow,
      /node dist\/scripts\/generate-release-body\.js \\\s*\n\s*"\$\{ARGS\[@\]\}"/,
    );
  });
});
