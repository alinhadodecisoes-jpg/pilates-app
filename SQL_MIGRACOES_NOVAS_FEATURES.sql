-- ============================================================
-- MIGRAÇÕES NOVAS FEATURES — 12/06/2026
-- Executar no Supabase SQL Editor
-- ============================================================

-- 1. Adiciona coluna "notes" na tabela classes_pilates
--    (usado pelo professor para observações da turma)
ALTER TABLE classes_pilates
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Adiciona colunas de cancelamento na tabela class_sessions
--    (usado quando professor cancela uma aula específica)
ALTER TABLE class_sessions
  ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Unique constraint para class_sessions (class_id + session_date)
--    necessário para o UPSERT funcionar ao cancelar aulas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'class_sessions_class_id_session_date_key'
  ) THEN
    ALTER TABLE class_sessions
      ADD CONSTRAINT class_sessions_class_id_session_date_key
      UNIQUE (class_id, session_date);
  END IF;
END $$;

-- ============================================================
-- FIM — 3 operações, todas idempotentes (IF NOT EXISTS)
-- ============================================================
