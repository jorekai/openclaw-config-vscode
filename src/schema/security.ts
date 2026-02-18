import type { ManifestSecurityPolicy, SecurityEvaluation } from "./types";

export function normalizePolicyInput(policy: ManifestSecurityPolicy): ManifestSecurityPolicy {
  return {
    requireHttps: policy.requireHttps,
    allowedHosts: normalizeList(policy.allowedHosts),
    allowedRepositories: normalizeList(policy.allowedRepositories),
  };
}

export function normalizeList(values: readonly string[]): string[] {
  const next = new Set<string>();
  for (const value of values) {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      continue;
    }
    next.add(normalized);
  }
  return [...next];
}

export function evaluateUrlSecurity(
  rawUrl: string,
  policy: ManifestSecurityPolicy,
): SecurityEvaluation {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return {
      allowed: false,
      reason: `Invalid URL: ${rawUrl}`,
    };
  }

  if (policy.requireHttps && parsed.protocol !== "https:") {
    return {
      allowed: false,
      reason: "Only https URLs are allowed by security policy.",
      host: parsed.hostname.toLowerCase(),
    };
  }

  const host = parsed.hostname.toLowerCase();
  if (!policy.allowedHosts.includes(host)) {
    return {
      allowed: false,
      reason: `Host is not allowlisted: ${host}`,
      host,
    };
  }

  const repository = extractRepositoryFromUrl(parsed);
  if (!policy.allowedRepositories.includes("*")) {
    if (!repository) {
      return {
        allowed: false,
        reason: "Repository could not be inferred from URL path.",
        host,
      };
    }
    if (!policy.allowedRepositories.includes(repository.toLowerCase())) {
      return {
        allowed: false,
        reason: `Repository is not allowlisted: ${repository}`,
        host,
        repository,
      };
    }
  }

  return {
    allowed: true,
    reason: "URL passed strict allowlist policy.",
    host,
    repository: repository ?? undefined,
  };
}

export function extractRepositoryFromUrl(url: URL): string | null {
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    return null;
  }
  const owner = parts[0]?.trim();
  const repo = parts[1]?.trim();
  if (!owner || !repo) {
    return null;
  }
  return `${owner}/${repo}`.toLowerCase();
}
