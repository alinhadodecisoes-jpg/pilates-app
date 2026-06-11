# RELATÓRIO — DEPLOY VERCEL + APK FINAL
**Data:** 2026-06-10

## Deploy Vercel ✅
- **Projeto:** `arkomachs-projects/daimach-pilates` (mesma conta do ARKO)
- **URL produção:** **https://daimach-pilates.vercel.app**
- **Status:** ✅ Online / READY
- **GitHub conectado:** `alinhadodecisoes-jpg/pilates-app`
- **Build:** passou (0 erros) — Next.js detectado automaticamente

### Testes em produção (verificados via HTTP)
- `GET /login` → **HTTP 200** (tela de login carrega)
- `GET /api/pilates/turmas` → **7 turmas** (Supabase service role funcionando em prod)
- `GET /api/pilates/stats` → `{total_alunos:75, turmas_ativas:7, inadimplentes:0}` (dados reais)

## Variáveis de ambiente (produção) ✅
Configuradas via `vercel env add` (valores lidos do `.env.local`, nomes abaixo):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`,
`RESEND_API_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET_KEY`,
`GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_SITE_URL` (= URL de produção).

> Obs: variáveis só de Production. Para deploys de branch (Preview) e `vercel dev`,
> replicar em Preview/Development quando necessário.

## APK Final ✅
- **Arquivo:** `C:\Users\willa\Downloads\daimach-pilates-FINAL.apk` (5,6 MB)
- **URL embutida (config nativo):** `https://daimach-pilates.vercel.app` ✅ (confirmado)
- **appId:** `br.com.daimach.movement`
- **Build:** Gradle 9.2.1 + JDK 21 (JBR), BUILD SUCCESSFUL

## Celulares
- Nenhum conectado via USB (`adb devices` vazio) → instalação manual.
- **Celular 1 (cabo):** `adb install -r C:\Users\willa\Downloads\daimach-pilates-FINAL.apk`
- **Celular 2 (sem cabo):** enviar o `.apk` por WhatsApp/Drive e instalar (permitir "fonte desconhecida").

## Segurança / housekeeping
- Confirmado: nenhum segredo real nos arquivos versionados (os matches eram placeholders truncados).
- `.gitignore` reforçado para nunca commitar os scripts de teste (`check-*.js`, `test-db*.js`, etc.) que contêm a service role key.
- `.env.local` ignorado (`.env*`).

## Próximos passos sugeridos
1. **Domínio próprio** (ex.: `pilates.daimach.com.br`) apontando para o projeto Vercel → depois rebuild do APK com esse domínio.
2. **Segurança/RLS** (`APP_PILATES_SEGURANCA_MAXIMA`) — decisão de arquitetura pendente (service role vs sessão autenticada). ⚠️ Rotacionar chaves Stripe que foram usadas em dev.
3. **Site premium** (`SITE_DAIMACH_PREMIUM_E_SEGURANCA`) — localizar pasta do site.
4. Rodar `SQL_MIGRACOES_PENDENTES.sql` para habilitar status de pagamento pendente + paciente só-fisio.

## Status
✅ App no ar em https://daimach-pilates.vercel.app + APK final apontando para essa URL.
