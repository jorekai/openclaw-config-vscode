# Feature Complete Gate (`0.1.0`)

Goal: enforce the release gate `Code + Docs + Smoke` before public publishing.

Roadmap context: [`release-roadmap.md`](./release-roadmap.md)

## Gate Definition

All items below must be true:

1. Compile and automated tests are green.
2. Release/operations docs are complete and current.
3. Smoke matrix is fully `PASS`.
4. No `BLOCKER` findings remain.

## Smoke Matrix

| Scenario | Status | Evidence |
|---|---|---|
| `OpenClaw: New Config` command path | PASS | Command registration covered in `test/integration/suite/extension.test.js` (`registers extension commands`) and command implementation in `src/extension/commands.ts`. |
| Schema diagnostics + Quick Fixes | PASS | `test/unit/codeActionsTransform.test.ts`, `test/unit/codeActionsPath.test.ts`, `test/unit/dedupe.test.ts`. |
| Dynamic snippet insert | PASS | `test/unit/dynamicCatalog.test.ts` + runtime command wiring in `src/extension/commands.ts`. |
| Explain selection + hover explain | PASS | `test/unit/explain.test.ts` + setting/wiring in `src/extension/settings.ts` and `src/extension/events.ts`. |
| Normalize config command | PASS | `test/unit/normalize.test.ts` + command wiring in `src/extension/commands.ts`. |
| Integrator diagnostics (bindings) | PASS | `test/unit/integratorRules.test.ts` + runtime provider `src/validation/integratorDiagnostics.ts`. |
| Secret hygiene strict mode (`strictSecrets` on/off) | PASS | `test/unit/integratorRules.test.ts` + setting `openclawConfig.integrator.strictSecrets`. |
| Schema refresh + schema status command | PASS | Integration activation/status test in `test/integration/suite/extension.test.js` and sync/status logic in `src/schema/artifactManager.ts`. |
| Policy block + fallback behavior | PASS | `test/unit/security.test.ts` and `test/unit/artifactManager.test.ts`. |
| Plugin metadata local + remote merge | PASS | `test/unit/pluginMetadata.test.ts` and `test/unit/dynamicSubfields.test.ts`. |

## Verification Log

- Date: `2026-02-18`
- VS Code (integration runner): `1.109.4`
- Repository: `openclaw-config-vscode`

Executed gates:

1. `pnpm compile` -> PASS
2. `pnpm test:unit` -> PASS (`46` tests)
3. `pnpm test:integration` -> PASS (`3` tests)
4. `pnpm package:verify` -> PASS (no LICENSE/packaging warnings)

## Gate Result

- Feature-complete gate: `PASS`
- Blockers: `0`
