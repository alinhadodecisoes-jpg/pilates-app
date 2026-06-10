-- ============================================================
-- MIGRAÇÕES PENDENTES — rodar no Supabase (SQL Editor)
-- Não foi possível rodar daqui (sem connection string direta do Postgres).
-- ============================================================

-- ------------------------------------------------------------
-- 1) STATUS DE PAGAMENTO + VENCIMENTO POR ALUNO
--    Permite: novo aluno entra como "pendente"; admin define se pagou
--    adiantado e qual o dia/próximo vencimento.
-- ------------------------------------------------------------
ALTER TABLE users_pilates
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pendente',  -- pendente | em_dia | atrasado
  ADD COLUMN IF NOT EXISTS due_day integer,                         -- dia do mês de vencimento (1-28)
  ADD COLUMN IF NOT EXISTS next_due_date date;                      -- próximo vencimento

-- Aluno novo já nasce pendente até o admin confirmar pagamento:
ALTER TABLE users_pilates ALTER COLUMN payment_status SET DEFAULT 'pendente';

-- ------------------------------------------------------------
-- 2) (OPCIONAL) USUÁRIO QUE NÃO É ALUNO DE PILATES
--    Para quem faz só fisioterapia, ou ambos.
--    Já existem roles 'fisioterapeuta' e 'prof_fisio'; para PACIENTE
--    de fisioterapia que não é aluno, marcamos com uma flag:
-- ------------------------------------------------------------
ALTER TABLE users_pilates
  ADD COLUMN IF NOT EXISTS is_physio_patient boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_pilates_student boolean DEFAULT true;

-- ============================================================
-- DEPOIS DE RODAR: avisar para o app passar a usar payment_status.
-- (O código já está preparado para ler essas colunas quando existirem.)
-- ============================================================
