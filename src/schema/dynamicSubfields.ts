import type { DynamicSubfieldCatalog, DynamicSubfieldEntry, PluginHintEntry } from "./types";

type JsonSchemaNode = {
  type?: string | string[];
  properties?: Record<string, JsonSchemaNode>;
  additionalProperties?: boolean | JsonSchemaNode;
  items?: JsonSchemaNode;
  anyOf?: JsonSchemaNode[];
  oneOf?: JsonSchemaNode[];
  allOf?: JsonSchemaNode[];
  description?: string;
  title?: string;
  enum?: unknown[];
};

type UiHintRecord = Record<string, { label?: string; help?: string }>;

export function buildDynamicSubfieldCatalog(
  schemaText: string,
  uiHintsText: string,
  pluginEntries: readonly PluginHintEntry[],
): DynamicSubfieldCatalog {
  const schema = parseJson<JsonSchemaNode>(schemaText) ?? {};
  const hints = parseJson<UiHintRecord>(uiHintsText) ?? {};

  const fieldsByPattern = new Map<string, DynamicSubfieldEntry[]>();
  const rootSections = new Set<string>();

  walkSchema(schema, [], hints, fieldsByPattern, rootSections);
  mergePluginEntries(pluginEntries, hints, fieldsByPattern);

  return {
    sections: [...rootSections].sort((a, b) => a.localeCompare(b)),
    fieldsByPattern,
  };
}

export function resolveDynamicSubfields(
  catalog: DynamicSubfieldCatalog,
  rawPath: string,
): DynamicSubfieldEntry[] {
  const path = normalizePath(rawPath);
  const pathSegments = path ? path.split(".") : [];
  const seen = new Map<string, DynamicSubfieldEntry>();

  for (const [pattern, entries] of catalog.fieldsByPattern) {
    const patternSegments = pattern ? pattern.split(".") : [];
    if (!matchesPathPattern(patternSegments, pathSegments)) {
      continue;
    }
    for (const entry of entries) {
      const existing = seen.get(entry.key);
      if (!existing || (existing.source === "schema" && entry.source === "plugin")) {
        seen.set(entry.key, entry);
      }
    }
  }

  return [...seen.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function walkSchema(
  node: JsonSchemaNode,
  pathSegments: string[],
  hints: UiHintRecord,
  fieldsByPattern: Map<string, DynamicSubfieldEntry[]>,
  rootSections: Set<string>,
): void {
  if (!node || typeof node !== "object") {
    return;
  }

  const properties = collectProperties(node);
  const objectPattern = pathSegments.join(".");

  for (const [key, propertyNode] of properties) {
    if (pathSegments.length === 0 && key !== "$schema") {
      rootSections.add(key);
    }

    const fullPath = [...pathSegments, key].join(".");
    const hint = resolveHint(hints, fullPath);
    const description = hint?.help ?? hint?.label ?? propertyNode.description ?? propertyNode.title;
    const snippet = inferSnippet(propertyNode);

    addField(fieldsByPattern, objectPattern, {
      key,
      path: fullPath,
      description: description || undefined,
      source: "schema",
      snippet,
    });

    walkSchema(propertyNode, [...pathSegments, key], hints, fieldsByPattern, rootSections);
  }

  if (isObjectSchema(node.additionalProperties)) {
    walkSchema(node.additionalProperties, [...pathSegments, "*"], hints, fieldsByPattern, rootSections);
  }

  if (isObjectSchema(node.items)) {
    walkSchema(node.items, [...pathSegments, "*"], hints, fieldsByPattern, rootSections);
  }
}

function collectProperties(node: JsonSchemaNode): Map<string, JsonSchemaNode> {
  const merged = new Map<string, JsonSchemaNode>();

  const direct = node.properties ?? {};
  for (const [key, value] of Object.entries(direct)) {
    if (isObjectSchema(value)) {
      merged.set(key, value);
    }
  }

  for (const composed of [...(node.anyOf ?? []), ...(node.oneOf ?? []), ...(node.allOf ?? [])]) {
    if (!isObjectSchema(composed)) {
      continue;
    }
    for (const [key, value] of collectProperties(composed)) {
      if (!merged.has(key)) {
        merged.set(key, value);
      }
    }
  }

  return merged;
}

function mergePluginEntries(
  entries: readonly PluginHintEntry[],
  hints: UiHintRecord,
  fieldsByPattern: Map<string, DynamicSubfieldEntry[]>,
): void {
  for (const entry of entries) {
    const pattern = normalizePath(entry.path);
    for (const [fieldKey, fieldHint] of Object.entries(entry.properties)) {
      const cleanKey = fieldKey.trim();
      if (!cleanKey) {
        continue;
      }
      const fullPath = [pattern, cleanKey].filter(Boolean).join(".");
      const hint = resolveHint(hints, fullPath);
      addField(fieldsByPattern, pattern, {
        key: cleanKey,
        path: fullPath,
        description: fieldHint.description ?? hint?.help ?? hint?.label,
        source: "plugin",
        snippet: fieldHint.snippet ?? inferSnippetFromType(fieldHint.type),
      });
    }
  }
}

function addField(
  fieldsByPattern: Map<string, DynamicSubfieldEntry[]>,
  pattern: string,
  candidate: DynamicSubfieldEntry,
): void {
  const current = fieldsByPattern.get(pattern) ?? [];
  const existingIndex = current.findIndex((entry) => entry.key === candidate.key);

  if (existingIndex === -1) {
    current.push(candidate);
    fieldsByPattern.set(pattern, current);
    return;
  }

  const existing = current[existingIndex];
  if (existing.source === "schema" && candidate.source === "plugin") {
    current.splice(existingIndex, 1, candidate);
    fieldsByPattern.set(pattern, current);
  }
}

function resolveHint(
  hints: UiHintRecord,
  fullPath: string,
): { label?: string; help?: string } | undefined {
  const normalized = normalizePath(fullPath);
  if (!normalized) {
    return undefined;
  }
  if (hints[normalized]) {
    return hints[normalized];
  }
  const wildcard = normalized.replace(/\.\d+(\.|$)/g, ".*$1");
  if (hints[wildcard]) {
    return hints[wildcard];
  }
  return undefined;
}

function matchesPathPattern(patternSegments: string[], pathSegments: string[]): boolean {
  if (patternSegments.length !== pathSegments.length) {
    return false;
  }
  for (let index = 0; index < patternSegments.length; index += 1) {
    const expected = patternSegments[index];
    const actual = pathSegments[index];
    if (expected !== "*" && expected !== actual) {
      return false;
    }
  }
  return true;
}

function inferSnippet(node: JsonSchemaNode): string | undefined {
  const type = Array.isArray(node.type) ? node.type[0] : node.type;
  return inferSnippetFromType(type);
}

function inferSnippetFromType(type: string | undefined): string | undefined {
  switch (type) {
    case "object":
      return "{\n  $1\n}";
    case "array":
      return "[\n  $1\n]";
    case "string":
      return '"${1:value}"';
    case "integer":
    case "number":
      return "${1:0}";
    case "boolean":
      return "${1|true,false|}";
    default:
      return undefined;
  }
}

function parseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizePath(value: string): string {
  return value
    .trim()
    .replace(/\[(\d+|\*)\]/g, ".$1")
    .split(".")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join(".");
}

function isObjectSchema(value: unknown): value is JsonSchemaNode {
  return Boolean(value && typeof value === "object");
}
