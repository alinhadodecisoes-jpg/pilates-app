# RELATÓRIO NOITE — EXECUÇÃO AUTÔNOMA FASE 2

> Honestidade total: "implementado, não testado" para itens sem teste real.
> "pronto/funcionando" somente com evidência de teste.

**Data:** 2026-06-09
**Branch:** main (15 commits à frente do origin)
**Ordem executada:** 05 → 06 → 07 → 02 → 03 → 04 → 08 → 01
**Build final:** ✅ LIMPO (sem erros TypeScript, 41 rotas)

---

## MD 05 — ANAMNESE / FICHA DE SAÚDE
**Status:** ✅ Implementado, não testado (depende de SQL)

### Arquivos criados/modificados:
- ✅ `src/app/aluno/ficha-saude/page.tsx` — formulário completo LGPD com seções: dados gerais, objetivo, lesões (dinâmico), cirurgias (dinâmico), condições crônicas (toggles), medicamentos (dinâmico), alergias, restrições físicas, contato emergência, termo de consentimento
- ✅ `src/app/admin/ficha-saude/[userId]/page.tsx` — visualização admin/professor/fisioterapeuta com alertas vermelhos de restrições
- ✅ `src/app/aluno/layout.tsx` — menu atualizado: Ficha de Saúde, Agenda, Financeiro, Notificações adicionados
- ✅ `src/app/admin/alunos/page.tsx` — botão "Ficha" (link) e botão "WhatsApp" adicionados por aluno

### Pendências para funcionar:
- ⏳ SQL: CREATE TABLE `health_records` (ver PENDENCIAS_WILLIAN.md)
- ⏳ Desabilitar RLS na tabela health_records

### Não testado:
- Salvamento real (depende do SQL)
- LGPD consent toggle
- PDF export (não implementado neste MD — anotado para Sprint 4)

---

## MD 06 — AVALIAÇÃO FÍSICA COMPLETA
**Status:** ✅ Implementado, não testado (depende de SQL + Storage)

### Arquivos criados/modificados:
- ✅ `src/app/admin/avaliacoes/nova/page.tsx` — formulário completo: seleção de aluno, data, peso/altura/IMC auto-calculado, % gordura, massa muscular, medidas (busto/cintura/quadril/coxa/braço), upload de fotos (frente/lado/costas → Supabase Storage bucket 'evaluations'), avaliação postural, flexibilidade, força, objetivos, observações
- ✅ `src/app/aluno/evolucao/page.tsx` — reescrito com dados reais: 3 abas (Gráficos/Histórico/Fotos), recharts LineChart para peso/IMC/gordura%/cintura, comparador de fotos com signed URLs
- ✅ `src/app/admin/layout.tsx` — menu Avaliações adicionado

### Pendências para funcionar:
- ⏳ SQL: ALTER TABLE `physical_evaluations_pilates` (colunas novas — ver PENDENCIAS_WILLIAN.md)
- ⏳ Bucket Supabase Storage: `evaluations` (privado) — criar manualmente no dashboard
- ⏳ `recharts` instalado via `npm install recharts --legacy-peer-deps` ✅ (já feito)

### Não testado:
- Upload de fotos (depende do bucket)
- Gráficos de evolução (depende do SQL + dados)
- Comparador de fotos

---

## MD 07 — PRONTUÁRIO DE FISIOTERAPIA (SOAP)
**Status:** ✅ Implementado, não testado (depende de SQL)

