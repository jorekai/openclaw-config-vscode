import * as vscode from "vscode";
import { parse, type ParseError } from "jsonc-parser";
import { SchemaArtifactManager } from "../schema/artifactManager";
import { isOpenClawConfigDocument } from "../utils";
import { dedupeZodDiagnostics } from "./dedupe";
import { findDiagnosticRange } from "./pathRanges";

export class OpenClawZodShadowDiagnostics {
  private readonly diagnostics = vscode.languages.createDiagnosticCollection("openclaw-zod");

  constructor(private readonly artifacts: SchemaArtifactManager) {}

  dispose(): void {
    this.diagnostics.dispose();
  }

  clear(document: vscode.TextDocument): void {
    this.diagnostics.delete(document.uri);
  }

  async validateDocument(document: vscode.TextDocument, enabled: boolean): Promise<void> {
    if (!enabled || !isOpenClawConfigDocument(document)) {
      this.clear(document);
      return;
    }

    const versionAtStart = document.version;
    const parseErrors: ParseError[] = [];
    const parsed = parse(document.getText(), parseErrors, {
      allowTrailingComma: true,
      disallowComments: false,
      allowEmptyContent: true,
    });

    if (parseErrors.length > 0) {
      this.clear(document);
      return;
    }

    const validator = await this.artifacts.getValidator();
    if (!validator) {
      this.clear(document);
      return;
    }

    let issues: Array<{ path: string; message: string }> = [];
    try {
      issues = validator.validate(parsed);
    } catch (error) {
      issues = [
        {
          path: "",
          message: `Zod shadow validator crashed: ${toErrorMessage(error)}`,
        },
      ];
    }

    if (document.version !== versionAtStart) {
      return;
    }

    const diagnostics = issues.map((issue) => {
      const diagnostic = new vscode.Diagnostic(
        findDiagnosticRange(document, issue.path),
        issue.message,
        vscode.DiagnosticSeverity.Error,
      );
      diagnostic.source = "openclaw-zod";
      diagnostic.code = issue.path || "openclaw";
      return diagnostic;
    });

    const externalDiagnostics = vscode.languages
      .getDiagnostics(document.uri)
      .filter((candidate) => candidate.source !== "openclaw-zod");
    const dedupedDiagnostics = dedupeZodDiagnostics(diagnostics, externalDiagnostics);

    this.diagnostics.set(document.uri, dedupedDiagnostics);
  }

  async revalidateAll(enabled: boolean): Promise<void> {
    const targets = vscode.workspace.textDocuments.filter((document) =>
      isOpenClawConfigDocument(document),
    );

    await Promise.all(targets.map((document) => this.validateDocument(document, enabled)));
  }
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
