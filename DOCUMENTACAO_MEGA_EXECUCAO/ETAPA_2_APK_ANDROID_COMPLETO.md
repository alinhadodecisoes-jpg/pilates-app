# 📱 ETAPA 2 — APK ANDROID COMPLETO + TESTES
**Objetivo:** Gerar APK de teste, instalar no emulador/celular, validar funcionamento  
**Tempo estimado:** 1-2 horas  
**Bloqueador:** Android Studio + Java JDK 17 instalados  

---

## ✅ PRÉ-REQUISITOS

Antes de começar, VALIDE:

```powershell
# Verificar Java JDK 17
java -version

# Verificar Android Studio
adb --version

# Verificar Gradle
android/gradlew.bat --version
```

Se algum desses falhar, AVISE no relatório e PULE esta etapa.

---

## 🎯 ETAPA 2.1 — SINCRONIZAR CAPACITOR

```powershell
cd C:\Users\willa\pilates-app
npx cap sync android
```

**Esperado:** Mensagem de sucesso, arquivos sincronizados  
**Resultado no arquivo:** `android/app/src/main/assets/capacitor.config.json` atualizado

---

## 🎯 ETAPA 2.2 — BUILD APK DE DEBUG

```powershell
cd C:\Users\willa\pilates-app
# Versão debug (mais rápida, ideal para teste)
android\gradlew.bat assembleDebug

# OU versão release (mais lenta, mais otimizada)
# android\gradlew.bat assembleRelease
```

**Esperado:** Sucesso, sem erros Gradle  
**Output:** `android/app/build/outputs/apk/debug/app-debug.apk` (arquivo gerado)  
**Tamanho esperado:** ~50-80 MB

---

## 🎯 ETAPA 2.3 — INSTALAR NO CELULAR/EMULADOR

### Opção A — Celular Android Físico (Recomendado para teste real)

```powershell
# 1. Conectar celular via USB
# 2. Ativar "Modo de desenvolvedor" (bater 7x em "Número da compilação")
# 3. Ativar "Depuração USB"

# 4. Verificar se aparece
adb devices

# 5. Instalar APK
adb install -r C:\Users\willa\pilates-app\android\app\build\outputs\apk\debug\app-debug.apk

# 6. Abrir app
adb shell am start -n br.com.pilates.app/.MainActivity
```

**Esperado:** "Success" na saída do `adb install`

### Opção B — Emulador Android (Se não tiver celular)

```powershell
# 1. Abrir Android Studio
# 2. Ir para AVD Manager (Virtual devices)
# 3. Criar ou iniciar um emulador existente
# 4. Aguardar inicializar completamente

# 5. Instalar
adb install -r C:\Users\willa\pilates-app\android\app\build\outputs\apk\debug\app-debug.apk

# 6. Abrir
adb shell am start -n br.com.pilates.app/.MainActivity
```

---

## 🧪 ETAPA 2.4 — TESTES NO CELULAR/EMULADOR

| Teste | Esperado | Status |
|-------|----------|--------|
| **App abre** | Tela de login | ✅/❌ |
| **Logo Daimach visível** | Verde/aqua corretamente | ✅/❌ |
| **Login com Google** | Vai para Google, volta logado | ✅/❌ |
| **Reconhece admin** | Navega para /admin | ✅/❌ |
| **Reconhece aluno** | Navega para /aluno | ✅/❌ |
| **Sidebar funciona** | Botões navegam | ✅/❌ |
| **Dashboard carrega** | Sem erros brancos | ✅/❌ |
| **Toca em "Alunos"** | Lista aparece | ✅/❌ |
| **Toca em "Turmas"** | Grid de turmas aparece | ✅/❌ |
| **Scroll funciona** | Interface responsiva | ✅/❌ |
| **Botões clicáveis** | Modals abrem | ✅/❌ |

**Anote cada teste no relatório.**

---

## 📝 ETAPA 2.5 — BUILD RELEASE (Pré-Play Store)

```powershell
# Gerar APK release (otimizado)
cd C:\Users\willa\pilates-app
android\gradlew.bat bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

**Esperado:** Bundle (.aab) gerado com sucesso  
**Nota:** O .aab é o formato oficial para Play Store

---

## 🔒 ETAPA 2.6 — VALIDAR ASSINATURA (Release)

Se gerou release, validar a assinatura:

```powershell
# Listar debug keystore
keytool -list -v -keystore C:\Users\willa\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Resultado esperado:** Fingerprint exibido (salvar para Play Store depois)

---

## 📋 CHECKLIST ETAPA 2

- [ ] Java JDK 17 instalado
- [ ] Android Studio instalado
- [ ] Capacitor sincronizado (`npx cap sync android`)
- [ ] APK debug gerado (`assembleDebug`)
- [ ] APK instalado no celular/emulador (`adb install`)
- [ ] App abre corretamente
- [ ] Login funciona
- [ ] Admin/Aluno detectados
- [ ] 10+ testes executados
- [ ] APK release gerado (opcional, mas bom ter)
- [ ] Relatório atualizado

---

## 🚨 POSSÍVEIS ERROS

| Erro | Solução |
|------|---------|
| `adb: command not found` | Android SDK não instalado, instalar Android Studio |
| `JAVA_HOME not set` | Adicionar Java ao PATH do Windows |
| `Gradle build failed` | Verificar `build.gradle` em `android/app/` |
| `app-debug.apk not found` | Build falhou, ver logs do Gradle |
| `adb install` falha com permissão | Ativar "Depuração USB" no celular |
| `branco/erro ao abrir` | Verificar console do navegador (F12), pode ser erro de Capacitor |

---

## ✅ RESULTADO FINAL

Quando terminar, você terá:

✅ APK de debug funcionando no celular/emulador  
✅ APK de release pronto para Play Store  
✅ Prova de funcionamento (screenshot ou vídeo curto)  
✅ Lista de testes executados  

---

## 🎯 PRÓXIMO PASSO (Quando Terminar)

Avise aqui no relatório:
```
✅ ETAPA 2 CONCLUÍDA
App funciona no celular?
Qual device foi testado (celular físico ou emulador)?
Houve erros? Quais?
```

Aí sigo pra **ETAPA 3 — UI REFINAMENTO COMPLETO**.

---

> **Data estimada de conclusão:** Hoje à noite  
> **Status:** Aguardando execução  
> **Dependência:** Android Studio + Java JDK 17
