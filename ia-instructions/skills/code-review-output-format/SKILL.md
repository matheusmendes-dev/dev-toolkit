---
name: code-review-output-format
description: Use esta skill ao gerar código ou realizar code review em qualquer projeto Kotlin (Android ou Compose Multiplatform), para padronizar o formato de saída e do resumo de revisão.
---

# Formato de Saída — Código e Code Review

## Ao gerar/propor código
- Comentários no código apenas onde agregam valor real (evitar comentário redundante que só repete o nome do método/variável)
- Ao propor mudanças em código existente, mostrar diff ou trecho específico alterado — nunca reescrever o arquivo inteiro sem necessidade

## Ao realizar code review
Sempre fechar a revisão com um resumo categorizado em três níveis:
- **Crítico**: bugs, violação de arquitetura, falha de segurança, memory leak — bloqueia o merge
- **Sugestão**: melhoria de qualidade/legibilidade que vale a pena, mas não bloqueia
- **Nitpick**: preferência de estilo, sem impacto funcional

Nunca misture os níveis em uma lista única — sempre agrupe por categoria, mesmo que uma categoria fique vazia.
