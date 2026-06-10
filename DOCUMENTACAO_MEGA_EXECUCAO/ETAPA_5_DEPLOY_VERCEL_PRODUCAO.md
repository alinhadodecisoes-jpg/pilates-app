# 🚀 ETAPA 5 — DEPLOY VERCEL PRODUÇÃO
**Objetivo:** Fazer deploy do Pilates App em produção (vercel.app)  
**Tempo estimado:** 30-45 minutos  
**Bloqueador:** Conta Vercel + GitHub  

---

## ✅ PRÉ-REQUISITOS

- [ ] Conta Vercel criada (vercel.com)
- [ ] Projeto GitHub publicado (alinhadodecisoes-jpg/pilates-app)
- [ ] Todas as chaves configuradas no .env.local

---

## 🎯 ETAPA 5.1 — PREPARAR PROJETO PARA DEPLOY

### Validar build local

```powershell
cd C:\Users\willa\pilates-app
npm run build
```

**Esperado:** Build passa em < 2 minutos, zero erros TypeScript

### Validar arquivos essenciais

```powershell
# Verificar .env.local existe (NÃO será enviado ao Vercel)
if (Test-Path .env.local) { Write-Host "✅ .env.local existe" }

# Verificar .env.example existe (para documentação)
if (Test-Path .env.example) { Write-Host "✅ .env.example existe" }

# Verificar .gitignore existe
if (Test-Path .gitignore) { Write-Host "✅ .gitignore existe" }
```

---

## 🎯 ETAPA 5.2 — CRIAR .env.example

Criar: `C:\Users\willa\pilates-app\.env.example`

```env
# Supabase
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Resend
RESEND_API_KEY=re_...

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# VAPID (Notificações Push)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BDx...
VAPID_PRIVATE_KEY=xxx...

# Cron
CRON_SECRET_KEY=...
```

**Nota:** Este arquivo VAI pro GitHub (é template). Não cole valores reais.

---

## 🎯 ETAPA 5.3 — CONFIGURAR VERCEL

### 1. Login no Vercel

```
Ir para: https://vercel.com
Login com GitHub
```

### 2. Criar novo projeto

```
"Add New..." → "Project"
Selecionar repositório: alinhadodecisoes-jpg/pilates-app
Clicar: "Import"
```

### 3. Framework Detection

Vercel deve detectar automaticamente:
```
Framework: Next.js ✅
Build Command: npm run build ✅
Output Directory: .next ✅
```

### 4. Environment Variables

Adicionar todas as 12 chaves:

```
SUPABASE_URL = https://qgqzbfyvhhnptmfgjpnd.supabase.co
SUPABASE_ANON_KEY = [cole aqui]
SUPABASE_SERVICE_ROLE_KEY = [cole aqui]
STRIPE_SECRET_KEY = [cole aqui]
STRIPE_WEBHOOK_SECRET = [cole aqui]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = [cole aqui]
RESEND_API_KEY = [cole aqui]
GOOGLE_CLIENT_ID = [cole aqui]
GOOGLE_CLIENT_SECRET = [cole aqui]
NEXT_PUBLIC_VAPID_PUBLIC_KEY = [cole aqui]
VAPID_PRIVATE_KEY = [cole aqui]
CRON_SECRET_KEY = [cole aqui]
```

**Importante:** `NEXT_PUBLIC_*` são públicas, as outras são secretas.

### 5. Deploy

```
Clicar: "Deploy"
Aguardar (2-5 minutos)
```

**Esperado:** Status muda para "Ready"

---

## 🎯 ETAPA 5.4 — VALIDAR DEPLOY

### Acessar app

```
Vai para a URL do Vercel (algo como: https://pilates-app-xyz.vercel.app)
```

### Testes rápidos

- [ ] Página carrega (não é erro 500)
- [ ] Login funciona (Google OAuth)
- [ ] Admin consegue logar
- [ ] Painel carrega dados do Supabase
- [ ] Botões navegam corretamente

---

## 🎯 ETAPA 5.5 — CONFIGURAR DOMÍNIO (Opcional)

Se quiser usar `pilates.daimach.com.br`:

### 1. No Vercel

```
Project → Settings → Domains
Clicar: "Add"
Digite: pilates.daimach.com.br
```

### 2. Na Registradora de Domínio (GoDaddy, RegistroBR, etc)

```
Adicionar registro CNAME:
  Nome: pilates
  Valor: cname.vercel-dns.com
```

**Aguardar:** 10-60 minutos para propagar

---

## 🎯 ETAPA 5.6 — CONFIGURAR WEBHOOK STRIPE (Importante!)

O Stripe precisa saber para onde enviar notificações de pagamento.

### 1. No Stripe Dashboard

```
Desenvolvedores → Webhooks
Clicar: "Adicionar endpoint"
URL: https://seu-domain.vercel.app/api/stripe/webhook
  (ou https://pilates-app-xyz.vercel.app/api/stripe/webhook)
```

### 2. Selecionar eventos

```
✅ payment_intent.succeeded
✅ payment_intent.payment_failed
✅ customer.subscription.created
✅ customer.subscription.deleted
```

### 3. Copiar token

```
Clicar: "Revelar"
Copiar: whsec_...
Adicionar ao Vercel Environment Variables: STRIPE_WEBHOOK_SECRET
```

---

## 🎯 ETAPA 5.7 — ATIVAR PRODUCTION BUILD

Para otimizar (mais rápido em produção):

```
Vercel Console → Settings → Build Cache
Desabilitar "Caching" temporariamente se houver problemas
```

---

## 📝 CHECKLIST ETAPA 5

- [ ] Build local passa
- [ ] .env.example criado
- [ ] Vercel project importado do GitHub
- [ ] 12 environment variables configuradas
- [ ] Deploy realizado com sucesso
- [ ] URL do Vercel acessível
- [ ] Login funciona
- [ ] Dados do Supabase carregam
- [ ] Webhook Stripe configurado
- [ ] Domínio (opcional) aponta para Vercel
- [ ] Relatório atualizado

---

## 🚨 POSSÍVEIS ERROS

| Erro | Solução |
|------|---------|
| `Build failed` | Verificar logs no Vercel (pode faltar chave env) |
| `500 error ao abrir` | Chave Supabase inválida ou não configurada |
| `Login não funciona` | Google OAuth secret errada, ou redirect URI não configurada |
| `Stripe webhook não recebe` | URL do webhook incorreta ou event type não marcado |

---

## ✅ RESULTADO FINAL

Quando terminar:

✅ App deployado em vercel.app  
✅ URL pública funcional  
✅ Todas as features testadas em produção  
✅ Webhook Stripe configurado  

---

## 🎯 PRÓXIMO PASSO (Quando Terminar)

Avise:
```
✅ ETAPA 5 CONCLUÍDA
URL de produção: https://...
Login funciona?
Dados carregam do Supabase?
```

Aí sigo pra **ETAPA 6 — PREPARAÇÃO BETA 50 USUÁRIOS**.

---

> **Data estimada:** Hoje à noite  
> **Status:** Aguardando execução  
> **Dependência:** Conta Vercel + GitHub
