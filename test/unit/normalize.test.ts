import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { OPENCLAW_SCHEMA_URI } from "../../src/schema/constants";
import { normalizeOpenClawConfigText } from "../../src/templating/normalize";

describe("normalizeOpenClawConfigText", () => {
  it("adds $schema and sorts root keys using ui hint order", () => {
    const text = `{\n  // comment\n  \"gateway\": { \"port\": 18789 },\n  \"agents\": {},\n  \"channels\": {}\n}\n`;
    const hints = JSON.stringify({
      gateway: { order: 30 },
      agents: { order: 40 },
      channels: { order: 150 },
    });

    const normalized = normalizeOpenClawConfigText(text, hints);
    assert.ok(normalized);
    const parsed = JSON.parse(normalized);

    const keys = Object.keys(parsed);
    assert.equal(keys[0], "$schema");
    assert.deepEqual(keys.slice(1), ["gateway", "agents", "channels"]);
    assert.equal(parsed.$schema, OPENCLAW_SCHEMA_URI);
  });

  it("returns null for invalid JSONC input", () => {
    const normalized = normalizeOpenClawConfigText("{ bad", "{}");
    assert.equal(normalized, null);
  });
});
