# Agentes

Coleção de agentes especializados (personas) reutilizáveis entre **opencode**, **GitHub Copilot / VS Code** e **Google Antigravity**.

Cada agente é definido uma única vez e gerado em três formatos compatíveis, um por ferramenta. Você edita a fonte e o resultado reflete nos três ambientes.

## Agentes disponíveis

| Agente | Papel |
| --- | --- |
| `android-senior` | Desenvolvedor Android Sênior (Kotlin/Java, arquitetura, code review, migração) |
| `compose-multiplatform-senior` | Desenvolvedor Sênior Kotlin Multiplatform / Compose Multiplatform |
| `uiux-senior` | Designer UI/UX Senior (pesquisa, design systems, acessibilidade, usabilidade) |

## Estrutura

```
agents/
├── src/            # Fonte única do prompt (corpo do agente)
├── manifest.json   # Metadados e configuração por ferramenta
├── build.mjs       # Gerador
├── opencode/       # Gerado — use com o opencode
├── copilot/        # Gerado — use com o Copilot / VS Code
└── antigravity/    # Gerado — use com o Google Antigravity
```

> Não edite os arquivos em `opencode/`, `copilot/` ou `antigravity/` manualmente — eles são sobrescritos pelo gerador. Para alterar um agente, veja o [DEVELOPMENT.md](./DEVELOPMENT.md).

## Instalação por ferramenta

Aponte o diretório de agentes de cada ferramenta para a subpasta correspondente. Symlinks mantêm tudo sincronizado automaticamente.

### opencode

Diretório de agentes globais: `~/.config/opencode/agents`

```sh
ln -sfn "$(pwd)/opencode" ~/.config/opencode/agents
```

- Cada arquivo é um agente (`<nome>.md`) com `permission: read/edit allow`.
- Após alterar qualquer agente, **reinicie o opencode** (a config é lida só no start).

### GitHub Copilot / VS Code

O Copilot descobre agentes em `.github/agents` (workspace) ou `~/.copilot/agents` (usuário).

```sh
# Nível de usuário
ln -sfn "$(pwd)/copilot" ~/.copilot/agents

# OU nível de workspace (dentro do repositório do projeto)
ln -sfn "$(pwd)/copilot" .github/agents
```

- Os arquivos usam a extensão `.agent.md`.
- As ferramentas permitidas ficam no campo `tools:` de cada arquivo.
- Aprovações (allow/ask) são gerenciadas nas configurações de *Approvals & Permissions* do VS Code.

### Google Antigravity

Diretório de agentes globais: `~/.gemini/config/agents`

```sh
ln -sfn "$(pwd)/antigravity" ~/.gemini/config/agents
```

- Cada arquivo (`<nome>.md`) define `tools`, `mainAgent`, `subagent` e `commandExecutionPolicy`.
- Permissões de leitura/escrita de arquivos são controladas em `~/.gemini/antigravity-cli/settings.json` (listas `allow`/`deny`/`ask`).

## Como invocar

| Ferramenta | Como usar |
| --- | --- |
| opencode | Agentes com `mode: subagent` são chamados pela Task tool / `@agente` |
| Copilot | Selecione o agente no dropdown de agentes do Chat view |
| Antigravity | Agentes com `mainAgent: true` aparecem no seletor; com `subagent: true` são invocáveis por outros agentes |

## Permissões de leitura e escrita

| Ferramenta | Onde se define | Formato |
| --- | --- | --- |
| opencode | frontmatter do agente (gerado) | `permission: { read: allow, edit: allow }` |
| Copilot | campo `tools:` (habilitar `edit/*` e `read/*`) + Approvals | allowlist de ferramentas |
| Antigravity | `~/.gemini/antigravity-cli/settings.json` | `read_file(...)`, `write_file(...)` |

## Fluxo de atualização

1. Edite o corpo em `src/<agente>.md` e/ou os metadados em `manifest.json`.
2. Rode o gerador:

   ```sh
   node build.mjs
   ```

3. Os três diretórios são atualizados. Reinicie o opencode para recarregar.

Detalhes de manutenção (criar agentes, adicionar ferramentas, CI) estão em [DEVELOPMENT.md](./DEVELOPMENT.md).