### Arquivos criados/modificados:
- ✅ `src/app/fisioterapeuta/layout.tsx` — layout com sidebar verde, menu Pacientes/Dashboard
- ✅ `src/app/fisioterapeuta/dashboard/page.tsx` — redirect para /fisioterapeuta/pacientes
- ✅ `src/app/fisioterapeuta/pacientes/page.tsx` — lista de physio_cases com filtro status (Todos/Ativos/Pausados/Alta), modal "Novo Caso" (aluno, data, queixa, diagnóstico, plano)
- ✅ `src/app/fisioterapeuta/paciente/[caseId]/page.tsx` — prontuário completo: cabeçalho do caso, alertas da ficha de saúde (MD05), timeline SOAP colorida (S=azul/O=verde/A=amarelo/P=roxo), modal "Nova Evolução SOAP" (S/O/A/P + escala de dor 0-10 + técnicas), modal "Dar Alta"
- ✅ `src/hooks/usePilatesAuth.ts` — admin liberado para acessar /fisioterapeuta/* sem redirect

### Pendências para funcionar:
- ⏳ SQL: CREATE TABLE `physio_cases`, `physio_evolutions` (ver PENDENCIAS_WILLIAN.md)
- ⏳ Desabilitar RLS nestas tabelas

### Não testado:
- CRUD de casos e evoluções
- Integração com ficha de saúde (alertas vermelhos)
- Alta do paciente

---

## MD 02 — NOTIFICAÇÕES (Push + Email)
**Status:** ✅ Implementado, não testado (depende de SQL + VAPID + Resend)

### Arquivos criados/modificados:
- ✅ `src/app/api/notify/route.ts` — POST `{user_id, type, title, body, channels}`, verifica notification_preferences, envia push via VAPID e/ou email via Resend, loga em notifications_log
- ✅ `src/app/api/push/subscribe/route.ts` — POST salva subscription (endpoint/p256dh/auth) em push_subscriptions
- ✅ `src/app/api/cron/lembretes/route.ts` — GET protegido por Bearer token; lembretes de aula (check dia_semana + horário) e mensalidade (inadimplentes); config vercel.json cron `"0 8 * * *"`
- ✅ `src/app/aluno/notificacoes/page.tsx` — solicita permissão push, registro no SW, toggles (aula_lembrete/mensalidade/reposicao), select horas_antes_aula, upsert em notification_preferences
- ✅ `public/sw.js` — URL padrão corrigida para /aluno/dashboard, ícone para /images/logo-oficial.jpeg

### Pendências para funcionar:
- ⏳ SQL: CREATE TABLE `push_subscriptions`, `notifications_log`, `notification_preferences` (ver PENDENCIAS_WILLIAN.md)
- ⏳ `.env.local`: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, NEXT_PUBLIC_VAPID_PUBLIC_KEY (gerar com `npx web-push generate-vapid-keys`)
- ⏳ `.env.local`: RESEND_API_KEY (obter em resend.com — já usado no companion-os)
- ⏳ `.env.local`: CRON_SECRET_KEY (definir qualquer string segura)

### Não testado:
- Push notification real (depende das chaves VAPID)
- Email via Resend (depende da chave)
- Cron de lembretes

---

## MD 03 — PAGAMENTO ONLINE (STRIPE)
**Status:** ✅ Implementado, não testado (depende de SQL + chaves Stripe reais)

### Arquivos criados/modificados:
- ✅ `src/app/api/stripe/checkout/route.ts` — POST `{user_id, price_id}`, cria/busca customer Stripe, gera Checkout Session, retorna URL
- ✅ `src/app/api/stripe/portal/route.ts` — POST `{user_id}`, retorna URL do Billing Portal
- ✅ `src/app/api/stripe/webhook/route.ts` — handles: checkout.session.completed, invoice.paid, invoice.payment_failed, customer.subscription.deleted; atualiza subscriptions_pilates + users_pilates.status + payment_history
- ✅ `src/app/aluno/financeiro/page.tsx` — mostra status/plano/valor, botão Checkout (se price_id configurado), botão Portal (se tem subscription_id), histórico de pagamentos, banner de aviso se Stripe não configurado

### Pendências para funcionar:
- ⏳ SQL: CREATE TABLE `plans_pilates`, `subscriptions_pilates` (colunas + FK — ver PENDENCIAS_WILLIAN.md)
- ⏳ `.env.local`: STRIPE_SECRET_KEY (chave real `sk_live_...` ou `sk_test_...` para testes)
- ⏳ `.env.local`: STRIPE_WEBHOOK_SECRET (obter ao criar webhook no dashboard Stripe)
- ⏳ `.env.local`: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (chave pública `pk_live_...` ou `pk_test_...`)
- ⏳ Criar produtos/preços no Stripe Dashboard e copiar price_id para tabela plans_pilates

### Não testado:
- Checkout real
- Webhook (precisa do endpoint exposto: `stripe listen --forward-to localhost:3000/api/stripe/webhook`)
- Status automático de inadimplente

---

## MD 04 — AGENDAMENTO + CALENDÁRIO
**Status:** ✅ Implementado, não testado (depende de SQL)

### Arquivos criados/modificados:
- ✅ `src/app/api/sessions/generate/route.ts` — POST gera class_sessions para próximos 28 dias a partir de classes_pilates (upsert idempotente por class_id+session_date), mapeamento dia_semana DB(1-7) → JS(0-6)
- ✅ `src/app/api/bookings/route.ts` — POST `{action:'book'|'cancel', session_id, user_id}`: book verifica capacidade (booked/waitlist), cancel respeita prazo 4h e promove fila de espera
- ✅ `src/app/admin/agenda/page.tsx` — grade semanal (Seg-Dom) com navegação prev/next, botão "Gerar Agenda do Mês", cards coloridos (cinza=cancelado/vermelho=lotado/verde=disponível), contagem reservados/capacidade
- ✅ `src/app/aluno/agenda/page.tsx` — grade semanal com botões Reservar/Cancelar, status pessoal (✅ Reservado / ⏳ Fila), legenda

### Pendências para funcionar:
- ⏳ SQL: CREATE TABLE `class_sessions`, `bookings` (ver PENDENCIAS_WILLIAN.md)
- ⏳ Desabilitar RLS nestas tabelas

### Não testado:
- Geração de sessões
- Reserva/cancelamento com promoção de fila
- Visualização das sessões no calendário

---

## MD 08 — BACKUP / GOOGLE DRIVE
**Status:** ✅ Implementado, não testado (depende de SQL + Google OAuth)

### Arquivos criados/modificados:
- ✅ `src/app/api/backup/route.ts` — POST `{scope, admin_user_id}`: exporta todas as tabelas principais para JSON, autentica no Google Drive via google_tokens (refresh token flow), cria/encontra pasta "Daimach Backups", faz upload, loga em backup_log; graceful degradation (local_only) se Google não configurado
- ✅ `src/app/admin/backups/page.tsx` — lista backup_log (últimos 20), botão "Fazer Backup Agora", link "Abrir pasta no Drive", painel de política de retenção (24 meses, soft-delete)
- ✅ `src/app/admin/layout.tsx` — menu "Backups" adicionado

### Pendências para funcionar:
- ⏳ SQL: CREATE TABLE `google_tokens`, `backup_log` (ver PENDENCIAS_WILLIAN.md)
- ⏳ `.env.local`: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (criar no Google Cloud Console)
- ⏳ Rota OAuth para Google ainda não implementada (admin precisa conectar conta Google manualmente na primeira vez)
- ⏳ Bucket / pasta Google Drive criada automaticamente pelo código (não precisa criar manualmente)

### Não testado:
- Backup real para Drive
- Autenticação Google (fluxo OAuth para admin não implementado — TODO para Sprint 4)
- Fallback local_only

---

## MD 01 — MOBILE APK (ANDROID / CAPACITOR)
**Status:** ✅ Configurado, APK não gerado (requer Java JDK 17 + Android Studio)

### Arquivos criados/modificados:
- ✅ `capacitor.config.ts` — appId: `br.com.daimach.movement`, appName: `Daimach.Movement`, server.url (produção), SplashScreen (slate-900), PushNotifications, allowNavigation configurados
- ✅ `INSTALAR_APK_CELULAR.md` — guia completo: transferência via USB/WhatsApp/Drive, ativar fontes desconhecidas, instalar, primeiros passos, solução de problemas
- ✅ `PUBLICAR_PLAYSTORE.md` — checklist completo: conta Play Console ($25), keystore (keytool), build AAB, ficha da loja (assets, textos, política de privacidade), configuração de conteúdo, upload e publicação, dicas (Google Play Billing vs Stripe)

### Pendências para gerar o APK:
- ⏳ Java JDK 17: não instalado na máquina (`java: command not found`) — download em adoptium.net
- ⏳ Android Studio: instalar com SDK Android 34+, configurar ANDROID_HOME
- ⏳ Após instalar: `npx cap sync android` → `cd android && .\gradlew.bat bundleRelease`
- ⏳ Firebase: google-services.json (se usar FCM para push nativo no app)
- ⏳ Keystore: gerar com keytool antes de build de release

### Não testado:
- Geração do APK (Java ausente)
- App rodando no celular
- Push notification nativo (Capacitor PushNotifications plugin)

---

## RESUMO EXECUTIVO

| MD | Título | Arquivos | Build | Testado |
|----|--------|----------|-------|---------|
| 05 | Ficha de Saúde | 4 criados/mod | ✅ | ❌ (SQL) |
| 06 | Avaliação Física | 3 criados/mod | ✅ | ❌ (SQL+Storage) |
| 07 | Prontuário SOAP | 5 criados/mod | ✅ | ❌ (SQL) |
| 02 | Notificações Push | 5 criados/mod | ✅ | ❌ (VAPID+SQL) |
| 03 | Pagamento Stripe | 4 criados/mod | ✅ | ❌ (Chaves+SQL) |
| 04 | Agendamento | 4 criados/mod | ✅ | ❌ (SQL) |
| 08 | Backup Drive | 3 criados/mod | ✅ | ❌ (Google+SQL) |
| 01 | APK Android | 3 criados/mod | ✅ | ❌ (Java ausente) |

**Total de arquivos criados/modificados na Fase 2:** ~35 arquivos
**Total de commits:** 15 (incluindo este)
**Build TypeScript:** ✅ SEM ERROS — 41 rotas compiladas
**Funcionalidades Sprint 1-3:** ✅ 100% preservadas

---

## PENDÊNCIAS EXTERNAS (bloqueia testes mas não a implementação)

### SQL para rodar no Supabase (ver PENDENCIAS_WILLIAN.md para código completo):
1. `health_records` — ficha de saúde do aluno
2. `physical_evaluations_pilates` — colunas novas de avaliação física
3. `physio_cases` + `physio_evolutions` — prontuário SOAP
4. `push_subscriptions` + `notifications_log` + `notification_preferences` — notificações
5. `plans_pilates` + `subscriptions_pilates` — colunas Stripe + planos
6. `class_sessions` + `bookings` — agenda e reservas
7. `google_tokens` + `backup_log` — backup Google Drive

### Chaves / serviços externos:
| Serviço | Variável | Como obter |
|---------|----------|------------|
| VAPID | VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, NEXT_PUBLIC_VAPID_PUBLIC_KEY | `npx web-push generate-vapid-keys` |
| Resend | RESEND_API_KEY | resend.com (já no companion-os) |
| Cron | CRON_SECRET_KEY | Qualquer string segura |
| Stripe | STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | dashboard.stripe.com |
| Google | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET | console.cloud.google.com |
| Supabase Storage | bucket `evaluations` (privado) | Supabase Dashboard → Storage |
| Java JDK 17 | — | adoptium.net |
| Android Studio | ANDROID_HOME | developer.android.com/studio |

---

## PRESERVAÇÃO DE FUNCIONALIDADES ✅

- Login (Google OAuth + email/senha): ✅ Preservado
- Role detection (admin/aluno/professor/fisioterapeuta): ✅ Preservado
- Admin dashboard + alunos + turmas + fisioterapia + professores: ✅ Preservado
- Aluno dashboard + minhas-aulas + fisioterapia + reposições: ✅ Preservado
- Professor dashboard: ✅ Preservado
- Sprint 1-3 completo: ✅ Preservado
- Middleware (src/proxy.ts): ✅ Não tocado
- Supabase auth (singleton browser client): ✅ Preservado
- usePilatesAuth hook: ✅ Preservado (apenas liberado /fisioterapeuta/* para admin)
