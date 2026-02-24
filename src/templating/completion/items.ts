import type { CompletionPrimitive, DynamicValueType, ResolvedDynamicSubfieldEntry } from "../../schema/types";

export type CompletionInsert =
  | {
      kind: "text";
      value: string;
    }
  | {
      kind: "snippet";
      value: string;
    };

export type CompletionSuggestion = {
  kind: "property" | "value";
  label: string;
  detail?: string;
  documentation?: string;
  insertText: CompletionInsert;
  filterText?: string;
  sortText?: string;
};

export function buildKeyCompletionSuggestions(
  entries: readonly ResolvedDynamicSubfieldEntry[],
  existingKeys: ReadonlySet<string>,
): CompletionSuggestion[] {
  const suggestions: CompletionSuggestion[] = [];

  for (const resolution of entries) {
    const { entry } = resolution;
    if (existingKeys.has(entry.key)) {
      continue;
    }

    suggestions.push({
      kind: "property",
      label: entry.key,
      detail: `${sourceDetail(entry.source)}${resolution.matchedByWildcard ? " (wildcard context)" : ""}`,
      documentation: entry.description,
      insertText: {
        kind: "snippet",
        value: entry.snippet ? `"${entry.key}": ${entry.snippet}` : `"${entry.key}": $1`,
      },
      filterText: entry.key,
    });
  }

  return suggestions;
}

export function buildValueCompletionSuggestions(
  resolution: ResolvedDynamicSubfieldEntry,
): CompletionSuggestion[] {
  const suggestions: CompletionSuggestion[] = [];
  const seen = new Set<string>();
  let order = 0;

  const pushSuggestion = (candidate: Omit<CompletionSuggestion, "kind" | "sortText">): void => {
    const fingerprint = `${candidate.insertText.kind}:${candidate.insertText.value}`;
    if (seen.has(fingerprint)) {
      return;
    }

    seen.add(fingerprint);
    suggestions.push({
      ...candidate,
      kind: "value",
      sortText: `${String(order).padStart(2, "0")}-${candidate.label}`,
    });
    order += 1;
  };

  const valueHints = resolution.entry.valueHints;
  const source = sourceDetail(resolution.entry.source);

  if (valueHints?.defaultValue !== undefined) {
    pushSuggestion({
      label: formatPrimitiveLabel(valueHints.defaultValue),
      detail: `Default value (${source.toLowerCase()})`,
      documentation: resolution.entry.description,
      insertText: {
        kind: "text",
        value: toJsonLiteral(valueHints.defaultValue),
      },
    });
  }

  for (const value of valueHints?.enumValues ?? []) {
    pushSuggestion({
      label: formatPrimitiveLabel(value),
      detail: `Allowed value (${source.toLowerCase()})`,
      documentation: resolution.entry.description,
      insertText: {
        kind: "text",
        value: toJsonLiteral(value),
      },
    });
  }

  for (const value of valueHints?.examples ?? []) {
    pushSuggestion({
      label: formatPrimitiveLabel(value),
      detail: `Example value (${source.toLowerCase()})`,
      documentation: resolution.entry.description,
      insertText: {
        kind: "text",
        value: toJsonLiteral(value),
      },
    });
  }

  if (valueHints?.valueType === "boolean") {
    pushSuggestion({
      label: "true",
      detail: `Boolean value (${source.toLowerCase()})`,
      documentation: resolution.entry.description,
      insertText: {
        kind: "text",
        value: "true",
      },
    });
    pushSuggestion({
      label: "false",
      detail: `Boolean value (${source.toLowerCase()})`,
      documentation: resolution.entry.description,
      insertText: {
        kind: "text",
        value: "false",
      },
    });
  }

  const fallbackSnippet = resolution.entry.snippet ?? inferValueSnippet(valueHints?.valueType);
  if (fallbackSnippet) {
    pushSuggestion({
      label: fallbackLabelForType(valueHints?.valueType),
      detail: `Type snippet (${source.toLowerCase()})`,
      documentation: resolution.entry.description,
      insertText: {
        kind: "snippet",
        value: fallbackSnippet,
      },
    });
  }

  return suggestions;
}

function sourceDetail(source: "schema" | "plugin"): string {
  return source === "plugin" ? "OpenClaw plugin subfield" : "OpenClaw schema subfield";
}

function toJsonLiteral(value: CompletionPrimitive): string {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  if (value === null) {
    return "null";
  }
  return String(value);
}

function formatPrimitiveLabel(value: CompletionPrimitive): string {
  return toJsonLiteral(value);
}

function inferValueSnippet(type: DynamicValueType | undefined): string | undefined {
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

function fallbackLabelForType(type: DynamicValueType | undefined): string {
  switch (type) {
    case "object":
      return "{...}";
    case "array":
      return "[...]";
    case "string":
      return '"value"';
    case "integer":
    case "number":
      return "0";
    case "boolean":
      return "true|false";
    default:
      return "<value>";
  }
}
