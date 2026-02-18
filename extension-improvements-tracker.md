# OpenClaw Extension Improvements Tracker

Last sync: 2026-02-18 (DX Integrator pack complete)

| Workstream | Owner | Status | Start | ETA | Done-When | Risks | Last-Update |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M1-T1 Tracker + docs scaffold | Agent E (Docs/Release) | Done | 2026-02-18 | 2026-02-18 | Tracker + README document all 8 points, commands, settings, rollout notes | Drift between implementation and docs | Tracker + README + changelog/runbook committed |
| M1-T2 Lazy activation gate | Agent C (Runtime/Perf) | Done | 2026-02-18 | 2026-02-18 | No heavy sync until command/open `openclaw.json`; init guarded by single lock | Hidden regressions in tests relying on eager activation | `ensureInitialized()` lock implemented; startup sync removed |
| M1-T3 Diagnostic dedupe | Agent A (Core UX) | Done | 2026-02-18 | 2026-02-18 | Overlapping schema+zod diagnostics collapse to one user-facing error | Over-filtering semantic-only zod errors | Fingerprint + overlap dedupe added in zod shadow pipeline |
| M1-T4 Quick Fix Code Actions | Agent A (Core UX) | Done | 2026-02-18 | 2026-02-18 | Quick fixes for `$schema`, unknown key, duplicate `agentDir` are available | Path resolution edge cases for malformed JSONC | Provider + internal apply command added |
| M1-T5 Dynamic snippet catalog | Agent A (Core UX) | Done | 2026-02-18 | 2026-02-18 | `insertSectionSnippet` uses live schema/uiHints with static fallback | Weak uiHints quality can reduce snippet clarity | Dynamic catalog builder integrated with fallback behavior |
| M2-T1 Strict manifest security policy | Agent B (Sync/Security) | Done | 2026-02-18 | 2026-02-18 | Non-HTTPS / non-allowlisted host/repo blocked, fallback remains functional | Overly strict allowlists can block legitimate mirrors | URL policy checks applied to manifest + artifact URLs |
| M2-T2 Runtime-configurable manifest policy | Agent B (Sync/Security) | Done | 2026-02-18 | 2026-02-18 | Settings update applies without restart and triggers re-sync if initialized | Frequent settings changes can cause repeated sync attempts | New settings wired + on-change reconfigure/resync flow |
| M2-T3 Schema status transparency | Agent B (Sync/Security) | Done | 2026-02-18 | 2026-02-18 | Command reports source, commit, sync state, manifest URL, policy verdict | Output may be misread without docs | `openclawConfig.showSchemaStatus` implemented with output channel details |
| M3-T1 QA hardening + acceptance | Agent D (QA) | Done | 2026-02-18 | 2026-02-18 | `pnpm compile`, unit/integration tests green; acceptance scenarios validated | Tests need updates for lazy activation/security defaults | `compile` + unit (22 tests) + integration (3 tests) all green |
| M4-T1 Dynamic subfield engine | Agent A (Core UX) | Done | 2026-02-18 | 2026-02-18 | Context-aware completions from schema/ui-hints/plugin metadata | Path matching with wildcards | `dynamicSubfields` + completion provider shipped |
| M4-T2 Integrator diagnostics | Agent D (QA) | Done | 2026-02-18 | 2026-02-18 | Binding refs + secret hygiene diagnostics in editor | False positives on secret keys | `openclaw-integrator` diagnostics shipped (warn-first + strict mode) |
| M4-T3 Explain + normalize UX | Agent A (Core UX) | Done | 2026-02-18 | 2026-02-18 | Hover explain + explain command + normalize command | Overly verbose explanations | `explainSelection`, hover provider, `normalizeConfig` shipped |
| M4-T4 Plugin metadata ingestion | Agent B (Sync/Security) | Done | 2026-02-18 | 2026-02-18 | Local+remote metadata merged safely under policy | Remote source quality and availability | `pluginMetadata` loader with policy checks + warnings |
| M4-T5 Regression coverage | Agent D (QA) | Done | 2026-02-18 | 2026-02-18 | Unit + integration expanded and green | Runtime-only edge cases | unit expanded to 36 passing tests; integration 3/3 passing |

## Milestone Log

- 2026-02-18 M1 complete: Core UX shipped (`lazy-init`, dedupe, code actions, dynamic snippets).
- 2026-02-18 M2 complete: Sync/Security shipped (strict allowlist + runtime policy settings + status command).
- 2026-02-18 M3 complete: QA gates green (`pnpm compile`, `pnpm test:unit`, `pnpm test:integration`).
- 2026-02-18 M4 complete: Integrator DX pack shipped (dynamic subfields, integrator diagnostics, explain/normalize, plugin metadata, extra quick fixes).
