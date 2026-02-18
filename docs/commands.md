# Commands Reference

Goal: know exactly when and how to use each command, and what success/failure looks like.

## Command Inventory

| Title | Command ID | User-Facing |
|---|---|---|
| OpenClaw: New Config | `openclawConfig.newConfig` | Yes |
| OpenClaw: Refresh Schema Now | `openclawConfig.refreshSchemaNow` | Yes |
| OpenClaw: Insert Section Snippet | `openclawConfig.insertSectionSnippet` | Yes |
| OpenClaw: Explain Selection | `openclawConfig.explainSelection` | Yes |
| OpenClaw: Normalize Config | `openclawConfig.normalizeConfig` | Yes |
| OpenClaw: Show Schema Status | `openclawConfig.showSchemaStatus` | Yes |
| OpenClaw: Apply Quick Fix (Internal) | `openclawConfig.applyQuickFix` | No (internal code action command) |

## `openclawConfig.newConfig`

Purpose:
Create or open a starter `openclaw.json`.

When to use:
At project start or when bootstrapping a new workspace.

Preconditions:
- VS Code is running extension host or installed extension.
- Workspace folder optional (works with or without one).

Steps:
1. Run `OpenClaw: New Config` from Command Palette.
2. If workspace exists, file is created/opened at workspace root.
3. If no workspace exists, an unsaved JSONC document is opened.

Expected result:
- `openclaw.json` is available in editor.
- Validation starts once initialization completes.

Failure signals:
- File system permission errors when creating files in workspace.

## `openclawConfig.refreshSchemaNow`

Purpose:
Force schema sync and global revalidation.

When to use:
After changing sync settings, allowlists, or when schema appears stale.

Preconditions:
- Extension initialized or initialization can complete.

Steps:
1. Run `OpenClaw: Refresh Schema Now`.
2. Wait for completion message.

Expected result:
- Sync attempt runs immediately.
- Diagnostics are revalidated.
- JSON schema refresh command is triggered.

Failure signals:
- Security policy blocking manifest/artifact URLs.
- Network timeout/offline errors.

## `openclawConfig.insertSectionSnippet`

Purpose:
Insert dynamic section snippets based on schema + UI hints + optional plugin metadata.

When to use:
When adding large sections quickly with fewer structural mistakes.

Preconditions:
- Active editor is `openclaw.json`.

Steps:
1. Open `openclaw.json`.
2. Run `OpenClaw: Insert Section Snippet`.
3. Pick a snippet from quick pick.

Expected result:
- Snippet body is inserted at cursor.

Failure signals:
- Warning: "Open an openclaw.json file first."

## `openclawConfig.explainSelection`

Purpose:
Open a markdown explanation for the path at cursor, including allowed subfields.

When to use:
When field semantics are unclear or dynamic subfields need context.

Preconditions:
- Active editor is `openclaw.json`.
- Dynamic catalog is available.

Steps:
1. Place cursor on a key or value in `openclaw.json`.
2. Run `OpenClaw: Explain Selection`.

Expected result:
- New markdown document opens with path-specific guidance.

Failure signals:
- Warning: "Dynamic schema catalog is not available yet."

## `openclawConfig.normalizeConfig`

Purpose:
Normalize and save config text with stable ordering and `$schema` insertion support.

When to use:
Before commit, after heavy edits, or after conflict resolution.

Preconditions:
- Active editor is `openclaw.json`.
- File parses as JSONC.

Steps:
1. Run `OpenClaw: Normalize Config`.
2. Review resulting edits.

Expected result:
- File rewritten if normalization changed content.
- File saved.
- Validation reruns.

Failure signals:
- Warning: "Cannot normalize: openclaw.json is not valid JSONC."

## `openclawConfig.showSchemaStatus`

Purpose:
Show operational sync and policy status for schema source and artifact checks.

When to use:
First-time verification, incident triage, and policy troubleshooting.

Preconditions:
- None (command initializes extension if needed).

Steps:
1. Run `OpenClaw: Show Schema Status`.
2. Inspect Output channel (`OpenClaw Config`) entries.

Expected result:
- Info message with source/commit summary.
- Detailed status lines in output channel.

Failure signals:
- Missing/blocked policy values.
- Repeated sync errors in output.

## `openclawConfig.applyQuickFix` (Internal)

Purpose:
Internal command invoked by generated code actions to apply text edits.

When to use:
Do not run manually. It is invoked by Quick Fix actions.

Preconditions:
- Valid quick-fix payload created by provider.

Expected result:
- Document edits applied and saved.

Failure signals:
- Warning: "OpenClaw quick fix payload is invalid."

## Related Guides

- Diagnostics model and examples: [`diagnostics-and-quick-fixes.md`](./diagnostics-and-quick-fixes.md)
- Settings and policy controls: [`configuration.md`](./configuration.md)
- Practical flows: [`workflows.md`](./workflows.md)
