import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { parseIssuePath } from "../../src/validation/issuePath";

describe("parseIssuePath", () => {
  it("parses dotted paths", () => {
    assert.deepEqual(parseIssuePath("agents.list.0.identity.avatar"), [
      "agents",
      "list",
      0,
      "identity",
      "avatar",
    ]);
  });

  it("parses bracket notation", () => {
    assert.deepEqual(parseIssuePath("agents.list[2].dir"), ["agents", "list", 2, "dir"]);
  });

  it("drops wildcard segments", () => {
    assert.deepEqual(parseIssuePath("agents.list.*.dir"), ["agents", "list", "dir"]);
  });

  it("handles empty paths", () => {
    assert.deepEqual(parseIssuePath(""), []);
  });
});
