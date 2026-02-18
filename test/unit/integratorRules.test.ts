import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { evaluateIntegratorIssues } from "../../src/validation/integratorRules";

describe("evaluateIntegratorIssues", () => {
  it("detects unknown binding agent ids", () => {
    const config = {
      agents: {
        list: [{ id: "main" }],
      },
      bindings: [
        {
          agentId: "missing",
          match: { channel: "whatsapp", accountId: "default" },
        },
      ],
    };

    const issues = evaluateIntegratorIssues(config, { strictSecrets: false });
    assert.equal(issues.some((issue) => issue.code === "binding-agent-missing"), true);
  });

  it("detects binding account ids not present in channel accounts", () => {
    const config = {
      agents: {
        list: [{ id: "main" }],
      },
      channels: {
        whatsapp: {
          accounts: {
            default: {},
          },
        },
      },
      bindings: [
        {
          agentId: "main",
          match: { channel: "whatsapp", accountId: "business" },
        },
      ],
    };

    const issues = evaluateIntegratorIssues(config, { strictSecrets: false });
    assert.equal(issues.some((issue) => issue.code === "binding-account-missing"), true);
  });

  it("flags cleartext secrets as warnings by default", () => {
    const config = {
      gateway: {
        auth: {
          token: "abc123",
        },
      },
    };

    const issues = evaluateIntegratorIssues(config, { strictSecrets: false });
    const issue = issues.find((entry) => entry.code === "secret-hygiene");
    assert.ok(issue);
    assert.equal(issue.severity, "warning");
  });

  it("upgrades secret hygiene issues to errors in strict mode", () => {
    const config = {
      skills: {
        entries: {
          notion: {
            apiKey: "ntn_xxx",
          },
        },
      },
    };

    const issues = evaluateIntegratorIssues(config, { strictSecrets: true });
    const issue = issues.find((entry) => entry.code === "secret-hygiene");
    assert.ok(issue);
    assert.equal(issue.severity, "error");
  });

  it("ignores env-referenced secret values", () => {
    const config = {
      gateway: {
        auth: {
          token: "${env:OPENCLAW_GATEWAY_TOKEN}",
        },
      },
    };

    const issues = evaluateIntegratorIssues(config, { strictSecrets: true });
    assert.equal(issues.some((entry) => entry.code === "secret-hygiene"), false);
  });
});
