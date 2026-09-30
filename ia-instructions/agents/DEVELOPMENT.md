# DEVELOPMENT

Guia para manter e alterar os agentes deste repositório.

## Arquitetura

O projeto usa uma **fonte única** e gera os arquivos específicos de cada ferramenta:

```
src/<nome>.md  ──┐
                 ├──►  build.mjs  ──►  opencode/<nome>.md
manifest.json  ──┘                  ──►  copilot/<nome>.agent.md
                                    ──►  antigravity/<nome>.md
```

- **`src/<nome>.md`** — apenas o **corpo** do agente (persona, instruções). Sem frontmatter.
- **`manifest.json`** — metadados (`description`, `skills`) e configuração por ferramenta (`defaults.<tool>` + overrides).
- **`build.mjs`** — monta o frontmatter correto para cada ferramenta e concatena com o corpo.
- **`opencode/`, `copilot/`, `antigravity/`** — arquivos **gerados e versionados**. Nunca edite à mão.

O motivo de separar o frontmatter por ferramenta: as três usam chaves com o mesmo nome mas formatos diferentes (`model`, `tools`, `skills`). Emitindo só as chaves que cada uma reconhece, evitamos colisões.

## Fluxo de edição

1. Edite o corpo em `src/<agente>.md` e/ou os metadados em `manifest.json`.
2. Gere:

   ```sh
   node build.mjs
   ```

3. Revise o diff dos diretórios gerados e faça o commit.

Antes de commitar (ou em CI), valide que os gerados estão sincronizados:

```sh
node build.mjs --check   # sai com código 1 se houver divergência
```

## `manifest.json`

```jsonc
{
  "defaults": {
    "opencode":    { "mode": "subagent", "permission": { "read": "allow", "edit": "allow" } },
    "copilot":     { "tools": ["search/codebase", "edit/editFiles", "..."] },
    "antigravity": { "tools": ["view_file", "..."], "mainAgent": true,
                     "subagent": true, "commandExecutionPolicy": "sandbox" }
  },
  "agents": {
    "nome-do-agente": {
      "description": "Texto exibido como descrição do agente.",
      "skills": ["skill-a", "skill-b"]
      // overrides opcionais por ferramenta:
      // "opencode":    { "permission": { "read": "allow", "edit": "deny" } },
      // "copilot":     { "tools": ["read/readFile"] },
      // "antigravity": { "commandExecutionPolicy": "off" }
    }
  }
}
```

- `defaults.<tool>` é aplicado a todos os agentes.
- Overrides em `agents.<nome>.<tool>` sobrescrevem os defaults para aquele agente/tool.

### Mapeamento de chaves por ferramenta

| Campo no manifest | opencode | Copilot | Antigravity |
| --- | --- | --- | --- |
| `description` | ✅ | ✅ | ✅ |
| `skills` | nomes puros | — | prefixado `skills/<nome>` |
| `mode` | ✅ | — | — |
| `permission` | ✅ | — | — |
| `tools` | — | nomes Copilot | nomes Antigravity |
| `mainAgent` / `subagent` / `commandExecutionPolicy` | — | — | ✅ |

## Criar um novo agente

1. Crie `src/<nome>.md` com o corpo do agente (comece com um `# Título`).
2. Adicione a entrada em `manifest.json`:

   ```jsonc
   "agents": {
     "<nome>": { "description": "...", "skills": [] }
   }
   ```

3. Rode `node build.mjs`. Os três arquivos são criados automaticamente.

## Adicionar/alterar uma ferramenta de destino

1. Adicione a configuração padrão em `manifest.json` → `defaults.<nova-tool>`.
2. Adicione um emissor em `build.mjs`, no objeto `emitters`:

   ```js
   const emitters = {
     // ...existentes
     "nova-tool": {
       filename: (name) => `${name}.md`,
       build: (name, meta, toolDefaults) => ({
         name,
         description: meta.description,
         // mapeie apenas as chaves que a ferramenta reconhece
       }),
     },
   };
   ```

3. Rode `node build.mjs` — a nova pasta é criada e os órfãos são limpos.

O gerador remove automaticamente arquivos em diretórios de saída que não correspondam mais a nenhum agente do manifest (arquivos `.gitkeep` são preservados).

## Regras importantes

- **Nunca** edite os arquivos em `opencode/`, `copilot/`, `antigravity/` — são gerados.
- O `description` no manifest é envolvido em aspas pelo serializador quando contém `:` ou `—`; isso é esperado.
- Sempre rode `node build.mjs --check` antes de abrir um PR para garantir sincronia.
- O gerador não tem dependências externas (apenas Node.js).

## Referências oficiais

- opencode — agentes: <https://opencode.ai/docs/agents/>
- VS Code — Custom agents: <https://code.visualstudio.com/docs/agent-customization/custom-agents>
- VS Code — Ferramentas (tools): <https://code.visualstudio.com/docs/agents/run/tools>
- Antigravity — Subagents: <https://antigravity.google/docs/subagents>
- Antigravity — Permissions: <https://antigravity.google/docs/cli/permissions>
