---
name: proguard-r8-rules
description: Use esta skill sempre que criar ou revisar classes Android/Kotlin que precisem sobreviver à ofuscação/minificação do ProGuard/R8 (ex: modelos serializados por reflection — Gson/Moshi/kotlinx.serialization, classes acessadas via JNI/reflection, APIs de SDK público, classes de crash report). Cobre quando uma regra `-keep` é necessária e como escrevê-la de forma cirúrgica.
---

# ProGuard / R8 — Regras de Keep

Builds de release usam ofuscação/minificação (ver `owasp-mobile-security`). Isso quebra em runtime qualquer classe/membro acessado via reflection, nome de classe serializado, ou API pública consumida fora do módulo — se não houver regra `-keep` correspondente.

## Quando adicionar regra `-keep`

Ao criar ou alterar uma classe, verificar se ela se encaixa em algum destes casos — se sim, **é obrigatório** adicionar regra:

- **Serialização por reflection**: model/DTO/entity usado com Gson, Moshi (sem codegen), kotlinx.serialization com reflection, Jackson — o nome dos campos é lido em runtime
- **Parcelable/Serializable** cujo `CREATOR` ou construtor é resolvido por nome/reflection
- **JNI**: classe/método chamado a partir de código nativo (C/C++) pelo nome
- **Reflection explícita no código**: `Class.forName(...)`, `::class.java.getDeclaredMethod(...)`, etc.
- **Deserialização de config remota** (Firebase Remote Config, feature flags) mapeada para uma data class
- **Enums usados com `valueOf`/`name` vindos de fonte externa** (API, banco, arquivo de config)
- **Classes expostas como API pública de uma library/módulo** consumida por outro módulo/app que não passa pelo mesmo R8
- **Anotações de frameworks que dependem de nome preservado em runtime** (ex: `@Keep` do AndroidX já resolve isso pontualmente, mas frameworks de terceiros sem suporte a `@Keep` exigem regra manual)

Não é necessário nem correto adicionar regra `-keep` para:
- Código que só é chamado diretamente (call site normal, sem reflection)
- Classes internas de implementação (ViewModel, UseCase, Repository, etc.) sem nenhum acesso por nome
- Qualquer classe/tipo "só por garantia" — regra desnecessária aumenta o app e reduz o benefício da ofuscação

## Como escrever a regra (escopo mínimo)

Preferir sempre a regra mais restrita possível, nesta ordem de preferência:

1. **Anotação `@Keep`** (`androidx.annotation.Keep`) na classe ou membro específico — quando o projeto já usa AndroidX, é a opção mais localizada e não exige tocar no `proguard-rules.pro`
2. **Regra nomeada para a classe exata** no `proguard-rules.pro`/`consumer-rules.pro`:
   ```proguard
   -keep class com.exemplo.feature.pagamento.data.model.PagamentoResponse { *; }
   ```
3. **Regra por padrão de pacote/sufixo**, só quando múltiplas classes do mesmo tipo precisam da mesma proteção (ex: todos os DTOs de um pacote `remote.dto`):
   ```proguard
   -keep class com.exemplo.feature.pagamento.data.remote.dto.** { *; }
   ```
4. **Evitar** `-keep class ** { *; }` genérico, `-dontobfuscate` global, ou regras em pacotes amplos (`com.exemplo.**`) — isso anula o propósito do R8 e deve ser sinalizado como problema em code review

Ao restringir membros (quando só campos importam, não a classe toda):
```proguard
-keepclassmembers class com.exemplo.feature.pagamento.data.model.PagamentoResponse {
    <fields>;
}
```

## Onde colocar a regra

- Módulo Android app: `proguard-rules.pro` referenciado no `build.gradle.kts` (`proguardFiles`)
- Módulo/library Android publicada: `consumer-rules.pro` — para que apps consumidores herdem a regra automaticamente
- KMP com target Android: regra vai no `proguard-rules.pro` do módulo Android (`androidMain`/módulo `androidApp`), nunca em `commonMain` (R8 é specific de bytecode JVM/Android)

## Ao implementar uma feature nova

Depois de criar as classes da feature, revisar cada model/entity/enum/DTO novo contra a lista de "quando adicionar regra" acima. Se algum se encaixar, adicionar a regra junto da mesma implementação — não deixar para depois.

## Ao revisar (code review)

- Marcar como **Crítico** classe nova que é serializada por reflection (Gson/Moshi sem codegen/kotlinx.serialization) e não tem `@Keep` nem regra `-keep` correspondente — isso quebra em release e passa despercebido em debug
- Marcar como **Sugestão** regra `-keep` presente mas com escopo mais amplo do que necessário (ex: pacote inteiro quando só uma classe precisa)
- Sinalizar regra `-keep` para classe que não se encaixa em nenhum critério da lista acima — remoção recomendada
