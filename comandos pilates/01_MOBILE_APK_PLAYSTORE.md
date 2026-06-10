# 📱 MD 01 — APP MOBILE (APK ANDROID + PLAY STORE)

**Objetivo:** Transformar o app web (já com Capacitor configurado) em um APK Android
instalável, testá-lo no celular e preparar a publicação na Play Store.

**Pré-requisito:** Fase 1 completa. O projeto já tem Capacitor 8 configurado
(`capacitor.config.ts`, pasta `android/`, appId `br.com.pilates.app` → trocar para
`br.com.daimach.movement`).

---

## CONTEXTO TÉCNICO
- O app já é PWA + Capacitor (não precisa reescrever em React Native/Flutter).
- Capacitor empacota o site Next.js dentro de um WebView Android nativo.
- Para o app funcionar no celular acessando o Supabase, ele aponta para a URL de
  produção (Vercel) OU roda o front exportado estático.
- **Decisão recomendada:** o APK carrega a URL de produção hospedada (Vercel).
  Mais simples, atualiza sozinho quando você faz deploy. (`server.url` no capacitor.config)

---

## PASSO 1 — PRÉ-REQUISITOS NO PC (você confere/instala)
O Claude Code deve verificar e, se faltar, te instruir a instalar:
1. **Java JDK 17** (Android exige)
2. **Android Studio** (inclui Android SDK + emulador) OU pelo menos o **SDK command-line tools**
3. Variável de ambiente `ANDROID_HOME` apontando para o SDK
4. Node 18+ (já tem)

> Se não tiver Android Studio, o Claude Code deve te dar o link e o passo a passo de instalação ANTES de continuar.

---

## PASSO 2 — COMANDO PARA O CLAUDE CODE

```
MD 01 — GERAR APK ANDROID DAIMACH.MOVEMENT

Projeto: C:\Users\willa\pilates-app
Autorização total. PRESERVE o que já funciona.

PRÉ-CHECK (faça primeiro e me avise se algo faltar):
- Verifique se Java JDK 17 está instalado: java -version
- Verifique ANDROID_HOME e se o Android SDK existe
- Verifique se a pasta android/ existe no projeto
- Se faltar qualquer um, PARE e me dê o passo a passo de instalação, aguarde meu "ok instalei".

TAREFA 1 — Ajustar identidade do app:
- Em capacitor.config.ts: trocar appId para "br.com.daimach.movement" e appName "Daimach.Movement"
- Configurar server.url para a URL de produção Vercel do projeto (me pergunte a URL se não souber)
- Garantir allowNavigation para o domínio Supabase e Vercel
- Ícone do app: usar public/images/logo-daimach-oficial.jpeg (gerar os tamanhos de ícone Android
  em android/app/src/main/res/mipmap-* — pode usar @capacitor/assets se disponível)
- Splash screen com logo Daimach e fundo #1a1a2e

TAREFA 2 — Sincronizar e buildar:
- npm run build (gerar o front)
- npx cap sync android
- Abrir/gerar o projeto Android: npx cap open android (ou build via gradlew)
- Gerar APK de debug: cd android && ./gradlew assembleDebug
  (no Windows: .\gradlew.bat assembleDebug)
- O APK sai em: android/app/build/outputs/apk/debug/app-debug.apk
- Me informe o caminho exato do APK gerado.

TAREFA 3 — Documentar instalação no celular:
Criar arquivo INSTALAR_APK_CELULAR.md explicando:
- Como transferir o APK pro celular (USB/Drive/WhatsApp)
- Como ativar "instalar de fontes desconhecidas"
- Como instalar e abrir

TAREFA 4 — Preparar para Play Store (documentar, não publicar ainda):
Criar PUBLICAR_PLAYSTORE.md com checklist:
- Criar conta Google Play Console (taxa única US$25)
- Gerar APK/AAB ASSINADO (release) com keystore: ./gradlew bundleRelease
- Como criar o keystore (keytool) e guardar com segurança
- Itens da ficha da loja: nome, descrição, screenshots, ícone 512x512, feature graphic,
  política de privacidade (URL)
- (Consultar PLAY_STORE_INFO.md do projeto antigo se existir para reaproveitar textos)

Commit: "md01: apk android daimach + docs playstore"
```

---

## ✅ CHECKPOINT MD 01
- [ ] Pré-requisitos (JDK, SDK) verificados
- [ ] appId e nome trocados para Daimach.Movement
- [ ] APK de debug gerado (caminho informado)
- [ ] APK instala e abre no celular real
- [ ] Login funciona dentro do app no celular
- [ ] Docs de instalação e Play Store criados

---

## OBSERVAÇÕES
- APK de debug serve para testar. Para a Play Store precisa do **AAB assinado (release)**.
- Guarde o **keystore** em local seguro — sem ele você não consegue atualizar o app na loja depois.
- Se preferir distribuir sem Play Store no começo, o APK de debug já roda (instalação manual).
