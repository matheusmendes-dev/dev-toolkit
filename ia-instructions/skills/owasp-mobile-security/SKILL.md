---
name: owasp-mobile-security
description: Use esta skill em toda implementação e code review de apps Android ou Compose Multiplatform, para garantir aderência aos princípios do OWASP Mobile Application Security (MASVS/MASTG). Cobre armazenamento de dados, comunicação de rede, autenticação, criptografia e resistência a engenharia reversa.
---

# OWASP Mobile Security — Diretrizes

Baseado no OWASP Mobile Application Security Verification Standard (MASVS). Ao implementar ou revisar código, verifique os pontos abaixo conforme a área tocada pela mudança.

## Armazenamento de dados (Storage)
- Nunca armazenar dados sensíveis (tokens, senhas, PII, chaves de API) em `SharedPreferences`/`DataStore` sem criptografia — usar `EncryptedSharedPreferences` (Android) ou solução equivalente multiplataforma com Keystore/Keychain por trás
- Nunca logar dados sensíveis, nem em builds de debug (logs podem vazar em crash reports/analytics)
- Evitar cache de dados sensíveis em disco sem necessidade; quando necessário, criptografar e limpar no logout
- Não expor dados sensíveis em backups automáticos (`android:allowBackup`, `dataExtractionRules`) sem revisão explícita

## Comunicação de rede
- Toda comunicação deve ser via HTTPS/TLS — nunca permitir cleartext traffic (`usesCleartextTraffic="false"`, Network Security Config configurado)
- Considerar certificate pinning para endpoints críticos (autenticação, pagamento), avaliando o trade-off de manutenção
- Validar certificados corretamente — nunca desabilitar validação de SSL/TLS (nem em builds de debug, sem isolar claramente do build de release)
- Nunca passar tokens/credenciais sensíveis via URL/query string — usar headers ou body

## Autenticação e sessão
- Tokens de sessão devem ter expiração e mecanismo de renovação seguro (refresh token)
- Dados de autenticação sensíveis (token, refresh token) vão sempre em armazenamento criptografado, nunca em texto puro
- Ao implementar biometria, usar as APIs oficiais da plataforma (`BiometricPrompt` no Android) — nunca lógica própria de captura/comparação
- Implementar timeout de sessão e invalidação de token no logout, incluindo no servidor quando aplicável

## Criptografia
- Usar apenas algoritmos e bibliotecas criptográficas padrão da plataforma/reconhecidas — nunca implementar criptografia própria
- Nunca hardcodar chaves, secrets ou credenciais no código-fonte (nem em `BuildConfig`, nem em constantes) — usar variáveis de build/CI ou Keystore
- Gerar valores aleatórios sensíveis (tokens, salts, IVs) sempre com `SecureRandom` ou equivalente, nunca `Random` comum

## Configuração e build
- Builds de release devem ter ofuscação/minificação habilitada (ProGuard/R8 no Android) e `debuggable=false`
- Revisar permissões declaradas no manifest/Info.plist: solicitar apenas o mínimo necessário, nunca por "pode ser útil depois"
- Não deixar endpoints de debug, feature flags de teste ou backdoors habilitados em build de produção

## Ao revisar (code review)
- Tratar qualquer violação desta skill como item **Crítico** (não Sugestão) — são riscos de segurança, não preferência de estilo
- Ao identificar violação, além de apontar, indicar a alternativa segura concreta (não só "isso é inseguro")

## Escopo
Esta skill cobre os princípios gerais do MASVS aplicáveis tanto a Android nativo quanto a Compose Multiplatform. Particularidades de plataforma (ex: Keystore Android vs. Keychain iOS) devem ser resolvidas pelo agente correspondente, usando a API nativa de cada target.