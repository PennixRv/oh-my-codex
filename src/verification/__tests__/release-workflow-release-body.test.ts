import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("release workflow release-body contract", () => {
  it("passes the latest published ancestor tag when generating GitHub release notes", () => {
    const workflowPath = join(process.cwd(), ".github", "workflows", "release.yml");
    assert.equal(existsSync(workflowPath), true, `missing workflow: ${workflowPath}`);

    const workflow = readFileSync(workflowPath, "utf-8");
    assert.match(workflow, /while read -r CANDIDATE_TAG; do/);
    assert.match(workflow, /git merge-base --is-ancestor "\$CANDIDATE_TAG" "\$GITHUB_REF_NAME"/);
    assert.match(workflow, /gh release view "\$CANDIDATE_TAG" --repo "\$GITHUB_REPOSITORY"/);
    assert.match(workflow, /PREVIOUS_TAG="\$CANDIDATE_TAG"/);
    assert.match(workflow, /ARGS=\(/);
    assert.match(workflow, /ARGS\+=\(--previous-tag "\$PREVIOUS_TAG"\)/);
    assert.match(
      workflow,
      /node dist\/scripts\/generate-release-body\.js \\\s*\n\s*"\$\{ARGS\[@\]\}"/,
    );
  });
});
