import assert from "node:assert/strict";
import { describe, it } from "vitest";
import {
  buildDynamicSubfieldCatalog,
  resolveDynamicSubfields,
} from "../../src/schema/dynamicSubfields";

describe("dynamicSubfields catalog", () => {
  it("resolves wildcard object paths from schema", () => {
    const schema = JSON.stringify({
      type: "object",
      properties: {
        channels: {
          type: "object",
          properties: {
            whatsapp: {
              type: "object",
              properties: {
                accounts: {
                  type: "object",
                  additionalProperties: {
                    type: "object",
                    properties: {
                      enabled: { type: "boolean" },
                      sendReadReceipts: { type: "boolean" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    const hints = JSON.stringify({
      "channels.whatsapp.accounts.*.sendReadReceipts": {
        help: "Enable or disable read receipts.",
      },
    });

    const catalog = buildDynamicSubfieldCatalog(schema, hints, []);
    const entries = resolveDynamicSubfields(catalog, "channels.whatsapp.accounts.default");
    const keys = entries.map((entry) => entry.key);

    assert.equal(keys.includes("enabled"), true);
    assert.equal(keys.includes("sendReadReceipts"), true);
  });

  it("merges plugin metadata and prefers plugin entries over schema entries", () => {
    const schema = JSON.stringify({
      type: "object",
      properties: {
        channels: {
          type: "object",
          properties: {
            whatsapp: {
              type: "object",
              properties: {
                accounts: {
                  type: "object",
                  additionalProperties: {
                    type: "object",
                    properties: {
                      configWrites: { type: "boolean", description: "schema description" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    const hints = JSON.stringify({});

    const catalog = buildDynamicSubfieldCatalog(schema, hints, [
      {
        path: "channels.whatsapp.accounts.*",
        properties: {
          configWrites: {
            description: "plugin override",
          },
          customPluginFlag: {
            description: "plugin flag",
          },
        },
      },
    ]);

    const entries = resolveDynamicSubfields(catalog, "channels.whatsapp.accounts.business");
    const configWrites = entries.find((entry) => entry.key === "configWrites");
    const pluginFlag = entries.find((entry) => entry.key === "customPluginFlag");

    assert.ok(configWrites);
    assert.equal(configWrites.source, "plugin");
    assert.equal(configWrites.description, "plugin override");
    assert.ok(pluginFlag);
  });
});
