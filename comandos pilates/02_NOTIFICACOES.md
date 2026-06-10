# 🔔 MD 02 — NOTIFICAÇÕES (PUSH + EMAIL + WHATSAPP)

**Objetivo:** Avisar o aluno automaticamente: lembrete de aula, mensalidade vencendo,
reposição aprovada/recusada. Notificação push no celular, email de backup, e (opcional)
link de WhatsApp.

**Reaproveitar do projeto antigo (companion-os):** já tinha **web-push (VAPID)** e
**Resend (email)** funcionando. Copiar `src/lib/capacitor/push.ts`, a config VAPID e
o setup do Resend. Variáveis já existiam: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `RESEND_API_KEY`.

---

## CONTEXTO TÉCNICO
- **Push web (PWA):** Service Worker + VAPID. Funciona no navegador e no PWA instalado.
- **Push nativo (APK):** Capacitor Push Notifications usa Firebase Cloud Messaging (FCM).
  Precisa do `google-services.json` (do Firebase). O projeto antigo já referenciava esse arquivo.
- **Email:** Resend (simples, já configurado antes).
- **WhatsApp:** sem API oficial paga, usar link `https://wa.me/<numero>?text=...` que o admin
  clica para enviar manualmente (gratuito). API oficial fica pra depois.

---

## PASSO 1 — SQL no Supabase (cole e RUN)

```sql
-- Guardar tokens de push de cada usuário (device tokens)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES users_pilates(id) ON DELETE CASCADE,
  endpoint TEXT,                 -- para web-push
  fcm_token TEXT,                -- para push nativo Android
  keys_p256dh TEXT,
  keys_auth TEXT,
  platform TEXT,                 -- 'web' | 'android'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Fila/histórico de notificações enviadas
CREATE TABLE IF NOT EXISTS notifications_log (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES users_pilates(id) ON DELETE CASCADE,
  type TEXT,                     -- 'aula_lembrete' | 'mensalidade' | 'reposicao'
  title TEXT,
  body TEXT,
  channel TEXT,                  -- 'push' | 'email' | 'whatsapp'
  status TEXT DEFAULT 'sent',    -- 'sent' | 'failed'
  sent_at TIMESTAMP DEFAULT NOW()
);

-- Preferências de notificação do usuário
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users_pilates(id) ON DELETE CASCADE,
  aula_lembrete BOOLEAN DEFAULT TRUE,
  mensalidade BOOLEAN DEFAULT TRUE,
  reposicao BOOLEAN DEFAULT TRUE,
  horas_antes_aula INT DEFAULT 12
);

ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences DISABLE ROW LEVEL SECURITY;
```

---

## PASSO 2 — COMANDO PARA O CLAUDE CODE

```
MD 02 — SISTEMA DE NOTIFICAÇÕES DAIMACH

Projeto: C:\Users\willa\pilates-app
Projeto antigo (reaproveitar): C:\Users\willa\companion-os
Autorização total. PRESERVE o que já funciona.

CONTEXTO: 3 tabelas novas: push_subscriptions, notifications_log, notification_preferences.
Reaproveitar do companion-os: web-push (VAPID), Resend (email), Capacitor push.

TAREFA 1 — Copiar e adaptar base do projeto antigo:
- Copiar src/lib/capacitor/push.ts do companion-os (push nativo)
- Copiar a config de web-push/VAPID e o helper de envio
- Copiar setup do Resend (envio de email)
- Adaptar imports/paths para o pilates-app
- Variáveis VAPID_*/RESEND_API_KEY: pedir ao usuário para copiar do .env.local antigo
  para o .env.local do pilates-app (me avise quais faltam)

TAREFA 2 — Registro de push:
- Ao logar, pedir permissão de notificação e salvar a subscription em push_subscriptions
  (web: endpoint+keys; android via Capacitor: fcm_token + platform='android')
- Service Worker (public/sw.js) tratar evento 'push' e mostrar a notificação

TAREFA 3 — API de envio:
Criar src/app/api/notify/route.ts (POST):
- Recebe { user_id, type, title, body, channels: ['push','email'] }
- Envia push (web-push e/ou FCM) para as subscriptions do usuário
- Envia email via Resend se 'email' nos channels
- Registra em notifications_log
- Respeita notification_preferences (não envia se desligado)

TAREFA 4 — Gatilhos automáticos (cron):
Criar src/app/api/cron/lembretes/route.ts (protegido por CRON_SECRET_KEY):
- Lembrete de aula: buscar enrollments/aulas que acontecem nas próximas X horas
  (notification_preferences.horas_antes_aula) e enviar notificação
- Mensalidade: alunos com vencimento em 3 dias ou vencido → notificar
- Reposição: ao aprovar/recusar (Sprint 3), disparar notificação na hora
- Configurar no vercel.json um cron diário chamando essa rota (ou explicar como agendar)

TAREFA 5 — Tela de preferências (aluno):
Criar src/app/aluno/notificacoes/page.tsx:
- Toggles: lembrete de aula, mensalidade, reposição
- Slider/select de "horas antes da aula"
- Salvar em notification_preferences
- Adicionar item no menu lateral do aluno

TAREFA 6 — Botão WhatsApp no admin:
Na gestão de alunos (admin), botão "WhatsApp" que abre
https://wa.me/55<telefone>?text=<mensagem padrão> em nova aba (envio manual gratuito).

TESTE (Claude in Chrome):
1. Login aluno → aceitar permissão de notificação → verificar registro em push_subscriptions
2. Chamar /api/notify manualmente para o aluno → push aparece + log gravado
3. /aluno/notificacoes → desligar um toggle → salvar → não recebe aquele tipo
4. Admin → botão WhatsApp abre wa.me com telefone do aluno
5. npm run build sem erros

Commit: "md02: notificacoes push+email+whatsapp + cron lembretes"
```

---

## ✅ CHECKPOINT MD 02
- [ ] Permissão de push solicitada e salva
- [ ] /api/notify envia push e email e grava log
- [ ] Cron de lembrete de aula e mensalidade configurado
- [ ] Reposição aprovada dispara notificação
- [ ] Tela de preferências do aluno funciona
- [ ] Botão WhatsApp no admin

---

## OBSERVAÇÕES
- Push **nativo no APK** exige Firebase (`google-services.json`). Se não tiver Firebase ainda,
  começar só com push web (PWA) + email, e adicionar FCM quando o APK estiver na loja.
- Resend tem plano gratuito generoso para começar.
- WhatsApp API oficial (Meta) é paga e burocrática — o link `wa.me` resolve no início.
