-- ============================================================
-- SQL dos blocos pendentes — VERSÃO CORRIGIDA (rodar tudo no Supabase SQL Editor)
-- É idempotente: pode rodar mais de uma vez sem problema.
-- ============================================================

-- ------------------------------------------------------------
-- 1) BLOCO 7/8 — Configurações do estúdio + PIX
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS studio_config (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE studio_config DISABLE ROW LEVEL SECURITY;

INSERT INTO studio_config (key, value) VALUES
  ('pix_key', ''),
  ('pix_name', 'Daiana Alves da Silva'),
  ('payment_deadline_days', '5'),
  ('studio_name', 'Daimach Movement'),
  ('studio_whatsapp', '5521763000055'),
  ('studio_instagram', '@daimach.movement'),
  ('studio_email', 'Daimach.movement@gmail.com')
ON CONFLICT (key) DO NOTHING;

-- ------------------------------------------------------------
-- 2) BLOCO 7 — Confirmações de pagamento (aluno marca "já paguei")
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_confirmations (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC,
  reference_month TEXT,
  informed_at TIMESTAMP DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMP,
  notes TEXT
);
ALTER TABLE payment_confirmations DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_payconf_status ON payment_confirmations(status);

-- ------------------------------------------------------------
-- 3) BLOCO 2.2 — Pagamentos do professor
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teacher_payments (
  id SERIAL PRIMARY KEY,
  teacher_id UUID NOT NULL,
  month TEXT NOT NULL,
  total_classes INTEGER DEFAULT 0,
  rate_per_class NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pendente',
  created_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE teacher_payments DISABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 4) BLOCO 3.2 — Gerar grade de turmas (Seg–Sáb, 07:00–21:00 = 90 turmas)
--    CORREÇÃO 1: professor_id é NOT NULL -> permitir NULL (atribuir depois)
--    CORREÇÃO 2: generate_series não aceita 'time'; usa inteiros + make_time
-- ------------------------------------------------------------
ALTER TABLE classes_pilates ALTER COLUMN professor_id DROP NOT NULL;

INSERT INTO classes_pilates (name, day_of_week, time_start, time_end, capacity, is_active)
SELECT
  'Pilates ' || dia_nome || ' ' || lpad(h::text, 2, '0') || ':00',
  dia_num,
  make_time(h, 0, 0),
  make_time(h + 1, 0, 0),
  4,
  TRUE
FROM (
  SELECT unnest(ARRAY[1,2,3,4,5,6]) AS dia_num,
         unnest(ARRAY['Seg','Ter','Qua','Qui','Sex','Sáb']) AS dia_nome
) dias
CROSS JOIN generate_series(7, 21) AS h
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 5) Recarregar o cache do PostgREST (resolve PGRST205 "table not found")
-- ------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
