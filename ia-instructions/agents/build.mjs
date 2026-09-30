#!/usr/bin/env node
// Gerador de agentes multi-ferramenta.
// Fonte única: src/<nome>.md (corpo) + manifest.json (metadados por tool).
// Saída: opencode/<nome>.md, copilot/<nome>.agent.md, antigravity/<nome>.md
//
// Uso:
//   node build.mjs          # gera os arquivos
//   node build.mjs --check  # falha se os gerados divergirem da fonte (CI)

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(ROOT, "src");
const CHECK = process.argv.includes("--check");

const manifest = JSON.parse(readFileSync(join(ROOT, "manifest.json"), "utf8"));
const defaults = manifest.defaults ?? {};
const agents = manifest.agents ?? {};

// --- Serializador YAML mínimo (apenas as formas usadas neste manifest) ---
function yamlScalar(value) {
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  const str = String(value);
  const needsQuote = str === "" || /[:#\[\]{}&*!|>'"%@`,]/.test(str) || /^\s|\s$/.test(str);
  return needsQuote ? JSON.stringify(str) : str;
}

function toYaml(value, indent = 0) {
  const pad = "  ".repeat(indent);
  if (Array.isArray(value)) {
    return value.map((item) => `${pad}- ${yamlScalar(item)}`).join("\n");
  }
  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, val]) => {
        if (val && typeof val === "object" && !Array.isArray(val)) {
          return `${pad}${key}:\n${toYaml(val, indent + 1)}`;
        }
        if (Array.isArray(val)) {
          return `${pad}${key}:\n${toYaml(val, indent + 1)}`;
        }
        return `${pad}${key}: ${yamlScalar(val)}`;
      })
      .join("\n");
  }
  return `${pad}${yamlScalar(value)}`;
}

function frontmatter(fields) {
  const body = toYaml(fields);
  return `---\n${body}\n---\n\n`;
}

// --- Emissores por ferramenta: cada um só recebe as chaves que reconhece ---
const emitters = {
  opencode: {
    filename: (name) => `${name}.md`,
    build: (name, meta, toolDefaults) => {
      const fields = { name, description: meta.description };
      if (meta.skills?.length) fields.skills = meta.skills;
      if (toolDefaults.mode) fields.mode = toolDefaults.mode;
      if (toolDefaults.permission) fields.permission = toolDefaults.permission;
      return fields;
    },
  },
  copilot: {
    filename: (name) => `${name}.agent.md`,
    build: (name, meta, toolDefaults) => {
      const fields = { name, description: meta.description };
      if (toolDefaults.tools?.length) fields.tools = toolDefaults.tools;
      return fields;
    },
  },
  antigravity: {
    filename: (name) => `${name}.md`,
    build: (name, meta, toolDefaults) => {
      const fields = { name, description: meta.description };
      if (meta.skills?.length) fields.skills = meta.skills.map((s) => `skills/${s}`);
      if (toolDefaults.tools?.length) fields.tools = toolDefaults.tools;
      if (toolDefaults.mainAgent !== undefined) fields.mainAgent = toolDefaults.mainAgent;
      if (toolDefaults.subagent !== undefined) fields.subagent = toolDefaults.subagent;
      if (toolDefaults.commandExecutionPolicy) {
        fields.commandExecutionPolicy = toolDefaults.commandExecutionPolicy;
      }
      return fields;
    },
  },
};

// --- Geração ---
let failures = 0;
let written = 0;

for (const [name, meta] of Object.entries(agents)) {
  const srcPath = join(SRC_DIR, `${name}.md`);
  if (!existsSync(srcPath)) {
    console.error(`ERRO: corpo não encontrado em src/${name}.md`);
    failures++;
    continue;
  }
  const body = readFileSync(srcPath, "utf8").trimEnd() + "\n";

  for (const [tool, emitter] of Object.entries(emitters)) {
    const outDir = join(ROOT, tool);
    const outPath = join(outDir, emitter.filename(name));
    const content = frontmatter(emitter.build(name, meta, defaults[tool] ?? {})) + body;

    if (CHECK) {
      const current = existsSync(outPath) ? readFileSync(outPath, "utf8") : null;
      if (current !== content) {
        console.error(`DESATUALIZADO: ${tool}/${emitter.filename(name)}`);
        failures++;
      }
      continue;
    }

    mkdirSync(outDir, { recursive: true });
    writeFileSync(outPath, content);
    written++;
  }
}

// Limpa arquivos órfãos nos diretórios gerados (agentes removidos do manifest)
if (!CHECK) {
  const expected = new Set(
    Object.keys(agents).flatMap((name) =>
      Object.values(emitters).map((e) => `${e.filename(name)}`)
    )
  );
  for (const tool of Object.keys(emitters)) {
    const outDir = join(ROOT, tool);
    if (!existsSync(outDir)) continue;
    for (const file of readdirSync(outDir)) {
      if (file === ".gitkeep") continue;
      if (!expected.has(file)) {
        rmSync(join(outDir, file));
        console.log(`removido órfão: ${tool}/${file}`);
      }
    }
  }
}

if (CHECK) {
  if (failures > 0) {
    console.error(`\n${failures} arquivo(s) desatualizado(s). Rode: node build.mjs`);
    process.exit(1);
  }
  console.log("OK: todos os arquivos gerados estão sincronizados com a fonte.");
} else {
  console.log(`Gerados ${written} arquivo(s) para ${Object.keys(agents).length} agente(s).`);
}
