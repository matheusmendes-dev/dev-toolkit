---
name: mobile-feature-implementation
description: Use esta skill sempre que for implementar uma nova feature ou classe em um projeto Kotlin com Clean Architecture — Android nativo ou Compose Multiplatform. Define a regra de dependência entre camadas (data/domain/presentation) e a convenção de pastas para model, entity, enum, request, mapper, mock, componentes de UI reutilizáveis e classes de foundation.
---

# Implementação de Features — Clean Architecture (Android / Compose Multiplatform)

Esta skill se aplica tanto a projetos Android nativos quanto a projetos **Compose Multiplatform (KMP)**. As regras de camadas e convenções de pastas são as mesmas nos dois casos; a única diferença é *onde* essas pastas vivem dentro da estrutura de source sets:

- **Android nativo**: as pastas ficam diretamente no módulo (ex: `app/src/main/kotlin/.../common/model/auth`)
- **Compose Multiplatform**: as pastas ficam no source set apropriado — `commonMain` para código compartilhado (a grande maioria de model, domain, mapper, UI comum), e `androidMain`/`iosMain`/etc. apenas quando a implementação exigir `expect`/`actual` específico de plataforma. Por padrão, prefira sempre `commonMain`; só quebre em source sets específicos quando a API da plataforma exigir.

## Estrutura em camadas

Antes de escrever código, estruture a feature em camadas: `data` / `domain` / `presentation`. Defina os contratos (interfaces) entre camadas antes da implementação concreta. Cubra estados de loading/erro/sucesso desde o início (sealed class de UiState). Escreva testes unitários junto com a implementação, não depois.

## Regra de dependência entre camadas (obrigatória)

A arquitetura deve seguir estritamente `data ← domain ← presentation`, ou seja, dependência sempre **vertical** e em uma única direção.

Nunca permita dependência **horizontal**: uma classe de `data` não pode depender de outra classe de `data` de um módulo/feature diferente — o mesmo vale para `domain` e `presentation`.

Se duas camadas do mesmo tipo precisarem compartilhar algo, extraia para `common/` em vez de criar dependência lateral.

Antes de finalizar qualquer implementação, valide se essa regra foi respeitada.

## Convenções de pastas em `common/` (obrigatórias)

Toda classe reaproveitável entre camadas deve ficar em `common/` (dentro de `commonMain` em projetos KMP), organizada assim:

**Model/Entity** — `common/model/{feature}`, com subpastas por tipo:
- `common/model/{feature}` → classes model (ex: `common/model/auth`)
- `common/model/{feature}/entity` → classes entity (ex: `common/model/auth/entity`)
- `common/model/{feature}/enums` → classes enum (ex: `common/model/auth/enums`)
- `common/model/{feature}/requests` → classes de request para API (ex: `common/model/auth/requests`)

**Mapper** — `common/mapper/{feature}` (ex: `common/mapper/auth`)

**Mock** — `common/mocks/{feature}` (ex: `common/mocks/auth`)

**Componentes de UI reutilizáveis** — `common/ui/{componentType}` (ex: `common/ui/buttons`)

**Classes utilitárias/foundation** — `common/foundation` (ex: `StringExtensions`, `NavigationHelper`, `FirebaseHelper`)

Nunca crie essas classes soltas dentro de `data`, `domain` ou `presentation` — elas vivem em `common/`, que pode ser referenciado verticalmente por todas as camadas sem violar a regra de dependência.
