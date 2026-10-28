---
name: kotlin-testing-conventions
description: Use esta skill ao escrever testes unitários em Kotlin puro / Kotlin Multiplatform / Compose Multiplatform (commonTest). Define estrutura, nomenclatura e ferramentas padrão de teste com kotlin.test, Turbine, kotlinx-coroutines-test e fakes.
---

# Skill: Especialista em Testes Unitários (Kotlin / Multiplatform)

## Função
Atuar como especialista em testes unitários Kotlin para código compartilhado (Kotlin puro, Kotlin Multiplatform e Compose Multiplatform), usando apenas bibliotecas multiplataforma. Para testes específicos de Android (JVM), usar a skill `android-unit-tests`.

---

## Regras e Diretrizes de Código

**1. Quando Escrever**
* Testes unitários devem ser escritos junto com a implementação da feature, nunca como etapa posterior separada.

**2. Frameworks e Dublês**
* **Framework de Teste:** Usar **`kotlin.test`** (`@Test`, `@BeforeTest`, `@AfterTest`, `assertEquals`, `assertIs`, `assertTrue`, etc.). **NUNCA** usar JUnit em `commonTest`.
* **Dublês:** Usar **fakes** escritos à mão (implementações simplificadas das interfaces). MockK e Mockito **não rodam em Kotlin/Native** — não usar em `commonTest`; MockK fica restrito a testes de plataforma (`androidUnitTest`/`jvmTest`).
* **Flow:** Utilizar **Turbine** (`flow.test { awaitItem() }`) para testar `Flow`/`StateFlow`/`SharedFlow` — nunca coletar manualmente em lista para depois asserir.
* **Massa de Dados:** Utilizar/criar fixtures e factories organizadas em pacotes comuns de teste (`commonTest`). Reaproveitar factories existentes em vez de construir objetos inline.

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
* *Exemplo:* Se o código estiver em `commonMain` como `com.projeto.feature.profile.ProfileViewModel`, o teste DEVE declarar `package com.projeto.feature.profile` dentro de `src/commonTest/kotlin/...`.
* Código específico de plataforma (`androidMain`, `iosMain`) é testado no source set correspondente (`androidUnitTest`, `iosTest`).

**5. Arquitetura da Classe de Teste**
* **Classes com dependências (ViewModels, UseCases, Repositories):** Não herdar de classe base JUnit. Declarar os fakes como propriedades e instanciar o SUT (System Under Test) em `@BeforeTest`, injetando os fakes pelo construtor.
* **Classes utilitárias/Mappers puros:** Fazer a instanciação direta no teste.

**6. Programação Assíncrona (Coroutines/Flow)**
* Substituir o `Dispatchers.Main` com `Dispatchers.setMain(UnconfinedTestDispatcher())` em `@BeforeTest` e restaurar com `Dispatchers.resetMain()` em `@AfterTest` sempre que a classe testada usar `viewModelScope` ou `Dispatchers.Main`.
* Executar testes suspensos dentro de `runTest`.
* Validar estados emitidos (`StateFlow` de UI, eventos) com Turbine.

**7. Estratégia de Dublês e Casos de Borda**
* Preferir fakes com estado real simplificado (ex: repositório em memória) a stubs que só retornam valores fixos.
* Expor no fake propriedades configuráveis para simular cenários (ex: `var result: Result<T>`) e contadores/registros de chamadas quando for preciso verificar interações.
* Cobrir cenários de: **Sucesso**, **Falha/Exceção**, **Nulos/Vazios** e **Desvios de fluxo (if/else)**.

---

## Modelos de Referência (Templates)

### Modelo 1: ViewModel (Fakes + Instanciação em `@BeforeTest`)

```kotlin
package com.projeto.feature.sample

import app.cash.turbine.test
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import kotlin.test.AfterTest
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals

class SampleViewModelTest {

    private val fakeRepository = FakeSampleRepository()
    private lateinit var sut: SampleViewModel

    @BeforeTest
    fun setup() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        sut = SampleViewModel(GetSampleUseCase(fakeRepository))
    }

    @AfterTest
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `should emit success state when repository returns data`() = runTest {
        // Arrange
        val expectedData = SampleFactory.createData()
        fakeRepository.result = Result.success(expectedData)

        sut.uiState.test {
            assertEquals(SampleUiState.Idle, awaitItem())

            // Act
            sut.loadData()

            // Assert
            assertEquals(SampleUiState.Loading, awaitItem())
            assertEquals(SampleUiState.Success(expectedData), awaitItem())
        }
        assertEquals(1, fakeRepository.fetchCallCount)
    }

    @Test
    fun `should emit error state when repository fails`() = runTest {
        // Arrange
        fakeRepository.result = Result.failure(RuntimeException("network error"))

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

class FakeSampleRepository : SampleRepository {

    var result: Result<SampleData> = Result.success(SampleFactory.createData())
    var fetchCallCount = 0
        private set

    override suspend fun fetch(): SampleData {
        fetchCallCount++
        return result.getOrThrow()
    }
}
```

### Modelo 2: Mapper / Classe Pura (Instanciação Direta)

```kotlin
package com.projeto.feature.sample

import kotlin.test.Test
import kotlin.test.assertEquals

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

- [ ] Ausência de MockK, Mockito e JUnit em `commonTest` (apenas `kotlin.test`).
- [ ] Presença dos blocos `// Arrange`, `// Act` e `// Assert`.
- [ ] Nome do teste descreve o comportamento esperado.
- [ ] Declaração exata do pacote espelhado em relação à classe de produção, no source set correto.
- [ ] `Dispatchers.setMain` em `@BeforeTest` e `Dispatchers.resetMain` em `@AfterTest` quando a classe testada usa `Dispatchers.Main`.
- [ ] `Flow`/`StateFlow` validados com Turbine.
- [ ] SUT instanciado em `@BeforeTest` com fakes injetados pelo construtor.
