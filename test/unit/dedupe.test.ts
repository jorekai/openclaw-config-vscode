import assert from "node:assert/strict";
import { describe, it, vi } from "vitest";

vi.mock("vscode", () => ({
  DiagnosticSeverity: {
    Error: 0,
    Warning: 1,
    Information: 2,
    Hint: 3,
  },
}));

describe("dedupeZodDiagnostics", () => {
  it("removes duplicate zod diagnostics by fingerprint", async () => {
    const { dedupeZodDiagnostics } = await import("../../src/validation/dedupe");
    const range = createRange(1, 2, 1, 8);
    const diagnostics = [
      {
        message: "Duplicate agentDir detected",
        range,
        severity: 0,
        code: "agents.list.1.agentDir",
        source: "openclaw-zod",
      },
      {
        message: "Duplicate   agentDir detected",
        range,
        severity: 0,
        code: "agents.list.1.agentDir",
        source: "openclaw-zod",
      },
    ];

    const deduped = dedupeZodDiagnostics(diagnostics as never, []);
    assert.equal(deduped.length, 1);
  });

  it("filters zod diagnostics that overlap with external error/warning diagnostics", async () => {
    const { dedupeZodDiagnostics } = await import("../../src/validation/dedupe");
    const diagnostics = [
      {
        message: "Unrecognized key: \"foo\"",
        range: createRange(3, 2, 3, 10),
        severity: 0,
        source: "openclaw-zod",
      },
    ];
    const external = [
      {
        message: "Property foo is not allowed",
        range: createRange(3, 0, 3, 14),
        severity: 1,
        source: "json-schema",
      },
    ];

    const deduped = dedupeZodDiagnostics(diagnostics as never, external as never);
    assert.equal(deduped.length, 0);
  });

  it("keeps zod diagnostics when external overlap is informational only", async () => {
    const { dedupeZodDiagnostics } = await import("../../src/validation/dedupe");
    const diagnostics = [
      {
        message: "Duplicate agentDir detected",
        range: createRange(5, 2, 5, 10),
        severity: 0,
        source: "openclaw-zod",
      },
    ];
    const external = [
      {
        message: "Some hint",
        range: createRange(5, 0, 5, 12),
        severity: 2,
        source: "json",
      },
    ];

    const deduped = dedupeZodDiagnostics(diagnostics as never, external as never);
    assert.equal(deduped.length, 1);
  });
});

type MockPosition = { line: number; character: number };
type MockRange = {
  start: MockPosition;
  end: MockPosition;
  intersection: (other: MockRange) => MockRange | undefined;
};

function createRange(
  startLine: number,
  startCharacter: number,
  endLine: number,
  endCharacter: number,
): MockRange {
  return {
    start: { line: startLine, character: startCharacter },
    end: { line: endLine, character: endCharacter },
    intersection(other: MockRange): MockRange | undefined {
      const start = comparePosition(this.start, other.start) > 0 ? this.start : other.start;
      const end = comparePosition(this.end, other.end) < 0 ? this.end : other.end;
      if (comparePosition(start, end) > 0) {
        return undefined;
      }
      return {
        start,
        end,
        intersection: this.intersection,
      };
    },
  };
}

function comparePosition(a: MockPosition, b: MockPosition): number {
  if (a.line !== b.line) {
    return a.line - b.line;
  }
  return a.character - b.character;
}
