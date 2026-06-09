# 🏪 Checklist para Publicar na Google Play Store

## Pré-requisitos

### 1. Conta Google Play Console
- Acesse: https://play.google.com/console
- Crie uma conta de desenvolvedor (taxa única de **US$25**)
- Pode levar até 48h para aprovação

### 2. Java JDK 17 instalado
```bash
# Verificar:
java -version
# Deve mostrar: openjdk version "17.x.x"

# Download: https://adoptium.net/
```

### 3. Android Studio (ou SDK Command-Line Tools)
- Download: https://developer.android.com/studio
- Instalar SDK Android 34+ durante a instalação
- Variável de ambiente: `ANDROID_HOME` apontando para o SDK

---

## Passo 1 — Gerar o Keystore (chave de assinatura)

⚠️ **GUARDE O KEYSTORE COM SEGURANÇA!** Sem ele você não pode atualizar o app na Play Store.

```bash
# Gerar keystore (execute uma vez, guarde o arquivo e as senhas)
keytool -genkey -v \
  -keystore daimach-release-key.keystore \
  -alias daimach \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Você será solicitado a criar:
# - Senha do keystore (guarde!)
# - Senha da chave (guarde!)
# - Nome, organização, cidade, estado, país
```

---

## Passo 2 — Gerar APK/AAB de Release

```bash
# Na pasta raiz do projeto:
npm run build       # ou next build (gera o front)
npx cap sync android

# Na pasta android/:
cd android

# Windows:
.\gradlew.bat bundleRelease
# Linux/Mac:
./gradlew bundleRelease

# O AAB sai em:
# android/app/build/outputs/bundle/release/app-release.aab
```

### Configurar assinatura no `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('../daimach-release-key.keystore')
            storePassword 'SUA_SENHA_DO_KEYSTORE'
            keyAlias 'daimach'
            keyPassword 'SUA_SENHA_DA_CHAVE'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
        }
    }
}
```

---

## Passo 3 — Criar App no Google Play Console

1. Acesse: https://play.google.com/console
2. Clique em **Criar aplicativo**
3. Preencha:
   - **Nome do app:** Daimach.Movement
   - **Idioma padrão:** Português (Brasil)
   - **App ou jogo:** App
   - **Gratuito ou pago:** Gratuito

---

## Passo 4 — Ficha da Loja

### Textos necessários:
- **Nome:** Daimach.Movement (máx. 50 caracteres)
- **Título curto:** Estúdio de Pilates (máx. 30 caracteres)
- **Descrição curta:** Gerencie suas aulas, evolução física e pagamentos do seu estúdio de Pilates. (máx. 80 caracteres)
- **Descrição completa:** (máx. 4000 caracteres — descrever funcionalidades)

### Assets gráficos:
| Asset | Tamanho | Observação |
|-------|---------|------------|
| Ícone | 512x512 px | PNG, sem transparência |
| Feature Graphic | 1024x500 px | Imagem de destaque |
| Screenshots | Mín. 2, máx. 8 | Por tipo de device |
| App TV banner | 1280x720 px | Opcional |

### Política de Privacidade:
- URL obrigatória: criar página em `daimach.com.br/privacidade`
- Deve mencionar: coleta de dados de saúde, LGPD, contato para exclusão

---

## Passo 5 — Configuração do App

1. **Classificação de conteúdo:** Preencher questionário (provavelmente "Para todos")
2. **Público-alvo:** 18+
3. **Permissões:** Declarar uso de notificações, câmera (fotos de avaliação), armazenamento
4. **Privacidade:** Declarar quais dados são coletados (saúde, pagamento, localização)

---

## Passo 6 — Upload e Publicação

1. Vá em **Produção** → **Criar nova versão**
2. Faça upload do arquivo `app-release.aab`
3. Preencha as notas de versão (ex: "Versão inicial do Daimach.Movement")
4. Clique em **Analisar e publicar**
5. Aguarde revisão (2-7 dias úteis para nova conta)

---

## Dicas importantes

- ✅ Teste primeiro com **Teste interno** (distribui para e-mails específicos sem revisão)
- ✅ Use o **Firebase App Distribution** para distribuir para testadores durante o desenvolvimento
- ⚠️ A Play Store exige **Google Play Billing** para apps que cobram dentro do app — para assinatura via Stripe, o pagamento deve ser feito no site, não no app (ou você paga 15-30% de taxa para o Google)
- 🔄 Cada atualização do app exige novo AAB assinado e subir na Play Console

---

## Estrutura de arquivos para backup do keystore

```
📁 Daimach (Google Drive - PRIVADO)
├── daimach-release-key.keystore  ← NUNCA compartilhar publicamente
├── keystore-senhas.txt           ← Senha do keystore e da chave
└── google-play-service-account.json
```
