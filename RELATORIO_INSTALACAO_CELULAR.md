# RELATÓRIO — GERAÇÃO DO APK (DAIMACH)
**Data:** 2026-06-10

## Ambiente
- **JDK:** OpenJDK 21 (JBR do Android Studio — `C:\Program Files\Android\Android Studio\jbr`)
- **Gradle:** 9.2.1 (cache local; o wrapper 8.14.3 não pôde ser baixado neste ambiente)
- **AGP:** 8.13.0
- **Android SDK:** `%LOCALAPPDATA%\Android\Sdk`

## APK gerado ✅
- **Arquivo:** `app-debug.apk` (5,6 MB)
- **Local original:** `C:\Users\willa\pilates-app\android\app\build\outputs\apk\debug\app-debug.apk`
- **Cópia para instalar:** `C:\Users\willa\Downloads\daimach-pilates-debug.apk`
- **appId:** `br.com.daimach.movement`

## Celulares
- Nenhum celular conectado via USB (`adb devices` vazio) → APK deixado na pasta acima para **instalação manual** (WhatsApp/Drive/cabo). Passo a passo no doc original (Parte 3/4).

## ⚠️ MUITO IMPORTANTE — antes de instalar e testar
Este APK é um **wrapper Capacitor** que carrega o app de uma URL (`capacitor.config.ts` → `server.url`). Hoje está apontando para o **placeholder** `https://daimach.com.br/pilates`, que **ainda não serve o app**. Resultado: ao abrir, o app mostrará **página em branco/erro** até resolver isso.

### Para o APK realmente funcionar, escolha um caminho:
1. **Produção (recomendado):** fazer deploy do app (ex.: Vercel), e atualizar `server.url` para a URL pública real → rebuild do APK.
2. **Teste local rápido (mesma WiFi):** apontar `server.url` para o IP do PC na rede (`http://192.168.x.x:3000`), com `cleartext: true` no config, rodar `npm run dev` no PC e rebuild do APK. Aí o celular abre o app rodando na sua máquina.

## Como refazer o build (offline, já com cache)
```
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
cd C:\Users\willa\pilates-app
npx cap sync android
cd android
"C:\Users\willa\.gradle\wrapper\dists\gradle-9.2.1-all\2lbhfocpgk6niea1fja7mj8kz\gradle-9.2.1\bin\gradle.bat" assembleDebug --no-daemon
```
(ou simplesmente abrir a pasta `android/` no Android Studio e Run ▶ — ele já tem tudo configurado.)

## Status
✅ APK debug gerado e disponível em `C:\Users\willa\Downloads\daimach-pilates-debug.apk`
⚠️ Pendente: definir `server.url` (deploy público ou IP da LAN) para o app carregar conteúdo.
