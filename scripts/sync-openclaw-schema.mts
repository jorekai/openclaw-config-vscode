#!/usr/bin/env node
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { build } from "esbuild";

type SchemaManifestV1 = {
  version: 1;
  openclawCommit: string;
  generatedAt: string;
  artifacts: {
    schema: { url: string; sha256: string };
    uiHints: { url: string; sha256: string };
    validator: { url: string; sha256: string };
  };
};

const OPENCLAW_REPO = process.env.OPENCLAW_REPO ?? "https://github.com/openclaw/openclaw.git";
const OPENCLAW_REF = process.env.OPENCLAW_REF ?? "main";
const ARTIFACT_REPOSITORY =
  process.env.SCHEMA_REPOSITORY ?? process.env.GITHUB_REPOSITORY ?? "nilsjorek/openclaw-config-vscode";
const ARTIFACT_REF = process.env.SCHEMA_ARTIFACT_REF ?? "main";
const FORCE_SYNC = process.env.FORCE_SYNC === "1";

const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, "schemas", "live");
const manifestPath = path.join(outputDir, "manifest.json");

async function main(): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });

  const upstreamHead = await resolveRemoteHeadCommit();
  const currentManifest = await readManifestIfExists(manifestPath);

  if (
    currentManifest &&
    currentManifest.openclawCommit === upstreamHead &&
    !FORCE_SYNC &&
    (await hasCompleteArtifactSet(outputDir))
  ) {
    console.log(`No schema update needed (commit ${upstreamHead}).`);
    return;
  }

  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-schema-sync-"));
  const openclawDir = path.join(tempRoot, "openclaw");
  try {
    await run("git", ["clone", "--depth", "1", "--branch", OPENCLAW_REF, OPENCLAW_REPO, openclawDir]);
    const commit = (await run("git", ["rev-parse", "HEAD"], { cwd: openclawDir })).stdout.trim();

    await run("pnpm", ["install", "--frozen-lockfile"], { cwd: openclawDir });

    const exportScriptPath = path.join(tempRoot, "export-config-schema.ts");
    const validatorEntryPath = path.join(tempRoot, "openclaw-validator-entry.ts");

    await fs.writeFile(
      exportScriptPath,
      `import fs from "node:fs/promises";
import path from "node:path";
import { buildConfigSchema } from ${JSON.stringify(path.join(openclawDir, "src/config/schema.ts"))};

async function main() {
  const outDir = process.argv[2];
  if (!outDir) {
    throw new Error("Missing output directory argument.");
  }

  await fs.mkdir(outDir, { recursive: true });
  const result = buildConfigSchema();
  const schema = result.schema;
  if (schema && typeof schema === "object" && !Array.isArray(schema)) {
    const root = schema;
    root.properties ??= {};
    root.properties.$schema = { type: "string" };
  }
  await fs.writeFile(path.join(outDir, "openclaw.schema.json"), JSON.stringify(schema, null, 2), "utf8");
  await fs.writeFile(path.join(outDir, "openclaw.ui-hints.json"), JSON.stringify(result.uiHints, null, 2), "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
`,
      "utf8",
    );

    await fs.writeFile(
      validatorEntryPath,
      `import { validateConfigObjectRaw } from ${JSON.stringify(path.join(openclawDir, "src/config/validation.ts"))};

export function validate(raw) {
  const result = validateConfigObjectRaw(raw);
  if (result.ok) {
    return [];
  }
  return result.issues.map((issue) => ({
    path: issue.path ?? "",
    message: issue.message,
  }));
}
`,
      "utf8",
    );

    await run("node", ["--import", "tsx", exportScriptPath, outputDir], { cwd: projectRoot });

    await build({
      absWorkingDir: openclawDir,
      entryPoints: [validatorEntryPath],
      outfile: path.join(outputDir, "openclaw.validator.mjs"),
      bundle: true,
      format: "esm",
      platform: "node",
      target: "node20",
      minify: true,
      sourcemap: false,
      legalComments: "none",
      treeShaking: true,
      banner: {
        js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
      },
    });

    const schema = await fs.readFile(path.join(outputDir, "openclaw.schema.json"), "utf8");
    const uiHints = await fs.readFile(path.join(outputDir, "openclaw.ui-hints.json"), "utf8");
    const validator = await fs.readFile(path.join(outputDir, "openclaw.validator.mjs"), "utf8");

    const baseUrl = `https://raw.githubusercontent.com/${ARTIFACT_REPOSITORY}/${ARTIFACT_REF}/schemas/live`;
    const manifest: SchemaManifestV1 = {
      version: 1,
      openclawCommit: commit,
      generatedAt: new Date().toISOString(),
      artifacts: {
        schema: {
          url: `${baseUrl}/openclaw.schema.json`,
          sha256: hash(schema),
        },
        uiHints: {
          url: `${baseUrl}/openclaw.ui-hints.json`,
          sha256: hash(uiHints),
        },
        validator: {
          url: `${baseUrl}/openclaw.validator.mjs`,
          sha256: hash(validator),
        },
      },
    };

    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

    console.log(`Schema artifacts updated to commit ${commit}.`);
    console.log(`Manifest written to ${manifestPath}.`);
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function resolveRemoteHeadCommit(): Promise<string> {
  const { stdout } = await run("git", ["ls-remote", OPENCLAW_REPO, `refs/heads/${OPENCLAW_REF}`]);
  const line = stdout.trim().split("\n").find(Boolean);
  if (!line) {
    throw new Error("Unable to resolve remote OpenClaw head commit.");
  }
  const [commit] = line.split("\t");
  if (!commit) {
    throw new Error("Malformed git ls-remote output.");
  }
  return commit.trim();
}

async function hasCompleteArtifactSet(dir: string): Promise<boolean> {
  const required = [
    "openclaw.schema.json",
    "openclaw.ui-hints.json",
    "openclaw.validator.mjs",
    "manifest.json",
  ];
  const checks = await Promise.all(
    required.map(async (filename) => {
      try {
        await fs.access(path.join(dir, filename));
        return true;
      } catch {
        return false;
      }
    }),
  );
  return checks.every(Boolean);
}

async function readManifestIfExists(absolutePath: string): Promise<SchemaManifestV1 | null> {
  try {
    const raw = await fs.readFile(absolutePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<SchemaManifestV1>;
    if (parsed.version !== 1 || typeof parsed.openclawCommit !== "string") {
      return null;
    }
    return parsed as SchemaManifestV1;
  } catch {
    return null;
  }
}

async function run(
  command: string,
  args: string[],
  options?: { cwd?: string },
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options?.cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
      process.stdout.write(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      process.stderr.write(chunk);
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}.`));
    });
  });
}

await main();
