-- ========================================
-- TABELAS PILATES (Novo Schema)
-- ========================================

-- 1. PLANOS DE PILATES
CREATE TABLE IF NOT EXISTS plans_pilates (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  classes_per_week INT DEFAULT 2,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. USUÁRIOS PILATES (estende profiles do Daimach)
CREATE TABLE IF NOT EXISTS users_pilates (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'professor', 'aluno')) DEFAULT 'aluno',
  plan_id BIGINT REFERENCES plans_pilates(id),
  status TEXT CHECK (status IN ('ativo', 'inativo', 'inadimplente')) DEFAULT 'ativo',
  phone TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(id)
);

-- 3. TURMAS / AULAS
CREATE TABLE IF NOT EXISTS classes_pilates (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  professor_id UUID NOT NULL REFERENCES users_pilates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  day_of_week INT CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=seg, 6=dom
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  capacity INT DEFAULT 4,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. MATRÍCULAS (Alunos em Turmas)
CREATE TABLE IF NOT EXISTS enrollments_pilates (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES users_pilates(id) ON DELETE CASCADE,
  class_id BIGINT NOT NULL REFERENCES classes_pilates(id) ON DELETE CASCADE,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, class_id)
);

-- 5. PRESENÇAS
CREATE TABLE IF NOT EXISTS attendances_pilates (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES users_pilates(id) ON DELETE CASCADE,
  class_id BIGINT NOT NULL REFERENCES classes_pilates(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status TEXT CHECK (status IN ('present', 'absent', 'canceled_in_advance', 'replacement')) DEFAULT 'absent',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, class_id, attendance_date)
);

-- 6. ASSINATURAS (Stripe + Supabase)
CREATE TABLE IF NOT EXISTS subscriptions_pilates (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES users_pilates(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT UNIQUE,
  plan_id BIGINT NOT NULL REFERENCES plans_pilates(id),
  status TEXT CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid')) DEFAULT 'active',
  current_period_start DATE,
  current_period_end DATE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. AVALIAÇÕES FÍSICAS
CREATE TABLE IF NOT EXISTS physical_evaluations_pilates (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES users_pilates(id) ON DELETE CASCADE,
  evaluation_date DATE NOT NULL,
  weight DECIMAL(5, 2),
  height DECIMAL(5, 2),
  measurements JSONB, -- {bust, waist, hip, thigh, etc}
  postural_notes TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE users_pilates ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes_pilates ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments_pilates ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances_pilates ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions_pilates ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_evaluations_pilates ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans_pilates ENABLE ROW LEVEL SECURITY;

-- Política: Admin vê tudo
CREATE POLICY "admin_all" ON users_pilates
  FOR ALL USING (
    (SELECT role FROM users_pilates WHERE id = auth.uid()) = 'admin'
  );

-- Política: Aluno só vê a si mesmo
CREATE POLICY "aluno_self" ON users_pilates
  FOR SELECT USING (
    auth.uid() = id OR (SELECT role FROM users_pilates WHERE id = auth.uid()) = 'admin'
  );

-- Similar para outras tabelas (simplificado, expandir conforme necessário)

-- ========================================
-- ÍNDICES PARA PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_users_pilates_role ON users_pilates(role);
CREATE INDEX IF NOT EXISTS idx_classes_pilates_professor ON classes_pilates(professor_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments_pilates(user_id);
CREATE INDEX IF NOT EXISTS idx_attendances_user_date ON attendances_pilates(user_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions_pilates(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_user ON physical_evaluations_pilates(user_id);
