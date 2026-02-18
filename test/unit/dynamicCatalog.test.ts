import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { buildDynamicSectionSnippets } from "../../src/templating/dynamicCatalog";

describe("buildDynamicSectionSnippets", () => {
  it("builds snippets from schema properties and ui hints", async () => {
    const schema = JSON.stringify({
      type: "object",
      properties: {
        agents: { type: "object" },
        gateway: { type: "object" },
        channels: {
          type: "object",
          properties: {
            telegram: { type: "object" },
            whatsapp: { type: "object" },
          },
        },
      },
    });
    const hints = JSON.stringify({
      gateway: { help: "Gateway settings" },
      "channels.telegram": { help: "Telegram channel" },
    });

    const snippets = await buildDynamicSectionSnippets(
      {
        getSchemaText: async () => schema,
        getUiHintsText: async () => hints,
      } as never,
      [{ label: "agents.defaults", description: "fallback", body: "{}" }],
    );

    const labels = snippets.map((snippet) => snippet.label);
    assert.equal(labels.includes("agents"), true);
    assert.equal(labels.includes("gateway"), true);
    assert.equal(labels.includes("channels.telegram"), true);
    assert.equal(labels.includes("channels.whatsapp"), true);

    const gateway = snippets.find((snippet) => snippet.label === "gateway");
    assert.equal(gateway?.description, "Gateway settings");
  });

  it("returns fallback snippets when live artifacts are invalid", async () => {
    const fallback = [{ label: "agents.defaults", description: "fallback", body: "{}" }];
    const snippets = await buildDynamicSectionSnippets(
      {
        getSchemaText: async () => "{bad-json",
        getUiHintsText: async () => "{}",
      } as never,
      fallback,
    );

    assert.deepEqual(snippets, fallback);
  });
});
