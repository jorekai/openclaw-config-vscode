import type { IntegratorIssue, IntegratorIssueSeverity } from "../schema/types";

const SENSITIVE_KEY_PATTERN =
  /(token|api(?:_|-)?key|secret|password|private(?:_|-)?key|access(?:_|-)?key)/i;

const ENV_REFERENCE_PATTERNS = [
  /^\$\{env:[^}]+\}$/i,
  /^env:[a-z_][a-z0-9_]*$/i,
  /^\$[a-z_][a-z0-9_]*$/i,
];

type IntegratorRuleOptions = {
  strictSecrets: boolean;
};

export function evaluateIntegratorIssues(
  config: unknown,
  options: IntegratorRuleOptions,
): IntegratorIssue[] {
  if (!config || typeof config !== "object") {
    return [];
  }

  const issues: IntegratorIssue[] = [];
  const typed = config as Record<string, unknown>;

  issues.push(...checkBindingAgentReferences(typed));
  issues.push(...checkBindingAccountReferences(typed));
  issues.push(...checkSecretHygiene(typed, options.strictSecrets));

  return issues;
}

function checkBindingAgentReferences(config: Record<string, unknown>): IntegratorIssue[] {
  const agents = extractAgentIds(config);
  const bindings = Array.isArray(config.bindings) ? config.bindings : [];
  const issues: IntegratorIssue[] = [];

  for (const [index, binding] of bindings.entries()) {
    if (!binding || typeof binding !== "object") {
      continue;
    }
    const agentId = getOptionalString((binding as Record<string, unknown>).agentId);
    if (!agentId) {
      continue;
    }
    if (agents.has(agentId)) {
      continue;
    }
    issues.push({
      code: "binding-agent-missing",
      path: `bindings.${index}.agentId`,
      message: `Binding references unknown agentId "${agentId}".`,
      severity: "error",
    });
  }

  return issues;
}

function checkBindingAccountReferences(config: Record<string, unknown>): IntegratorIssue[] {
  const channelAccounts = extractChannelAccountMap(config.channels);
  const bindings = Array.isArray(config.bindings) ? config.bindings : [];
  const issues: IntegratorIssue[] = [];

  for (const [index, binding] of bindings.entries()) {
    if (!binding || typeof binding !== "object") {
      continue;
    }
    const match = (binding as Record<string, unknown>).match;
    if (!match || typeof match !== "object") {
      continue;
    }
    const channel = getOptionalString((match as Record<string, unknown>).channel);
    const accountId = getOptionalString((match as Record<string, unknown>).accountId);
    if (!channel || !accountId) {
      continue;
    }

    const accounts = channelAccounts.get(channel);
    if (!accounts || accounts.size === 0) {
      continue;
    }
    if (accounts.has(accountId)) {
      continue;
    }

    issues.push({
      code: "binding-account-missing",
      path: `bindings.${index}.match.accountId`,
      message: `Binding accountId "${accountId}" does not exist in channels.${channel}.accounts.`,
      severity: "error",
    });
  }

  return issues;
}

function checkSecretHygiene(
  config: Record<string, unknown>,
  strictSecrets: boolean,
): IntegratorIssue[] {
  const severity: IntegratorIssueSeverity = strictSecrets ? "error" : "warning";
  const issues: IntegratorIssue[] = [];

  walkObject(config, [], (path, key, value) => {
    if (typeof value !== "string" || !SENSITIVE_KEY_PATTERN.test(key)) {
      return;
    }
    if (!value.trim() || isEnvReference(value)) {
      return;
    }
    issues.push({
      code: "secret-hygiene",
      path: [...path, key].join("."),
      message: `Sensitive value detected at "${[...path, key].join(".")}". Prefer an env reference like \${env:...}.`,
      severity,
    });
  });

  return issues;
}

function extractAgentIds(config: Record<string, unknown>): Set<string> {
  const ids = new Set<string>();
  const agents = config.agents;
  if (!agents || typeof agents !== "object") {
    return ids;
  }
  const list = (agents as Record<string, unknown>).list;
  if (!Array.isArray(list)) {
    return ids;
  }
  for (const entry of list) {
    const id = getOptionalString((entry as Record<string, unknown>)?.id);
    if (id) {
      ids.add(id);
    }
  }
  return ids;
}

function extractChannelAccountMap(channelsRaw: unknown): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  if (!channelsRaw || typeof channelsRaw !== "object") {
    return map;
  }

  for (const [channelName, channelConfig] of Object.entries(channelsRaw as Record<string, unknown>)) {
    if (!channelConfig || typeof channelConfig !== "object") {
      continue;
    }
    const accountsRaw = (channelConfig as Record<string, unknown>).accounts;
    if (!accountsRaw || typeof accountsRaw !== "object") {
      continue;
    }
    const accountIds = new Set(Object.keys(accountsRaw));
    map.set(channelName, accountIds);
  }
  return map;
}

function walkObject(
  value: unknown,
  path: string[],
  visit: (path: string[], key: string, value: unknown) => void,
): void {
  if (!value || typeof value !== "object") {
    return;
  }

  if (Array.isArray(value)) {
    for (const [index, entry] of value.entries()) {
      walkObject(entry, [...path, String(index)], visit);
    }
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    visit(path, key, child);
    walkObject(child, [...path, key], visit);
  }
}

function isEnvReference(value: string): boolean {
  const candidate = value.trim();
  return ENV_REFERENCE_PATTERNS.some((pattern) => pattern.test(candidate));
}

function getOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed || null;
}
