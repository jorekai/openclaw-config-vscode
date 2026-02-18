import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { buildDynamicSubfieldCatalog } from "../../src/schema/dynamicSubfields";
import { buildFieldExplainMarkdown, findPathAtOffset } from "../../src/schema/explain";

describe("explain helpers", () => {
  it("finds json path at cursor offset", () => {
    const text = `{\n  \"bindings\": [{ \"match\": { \"accountId\": \"default\" } }]\n}\n`;
    const offset = text.indexOf("accountId");
    const path = findPathAtOffset(text, offset);
    assert.equal(path, "bindings.0.match.accountId");
  });

  it("builds markdown with allowed subfields", () => {
    const schema = JSON.stringify({
      type: "object",
      properties: {
        gateway: {
          type: "object",
          properties: {
            mode: { type: "string" },
            port: { type: "number" },
          },
        },
      },
    });
    const hints = JSON.stringify({
      gateway: { label: "Gateway", help: "Gateway settings." },
      "gateway.mode": { help: "Gateway mode." },
    });
    const catalog = buildDynamicSubfieldCatalog(schema, hints, []);

    const markdown = buildFieldExplainMarkdown("gateway", catalog, hints);
    assert.match(markdown, /Gateway settings/);
    assert.match(markdown, /`mode`/);
    assert.match(markdown, /`port`/);
  });
});
