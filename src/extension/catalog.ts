import * as vscode from "vscode";
import { buildDynamicSubfieldCatalog } from "../schema/dynamicSubfields";
import { loadPluginHintEntries } from "../schema/pluginMetadata";
import type { DynamicSubfieldCatalog, PluginHintEntry } from "../schema/types";
import type { ExtensionSettings } from "./settings";

type CatalogControllerOptions = {
  artifacts: {
    getSchemaText: () => Promise<string>;
    getUiHintsText: () => Promise<string>;
  };
  output: Pick<vscode.OutputChannel, "appendLine">;
  readSettings: () => ExtensionSettings;
  ensureInitialized: (reason: string) => Promise<void>;
  getWorkspaceRoot: () => string | undefined;
};

export type CatalogController = {
  getCatalog: () => Promise<DynamicSubfieldCatalog | null>;
  invalidateCatalog: () => void;
  getPluginEntries: () => readonly PluginHintEntry[];
};

export function createCatalogController(options: CatalogControllerOptions): CatalogController {
  const warningOnce = new Set<string>();
  let dynamicCatalog: DynamicSubfieldCatalog | null = null;
  let dynamicPluginEntries: PluginHintEntry[] = [];

  const invalidateCatalog = (): void => {
    dynamicCatalog = null;
    dynamicPluginEntries = [];
  };

  const buildCatalog = async (): Promise<DynamicSubfieldCatalog | null> => {
    try {
      const settings = options.readSettings();
      const [schemaText, uiHintsText] = await Promise.all([
        options.artifacts.getSchemaText(),
        options.artifacts.getUiHintsText(),
      ]);

      const pluginResult = await loadPluginHintEntries({
        workspaceRoot: options.getWorkspaceRoot(),
        localPath: settings.pluginMetadataLocalPath,
        remoteUrl: settings.pluginMetadataUrl,
        securityPolicy: {
          requireHttps: true,
          allowedHosts: settings.allowedHosts,
          allowedRepositories: settings.allowedRepositories,
        },
      });

      dynamicPluginEntries = pluginResult.entries;
      for (const warning of pluginResult.warnings) {
        if (warningOnce.has(warning)) {
          continue;
        }
        warningOnce.add(warning);
        options.output.appendLine(`[plugin-hints] ${warning}`);
      }

      return buildDynamicSubfieldCatalog(schemaText, uiHintsText, pluginResult.entries);
    } catch (error) {
      options.output.appendLine(`[catalog] Failed to build dynamic catalog: ${toErrorMessage(error)}`);
      return null;
    }
  };

  const getCatalog = async (): Promise<DynamicSubfieldCatalog | null> => {
    if (dynamicCatalog) {
      return dynamicCatalog;
    }
    await options.ensureInitialized("catalog");
    dynamicCatalog = await buildCatalog();
    return dynamicCatalog;
  };

  return {
    getCatalog,
    invalidateCatalog,
    getPluginEntries: () => dynamicPluginEntries,
  };
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
