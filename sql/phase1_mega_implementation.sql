-- ========== FASE 1: MEGA IMPLEMENTATION SQL ==========

-- 1. ESTENDER users_pilates COM DADOS ADICIONAIS
ALTER TABLE users_pilates ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users_pilates ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users_pilates ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE users_pilates ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE users_pilates ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE users_pilates ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE users_pilates ADD COLUMN IF NOT EXISTS cpf TEXT UNIQUE;
ALTER TABLE users_pilates ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE users_pilates ADD COLUMN IF NOT EXISTS bank_info JSONB;

-- 2. HISTÓRICO DE PAGAMENTOS
CREATE TABLE IF NOT EXISTS payment_history (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES users_pilates(id) ON DELETE CASCADE,
  plan_id BIGINT REFERENCES plans_pilates(id),
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('pix', 'credit_card', 'bank_transfer', 'cash')) DEFAULT 'pix',
  status TEXT CHECK (status IN ('paid', 'pending', 'overdue', 'canceled')) DEFAULT 'pending',
  stripe_payment_id TEXT UNIQUE,
  invoice_number TEXT UNIQUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. PROMOÇÕES E DESCONTOS
CREATE TABLE IF NOT EXISTS promotions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_percent DECIMAL(5, 2),
  discount_fixed DECIMAL(10, 2),
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  max_uses INT,
  current_uses INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. PROMOÇÕES USADAS POR USUÁRIO
CREATE TABLE IF NOT EXISTS user_promotions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES users_pilates(id) ON DELETE CASCADE,
  promotion_id BIGINT NOT NULL REFERENCES promotions(id),
  used_date DATE DEFAULT CURRENT_DATE,
  discount_amount DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. PAGAMENTOS DE PROFESSORES
CREATE TABLE IF NOT EXISTS teacher_payments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  teacher_id UUID NOT NULL REFERENCES users_pilates(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  total_classes INT,
  rate_per_class DECIMAL(10, 2),
  total_amount DECIMAL(10, 2),
  payment_date DATE,
  status TEXT CHECK (status IN ('pending', 'paid', 'overdue')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(teacher_id, month)
);

-- 6. SESSÕES DE FISIOTERAPIA
CREATE TABLE IF NOT EXISTS physical_therapy_sessions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES users_pilates(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES users_pilates(id),
  session_date TIMESTAMP NOT NULL,
  duration_minutes INT DEFAULT 60,
  therapy_type TEXT NOT NULL,
  notes TEXT,
  cost DECIMAL(10, 2),
  status TEXT CHECK (status IN ('scheduled', 'completed', 'canceled')) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. RESUMO FINANCEIRO DO USUÁRIO
CREATE TABLE IF NOT EXISTS financial_summary (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL UNIQUE REFERENCES users_pilates(id) ON DELETE CASCADE,
  total_paid DECIMAL(15, 2) DEFAULT 0,
  total_due DECIMAL(15, 2) DEFAULT 0,
  last_payment_date DATE,
  days_overdue INT DEFAULT 0,
  current_status TEXT CHECK (current_status IN ('active', 'pending', 'overdue', 'inactive')) DEFAULT 'active',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_payment_history_user ON payment_history(user_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_teacher_payments_month ON teacher_payments(teacher_id, month DESC);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_user ON physical_therapy_sessions(user_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_summary_status ON financial_summary(current_status);

-- 9. DESABILITAR RLS (por enquanto)
ALTER TABLE payment_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE promotions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_promotions DISABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE physical_therapy_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE financial_summary DISABLE ROW LEVEL SECURITY;

-- 10. INSERIR PROMOÇÕES DE TESTE
INSERT INTO promotions (code, description, discount_percent, valid_from, valid_until, is_active)
VALUES
  ('PROMO10', '10% desconto primeira aula', 10.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', TRUE),
  ('SUMMER20', '20% desconto verão', 20.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', TRUE)
ON CONFLICT DO NOTHING;
