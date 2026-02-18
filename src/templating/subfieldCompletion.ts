import * as vscode from "vscode";
import { findNodeAtOffset, getNodePath, parseTree, type Node } from "jsonc-parser";
import { resolveDynamicSubfields } from "../schema/dynamicSubfields";
import type { DynamicSubfieldCatalog } from "../schema/types";
import { isOpenClawConfigDocument } from "../utils";

type CompletionOptions = {
  getCatalog: () => Promise<DynamicSubfieldCatalog | null>;
};

const DOCUMENT_SELECTOR: vscode.DocumentSelector = [
  { language: "jsonc", pattern: "**/openclaw.json" },
  { language: "json", pattern: "**/openclaw.json" },
];

export function registerOpenClawSubfieldCompletion(
  context: vscode.ExtensionContext,
  options: CompletionOptions,
): void {
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      DOCUMENT_SELECTOR,
      new OpenClawSubfieldCompletionProvider(options),
      "\"",
    ),
  );
}

class OpenClawSubfieldCompletionProvider implements vscode.CompletionItemProvider {
  constructor(private readonly options: CompletionOptions) {}

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<vscode.CompletionItem[]> {
    if (!isOpenClawConfigDocument(document)) {
      return [];
    }

    const catalog = await this.options.getCatalog();
    if (!catalog) {
      return [];
    }

    const text = document.getText();
    const root = parseTree(text);
    if (!root) {
      return [];
    }

    const offset = document.offsetAt(position);
    const node = findNodeAtOffset(root, offset, true);
    const objectNode = findClosestObjectNode(node);
    if (!objectNode) {
      return [];
    }

    const path = getNodePath(objectNode)
      .map((segment) => (typeof segment === "number" ? "*" : String(segment)))
      .join(".");
    const entries = resolveDynamicSubfields(catalog, path);
    if (entries.length === 0) {
      return [];
    }

    const existing = collectExistingObjectKeys(objectNode);
    const items: vscode.CompletionItem[] = [];

    for (const entry of entries) {
      if (existing.has(entry.key)) {
        continue;
      }

      const item = new vscode.CompletionItem(entry.key, vscode.CompletionItemKind.Property);
      item.detail = entry.source === "plugin" ? "OpenClaw plugin subfield" : "OpenClaw schema subfield";
      item.documentation = entry.description ? new vscode.MarkdownString(entry.description) : undefined;
      const snippet = entry.snippet
        ? `"${entry.key}": ${entry.snippet}`
        : `"${entry.key}": $1`;
      item.insertText = new vscode.SnippetString(snippet);
      item.filterText = entry.key;
      items.push(item);
    }

    return items;
  }
}

function findClosestObjectNode(node: Node | undefined): Node | null {
  let current = node;
  while (current) {
    if (current.type === "object") {
      return current;
    }
    current = current.parent;
  }
  return null;
}

function collectExistingObjectKeys(node: Node): Set<string> {
  const keys = new Set<string>();
  for (const child of node.children ?? []) {
    if (child.type !== "property") {
      continue;
    }
    const keyNode = child.children?.[0];
    if (keyNode && typeof keyNode.value === "string") {
      keys.add(keyNode.value);
    }
  }
  return keys;
}
