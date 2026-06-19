-- ============================================================
-- SQL OPCIONAL — melhorias de banco descobertas no teste completo (19/06/2026)
-- O APP JÁ FUNCIONA SEM ESTES SQLs (o código foi ajustado para não depender deles).
-- Execute apenas se quiser dados mais ricos / upserts nativos.
-- ============================================================

-- 1) payment_history: colunas usadas pelo código antigo (reference_month, notes)
--    Hoje removidas do código. Se readicionar, o mês de referência e notas voltam a ser gravados.
ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS reference_month TEXT;
ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2) Constraints únicas para permitir upsert nativo (hoje usamos check-then-insert)
ALTER TABLE reposition_requests
  ADD CONSTRAINT uq_repreq_user_slot UNIQUE (user_id, slot_id);

-- 3) attendances_pilates: permitir reposição sem turma fixa (class_id NULL)
--    Hoje gravamos a reposição com o class_id do slot. Se preferir NULL, rode:
-- ALTER TABLE attendances_pilates ALTER COLUMN class_id DROP NOT NULL;

-- 4) health_records: precisão de altura/peso (evita overflow em valores extremos)
ALTER TABLE health_records
  ALTER COLUMN height_cm TYPE NUMERIC(6,2),
  ALTER COLUMN weight_kg TYPE NUMERIC(6,2);
