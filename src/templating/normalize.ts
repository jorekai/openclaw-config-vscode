import { parse, type ParseError } from "jsonc-parser";
import { OPENCLAW_SCHEMA_URI } from "../schema/constants";

type UiHintRecord = Record<string, { order?: number }>;

export function normalizeOpenClawConfigText(text: string, uiHintsText: string): string | null {
  const parseErrors: ParseError[] = [];
  const parsed = parse(text, parseErrors, {
    allowTrailingComma: true,
    disallowComments: false,
    allowEmptyContent: true,
  });

  if (parseErrors.length > 0 || !parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  const root = parsed as Record<string, unknown>;
  if (typeof root.$schema !== "string" || !root.$schema.trim()) {
    root.$schema = OPENCLAW_SCHEMA_URI;
  }

  const orderHints = parseOrderHints(uiHintsText);
  const normalized = sortValue(root, [], orderHints);
  return `${JSON.stringify(normalized, null, 2)}\n`;
}

function parseOrderHints(uiHintsText: string): Map<string, number> {
  let parsed: UiHintRecord;
  try {
    parsed = JSON.parse(uiHintsText) as UiHintRecord;
  } catch {
    return new Map();
  }

  const map = new Map<string, number>();
  for (const [key, value] of Object.entries(parsed)) {
    if (!key.includes(".") && typeof value.order === "number") {
      map.set(key, value.order);
    }
  }
  return map;
}

function sortValue(
  value: unknown,
  pathSegments: string[],
  rootOrderHints: Map<string, number>,
): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sortValue(entry, [...pathSegments, "*"], rootOrderHints));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const input = value as Record<string, unknown>;
  const keys = Object.keys(input).sort((a, b) =>
    compareKeys(pathSegments, a, b, rootOrderHints),
  );
  const output: Record<string, unknown> = {};
  for (const key of keys) {
    output[key] = sortValue(input[key], [...pathSegments, key], rootOrderHints);
  }
  return output;
}

function compareKeys(
  pathSegments: string[],
  a: string,
  b: string,
  rootOrderHints: Map<string, number>,
): number {
  if (pathSegments.length === 0) {
    if (a === "$schema") {
      return -1;
    }
    if (b === "$schema") {
      return 1;
    }
    const aOrder = rootOrderHints.get(a) ?? Number.MAX_SAFE_INTEGER;
    const bOrder = rootOrderHints.get(b) ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
  }
  return a.localeCompare(b);
}
