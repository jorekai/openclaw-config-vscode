import assert from "node:assert/strict";
import { describe, it } from "vitest";
import type { ResolvedDynamicSubfieldEntry } from "../../src/schema/types";
import { filterHybridDynamicEntries } from "../../src/templating/completion/hybrid";
import {
  buildKeyCompletionSuggestions,
  buildValueCompletionSuggestions,
} from "../../src/templating/completion/items";

describe("completion items", () => {
  it("filters to hybrid entries and skips existing keys", () => {
    const mixed: ResolvedDynamicSubfieldEntry[] = [
      resolution({
        key: "mode",
        path: "gateway.mode",
        source: "schema",
      }, "gateway", false),
      resolution({
        key: "pluginFlag",
        path: "gateway.pluginFlag",
        source: "plugin",
        snippet: "${1|on,off|}",
      }, "gateway", false),
      resolution({
        key: "configWrites",
        path: "channels.whatsapp.accounts.*.configWrites",
        source: "schema",
      }, "channels.whatsapp.accounts.*", true),
    ];

    const hybrid = filterHybridDynamicEntries(mixed);
    const suggestions = buildKeyCompletionSuggestions(hybrid, new Set(["configWrites"]));

    assert.equal(hybrid.length, 2);
    assert.equal(suggestions.length, 1);
    assert.equal(suggestions[0].label, "pluginFlag");
    assert.match(suggestions[0].detail ?? "", /plugin/i);
  });

  it("builds value suggestions with priority and dedupe", () => {
    const suggestions = buildValueCompletionSuggestions(
      resolution(
        {
          key: "dynamicMode",
          path: "channels.whatsapp.accounts.*.dynamicMode",
          source: "plugin",
          snippet: '"${1:value}"',
          valueHints: {
            valueType: "string",
            defaultValue: "strict",
            enumValues: ["strict", "relaxed"],
            examples: ["relaxed", "debug"],
          },
        },
        "channels.whatsapp.accounts.*",
        true,
      ),
    );

    const labels = suggestions.map((item) => item.label);
    assert.equal(labels[0], '"strict"');
    assert.equal(labels.includes('"relaxed"'), true);
    assert.equal(labels.includes('"debug"'), true);
    assert.equal(labels.filter((label) => label === '"strict"').length, 1);
    assert.equal(suggestions.some((item) => item.insertText.kind === "snippet"), true);
  });

  it("falls back to boolean values when no enum hints exist", () => {
    const suggestions = buildValueCompletionSuggestions(
      resolution(
        {
          key: "enabled",
          path: "channels.whatsapp.accounts.*.enabled",
          source: "schema",
          valueHints: {
            valueType: "boolean",
          },
        },
        "channels.whatsapp.accounts.*",
        true,
      ),
    );

    const labels = suggestions.map((item) => item.label);
    assert.equal(labels.includes("true"), true);
    assert.equal(labels.includes("false"), true);
  });
});

function resolution(
  entry: ResolvedDynamicSubfieldEntry["entry"],
  matchedPattern: string,
  matchedByWildcard: boolean,
): ResolvedDynamicSubfieldEntry {
  return {
    entry,
    matchedPattern,
    matchedByWildcard,
  };
}
