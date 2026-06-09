-- =========================================================
-- PILATES APP — Novas Tabelas (Sprint 2)
-- Execute em: https://app.supabase.com/project/qgqzbfyvhhnptmfgjpnd/editor
-- =========================================================

-- 1. DESABILITAR RLS (elimina 406/42P17)
ALTER TABLE users_pilates              DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes_pilates            DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments_pilates        DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendances_pilates        DISABLE ROW LEVEL SECURITY;
ALTER TABLE plans_pilates              DISABLE ROW LEVEL SECURITY;
ALTER TABLE physical_evaluations_pilates DISABLE ROW LEVEL SECURITY;

-- Remover policies com recursão
DROP POLICY IF EXISTS "Users can view own profile"   ON users_pilates;
DROP POLICY IF EXISTS "Users can update own profile" ON users_pilates;
DROP POLICY IF EXISTS "Users can insert own profile" ON users_pilates;
DROP POLICY IF EXISTS "Allow all"                    ON users_pilates;

-- 2. HISTÓRICO DE PAGAMENTOS
CREATE TABLE IF NOT EXISTS payment_history (
  id               BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id          UUID NOT NULL REFERENCES users_pilates(id) ON DELETE CASCADE,
  plan_id          BIGINT REFERENCES plans_pilates(id),
  amount           DECIMAL(10,2) NOT NULL,
  payment_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method   TEXT CHECK (payment_method IN ('pix','credit_card','bank_transfer','cash')),
  status           TEXT CHECK (status IN ('paid','pending','overdue','canceled')) DEFAULT 'pending',
  stripe_payment_id TEXT UNIQUE,
  invoice_number   TEXT UNIQUE,
  notes            TEXT,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

ALTER TABLE payment_history DISABLE ROW LEVEL SECURITY;

-- 3. PROMOÇÕES
CREATE TABLE IF NOT EXISTS promotions (
  id               BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code             TEXT UNIQUE NOT NULL,
  description      TEXT,
  discount_percent DECIMAL(5,2),
  discount_fixed   DECIMAL(10,2),
  valid_from       DATE NOT NULL,
  valid_until      DATE NOT NULL,
  max_uses         INT,
  current_uses     INT DEFAULT 0,
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMP DEFAULT NOW()
);

ALTER TABLE promotions DISABLE ROW LEVEL SECURITY;

-- 4. PROMOÇÕES USADAS POR ALUNOS
CREATE TABLE IF NOT EXISTS user_promotions (
  id              BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id         UUID NOT NULL REFERENCES users_pilates(id) ON DELETE CASCADE,
  promotion_id    BIGINT NOT NULL REFERENCES promotions(id),
  used_date       DATE DEFAULT CURRENT_DATE,
  discount_amount DECIMAL(10,2),
  created_at      TIMESTAMP DEFAULT NOW()
);

ALTER TABLE user_promotions DISABLE ROW LEVEL SECURITY;

-- 5. PAGAMENTOS DE PROFESSORES
CREATE TABLE IF NOT EXISTS teacher_payments (
  id           BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  teacher_id   UUID NOT NULL REFERENCES users_pilates(id) ON DELETE CASCADE,
  month        DATE NOT NULL,
  total_classes INT,
  rate_per_class DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  payment_date DATE,
  status       TEXT CHECK (status IN ('pending','paid','overdue')) DEFAULT 'pending',
  notes        TEXT,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE(teacher_id, month)
);

ALTER TABLE teacher_payments DISABLE ROW LEVEL SECURITY;

-- 6. SESSÕES DE FISIOTERAPIA
CREATE TABLE IF NOT EXISTS physical_therapy_sessions (
  id               BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id          UUID NOT NULL REFERENCES users_pilates(id) ON DELETE CASCADE,
  therapist_id     UUID REFERENCES users_pilates(id),
  session_date     TIMESTAMP NOT NULL,
  duration_minutes INT DEFAULT 60,
  therapy_type     TEXT NOT NULL,
  notes            TEXT,
  cost             DECIMAL(10,2),
  status           TEXT CHECK (status IN ('scheduled','completed','canceled')) DEFAULT 'scheduled',
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

ALTER TABLE physical_therapy_sessions DISABLE ROW LEVEL SECURITY;

-- 7. RESUMO FINANCEIRO POR ALUNO
CREATE TABLE IF NOT EXISTS financial_summary (
  id               BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id          UUID NOT NULL UNIQUE REFERENCES users_pilates(id) ON DELETE CASCADE,
  total_paid       DECIMAL(15,2) DEFAULT 0,
  total_due        DECIMAL(15,2) DEFAULT 0,
  last_payment_date DATE,
  days_overdue     INT DEFAULT 0,
  current_status   TEXT CHECK (current_status IN ('active','pending','overdue','inactive')) DEFAULT 'active',
  updated_at       TIMESTAMP DEFAULT NOW()
);

ALTER TABLE financial_summary DISABLE ROW LEVEL SECURITY;

-- 8. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_payment_history_user   ON payment_history(user_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_teacher_payments_month ON teacher_payments(teacher_id, month DESC);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_user  ON physical_therapy_sessions(user_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_status       ON financial_summary(current_status);

-- 9. DADOS INICIAIS
INSERT INTO promotions (code, description, discount_percent, valid_from, valid_until, is_active)
VALUES
  ('BEM-VINDO10', '10% desconto primeira aula', 10.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', TRUE),
  ('SUMMER20',   '20% desconto verão',          20.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Verificar resultado
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE '%pilates%' OR table_name IN ('payment_history','promotions','teacher_payments','physical_therapy_sessions','financial_summary')
ORDER BY table_name;
