import * as vscode from "vscode";
import { applyEdits, modify, parse } from "jsonc-parser";
import { OPENCLAW_SCHEMA_URI } from "../../schema/constants";
import { isOpenClawConfigDocument } from "../../utils";
import { parseIssuePath } from "../issuePath";
import { fullDocumentRange, toEnvVarName } from "./path";
import { FORMAT_OPTIONS, type OpenClawQuickFixPayload } from "./types";

export async function applyQuickFix(payload: unknown): Promise<void> {
  if (!isQuickFixPayload(payload)) {
    await vscode.window.showWarningMessage("OpenClaw quick fix payload is invalid.");
    return;
  }

  const uri = vscode.Uri.parse(payload.uri);
  const document = await vscode.workspace.openTextDocument(uri);
  if (!isOpenClawConfigDocument(document)) {
    await vscode.window.showWarningMessage(
      "OpenClaw quick fix can only be applied to openclaw.json files.",
    );
    return;
  }

  const nextText = computeQuickFixText(document.getText(), payload);
  if (nextText === null || nextText === document.getText()) {
    return;
  }

  const fullRange = fullDocumentRange(document);
  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, fullRange, nextText);
  await vscode.workspace.applyEdit(edit);
  await document.save();
}

export function isQuickFixPayload(value: unknown): value is OpenClawQuickFixPayload {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<OpenClawQuickFixPayload>;
  if (
    candidate.kind !== "setSchema" &&
    candidate.kind !== "removeUnknownKey" &&
    candidate.kind !== "removeDuplicateAgentDir" &&
    candidate.kind !== "removeInvalidBinding" &&
    candidate.kind !== "replaceSecretWithEnvRef"
  ) {
    return false;
  }
  return typeof candidate.uri === "string" && candidate.uri.length > 0;
}

export function computeQuickFixText(text: string, payload: OpenClawQuickFixPayload): string | null {
  switch (payload.kind) {
    case "setSchema": {
      const edits = modify(text, ["$schema"], OPENCLAW_SCHEMA_URI, FORMAT_OPTIONS);
      return edits.length > 0 ? applyEdits(text, edits) : text;
    }
    case "removeUnknownKey": {
      if (!payload.path) {
        return null;
      }
      const edits = modify(text, parseIssuePath(payload.path), undefined, FORMAT_OPTIONS);
      return edits.length > 0 ? applyEdits(text, edits) : text;
    }
    case "removeDuplicateAgentDir": {
      const paths = resolveDuplicateAgentDirPaths(text, payload.diagnosticMessage ?? "");
      if (paths.length === 0) {
        return null;
      }
      let nextText = text;
      for (const path of paths) {
        const edits = modify(nextText, parseIssuePath(path), undefined, FORMAT_OPTIONS);
        if (edits.length === 0) {
          continue;
        }
        nextText = applyEdits(nextText, edits);
      }
      return nextText;
    }
    case "removeInvalidBinding": {
      if (!payload.path) {
        return null;
      }
      const edits = modify(text, parseIssuePath(payload.path), undefined, FORMAT_OPTIONS);
      return edits.length > 0 ? applyEdits(text, edits) : text;
    }
    case "replaceSecretWithEnvRef": {
      if (!payload.path) {
        return null;
      }
      const envReference = `\${env:${toEnvVarName(payload.path)}}`;
      const edits = modify(text, parseIssuePath(payload.path), envReference, FORMAT_OPTIONS);
      return edits.length > 0 ? applyEdits(text, edits) : text;
    }
    default:
      return null;
  }
}

export function resolveDuplicateAgentDirPaths(text: string, diagnosticMessage: string): string[] {
  const parsed = parse(text);
  const agents = (parsed as { agents?: { list?: Array<{ id?: unknown; agentDir?: unknown }> } }).agents;
  const list = Array.isArray(agents?.list) ? agents.list : [];

  const lineMatches = [...diagnosticMessage.matchAll(/: ([^\n]+)/g)];
  const duplicateIds = new Set<string>();
  for (const match of lineMatches) {
    const ids = [...(match[1] ?? "").matchAll(/"([^"]+)"/g)].map((entry) => entry[1]);
    for (const id of ids.slice(1)) {
      duplicateIds.add(id);
    }
  }

  if (duplicateIds.size === 0) {
    return [];
  }

  const paths: string[] = [];
  for (const [index, entry] of list.entries()) {
    const id = typeof entry?.id === "string" ? entry.id : "";
    if (!duplicateIds.has(id)) {
      continue;
    }
    if (typeof entry?.agentDir !== "string" || !entry.agentDir) {
      continue;
    }
    paths.push(`agents.list.${index}.agentDir`);
  }

  return paths;
}
