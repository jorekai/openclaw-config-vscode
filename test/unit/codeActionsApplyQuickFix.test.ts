import assert from "node:assert/strict";
import { beforeEach, describe, expect, it, vi } from "vitest";

type MockDocument = {
  uri: { fsPath: string; toString: () => string };
  fileName: string;
  lineCount: number;
  getText: () => string;
  positionAt: (offset: number) => { line: number; character: number };
  lineAt: (line: number) => { text: string };
  save: ReturnType<typeof vi.fn>;
};

let activeDocument: MockDocument;
const applyEditMock = vi.fn(async () => true);
const warningMock = vi.fn(async () => undefined);
const replaceMock = vi.fn();

function createDocument(fileName: string, text = "{}\n"): MockDocument {
  return {
    uri: {
      fsPath: fileName,
      toString: () => `file://${fileName}`,
    },
    fileName,
    lineCount: 1,
    getText: () => text,
    positionAt: (offset: number) => ({ line: 0, character: offset }),
    lineAt: () => ({ text: text.replace(/\n$/, "") }),
    save: vi.fn(async () => true),
  };
}

vi.mock("vscode", () => ({
  Uri: {
    parse: (value: string) => ({
      fsPath: value.replace(/^file:\/\//, ""),
      toString: () => value,
    }),
  },
  WorkspaceEdit: class {
    replace(uri: unknown, range: unknown, text: unknown): void {
      replaceMock(uri, range, text);
    }
  },
  Range: class {
    constructor(
      public readonly startLine: number,
      public readonly startCharacter: number,
      public readonly endLine: number,
      public readonly endCharacter: number,
    ) {}
  },
  workspace: {
    openTextDocument: vi.fn(async () => activeDocument),
    applyEdit: applyEditMock,
  },
  window: {
    showWarningMessage: warningMock,
  },
}));

describe("applyQuickFix", () => {
  beforeEach(() => {
    applyEditMock.mockClear();
    warningMock.mockClear();
    replaceMock.mockClear();
  });

  it("rejects quick fixes on non-openclaw files", async () => {
    activeDocument = createDocument("/tmp/any.json");
    const { applyQuickFix } = await import("../../src/validation/codeActions/transform");

    await applyQuickFix({
      kind: "setSchema",
      uri: "file:///tmp/any.json",
    });

    expect(warningMock).toHaveBeenCalledTimes(1);
    expect(applyEditMock).not.toHaveBeenCalled();
    expect(activeDocument.save).not.toHaveBeenCalled();
  });

  it("applies quick fix on openclaw.json", async () => {
    activeDocument = createDocument("/tmp/openclaw.json");
    const { applyQuickFix } = await import("../../src/validation/codeActions/transform");

    await applyQuickFix({
      kind: "setSchema",
      uri: "file:///tmp/openclaw.json",
    });

    assert.equal(warningMock.mock.calls.length, 0);
    expect(applyEditMock).toHaveBeenCalledTimes(1);
    expect(activeDocument.save).toHaveBeenCalledTimes(1);
  });
});
