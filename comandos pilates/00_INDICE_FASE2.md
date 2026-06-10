# 🗂️ FASE 2 — ÍNDICE GERAL (DAIMACH.MOVEMENT)

> Estes arquivos são a continuação da `LINHA_DE_PRODUCAO_DAIMACH.md` (Fase 1).
> **Só comece a Fase 2 depois que os 4 sprints da Fase 1 estiverem ✅.**

**Projeto:** `C:\Users\willa\pilates-app`
**Supabase:** `https://app.supabase.com/project/qgqzbfyvhhnptmfgjpnd`

## Reaproveitamento do projeto antigo (ARKO / companion-os)
O projeto antigo em `C:\Users\willa\companion-os` JÁ TINHA implementado e funcionando:
- **Stripe**: `/api/stripe/checkout`, `/api/stripe/portal`, `/api/stripe/webhook` + `src/lib/stripe.ts`
- **Google**: OAuth, Calendar (create/update/delete/sync event), Gmail, Drive, Contacts
- **Resend** (envio de email) + **web-push** (VAPID, notificações)
- Variáveis já existentes no `.env.local` antigo:
  `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
  `RESEND_API_KEY`, `GOOGLE_*` (client id/secret/callback)

➡️ **Regra:** copiar esses arquivos/chaves do projeto antigo e adaptar para o contexto
pilates, em vez de criar do zero. Cada MD abaixo indica exatamente o que copiar.

## Ordem de execução recomendada (linha de produção)

| Ordem | Arquivo | Por quê nessa ordem |
|-------|---------|---------------------|
| 1 | `01_MOBILE_APK_PLAYSTORE.md` | Sem app no celular, nada é "real" pro aluno |
| 2 | `02_NOTIFICACOES.md` | Retenção: lembrete de aula e mensalidade |
| 3 | `03_PAGAMENTO_ONLINE.md` | Parar de cobrar por fora (reusa Stripe antigo) |
| 4 | `04_AGENDAMENTO_CALENDARIO.md` | Calendário + reserva + Google Calendar (reusa) |
| 5 | `05_ANAMNESE_FICHA_SAUDE.md` | Segurança do aluno; base pra fisio |
| 6 | `06_AVALIACAO_FISICA_COMPLETA.md` | Evolução com fotos, medidas, gráficos |
| 7 | `07_PRONTUARIO_FISIOTERAPIA.md` | Prontuário clínico por sessão |
| 8 | `08_BACKUP_MEMORIA_DRIVE_24MESES.md` | Guardar tudo 24 meses (reusa Google Drive) |

## Como usar cada MD
1. Salve todos em `C:\Users\willa\pilates-app\fase2\`
2. Execute UM por vez no Claude Code.
3. Cada MD tem: SQL (você roda no Supabase) → comando pro Claude Code → checkpoint de teste.
4. Só avance pro próximo quando o atual passar no checkpoint.

## Regras globais (valem pra todos)
- `npm run build` antes de cada teste.
- Testar em aba anônima.
- Erro 406/409 em tabela nova → `ALTER TABLE x DISABLE ROW LEVEL SECURITY;`
- `day_of_week`: 1=Seg ... 7=Dom.
- Logo para PDFs/telas: `public/images/logo-daimach-oficial.jpeg`
- PRESERVAR tudo que já funciona.
