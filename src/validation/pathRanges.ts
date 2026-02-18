import * as vscode from "vscode";
import { findNodeAtLocation, parseTree, type Node } from "jsonc-parser";
import { parseIssuePath } from "./issuePath";

export function findDiagnosticRange(
  document: vscode.TextDocument,
  issuePath: string,
): vscode.Range {
  const root = parseTree(document.getText());
  if (!root) {
    return new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 1));
  }

  const pathSegments = parseIssuePath(issuePath);
  const node = findBestNode(root, pathSegments);
  if (!node) {
    return fallbackRange(document);
  }

  const start = document.positionAt(node.offset);
  const end = document.positionAt(node.offset + Math.max(node.length, 1));
  return new vscode.Range(start, end);
}

function findBestNode(root: Node, pathSegments: Array<string | number>): Node | null {
  if (pathSegments.length === 0) {
    return root;
  }

  let candidate = findNodeAtLocation(root, pathSegments);
  if (candidate) {
    return candidate;
  }

  const mutable = [...pathSegments];
  while (mutable.length > 0) {
    mutable.pop();
    candidate = findNodeAtLocation(root, mutable);
    if (candidate) {
      return candidate;
    }
  }

  return root;
}

function fallbackRange(document: vscode.TextDocument): vscode.Range {
  if (document.lineCount === 0) {
    return new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 1));
  }
  const firstLine = document.lineAt(0);
  return new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, Math.max(1, firstLine.text.length)));
}
