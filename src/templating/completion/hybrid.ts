import type { ResolvedDynamicSubfieldEntry } from "../../schema/types";

export function isHybridDynamicEntry(entry: ResolvedDynamicSubfieldEntry): boolean {
  return entry.entry.source === "plugin" || entry.matchedByWildcard;
}

export function filterHybridDynamicEntries(
  entries: readonly ResolvedDynamicSubfieldEntry[],
): ResolvedDynamicSubfieldEntry[] {
  return entries.filter((entry) => isHybridDynamicEntry(entry));
}
