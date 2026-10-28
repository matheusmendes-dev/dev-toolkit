---
name: android-unit-tests
description: Especialista em testes unitários Kotlin para projetos Android (JVM), usando MockK, JUnit4, Turbine e kotlinx-coroutines-test, aplicando rigorosamente as convenções de arquitetura, padrões de mocking e regras de execução do projeto.
---

# Skill: Especialista em Testes Unitários (Android)

## Função
Atuar como especialista em testes unitários Kotlin em projetos Android, aplicando rigorosamente as convenções de arquitetura, padrões de mocking e regras de execução do projeto. Para lógica compartilhada em Kotlin Multiplatform (`commonTest`), usar a skill `kotlin-testing-conventions`.

---

## Regras e Diretrizes de Código

**1. Quando Escrever**
* Testes unitários devem ser escritos junto com a implementação da feature, nunca como etapa posterior separada.

**2. Frameworks e Mocks**
* **Framework de Mock:** Usar **exclusivamente MockK** (`@MockK`, `@RelaxedMockK`, `every`/`coEvery`, `verify`/`coVerify`, `just Runs`). **NUNCA** utilizar Mockito ou Mockito-Kotlin em código novo.
* **Asserts:** Utilizar os componentes do **JUnit4** (`org.junit.Assert.assertEquals`, `assertTrue`, `assertNotNull`, etc.).
* **Flow:** Utilizar **Turbine** (`flow.test { awaitItem() }`) para testar `Flow`/`StateFlow`/`SharedFlow` — nunca coletar manualmente em lista para depois asserir.
* **Massa de Dados:** Utilizar/criar fixtures e factories organizadas em pacotes ou módulos de mock comuns. Evitar mockar instâncias genéricas inline se já houver factory disponível.

**3. Estrutura e Nomenclatura**
* **Padrão AAA:** Estrutura obrigatória dentro de cada função `@Test`, separada expressamente pelos comentários:
  ```kotlin
  // Arrange
  // Act
  // Assert
  ```
* Nomear os testes descrevendo o comportamento esperado, não a implementação: `` `should emit error state when request fails`() `` em vez de `testError()`.

**4. Hierarquia e Pacote**
* O arquivo de teste DEVE espelhar rigorosamente a estrutura do pacote do arquivo de produção.
* *Exemplo:* Se o código estiver em `com.projeto.feature.profile.ProfileViewModel`, o teste DEVE declarar `package com.projeto.feature.profile` dentro de `src/test/java/...` (ou `src/test/kotlin/...`).

**5. Arquitetura da Classe de Teste**
* **Classes com dependências (ViewModels, UseCases, Repositories):** Herdar da classe base de testes do projeto (ex: `BaseTest<SUT>()`) e sobrescrever o método de setup do SUT (System Under Test).
* **Classes utilitárias/Mappers puros:** NÃO estender classe base. Fazer a instanciação direta no teste.

**6. Programação Assíncrona (Coroutines/Flow)**
* Substituir o `Dispatchers.Main` pela regra do projeto (ex: `MainDispatcherRule`) sempre que a classe testada usar `viewModelScope` ou `Dispatchers.Main`.
* Executar testes suspensos dentro de `runTest`.
* Validar estados emitidos (`StateFlow` de UI, eventos) com Turbine.

**7. Estratégia de Mocks e Casos de Borda**
* Usar `@RelaxedMockK` em interfaces com múltiplos métodos onde os retornos padrão não afetam o teste (ex: analytics, logger).
* Cobrir cenários de: **Sucesso**, **Falha/Exceção**, **Nulos/Vazios** e **Desvios de fluxo (if/else)**.
* Para construtores de SUT com efeitos colaterais na inicialização, utilizar ferramentas adequadas (ex: `clearMocks(...)`) no teardown/setup, se necessário.

---

## Modelos de Referência (Templates)

### Modelo 1: ViewModel (Uso de Classe Base)

```kotlin
package com.projeto.feature.sample

import app.cash.turbine.test
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.impl.annotations.MockK
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class SampleViewModelTest : BaseTest<SampleViewModel>() {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @MockK
    private lateinit var getSampleUseCase: GetSampleUseCase

    override fun setupSUT() = SampleViewModel(getSampleUseCase)

    @Test
    fun `should emit success state when use case returns data`() = runTest {
        // Arrange
        val expectedData = SampleFactory.createData()
        coEvery { getSampleUseCase() } returns expectedData

        sut.uiState.test {
            assertEquals(SampleUiState.Idle, awaitItem())

            // Act
            sut.loadData()

            // Assert
            assertEquals(SampleUiState.Loading, awaitItem())
            assertEquals(SampleUiState.Success(expectedData), awaitItem())
        }
        coVerify(exactly = 1) { getSampleUseCase() }
    }

    @Test
    fun `should emit error state when use case throws exception`() = runTest {
        // Arrange
        coEvery { getSampleUseCase() } throws RuntimeException("network error")

        sut.uiState.test {
            assertEquals(SampleUiState.Idle, awaitItem())

            // Act
            sut.loadData()

            // Assert
            assertEquals(SampleUiState.Loading, awaitItem())
            assertEquals(SampleUiState.Error("network error"), awaitItem())
        }
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
    fun `should return mapped object when input is valid`() {
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
- [ ] Nome do teste descreve o comportamento esperado.
- [ ] Declaração exata do pacote espelhado em relação à classe de produção.
- [ ] `MainDispatcherRule` declarada quando a classe testada usa coroutines no `Dispatchers.Main`.
- [ ] `Flow`/`StateFlow` validados com Turbine.
- [ ] Configuração correta de SUT (System Under Test) via classe base, respeitando os padrões de injeção/instanciação do projeto.
