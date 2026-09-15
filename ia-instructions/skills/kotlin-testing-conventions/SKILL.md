---
name: kotlin-testing-conventions
description: Use esta skill ao escrever testes unitários em Kotlin (Android ou Compose Multiplatform). Define estrutura, nomenclatura e ferramentas padrão de teste.
---

# Convenções de Teste — Kotlin

## Quando escrever
- Testes unitários devem ser escritos junto com a implementação da feature, nunca como etapa posterior separada

## Estrutura
- Siga o padrão **Given-When-Then** (ou Arrange-Act-Assert) dentro de cada teste, com blocos claramente separados (por comentário ou espaçamento)
- Nomeie os testes descrevendo comportamento esperado, não a implementação: `` `should emit error state when request fails`() `` em vez de `testError()`

## Ferramentas
- **Mockk** para mocks/stubs em Kotlin (evitar Mockito em código novo)
- **Turbine** para testar `Flow`/`StateFlow`/`SharedFlow` — nunca coletar manualmente em lista para depois asserir
- Em projetos multiplataforma, priorize `kotlin.test` em `commonTest` para lógica compartilhada; use `JUnit` apenas em `androidTest` para o que for específico da plataforma

## Mock vs. Fake
- Prefira fakes simples (implementação real simplificada) para dependências com lógica de estado (ex: repositório em memória) em vez de mockar cada chamada
- Use mock (Mockk) para dependências sem estado relevante ao teste (ex: logger, analytics)
