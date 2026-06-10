# 💳 MD 03 — PAGAMENTO ONLINE DE VERDADE

**Objetivo:** O aluno paga a mensalidade pelo próprio app (cartão recorrente e/ou Pix),
sem o admin precisar dar baixa manual. Assinatura mensal automática.

**Reaproveitar do projeto antigo (companion-os):** já tinha Stripe completo —
`/api/stripe/checkout`, `/api/stripe/portal`, `/api/stripe/webhook` e `src/lib/stripe.ts`.
Variáveis já existiam: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
`STRIPE_WEBHOOK_SECRET`. Pacotes: `stripe@^20`, `@stripe/stripe-js@^8`.

---

## DECISÃO DE GATEWAY
- **Stripe** (já temos as chaves e o código) → ótimo para cartão recorrente.
  Stripe agora suporta **Pix** no Brasil também.
- Alternativa brasileira: **Asaas/Mercado Pago** (Pix nativo, boleto). Mais comum em academia.
- **Recomendação:** começar com Stripe (reaproveita tudo) para cartão. Avaliar Asaas depois
  se quiser boleto/Pix mais barato. Este MD foca em Stripe.

> ⚠️ Lembrete do projeto: a regra "sem bancos" do ARKO era para o assistente de IA.
> Aqui é um app de gestão de estúdio — cobrança de mensalidade via gateway é normal e esperado.

---

## PASSO 1 — Stripe Dashboard (você faz, fora do código)
1. Entrar em https://dashboard.stripe.com (conta já existe: willian@daimach.com.br)
2. Criar **Produtos/Preços recorrentes** correspondentes aos planos:
   - Plano 2x/Semana — R$199/mês → copiar o `price_id`
   - Plano Livre — R$299/mês → `price_id`
   - Plano Particular — R$450/mês → `price_id`
3. Pegar as chaves (test e live): `pk_...`, `sk_...`
4. Configurar webhook endpoint (depois do deploy): `https://<seu-dominio>/api/stripe/webhook`
   e copiar o `whsec_...`

---

## PASSO 2 — SQL no Supabase (cole e RUN)

```sql
-- Vincular plano ao price_id do Stripe
ALTER TABLE plans_pilates ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- subscriptions_pilates já existe. Garantir colunas:
ALTER TABLE subscriptions_pilates ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE subscriptions_pilates ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE subscriptions_pilates ADD COLUMN IF NOT EXISTS current_period_end DATE;

-- Atualizar os price_id (troque pelos reais do Stripe)
-- UPDATE plans_pilates SET stripe_price_id='price_xxx' WHERE name='Plano 2x/Semana';
-- UPDATE plans_pilates SET stripe_price_id='price_yyy' WHERE name='Plano Livre';
-- UPDATE plans_pilates SET stripe_price_id='price_zzz' WHERE name='Plano Particular';

ALTER TABLE subscriptions_pilates DISABLE ROW LEVEL SECURITY;
```

---

## PASSO 3 — COMANDO PARA O CLAUDE CODE

```
MD 03 — PAGAMENTO ONLINE COM STRIPE

Projeto: C:\Users\willa\pilates-app
Projeto antigo (reaproveitar): C:\Users\willa\companion-os
Autorização total. PRESERVE o que já funciona.

CONTEXTO: Reaproveitar Stripe do companion-os. plans_pilates tem stripe_price_id.
subscriptions_pilates guarda a assinatura. Instalar se faltar:
npm install stripe @stripe/stripe-js --legacy-peer-deps

TAREFA 1 — Copiar e adaptar base Stripe do projeto antigo:
- Copiar src/lib/stripe.ts do companion-os
- Copiar src/app/api/stripe/checkout/route.ts
- Copiar src/app/api/stripe/portal/route.ts
- Copiar src/app/api/stripe/webhook/route.ts
- Adaptar para o contexto pilates (usar plans_pilates, subscriptions_pilates, users_pilates)
- Pedir ao usuário para copiar STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET do .env.local antigo (me avise quais faltam)

TAREFA 2 — Checkout (aluno assina):
- Em /aluno/financeiro adicionar botão "Assinar / Pagar mensalidade"
- Chama /api/stripe/checkout com o stripe_price_id do plano do aluno
- Cria checkout session (mode subscription) e redireciona para o Stripe Checkout
- Suportar Pix além de cartão se a conta Stripe tiver Pix habilitado

TAREFA 3 — Webhook (atualiza status automático):
- /api/stripe/webhook trata eventos:
  checkout.session.completed → cria/atualiza subscriptions_pilates, marca users_pilates.status='ativo'
  invoice.paid → INSERT payment_history (status='paid', reference_month) automático
  invoice.payment_failed → users_pilates.status='inadimplente' + dispara notificação (MD02)
  customer.subscription.deleted → status='inativo'
- Validar assinatura do webhook com STRIPE_WEBHOOK_SECRET

TAREFA 4 — Portal (aluno gerencia):
- Botão "Gerenciar assinatura" em /aluno/financeiro → /api/stripe/portal
- Abre o Stripe Customer Portal (trocar cartão, cancelar, ver faturas)

TAREFA 5 — Admin vê assinaturas:
- Em /admin/financeiro, coluna "Assinatura" mostrando status real (active/past_due/canceled)
  vindo de subscriptions_pilates
- O "dar baixa manual" continua existindo para quem paga por fora (dinheiro/Pix manual)

TESTE (modo TEST do Stripe — cartão 4242 4242 4242 4242):
1. Login aluno → /aluno/financeiro → Assinar → completa checkout teste
2. Webhook recebe checkout.session.completed → status do aluno vira 'ativo' + payment_history gravado
3. Stripe portal abre e mostra a assinatura
4. Admin vê a assinatura ativa no financeiro
5. npm run build sem erros

Commit: "md03: pagamento online stripe (checkout+webhook+portal)"
```

---

## ✅ CHECKPOINT MD 03
- [ ] Produtos/preços criados no Stripe e price_id no banco
- [ ] Aluno assina via checkout (modo teste)
- [ ] Webhook atualiza status e grava payment_history sozinho
- [ ] Portal de gestão de assinatura funciona
- [ ] Admin vê status real das assinaturas
- [ ] "Dar baixa manual" preservado para pagamento por fora

---

## OBSERVAÇÕES
- Comece em **modo TEST** (chaves `pk_test`/`sk_test`, cartão 4242...). Só vá pra LIVE quando validar.
- O webhook só funciona com a URL pública (deploy na Vercel). Em local, usar `stripe listen` (CLI).
- Pix no Stripe Brasil: confirmar habilitação na conta. Se não tiver, considerar Asaas num MD futuro.
- Taxas do gateway são descontadas — refletir isso no relatório financeiro depois.
