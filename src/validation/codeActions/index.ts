export { OpenClawCodeActionProvider, registerOpenClawCodeActions } from "./provider";
export { applyQuickFix, computeQuickFixText, isQuickFixPayload, resolveDuplicateAgentDirPaths } from "./transform";
export {
  appendPath,
  extractBindingIndex,
  extractUnknownKey,
  findPropertyPathFromRange,
  fullDocumentRange,
  looksSensitivePath,
  pathExistsInDocument,
  resolvePathFromDiagnosticCode,
  toEnvVarName,
} from "./path";
export type { CodeActionOptions, OpenClawQuickFixPayload, QuickFixKind } from "./types";
