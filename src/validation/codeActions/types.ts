import * as vscode from "vscode";

export type QuickFixKind =
  | "setSchema"
  | "removeUnknownKey"
  | "removeDuplicateAgentDir"
  | "removeInvalidBinding"
  | "replaceSecretWithEnvRef";

export type OpenClawQuickFixPayload = {
  kind: QuickFixKind;
  uri: string;
  path?: string;
  diagnosticMessage?: string;
};

export type CodeActionOptions = {
  isEnabled: () => boolean;
};

export const FORMAT_OPTIONS = {
  formattingOptions: {
    insertSpaces: true,
    tabSize: 2,
    eol: "\n",
  },
};

export const DOCUMENT_SELECTOR: vscode.DocumentSelector = [
  { language: "jsonc", pattern: "**/openclaw.json" },
  { language: "json", pattern: "**/openclaw.json" },
];
