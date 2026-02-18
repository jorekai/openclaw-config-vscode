import path from "node:path";
import * as vscode from "vscode";
import { CONFIG_FILE_NAME } from "./schema/constants";

export function isOpenClawConfigDocument(document: vscode.TextDocument): boolean {
  const base = path.basename(document.fileName || document.uri.fsPath || "");
  return base.toLowerCase() === CONFIG_FILE_NAME;
}

export function clampTtlHours(value: number): number {
  if (!Number.isFinite(value)) {
    return 6;
  }
  return Math.max(1, Math.min(168, Math.floor(value)));
}
