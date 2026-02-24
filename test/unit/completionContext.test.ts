import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { resolveCompletionContext } from "../../src/templating/completion/context";

describe("completion context", () => {
  it("detects object-key context and normalizes array paths", () => {
    const { text, offset } = withCursor(`{
  "bindings": [
    {
      "match": {
        __CURSOR__
      }
    }
  ]
}`);

    const context = resolveCompletionContext(text, offset);
    assert.equal(context.mode, "objectKey");
    if (context.mode !== "objectKey") {
      return;
    }

    assert.equal(context.objectPath, "bindings.*.match");
    assert.equal(context.existingKeys.size, 0);
  });

  it("detects value context for the active property", () => {
    const { text, offset } = withCursor(`{
  "channels": {
    "whatsapp": {
      "enabled": t__CURSOR__rue,
      "dmPolicy": "pairing"
    }
  }
}`);

    const context = resolveCompletionContext(text, offset);
    assert.equal(context.mode, "propertyValue");
    if (context.mode !== "propertyValue") {
      return;
    }

    assert.equal(context.objectPath, "channels.whatsapp");
    assert.equal(context.propertyKey, "enabled");
    assert.equal(context.existingKeys.has("enabled"), true);
    assert.equal(context.existingKeys.has("dmPolicy"), true);
  });

  it("returns none when no parse tree can be built", () => {
    const context = resolveCompletionContext("", 0);
    assert.equal(context.mode, "none");
  });
});

function withCursor(input: string): { text: string; offset: number } {
  const marker = "__CURSOR__";
  const offset = input.indexOf(marker);
  if (offset < 0) {
    throw new Error("Missing cursor marker");
  }

  return {
    text: input.replace(marker, ""),
    offset,
  };
}
