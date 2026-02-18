# Contributing Guide

Goal: make safe, testable, and maintainable contributions without regressions.

## Local Setup

```bash
pnpm install
pnpm compile
pnpm test:unit
pnpm test:integration
```

Recommended dev loop:

1. `pnpm compile` for fast type-level feedback.
2. `pnpm test:unit` for targeted correctness.
3. `pnpm test:integration` before merge.

## Core Safety Gates

Before opening a PR:

1. `pnpm compile` passes.
2. Unit tests pass.
3. Integration tests pass.
4. Behavior of command IDs and settings keys remains stable unless intentional change is documented.

## Working on Diagnostics and Quick Fixes

Relevant modules:

- `src/validation/zodShadow.ts`
- `src/validation/integratorDiagnostics.ts`
- `src/validation/integratorRules.ts`
- `src/validation/codeActions/*`

Safety checklist:

1. Preserve diagnostic source semantics (`json-schema`, `openclaw-zod`, `openclaw-integrator`).
2. Preserve quick-fix payload compatibility.
3. Add or update tests in `test/unit/` for new rules or transformations.
4. Validate no regressions in command visibility and activation behavior.

## Working on Schema Sync and Artifacts

Relevant modules:

- `src/schema/artifactManager.ts`
- `src/schema/security.ts`
- `scripts/sync-openclaw-schema.mts`

Safety checklist:

1. Keep HTTPS and allowlist policy enforcement intact by default.
2. Keep SHA-256 verification as non-optional for accepted downloads.
3. Preserve fallback behavior (`cache` -> `bundled`).
4. Update runbook and troubleshooting docs if sync behavior changes.

## Working on Extension Orchestration

Relevant modules:

- `src/extension.ts`
- `src/extension/settings.ts`
- `src/extension/catalog.ts`
- `src/extension/events.ts`
- `src/extension/commands.ts`

Safety checklist:

1. Keep initialization lock behavior correct (single in-flight init).
2. Preserve command IDs and user-facing command behavior.
3. Keep event handlers and revalidation pathways consistent.
4. Avoid introducing startup work that breaks lazy activation intent.

## Testing Strategy by Change Type

- Documentation-only change:
  - Link/accuracy checks, optional test run.
- Validation or code-action change:
  - Mandatory unit tests + compile.
- Sync/security change:
  - Unit tests around policy/sync behavior + integration sanity.
- Command and activation change:
  - Integration tests required.

## Documentation Expectations

Any feature or behavior change must update docs in the same PR:

- End-user behavior: `README.md`, `docs/getting-started.md`, `docs/commands.md`
- Settings/policy: `docs/configuration.md`
- Diagnostics/quick fixes: `docs/diagnostics-and-quick-fixes.md`
- Operations impact: `docs/runbook.md`, `docs/troubleshooting.md`
- Architectural movement: `docs/architecture.md`

## PR Checklist

- [ ] Compile passes.
- [ ] Unit tests pass.
- [ ] Integration tests pass.
- [ ] Documentation updated for behavior/config changes.
- [ ] Changelog updated for user-visible changes.

## Related Guides

- Architecture details: [`architecture.md`](./architecture.md)
- Operational verification: [`runbook.md`](./runbook.md)
