import assert from "node:assert/strict";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cancelPendingValidation,
  clearAllPendingValidations,
} from "../../src/extension/pendingValidation";

describe("pendingValidation helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("cancels and removes a pending validation by key", () => {
    const pending = new Map<string, NodeJS.Timeout>();
    const timeout = setTimeout(() => undefined, 1_000);
    pending.set("file:///tmp/openclaw.json", timeout);

    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
    cancelPendingValidation(pending, "file:///tmp/openclaw.json");

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    assert.equal(pending.size, 0);
  });

  it("clears every pending validation timeout", () => {
    const pending = new Map<string, NodeJS.Timeout>();
    pending.set("a", setTimeout(() => undefined, 1_000));
    pending.set("b", setTimeout(() => undefined, 1_000));

    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
    clearAllPendingValidations(pending);

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);
    assert.equal(pending.size, 0);
  });
});
