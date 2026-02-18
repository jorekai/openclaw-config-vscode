# Troubleshooting

Goal: diagnose issues quickly by starting from symptoms and mapping to precise actions.

## Symptom-First Troubleshooting Table

| Symptom | Likely Cause | What to Check | Recovery Action |
|---|---|---|---|
| No OpenClaw command appears | Extension not activated/loaded | Command palette + extension host status | Open `openclaw.json` or run `OpenClaw: Show Schema Status` to trigger activation |
| `openclaw.json` has no expected validation | Wrong file name/path or language state not updated | File name, active editor, language mode | Use exact file name `openclaw.json`; reopen file |
| Schema status shows blocked policy | Host/repository/HTTPS mismatch | `policy.manifest.*` and `policy.artifacts.*` in status output | Update allowlists and manifest URL, then refresh schema |
| Sync never updates | TTL not expired and no forced refresh | `ttlHours`, `lastCheckedAt`, command usage | Run `OpenClaw: Refresh Schema Now` |
| Plugin hints not appearing | Local path wrong or remote blocked/invalid | Output warnings, metadata settings | Fix path/URL/allowlist and rerun refresh |
| Quick fix not shown | Code actions disabled or unsupported diagnostic | `openclawConfig.codeActions.enabled`, diagnostic source | Re-enable setting and place cursor on exact diagnostic |
| Explain command shows catalog unavailable | Catalog build failed or not initialized yet | Output channel warnings | Run status/refresh and retry explain |
| Unexpected duplicate diagnostics | Overlap across providers | Diagnostic sources and severities | Normalize file and re-open; compare with dedupe behavior expectations |

## Offline and Fallback Behavior

Expected fallback chain:

1. Use last-known-good cache artifacts when available.
2. Otherwise use bundled artifacts from `schemas/live`.

How to confirm:

1. Run `OpenClaw: Show Schema Status`.
2. Check `source` value (`cache` or `bundled`).
3. Check `lastError` and sync timestamps.

## Security Policy Blocking

Common blockers:

- `manifestUrl` is not HTTPS.
- Manifest host not in `openclawConfig.sync.allowedHosts`.
- Artifact repository not in `openclawConfig.sync.allowedRepositories`.

Remediation sequence:

1. Correct `manifestUrl`.
2. Add required host and repository entries.
3. Run `OpenClaw: Refresh Schema Now`.
4. Re-check status output fields.

## Plugin Metadata Load Issues

Checks:

1. Local path exists and contains valid versioned JSON shape.
2. Remote URL is HTTPS and policy-allowed.
3. Remote response is valid and reachable.

If issues persist:

- Temporarily disable remote metadata URL.
- Keep local metadata only and verify completion behavior.

## Command Visibility and Activation Issues

Activation is lazy and command-trigger aware.

Reliable activation triggers:

- Opening `openclaw.json`.
- Running any contributed OpenClaw command.

If extension still appears inactive:

- Restart extension host.
- Re-run `OpenClaw: Show Schema Status`.

## Diagnostic Mismatch or Duplication

If diagnostics seem inconsistent:

1. Save file and run `OpenClaw: Normalize Config`.
2. Reopen file to force fresh validation context.
3. Compare source tags (`json-schema`, `openclaw-zod`, `openclaw-integrator`).
4. Apply quick fixes where available and revalidate.

## Escalation Path

When reporting an issue, include:

- Output channel excerpts from `OpenClaw Config`.
- Result of `OpenClaw: Show Schema Status`.
- Relevant settings values.
- Minimal reproducible `openclaw.json` snippet.

## Related Guides

- Runbook for operations: [`runbook.md`](./runbook.md)
- Configuration reference: [`configuration.md`](./configuration.md)
