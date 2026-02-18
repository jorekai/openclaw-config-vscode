# Diagnostics and Quick Fixes

Goal: understand why diagnostics appear, how sources differ, and what each quick fix changes.

## Diagnostic Sources

| Source | Purpose | Typical Examples |
|---|---|---|
| `json-schema` | Structural schema validation | missing/invalid properties, type mismatch |
| `openclaw-zod` | Additional semantic diagnostics | duplicate/semantic issues not fully covered by schema |
| `openclaw-integrator` | Cross-reference and security hygiene checks | unknown `bindings[].agentId`, invalid account references, cleartext secret values |

Practical note:
Zod diagnostics are deduplicated against overlapping non-informational external diagnostics to reduce noise.

## Quick Fix Matrix

| Trigger Pattern | Quick Fix Action | Resulting Change |
|---|---|---|
| `$schema` missing/wrong | Set `$schema` to OpenClaw URI | Adds or replaces `$schema` with `openclaw-schema://live/openclaw.schema.json` |
| Unknown key diagnostic | Remove unknown key | Removes offending property path from JSONC |
| Duplicate `agentDir` warning | Remove duplicate `agentDir` overrides | Keeps first seen `agentDir`, removes duplicate overrides |
| Invalid `bindings[]` reference | Remove invalid binding entry | Removes referenced `bindings[index]` object |
| Cleartext secret hygiene issue | Replace with `${env:...}` | Replaces value with generated env reference |

## Before/After Examples

### 1) Insert or replace `$schema`

Before:

```jsonc
{
  "gateway": {}
}
```

After:

```jsonc
{
  "$schema": "openclaw-schema://live/openclaw.schema.json",
  "gateway": {}
}
```

### 2) Remove unknown key

Before:

```jsonc
{
  "gateway": {},
  "unknownKey": true
}
```

After:

```jsonc
{
  "gateway": {}
}
```

### 3) Remove duplicate `agentDir` overrides

Before:

```jsonc
{
  "agents": {
    "list": [
      { "id": "alpha", "agentDir": "./agents/a" },
      { "id": "beta", "agentDir": "./agents/b1" },
      { "id": "beta", "agentDir": "./agents/b2" }
    ]
  }
}
```

After:

```jsonc
{
  "agents": {
    "list": [
      { "id": "alpha", "agentDir": "./agents/a" },
      { "id": "beta" },
      { "id": "beta" }
    ]
  }
}
```

### 4) Remove invalid binding entry

Before:

```jsonc
{
  "bindings": [
    { "agentId": "valid-agent" },
    { "agentId": "missing-agent" }
  ]
}
```

After:

```jsonc
{
  "bindings": [
    { "agentId": "valid-agent" }
  ]
}
```

### 5) Replace cleartext secret with env reference

Before:

```jsonc
{
  "gateway": {
    "apiKey": "my-plain-token"
  }
}
```

After:

```jsonc
{
  "gateway": {
    "apiKey": "${env:OPENCLAW_GATEWAY_APIKEY}"
  }
}
```

## Failure Modes and Recovery

- No quick fix appears:
  - Confirm `openclawConfig.codeActions.enabled` is `true`.
  - Confirm cursor is on the diagnostic and command palette context is `openclaw.json`.
- Quick fix does not change file:
  - Payload may be stale after edits; rerun quick fix after save.
- Unexpected path behavior:
  - Run `OpenClaw: Normalize Config` first, then retry quick fix.

## Related Guides

- Detailed command behavior: [`commands.md`](./commands.md)
- Troubleshooting diagnostic mismatch: [`troubleshooting.md`](./troubleshooting.md)
