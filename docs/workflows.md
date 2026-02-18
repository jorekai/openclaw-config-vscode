# Workflows

Goal: provide repeatable, low-friction workflows for daily use.

## Workflow 1: Bootstrap a New Project

Outcome:
A valid baseline `openclaw.json` with immediate validation feedback.

Steps:
1. Run `OpenClaw: New Config`.
2. Insert one or more snippets using `OpenClaw: Insert Section Snippet`.
3. Resolve initial diagnostics using Quick Fix actions.
4. Run `OpenClaw: Normalize Config`.
5. Run `OpenClaw: Show Schema Status` to verify sync/policy state.

Success criteria:
- File validates without blocking errors.
- `$schema` points to `openclaw-schema://live/openclaw.schema.json`.

## Workflow 2: Iterative Editing Loop

Outcome:
Fast and safe config changes with minimal context switching.

Steps:
1. Edit fields in `openclaw.json`.
2. Accept dynamic completion suggestions where offered.
3. Use hover explain or `OpenClaw: Explain Selection` on unclear fields.
4. Apply available quick fixes for detected issues.
5. Normalize before commit.

Success criteria:
- Diagnostics trend toward zero.
- Structure remains stable after normalization.

## Workflow 3: Secure Configuration Workflow

Outcome:
Secret hygiene violations removed and environment references standardized.

Steps:
1. Enable strict mode if needed:

```json
{
  "openclawConfig.integrator.strictSecrets": true
}
```

2. Fix `openclaw-integrator` secret diagnostics via quick fix.
3. Replace remaining cleartext values manually if needed.
4. Re-run normalization and verify diagnostics are clear.

Success criteria:
- No cleartext secret diagnostics remain.
- All sensitive values use `${env:...}` style references.

## Workflow 4: Live Schema Sync and Policy Validation

Outcome:
Predictable schema updates without bypassing security controls.

Steps:
1. Configure sync settings in VS Code settings.
2. Run `OpenClaw: Refresh Schema Now`.
3. Run `OpenClaw: Show Schema Status`.
4. If blocked, adjust allowlists and rerun.

Success criteria:
- `policy.manifest.allowed` is `true`.
- Artifact policy entries are allowed.
- Source reflects expected fallback (`cache` or `bundled`).

## Workflow 5: Plugin Metadata Hints (Local + Remote)

Outcome:
Richer completion/description hints from plugin metadata layers.

Steps:
1. Add local metadata file at `.openclaw/plugin-hints.json`.
2. Optionally set remote metadata URL.
3. Ensure URL passes host/repository allowlists.
4. Trigger refresh and inspect completion behavior.

Example settings:

```json
{
  "openclawConfig.plugins.metadataLocalPath": ".openclaw/plugin-hints.json",
  "openclawConfig.plugins.metadataUrl": ""
}
```

Success criteria:
- Dynamic completion reflects plugin entries.
- No repeated metadata load warnings in output.

## Related Guides

- Detailed commands: [`commands.md`](./commands.md)
- Full configuration: [`configuration.md`](./configuration.md)
- Troubleshooting failed workflows: [`troubleshooting.md`](./troubleshooting.md)
