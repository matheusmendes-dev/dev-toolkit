---
name: android-unit-tests
description: Especialista em testes unitários Kotlin/Android, aplicando rigorosamente as convenções de arquitetura, padrões de mocking e regras de execução de projeto.
---

# Skill: Especialista em Testes Unitários (Kotlin/Android)

## Função
Atuar como especialista em testes unitários Kotlin/Android, aplicando rigorosamente as convenções de arquitetura, padrões de mocking e regras de execução de projeto.

---

## Regras e Diretrizes de Código

**1. Frameworks e Mocks**
* **Framework de Mock:** Usar **exclusivamente MockK** (`@MockK`, `@RelaxedMockK`, `every { ... }`, `verify { ... }`, `just Runs`). **NUNCA** utilizar Mockito ou Mockito-Kotlin em código novo.
* **Asserts:** Utilizar os componentes nativos do **JUnit** (`assertEquals`, `assertTrue`, `assertNotNull`, etc.).
* **Padrão AAA:** Estrutura tabular obrigatória dentro de cada função `@Test`, separada expressamente pelos comentários:
  ```kotlin
  // Arrange
  // Act
  // Assert
  ```
* **Massa de Dados:** Utilizar/criar fixtures e factories organizadas em pacotes ou módulos de mock comuns. Evitar mockar instâncias genéricas inline se já houver factory disponível.

**2. Hierarquia e Pacote**
* O arquivo de teste DEVE espelhar rigorosamente a estrutura do pacote do arquivo de produção.
* *Exemplo:* Se o código estiver em `com.projeto.feature.profile.ProfilePresenter`, o teste DEVE declarar `package com.projeto.feature.profile` dentro de `src/test/java/...`.

**3. Arquitetura da Classe de Teste**
* **Classes com dependências (Presenters, UseCases, Repositories, ViewModels):** Herdar da classe base de testes do projeto (ex: `BaseTest<SUT>()`) e sobrescrever o método de setup do SUT (System Under Test).
* **Classes utilitárias/Mappers puros:** NÃO estender classe base. Fazer a instanciação direta no teste.

**4. Suporte a Programação Reativa / Assíncrona**
* Se a classe testada utilizar **RxJava**, declarar a regra de Scheduler correspondente do projeto (ex: `RxImmediateSchedulerRule`). Validar streams usando o fluxo `.test()` e asserções do `TestObserver` / `TestSubscriber`.
* Se a classe testada utilizar **Coroutines**, utilizar os despachantes de teste e regras equivalentes do projeto (ex: `MainDispatcherRule`).

**5. Estratégia de Mocks e Casos de Borda**
* Usar `@RelaxedMockK` em interfaces ou Views/Contracts com múltiplos métodos onde os retornos padrão não afetam o teste.
* Cobrir cenários de: **Sucesso**, **Falha/Exceção**, **Nulos/Vazios** e **Desvios de fluxo (if/else)**.
* Para construtores de SUT com efeitos colaterais na inicialização, utilizar ferramentas adequadas (ex: `clearMocks(...)`) no teardown/setup, se necessário.

---

## Modelos de Referência (Templates)

### Modelo 1: SUT com Dependências (Uso de Classe Base)

```kotlin
package com.projeto.feature.sample

import io.mockk.impl.annotations.MockK
import io.mockk.verify
import org.junit.Rule
import org.junit.Test

class SamplePresenterTest : BaseTest<SamplePresenter>() {

    // Exemplo de regra para execução síncrona
    @get:Rule
    val rxRule = RxImmediateSchedulerRule()

    @MockK
    private lateinit var useCase: SampleUseCase

    @MockK(relaxed = true)
    private lateinit var view: SampleView

    override fun setupSUT() = SamplePresenter(useCase, view)

    @Test
    fun `fetchData when useCase returns success should update view`() {
        // Arrange
        val expectedData = SampleFactory.createData()
        every { useCase.execute() } returns Single.just(expectedData)

        // Act
        sut.fetchData()

        // Assert
        verify { view.showData(expectedData) }
    }
}
```

### Modelo 2: Mapper / Classe Pura (Instanciação Direta)

```kotlin
package com.projeto.feature.sample

import org.junit.Assert.assertEquals
import org.junit.Test

class SampleMapperTest {

    private val mapper = SampleMapper()

    @Test
    fun `mapToDomain when input is valid should return mapped object`() {
        // Arrange
        val response = SampleFactory.createResponse()

        // Act
        val result = mapper.mapToDomain(response)

        // Assert
        assertEquals(response.id, result.id)
    }
}
```

---

## Processo de Validação Pré-Saída

Ao gerar ou revisar qualquer teste unitário, garanta a conformidade com o checklist:

- [ ] Ausência de chamadas/importações ao Mockito.
- [ ] Presença dos blocos `// Arrange`, `// Act` e `// Assert`.
- [ ] Declaração exata do pacote espelhado em relação à classe de produção.
- [ ] Utilização de regras adequadas para concorrência (RxJava ou Coroutines).
- [ ] Configuração correta de SUT (System Under Test), respeitando os padrões de injeção/instanciação do projeto.
