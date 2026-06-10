# PENDÊNCIAS WILLIAN — FASE 2

> Estas pendências exigem ação manual (SQL no Supabase ou configuração externa).
> O código foi implementado assumindo que o SQL já foi executado.

---

## ⚠️ A1 — BLOQUEANTE: Corrigir constraint de role (rodar ANTES de criar professor/fisio)

```sql
-- Sem isso, criar/editar usuários com role prof_fisio / prof_edfisica / fisioterapeuta vai falhar
ALTER TABLE users_pilates DROP CONSTRAINT IF EXISTS users_pilates_role_check;
ALTER TABLE users_pilates ADD CONSTRAINT users_pilates_role_check
  CHECK (role IN ('admin','aluno','professor','fisioterapeuta','prof_fisio','prof_edfisica'));
```

---

## ⚠️ B1 — BLOQUEANTE: Tabela de matrículas em turmas

```sql
-- Necessário para o modal "Gerenciar Alunos" em /admin/turmas
CREATE TABLE IF NOT EXISTS enrollments_pilates (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  class_id BIGINT NOT NULL REFERENCES classes_pilates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users_pilates(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(class_id, user_id)
);

ALTER TABLE enrollments_pilates DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON enrollments_pilates(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments_pilates(user_id);
```

---

## ⚠️ C1 — BLOQUEANTE: Tabela de slots de reposição

```sql
-- Necessário para o sistema real de reposições
CREATE TABLE IF NOT EXISTS reposition_slots (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  class_id BIGINT NOT NULL REFERENCES classes_pilates(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  capacity INT DEFAULT 4,
  created_by UUID REFERENCES users_pilates(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(class_id, slot_date)
);

CREATE TABLE IF NOT EXISTS reposition_requests (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES users_pilates(id) ON DELETE CASCADE,
  slot_id BIGINT NOT NULL REFERENCES reposition_slots(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','canceled')),
  requested_at TIMESTAMP DEFAULT NOW(),
  reviewed_by UUID REFERENCES users_pilates(id),
  reviewed_at TIMESTAMP,
  notes TEXT,
  UNIQUE(user_id, slot_id)
);

ALTER TABLE reposition_slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE reposition_requests DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_repo_slots_date ON reposition_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_repo_requests_user ON reposition_requests(user_id, status);
```

---

## MD 05 — ANAMNESE / FICHA DE SAÚDE

### SQL no Supabase (cole e RUN)
```sql
CREATE TABLE IF NOT EXISTS health_records (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL UNIQUE REFERENCES users_pilates(id) ON DELETE CASCADE,
  birth_date DATE,
  blood_type TEXT,
  height_cm DECIMAL(5,2),
  weight_kg DECIMAL(5,2),
  main_goal TEXT,
  injuries JSONB,
  surgeries JSONB,
  chronic_conditions JSONB,
  medications JSONB,
  allergies TEXT,
  physical_restrictions TEXT,
  doctor_clearance BOOLEAN DEFAULT FALSE,
  doctor_notes TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  consent_signed BOOLEAN DEFAULT FALSE,
  consent_date TIMESTAMP,
  filled_by UUID REFERENCES users_pilates(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE health_records DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_health_user ON health_records(user_id);
```

---

## MD 06 — AVALIAÇÃO FÍSICA COMPLETA

### SQL no Supabase (cole e RUN)
```sql
ALTER TABLE physical_evaluations_pilates ADD COLUMN IF NOT EXISTS evaluator_id UUID REFERENCES users_pilates(id);
ALTER TABLE physical_evaluations_pilates ADD COLUMN IF NOT EXISTS body_fat DECIMAL(5,2);
ALTER TABLE physical_evaluations_pilates ADD COLUMN IF NOT EXISTS muscle_mass DECIMAL(5,2);
ALTER TABLE physical_evaluations_pilates ADD COLUMN IF NOT EXISTS photos JSONB;
ALTER TABLE physical_evaluations_pilates ADD COLUMN IF NOT EXISTS posture_assessment TEXT;
ALTER TABLE physical_evaluations_pilates ADD COLUMN IF NOT EXISTS flexibility_notes TEXT;
ALTER TABLE physical_evaluations_pilates ADD COLUMN IF NOT EXISTS strength_notes TEXT;
ALTER TABLE physical_evaluations_pilates ADD COLUMN IF NOT EXISTS goals TEXT;

ALTER TABLE physical_evaluations_pilates DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_eval_user_date ON physical_evaluations_pilates(user_id, evaluation_date DESC);
```

### Storage no Supabase
- Criar bucket `evaluations` (privado): Supabase → Storage → New bucket → nome: `evaluations`, desmarcar "Public"

### Dependência: recharts
```
npm install recharts --legacy-peer-deps
```

---

## MD 07 — PRONTUÁRIO DE FISIOTERAPIA

### SQL no Supabase (cole e RUN)
```sql
CREATE TABLE IF NOT EXISTS physio_cases (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES users_pilates(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES users_pilates(id),
  chief_complaint TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  start_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active',
  discharge_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS physio_evolutions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  case_id BIGINT NOT NULL REFERENCES physio_cases(id) ON DELETE CASCADE,
  session_id BIGINT REFERENCES physical_therapy_sessions(id),
  evolution_date TIMESTAMP DEFAULT NOW(),
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  pain_scale INT,
  techniques_used TEXT,
  therapist_id UUID REFERENCES users_pilates(id),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE physio_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE physio_evolutions DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_physio_case_user ON physio_cases(user_id, status);
CREATE INDEX IF NOT EXISTS idx_physio_evo_case ON physio_evolutions(case_id, evolution_date DESC);
```

