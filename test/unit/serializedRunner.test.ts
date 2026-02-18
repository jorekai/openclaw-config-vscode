import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { createSerializedRunner } from "../../src/extension/serializedRunner";

describe("createSerializedRunner", () => {
  it("runs tasks sequentially", async () => {
    const order: string[] = [];
    const run = createSerializedRunner(async (value: number) => {
      order.push(`start-${value}`);
      await new Promise((resolve) => setTimeout(resolve, value === 1 ? 10 : 0));
      order.push(`end-${value}`);
    });

    await Promise.all([run(1), run(2)]);
    assert.deepEqual(order, ["start-1", "end-1", "start-2", "end-2"]);
  });

  it("continues queue execution after a rejected task", async () => {
    const order: string[] = [];
    const run = createSerializedRunner(async (value: number) => {
      order.push(`start-${value}`);
      if (value === 1) {
        throw new Error("boom");
      }
      order.push(`end-${value}`);
    });

    await run(1).catch(() => undefined);
    await run(2);
    assert.deepEqual(order, ["start-1", "start-2", "end-2"]);
  });
});
