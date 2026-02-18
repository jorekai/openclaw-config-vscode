export function parseIssuePath(path: string): Array<string | number> {
  if (!path.trim()) {
    return [];
  }

  const normalized = path.replace(/\[(\d+)\]/g, ".$1");
  const rawSegments = normalized.split(".").map((segment) => segment.trim());

  const segments: Array<string | number> = [];
  for (const segment of rawSegments) {
    if (!segment || segment === "*" || segment === "[]") {
      continue;
    }
    if (/^\d+$/.test(segment)) {
      segments.push(Number(segment));
      continue;
    }
    segments.push(segment);
  }

  return segments;
}
