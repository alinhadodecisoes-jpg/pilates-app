-- ============================================================
-- SQL dos blocos que dependem de novas tabelas (rodar no Supabase SQL Editor)
-- ============================================================

-- ------------------------------------------------------------
-- BLOCO 7/8 — Configurações do estúdio + PIX
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
-- BLOCO 7 — Pedidos de confirmação de pagamento (aluno marca "já paguei")
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_confirmations (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC,
  reference_month TEXT,
  informed_at TIMESTAMP DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending', -- pending | confirmed | rejected
  reviewed_by UUID,
  reviewed_at TIMESTAMP,
  notes TEXT
);
ALTER TABLE payment_confirmations DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_payconf_status ON payment_confirmations(status);

-- ------------------------------------------------------------
-- BLOCO 2.2 — Pagamentos do professor (se ainda não existir)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teacher_payments (
  id SERIAL PRIMARY KEY,
  teacher_id UUID NOT NULL,
  month TEXT NOT NULL,           -- 'YYYY-MM'
  total_classes INTEGER DEFAULT 0,
  rate_per_class NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pendente', -- pendente | pago
  created_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE teacher_payments DISABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- BLOCO 3.2 — Gerar grade de turmas (Seg-Sáb, 07:00-21:00) = 90 turmas
-- (professor_id fica NULL; atribua depois no admin)
-- ------------------------------------------------------------
INSERT INTO classes_pilates (name, day_of_week, time_start, time_end, capacity, is_active)
SELECT
  'Pilates ' || dia_nome || ' ' || to_char(hora_start, 'HH24:MI'),
  dia_num,
  hora_start,
  hora_start + INTERVAL '1 hour',
  4,
  TRUE
FROM (
  SELECT unnest(ARRAY[1,2,3,4,5,6]) AS dia_num,
         unnest(ARRAY['Seg','Ter','Qua','Qui','Sex','Sáb']) AS dia_nome
) dias
CROSS JOIN (
  SELECT generate_series('07:00'::time, '21:00'::time, '1 hour'::interval) AS hora_start
) horarios
ON CONFLICT DO NOTHING;
