import * as vscode from "vscode";
import type { DiagnosticFingerprint } from "../schema/types";

export function dedupeZodDiagnostics(
  diagnostics: readonly vscode.Diagnostic[],
  externalDiagnostics: readonly vscode.Diagnostic[],
): vscode.Diagnostic[] {
  const seen = new Set<DiagnosticFingerprint>();
  const deduped: vscode.Diagnostic[] = [];

  for (const diagnostic of diagnostics) {
    const fingerprint = createDiagnosticFingerprint(diagnostic);
    if (seen.has(fingerprint)) {
      continue;
    }

    if (hasOverlappingExternalDiagnostic(diagnostic, externalDiagnostics)) {
      continue;
    }

    seen.add(fingerprint);
    deduped.push(diagnostic);
  }

  return deduped;
}

export function createDiagnosticFingerprint(diagnostic: vscode.Diagnostic): DiagnosticFingerprint {
  const message = normalizeMessage(diagnostic.message);
  const range = `${diagnostic.range.start.line}:${diagnostic.range.start.character}-${diagnostic.range.end.line}:${diagnostic.range.end.character}`;
  const code = diagnostic.code ? String(diagnostic.code) : "";
  return `${message}|${range}|${diagnostic.severity}|${code}`;
}

function hasOverlappingExternalDiagnostic(
  diagnostic: vscode.Diagnostic,
  externalDiagnostics: readonly vscode.Diagnostic[],
): boolean {
  return externalDiagnostics.some((candidate) => {
    if (candidate.source === "openclaw-zod") {
      return false;
    }
    if (candidate.severity > vscode.DiagnosticSeverity.Warning) {
      return false;
    }
    return rangesOverlap(diagnostic.range, candidate.range);
  });
}

function rangesOverlap(a: vscode.Range, b: vscode.Range): boolean {
  return a.intersection(b) !== undefined;
}

function normalizeMessage(input: string): string {
  return input
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 .:_-]+/g, "")
    .trim();
}
