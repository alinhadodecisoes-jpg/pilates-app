# 📱 Como Instalar o APK no Celular (Android)

## Pré-requisito
O APK já foi gerado em: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Passo 1 — Transferir o APK para o celular

### Opção A: Via cabo USB
1. Conecte o celular ao computador via USB
2. No celular, autorize a transferência de arquivos (escolha "Transferência de Arquivos / MTP")
3. Copie o arquivo `app-debug.apk` para a pasta Downloads do celular
4. Desconecte o cabo

### Opção B: Via WhatsApp / Telegram
1. Abra o WhatsApp no computador
2. Envie o arquivo `app-debug.apk` para você mesmo (Saved Messages / Favoritos)
3. No celular, baixe o arquivo

### Opção C: Via Google Drive
1. Faça upload do `app-debug.apk` para o Google Drive
2. No celular, baixe o arquivo pelo app do Drive

---

## Passo 2 — Ativar instalação de fontes desconhecidas

### Android 8.0 ou superior:
1. Vá em **Configurações** → **Privacidade** (ou **Segurança**)
2. Toque em **Instalar apps desconhecidos**
3. Selecione o navegador/gerenciador de arquivos que você usará para instalar
4. Ative **Permitir dessa fonte**

### Android 7.0 ou inferior:
1. Vá em **Configurações** → **Segurança**
2. Ative **Fontes desconhecidas**

---

## Passo 3 — Instalar o APK

1. Abra o **Gerenciador de Arquivos** (ou a pasta Downloads)
2. Localize o arquivo `app-debug.apk`
3. Toque no arquivo
4. Toque em **Instalar**
5. Aguarde a instalação (pode demorar 30-60 segundos)
6. Toque em **Abrir** para iniciar o app

---

## Passo 4 — Primeiros passos no app

1. O app abrirá a tela de login do Daimach.Movement
2. Faça login com sua conta (Google OAuth ou email/senha)
3. Aceite as permissões de notificação quando solicitado
4. Pronto! 🎉

---

## Solução de problemas

| Problema | Solução |
|----------|---------|
| "APK inválido" | O arquivo pode ter corrompido na transferência. Transfira novamente. |
| "Instalação bloqueada" | Verifique se a opção de fontes desconhecidas está ativada (Passo 2) |
| "Aplicativo não instalado" | Certifique-se de ter espaço suficiente no celular (mín. 100MB) |
| App não abre / tela branca | O servidor (Vercel) pode estar offline. Verifique a URL configurada. |

---

## Notas importantes

- Este APK é uma versão de **teste (debug)** — para distribuição na Play Store é necessário um APK/AAB assinado.
- O app carrega o conteúdo da URL de produção — precisa de internet para funcionar.
- Cada novo deploy na Vercel atualiza automaticamente o app (sem precisar reinstalar o APK).