---

## MD 02 — NOTIFICAÇÕES (PUSH + EMAIL)

### SQL no Supabase (cole e RUN)
```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES users_pilates(id) ON DELETE CASCADE,
  endpoint TEXT,
  fcm_token TEXT,
  keys_p256dh TEXT,
  keys_auth TEXT,
  platform TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

CREATE TABLE IF NOT EXISTS notifications_log (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES users_pilates(id) ON DELETE CASCADE,
  type TEXT,
  title TEXT,
  body TEXT,
  channel TEXT,
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users_pilates(id) ON DELETE CASCADE,
  aula_lembrete BOOLEAN DEFAULT TRUE,
  mensalidade BOOLEAN DEFAULT TRUE,
  reposicao BOOLEAN DEFAULT TRUE,
  horas_antes_aula INT DEFAULT 12
);

ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences DISABLE ROW LEVEL SECURITY;
```

### Variáveis de ambiente necessárias (copiar do companion-os .env.local)
```
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
RESEND_API_KEY=
CRON_SECRET_KEY=  (gerar uma string aleatória segura)
```

---

## MD 03 — PAGAMENTO ONLINE (STRIPE)

### SQL no Supabase (cole e RUN)
```sql
ALTER TABLE plans_pilates ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE subscriptions_pilates ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE subscriptions_pilates ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE subscriptions_pilates ADD COLUMN IF NOT EXISTS current_period_end DATE;
ALTER TABLE subscriptions_pilates DISABLE ROW LEVEL SECURITY;

-- Após criar produtos no Stripe Dashboard, atualizar:
-- UPDATE plans_pilates SET stripe_price_id='price_xxx' WHERE name='Plano 2x/Semana';
-- UPDATE plans_pilates SET stripe_price_id='price_yyy' WHERE name='Plano Livre';
-- UPDATE plans_pilates SET stripe_price_id='price_zzz' WHERE name='Plano Particular';
```

### Variáveis de ambiente necessárias
```
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Stripe Dashboard (manual)
- Entrar em https://dashboard.stripe.com (conta: willian@daimach.com.br)
- Criar Produtos/Preços recorrentes para cada plano
- Configurar webhook endpoint após deploy: `https://<dominio>/api/stripe/webhook`

### Dependências
```
npm install stripe @stripe/stripe-js --legacy-peer-deps
```

---

## MD 04 — AGENDAMENTO + GOOGLE CALENDAR

### SQL no Supabase (cole e RUN)
```sql
CREATE TABLE IF NOT EXISTS class_sessions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  class_id BIGINT NOT NULL REFERENCES classes_pilates(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  capacity INT DEFAULT 4,
  status TEXT DEFAULT 'scheduled',
  google_event_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(class_id, session_date)
);

CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  session_id BIGINT NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users_pilates(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'booked',
  booked_at TIMESTAMP DEFAULT NOW(),
  canceled_at TIMESTAMP,
  UNIQUE(session_id, user_id)
);

CREATE TABLE IF NOT EXISTS google_tokens (
  user_id UUID PRIMARY KEY REFERENCES users_pilates(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  expiry TIMESTAMP,
  scope TEXT,
  google_email TEXT,
  google_name TEXT,
  is_valid BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE class_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE google_tokens DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_sessions_date ON class_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_bookings_session ON bookings(session_id, status);
```

### Variáveis de ambiente necessárias (copiar do companion-os .env.local)
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback
```

---

## MD 08 — BACKUP / GOOGLE DRIVE

### SQL no Supabase (cole e RUN)
```sql
CREATE TABLE IF NOT EXISTS backup_log (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  backup_date TIMESTAMP DEFAULT NOW(),
  scope TEXT,
  drive_file_id TEXT,
  drive_url TEXT,
  rows_count INT,
  status TEXT DEFAULT 'success',
  notes TEXT
);

ALTER TABLE backup_log DISABLE ROW LEVEL SECURITY;
```

### Variáveis de ambiente necessárias
- Mesmas variáveis GOOGLE_* do MD 04

---

## MD 01 — MOBILE APK

### Pré-requisitos no PC (verificar/instalar)
- **Java JDK 17**: https://adoptium.net/
- **Android Studio**: https://developer.android.com/studio
- Variável de ambiente `ANDROID_HOME` apontando para o SDK

### Após instalar
- Avisar para executar: `npx cap sync android` e `.\gradlew.bat assembleDebug` na pasta `android/`

---

## RESUMO DOS SQLs PENDENTES

| MD | Tabelas | Status |
|----|---------|--------|
| MD05 | health_records | ⏳ Aguardando execução |
| MD06 | ALTER physical_evaluations_pilates | ⏳ Aguardando execução |
| MD06 | Bucket "evaluations" no Storage | ⏳ Aguardando criação manual |
| MD07 | physio_cases, physio_evolutions | ⏳ Aguardando execução |
| MD02 | push_subscriptions, notifications_log, notification_preferences | ⏳ Aguardando execução |
| MD03 | ALTER plans_pilates, subscriptions_pilates | ⏳ Aguardando execução |
| MD04 | class_sessions, bookings, google_tokens | ⏳ Aguardando execução |
| MD08 | backup_log | ⏳ Aguardando execução |
