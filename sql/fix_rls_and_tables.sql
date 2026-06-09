-- =========================================================
-- PILATES APP — Script SQL para executar no Supabase
-- URL: https://app.supabase.com/project/qgqzbfyvhhnptmfgjpnd/editor
-- =========================================================

-- 1. DESATIVAR RLS EM TODAS AS TABELAS PILATES
-- (Elimina o erro 42P17 de recursão infinita e 42501 de violação RLS)
ALTER TABLE users_pilates              DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes_pilates            DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments_pilates        DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendances_pilates        DISABLE ROW LEVEL SECURITY;
ALTER TABLE plans_pilates              DISABLE ROW LEVEL SECURITY;
ALTER TABLE physical_evaluations_pilates DISABLE ROW LEVEL SECURITY;

-- Tabelas opcionais (criar se não existir)
ALTER TABLE subscriptions_pilates      DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER TODAS AS POLICIES ANTIGAS (que causam a recursão)
DROP POLICY IF EXISTS "Users can view own profile" ON users_pilates;
DROP POLICY IF EXISTS "Users can update own profile" ON users_pilates;
DROP POLICY IF EXISTS "Users can insert own profile" ON users_pilates;
DROP POLICY IF EXISTS "Allow all" ON users_pilates;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON users_pilates;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users_pilates;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users_pilates;
DROP POLICY IF EXISTS "anon_select" ON users_pilates;
DROP POLICY IF EXISTS "auth_insert" ON users_pilates;
DROP POLICY IF EXISTS "auth_select" ON users_pilates;
DROP POLICY IF EXISTS "auth_update" ON users_pilates;

-- 3. GARANTIR QUE AS TABELAS EXISTEM
-- users_pilates
CREATE TABLE IF NOT EXISTS users_pilates (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'aluno' CHECK (role IN ('admin', 'professor', 'aluno')),
  status      TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'inadimplente')),
  plan_id     INTEGER,
  phone       TEXT,
  emergency_contact TEXT,
  emergency_phone   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- plans_pilates
CREATE TABLE IF NOT EXISTS plans_pilates (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  description      TEXT,
  price            NUMERIC(10,2) NOT NULL DEFAULT 0,
  classes_per_week INTEGER NOT NULL DEFAULT 2,
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- classes_pilates
CREATE TABLE IF NOT EXISTS classes_pilates (
  id           SERIAL PRIMARY KEY,
  professor_id UUID REFERENCES auth.users(id),
  name         TEXT NOT NULL,
  day_of_week  INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  time_start   TIME NOT NULL,
  time_end     TIME NOT NULL,
  capacity     INTEGER NOT NULL DEFAULT 4,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- enrollments_pilates
CREATE TABLE IF NOT EXISTS enrollments_pilates (
  id              SERIAL PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id        INTEGER REFERENCES classes_pilates(id) ON DELETE CASCADE,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- attendances_pilates
CREATE TABLE IF NOT EXISTS attendances_pilates (
  id              SERIAL PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id        INTEGER REFERENCES classes_pilates(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status          TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','canceled_in_advance','replacement')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- physical_evaluations_pilates
CREATE TABLE IF NOT EXISTS physical_evaluations_pilates (
  id              SERIAL PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight          NUMERIC(5,2),
  height          NUMERIC(5,2),
  measurements    JSONB,
  postural_notes  TEXT,
  image_url       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- subscriptions_pilates
CREATE TABLE IF NOT EXISTS subscriptions_pilates (
  id                  SERIAL PRIMARY KEY,
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id             INTEGER REFERENCES plans_pilates(id),
  stripe_customer_id  TEXT,
  stripe_subscription_id TEXT,
  status              TEXT DEFAULT 'active',
  current_period_end  TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CONFIRMAR: Ver usuários já criados
SELECT id, role, status, created_at FROM users_pilates ORDER BY created_at DESC LIMIT 10;
