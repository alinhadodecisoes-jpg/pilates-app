# 💾 MD 08 — BACKUP / MEMÓRIA NO GOOGLE DRIVE (24 MESES)

**Objetivo:** Guardar com segurança, por pelo menos 24 meses, todo o histórico do estúdio:
pagamentos, presenças, avaliações, prontuários, relatórios. Backup automático no Google
Drive (reaproveitando a integração Google que o projeto antigo já tinha) + retenção no banco.

**Reaproveitar do projeto antigo (companion-os):** `/api/google/drive` e `google-tools.ts`
já faziam upload no Google Drive. Reaproveitar.

---

## CONTEXTO TÉCNICO
- O Supabase já guarda os dados (retenção no banco). Este MD garante:
  1. **Retenção:** não apagar registros por 24 meses (política e verificação).
  2. **Backup externo:** export periódico (Excel/JSON/PDF) enviado para uma pasta no Google Drive.
- Drive serve como cópia de segurança fora do banco (à prova de acidente no Supabase).

---

## PASSO 1 — SQL no Supabase (cole e RUN)

```sql
-- Registro dos backups feitos
CREATE TABLE IF NOT EXISTS backup_log (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  backup_date TIMESTAMP DEFAULT NOW(),
  scope TEXT,                 -- 'full' | 'financeiro' | 'avaliacoes' | 'prontuarios'
  drive_file_id TEXT,         -- id do arquivo no Google Drive
  drive_url TEXT,
  rows_count INT,
  status TEXT DEFAULT 'success',
  notes TEXT
);

ALTER TABLE backup_log DISABLE ROW LEVEL SECURITY;
```

> **Retenção:** NÃO usar DELETE em tabelas de histórico (payment_history, attendances,
> physio_evolutions, physical_evaluations). Para "remover" um aluno, usar status='inativo'
> em vez de apagar — preserva o histórico por 24 meses.

---

## PASSO 2 — COMANDO PARA O CLAUDE CODE

```
MD 08 — BACKUP / MEMÓRIA NO GOOGLE DRIVE (24 MESES)

Projeto: C:\Users\willa\pilates-app
Projeto antigo (reaproveitar): C:\Users\willa\companion-os
Autorização total. PRESERVE o que já funciona.

CONTEXTO: Tabela backup_log. Reaproveitar /api/google/drive e google-tools.ts do companion-os.
Política: nunca apagar histórico; "remover" aluno = status inativo.

TAREFA 1 — Reaproveitar Google Drive:
- Copiar do companion-os: google-tools.ts (parte do Drive) e /api/google/drive
- Adaptar paths para pilates-app
- Garantir credenciais Google no .env (reaproveitar do MD04; me avise se faltar)

TAREFA 2 — Geração de backup:
Criar src/app/api/backup/route.ts (POST, protegido por CRON_SECRET_KEY):
- scope 'full': exportar todas as tabelas principais (users, payments, attendances,
  evaluations, physio_cases, physio_evolutions, classes, bookings) para um arquivo
  (JSON e/ou Excel via xlsx do Sprint 4)
- Fazer upload do arquivo numa pasta "Daimach Backups" no Google Drive
- Registrar em backup_log (drive_file_id, drive_url, rows_count)

TAREFA 3 — Backup automático (cron):
- Configurar cron semanal (vercel.json) chamando /api/backup com scope 'full'
- Manter os últimos backups; nomear arquivos com a data (ex: daimach_backup_2026-06-09.xlsx)

TAREFA 4 — Painel de backups (admin):
Criar src/app/admin/backups/page.tsx:
- Listar backup_log (data, escopo, link do Drive, status)
- Botão "Fazer backup agora" (chama /api/backup)
- Botão "Abrir pasta no Drive"
- Adicionar "Backups" no menu admin

TAREFA 5 — Política de retenção:
- Revisar o código: garantir que exclusões de aluno usam status='inativo' (não DELETE)
- Onde houver DELETE de histórico, trocar por soft-delete/inativação
- Documentar em RETENCAO_DADOS.md a política de 24 meses

TESTE (Claude in Chrome):
1. Admin → /admin/backups → "Fazer backup agora" → arquivo sobe no Drive + log gravado
2. Link do Drive abre o arquivo de backup
3. Verificar que "deletar aluno" agora inativa (não some o histórico)
4. npm run build sem erros

Commit: "md08: backup google drive + retencao 24 meses"
```

---

## ✅ CHECKPOINT MD 08
- [ ] Google Drive reaproveitado e conectado
- [ ] Backup full gera arquivo e sobe no Drive
- [ ] backup_log registra cada backup
- [ ] Cron semanal de backup configurado
- [ ] Painel de backups no admin
- [ ] Política de retenção (soft-delete) aplicada e documentada

---

## OBSERVAÇÕES
- O backup no Drive é a "memória de 24 meses" fora do banco — protege contra perda no Supabase.
- Dados clínicos/financeiros no backup também são sensíveis: a pasta do Drive deve ser privada
  (conta do estúdio), nunca pública.
- Alternativa/futuro: backup também para o Supabase Storage ou export agendado por email.
