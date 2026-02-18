export type SchemaArtifactRecord = {
  url: string;
  sha256: string;
};

export type ManifestSecurityPolicy = {
  requireHttps: boolean;
  allowedHosts: string[];
  allowedRepositories: string[];
};

export type SchemaManifestV1 = {
  version: 1;
  openclawCommit: string;
  generatedAt: string;
  artifacts: {
    schema: SchemaArtifactRecord;
    uiHints: SchemaArtifactRecord;
    validator: SchemaArtifactRecord;
  };
};

export type OpenClawValidationIssue = {
  path: string;
  message: string;
};

export type OpenClawZodValidator = {
  validate: (raw: unknown) => OpenClawValidationIssue[];
};

export type ArtifactSource = "cache" | "bundled";

export type SchemaSyncResult = {
  checked: boolean;
  updated: boolean;
  source: ArtifactSource;
  message: string;
};

export type SecurityEvaluation = {
  allowed: boolean;
  reason: string;
  host?: string;
  repository?: string;
};

export type SchemaStatus = {
  source: ArtifactSource;
  manifestUrl: string;
  openclawCommit?: string;
  generatedAt?: string;
  lastCheckedAt?: string;
  lastSuccessfulSyncAt?: string;
  lastError?: string;
  policy: {
    manifest: SecurityEvaluation;
    artifacts: SecurityEvaluation[];
  };
};

export type DiagnosticFingerprint = string;

export type IntegratorIssueSeverity = "warning" | "error";

export type IntegratorIssueCode =
  | "binding-agent-missing"
  | "binding-account-missing"
  | "secret-hygiene";

export type IntegratorIssue = {
  code: IntegratorIssueCode;
  path: string;
  message: string;
  severity: IntegratorIssueSeverity;
};

export type DynamicSubfieldEntry = {
  key: string;
  path: string;
  description?: string;
  source: "schema" | "plugin";
  snippet?: string;
};

export type DynamicSubfieldCatalog = {
  sections: string[];
  fieldsByPattern: Map<string, DynamicSubfieldEntry[]>;
};

export type PluginHintProperty = {
  description?: string;
  snippet?: string;
  type?: string;
};

export type PluginHintEntry = {
  path: string;
  properties: Record<string, PluginHintProperty>;
};

export type PluginHintDocumentV1 = {
  version: 1;
  entries: PluginHintEntry[];
};
