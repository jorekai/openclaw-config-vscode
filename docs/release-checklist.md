# Manual Release Checklist (`0.1.0`)

Goal: deterministic, repeatable release flow for VS Marketplace and Open VSX.

Roadmap context: [`release-roadmap.md`](./release-roadmap.md)

## Preconditions

1. `docs/release-feature-complete-checklist.md` is `PASS`.
2. Publisher in `package.json` matches the VS Marketplace publisher.
3. Tokens exist and are valid:
   - `VSCE_PAT`
   - `OVSX_PAT`

## Phase 1: Local Release Gate

Run in this exact order:

1. `pnpm install --frozen-lockfile`
2. `pnpm compile`
3. `pnpm test:unit`
4. `pnpm test:integration`
5. `pnpm package:verify`
6. `pnpm package:vsix`

Expected outputs:

1. All commands exit `0`.
2. VSIX exists at `dist/openclaw-config-vscode-0.1.0.vsix`.
3. VSIX packaging includes only runtime assets (`dist`, `schemas/live`, `snippets`, docs metadata files).

## Phase 2: Local Install Smoke (VSIX)

1. In VS Code run: `Extensions: Install from VSIX...`.
2. Select `dist/openclaw-config-vscode-0.1.0.vsix`.
3. Execute quick smoke:
   - `OpenClaw: New Config`
   - `OpenClaw: Show Schema Status`
   - `OpenClaw: Normalize Config`
4. Confirm no runtime errors in `Output > OpenClaw Config`.

## Phase 3: Publish to Stores

Publish exactly the same VSIX artifact to both stores.

1. VS Marketplace:
   - `VSCE_PAT=... pnpm dlx @vscode/vsce publish --packagePath ./dist/openclaw-config-vscode-0.1.0.vsix --no-yarn --no-dependencies`
2. Open VSX:
   - `OVSX_PAT=... pnpm dlx ovsx publish ./dist/openclaw-config-vscode-0.1.0.vsix`

## Phase 4: Post-Publish Verification

1. Listing is visible in VS Marketplace.
2. Listing is visible in Open VSX.
3. Install succeeds from both stores.
4. Quick-start flow in `README.md` works on clean workspace.

## Release Record

Fill once release is completed:

- Release date:
- Git tag:
- VSIX checksum (`shasum -a 256 dist/openclaw-config-vscode-0.1.0.vsix`):
- VS Marketplace URL:
- Open VSX URL:
- Notes:
