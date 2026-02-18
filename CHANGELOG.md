# Changelog

## 0.1.2 - 2026-02-18

### Fixed
- Fixed marketplace activation crash by bundling runtime JSONC parsing into `dist/extension.js` so schema provider registration works without external runtime dependencies.
- Tightened packaged files to publish only the bundled runtime entry (`dist/extension.js` + source map) to avoid stale transpiled artifacts.

## 0.1.0 - 2026-02-18

### Added
- Lazy activation with explicit `ensureInitialized()` lock and deferred heavy sync.
- Strict manifest/artifact security policy with host/repo allowlists and HTTPS enforcement.
- Runtime-configurable sync policy settings:
  - `openclawConfig.sync.manifestUrl`
  - `openclawConfig.sync.allowedHosts`
  - `openclawConfig.sync.allowedRepositories`
- Schema status command: `openclawConfig.showSchemaStatus`.
- OpenClaw code actions + internal quick-fix command.
- Dynamic snippet catalog built from live `schema + uiHints`.
- Diagnostic dedupe for overlapping schema and zod issues.
- Expanded unit/integration coverage for sync/security/runtime behavior.
- Integrator diagnostics for binding reference checks and secret hygiene.
- Context-aware dynamic subfield completion from schema + plugin metadata layers.
- Plugin metadata ingestion from workspace file and optional remote registry URL.
- Explain UX (`openclawConfig.explainSelection` + hover hints).
- Normalize command (`openclawConfig.normalizeConfig`) with `$schema` insertion and stable ordering.
- Quick fixes for invalid bindings and cleartext secret env migration.
