# Getting Started

Goal: create, validate, and refine a working `openclaw.json` with immediate editor feedback.

## Prerequisites

- VS Code `^1.95.0` (extension engine target).
- A workspace folder where you can create `openclaw.json`.
- For development mode: Node.js + pnpm.

## Install or Load the Extension

### Development mode (from this repository)

```bash
pnpm install
pnpm compile
```

1. Open the repository in VS Code.
2. Press `F5` to launch an Extension Development Host.
3. Use the new window for all steps below.

### Installed extension mode

If you are using an already installed extension build, open your workspace and continue.

## First `openclaw.json` Flow

1. Run command `OpenClaw: New Config` (`openclawConfig.newConfig`).
2. Confirm `openclaw.json` opens in the editor.
3. Add one deliberate mistake (for example, an unknown key) and confirm diagnostics appear.
4. Use Quick Fix (`Cmd+.` / `Ctrl+.`) where offered.

## Verify Activation and Validation

Run `OpenClaw: Show Schema Status` (`openclawConfig.showSchemaStatus`) and confirm:

- A valid `source` value (`cache` or `bundled`).
- A `manifestUrl` value.
- Policy output fields such as `policy.manifest.allowed`.

Expected validation behavior on `openclaw.json`:

- JSON schema diagnostics are active.
- Zod shadow diagnostics can appear when enabled.
- Integrator diagnostics can appear for reference and secret hygiene issues.

## First Productivity Loop

Use this sequence repeatedly while editing:

1. `OpenClaw: Insert Section Snippet` to scaffold structure quickly.
2. Edit fields and rely on completion suggestions for dynamic subfields.
3. Hover fields or run `OpenClaw: Explain Selection` for context.
4. Run `OpenClaw: Normalize Config` before commit.

## What Good Looks Like

A successful setup has all of the following:

- `openclaw.json` resolves against `openclaw-schema://live/openclaw.schema.json`.
- No unresolved high-severity diagnostics.
- Secret-like values expressed as environment references (for example, `${env:OPENCLAW_GATEWAY_APIKEY}`).
- Config formatting is stable after `OpenClaw: Normalize Config`.
- `OpenClaw: Show Schema Status` reports expected policy and sync state.

## Next Steps

- Learn full commands: [`commands.md`](./commands.md)
- Tune behavior safely: [`configuration.md`](./configuration.md)
- Debug failures quickly: [`troubleshooting.md`](./troubleshooting.md)
