const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const vscode = require("vscode");

const EXTENSION_ID = "nilsjorek.openclaw-config-vscode";

suite("OpenClaw Extension Integration", () => {
  test("lazy activation waits until command invocation", async () => {
    const extension = await getExtension();
    assert.equal(extension.isActive, false);

    await vscode.commands.executeCommand("openclawConfig.showSchemaStatus");

    await waitFor(() => extension.isActive, 10_000);
    assert.equal(extension.isActive, true);
  });

  test("registers extension commands", async () => {
    await ensureActivated();

    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes("openclawConfig.newConfig"));
    assert.ok(commands.includes("openclawConfig.refreshSchemaNow"));
    assert.ok(commands.includes("openclawConfig.insertSectionSnippet"));
    assert.ok(commands.includes("openclawConfig.explainSelection"));
    assert.ok(commands.includes("openclawConfig.normalizeConfig"));
    assert.ok(commands.includes("openclawConfig.showSchemaStatus"));
    assert.ok(commands.includes("openclawConfig.applyQuickFix"));
  });

  test("forces jsonc mode for openclaw.json", async () => {
    await ensureActivated();
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-doc-test-"));
    const configPath = path.join(tempDir, "openclaw.json");

    try {
      await fs.writeFile(configPath, "{}\n", "utf8");
      const doc = await vscode.workspace.openTextDocument(configPath);
      await vscode.window.showTextDocument(doc, { preview: false });

      await waitFor(async () => {
        const active = vscode.window.activeTextEditor?.document;
        return Boolean(active && active.fileName === configPath && active.languageId === "jsonc");
      }, 8_000);

      const active = vscode.window.activeTextEditor?.document;
      assert.ok(active);
      assert.equal(active.fileName, configPath);
      assert.equal(active.languageId, "jsonc");
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});

async function getExtension() {
  await waitFor(() => Boolean(vscode.extensions.getExtension(EXTENSION_ID)), 10_000);
  const extension = vscode.extensions.getExtension(EXTENSION_ID);
  assert.ok(extension);
  return extension;
}

async function ensureActivated() {
  const extension = await getExtension();
  if (extension.isActive) {
    return extension;
  }
  await extension.activate();
  await waitFor(() => extension.isActive, 10_000);
  return extension;
}

async function waitFor(checkFn, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await checkFn()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out after ${timeoutMs}ms`);
}
