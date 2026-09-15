---
name: coroutines-flow-guidelines
description: Use esta skill sempre que escrever ou revisar código que usa Coroutines ou Flow em Kotlin (Android ou Compose Multiplatform). Define escopo, dispatcher e padrões de concorrência estruturada.
---

# Coroutines e Flow — Diretrizes

## Escopo
- Sempre especifique explicitamente o escopo da coroutine — nunca use `GlobalScope`
- Em ViewModel/state holder: `viewModelScope`
- Em componente com lifecycle (Activity/Fragment/Composable com `LaunchedEffect`): `lifecycleScope` ou o escopo do próprio Composable
- Prefira `SupervisorJob` quando falhas de uma coroutine filha não devem cancelar as demais

## Dispatcher
- Sempre especifique o dispatcher apropriado para a operação: `Dispatchers.IO` para I/O (rede, disco), `Dispatchers.Default` para CPU-bound, `Dispatchers.Main`/Main thread para UI
- Em projetos Compose Multiplatform, tenha atenção: o comportamento de `Dispatchers.Main`/`IO` pode variar entre plataformas (Android, iOS, Desktop) — valide o comportamento no target específico antes de assumir paridade total com Android

## Flow / StateFlow / SharedFlow
- Prefira `StateFlow` para estado observável com valor atual sempre disponível; `SharedFlow` para eventos (navegação, snackbar) que não devem ser re-emitidos em recomposição/reinscrição
- Sempre trate cancelamento e conclusão do Flow adequadamente (evitar vazamento de coleta)
- Ao testar Flow, use Turbine em vez de coletar manualmente com `toList()`/callbacks
