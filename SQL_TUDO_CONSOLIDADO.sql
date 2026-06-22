-- =============================================================================
-- DAIMACH — SQL CONSOLIDADO (TODOS OS MIGRATIONS + SEGURANÇA EM 1 ARQUIVO)
-- Gerado em 20/06/2026 — junta: BLOCOS_PENDENTES, CRITICO_SEGURANCA_RLS,
-- FIX_HEALTH_RECORDS, MIGRACOES_NOVAS_FEATURES, MIGRACOES_PENDENTES,
-- OPCIONAL_MELHORIAS_BANCO, PARA_EXECUTAR (A1/B1/C1) e RLS_POLICIES (comentado).
--
-- ✅ IDEMPOTENTE: pode rodar inteiro, de uma vez, MESMO QUE partes já tenham
--    sido executadas. Nenhum statement falha em re-execução (guards em tudo).
-- ✅ NÃO cria turmas duplicadas (a grade de 90 turmas tem guard NOT EXISTS).
-- Rode tudo no Supabase → SQL Editor → RUN.
-- =============================================================================


-- =============================================================================
-- 1) users_pilates — papéis aceitos (A1) + colunas de pagamento/flags
-- =============================================================================
DO $$ BEGIN
  ALTER TABLE users_pilates DROP CONSTRAINT IF EXISTS users_pilates_role_check;
  ALTER TABLE users_pilates ADD CONSTRAINT users_pilates_role_check
    CHECK (role IN ('admin','aluno','professor','fisioterapeuta','prof_fisio','prof_edfisica'));
EXCEPTION WHEN others THEN RAISE NOTICE 'role_check não aplicada: %', SQLERRM; END $$;

ALTER TABLE users_pilates
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pendente',  -- pendente | em_dia | atrasado
  ADD COLUMN IF NOT EXISTS due_day integer,                         -- dia de vencimento (1-28)
  ADD COLUMN IF NOT EXISTS next_due_date date,
  ADD COLUMN IF NOT EXISTS is_physio_patient boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_pilates_student boolean DEFAULT true;
ALTER TABLE users_pilates ALTER COLUMN payment_status SET DEFAULT 'pendente';


-- =============================================================================
-- 2) classes_pilates — observações da turma + professor opcional
-- =============================================================================
ALTER TABLE classes_pilates ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE classes_pilates ALTER COLUMN professor_id DROP NOT NULL;


-- =============================================================================
-- 3) class_sessions — cancelamento de aula + constraint p/ upsert
-- =============================================================================
ALTER TABLE class_sessions
  ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'class_sessions_class_id_session_date_key') THEN
    BEGIN
      ALTER TABLE class_sessions ADD CONSTRAINT class_sessions_class_id_session_date_key UNIQUE (class_id, session_date);
    EXCEPTION WHEN others THEN RAISE NOTICE 'class_sessions unique não adicionada: %', SQLERRM; END;
  END IF;
END $$;


-- =============================================================================
-- 4) enrollments_pilates (B1) — matrículas
-- =============================================================================
CREATE TABLE IF NOT EXISTS enrollments_pilates (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  class_id BIGINT NOT NULL REFERENCES classes_pilates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users_pilates(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(class_id, user_id)
);
-- (não mexemos no RLS de tabelas existentes — o app usa service role nas rotas /api)
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON enrollments_pilates(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments_pilates(user_id);


-- =============================================================================
-- 5) reposition_slots + reposition_requests (C1) — sistema de reposição
-- =============================================================================
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

CREATE INDEX IF NOT EXISTS idx_repo_slots_date ON reposition_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_repo_requests_user ON reposition_requests(user_id, status);

-- (OPCIONAL) constraint única em reposition_requests — só adiciona se ainda não existir
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_repreq_user_slot')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'reposition_requests'::regclass AND contype='u') THEN
    BEGIN
      ALTER TABLE reposition_requests ADD CONSTRAINT uq_repreq_user_slot UNIQUE (user_id, slot_id);
    EXCEPTION WHEN others THEN RAISE NOTICE 'uq_repreq_user_slot não adicionada: %', SQLERRM; END;
  END IF;
END $$;


-- =============================================================================
-- 6) studio_config — configurações + PIX
-- =============================================================================
CREATE TABLE IF NOT EXISTS studio_config (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);
INSERT INTO studio_config (key, value) VALUES
  ('pix_key', ''),
  ('pix_name', 'Daiana Alves da Silva'),
  ('payment_deadline_days', '5'),
  ('studio_name', 'Daimach Movement'),
  ('studio_whatsapp', '5521763000055'),
  ('studio_instagram', '@daimach.movement'),
  ('studio_email', 'Daimach.movement@gmail.com')
ON CONFLICT (key) DO NOTHING;


-- =============================================================================
-- 7) payment_confirmations — aluno informa "já paguei" (PIX)
-- =============================================================================
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
CREATE INDEX IF NOT EXISTS idx_payconf_status ON payment_confirmations(status);


-- =============================================================================
-- 8) teacher_payments — pagamentos do professor
-- =============================================================================
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


-- =============================================================================
-- 9) payment_history — colunas extras (mês de referência + notas)
-- =============================================================================
ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS reference_month TEXT;
ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS notes TEXT;


-- =============================================================================
-- 10) health_records — precisão de altura/peso (evita overflow)
-- =============================================================================
DO $$ BEGIN
  ALTER TABLE health_records
    ALTER COLUMN height_cm TYPE NUMERIC(6,2),
    ALTER COLUMN weight_kg TYPE NUMERIC(6,2);
EXCEPTION WHEN others THEN RAISE NOTICE 'health_records type não alterado: %', SQLERRM; END $$;


-- =============================================================================
-- 11) Grade de turmas (Seg–Sáb, 07:00–21:00) — COM GUARD ANTI-DUPLICATA
--     Só insere turmas que ainda NÃO existem (pelo nome). Re-rodar = nada.
-- =============================================================================
INSERT INTO classes_pilates (name, day_of_week, time_start, time_end, capacity, is_active)
SELECT grid.nm, grid.dia_num, make_time(grid.h, 0, 0), make_time(grid.h + 1, 0, 0), 4, TRUE
FROM (
  SELECT dias.dia_num, dias.dia_nome, h,
         ('Pilates ' || dias.dia_nome || ' ' || lpad(h::text, 2, '0') || ':00') AS nm
  FROM (
    SELECT unnest(ARRAY[1,2,3,4,5,6]) AS dia_num,
           unnest(ARRAY['Seg','Ter','Qua','Qui','Sex','Sáb']) AS dia_nome
  ) dias
  CROSS JOIN generate_series(7, 21) AS h
) grid
WHERE NOT EXISTS (SELECT 1 FROM classes_pilates c WHERE c.name = grid.nm);


-- =============================================================================
-- 12) 🔴 SEGURANÇA CRÍTICA — impede aluno de virar admin / se marcar pago
--     (REVOKE é idempotente; service_role das rotas /api NÃO é afetado)
-- =============================================================================
REVOKE UPDATE (
  role, status, payment_status, plan_id, monthly_value,
  due_day, next_due_date, is_physio_patient, is_pilates_student
) ON public.users_pilates FROM authenticated, anon;

REVOKE INSERT ON public.users_pilates FROM authenticated, anon;


-- =============================================================================
-- 13) Recarregar cache do PostgREST (resolve "table not found")
-- =============================================================================
NOTIFY pgrst, 'reload schema';


-- =============================================================================
-- =============================================================================
-- PARTE OPCIONAL (DEFESA EXTRA) — RLS POLICIES  ⚠️ COMENTADO DE PROPÓSITO
-- -----------------------------------------------------------------------------
-- NÃO é obrigatório: a proteção crítica já está no item 12 acima.
-- Isto LIGA o Row Level Security nas tabelas (camada extra contra acesso
-- direto). O app usa service role nas rotas /api, então NÃO quebra o app.
-- Porém é uma mudança de comportamento não testada a fundo aqui.
--
-- PARA ATIVAR: remova o /* e */ que envolvem o bloco abaixo e rode de novo.
-- ROLLBACK (se algo de acesso direto parar): para cada tabela ->
--   ALTER TABLE public.<tabela> DISABLE ROW LEVEL SECURITY;
-- =============================================================================
/*
create or replace function public.current_pilates_role()
returns text language sql security definer set search_path = public stable as $$
  select role from public.users_pilates where id = auth.uid()
$$;

create or replace function public.is_pilates_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists(select 1 from public.users_pilates where id = auth.uid() and role = 'admin')
$$;

alter table public.users_pilates enable row level security;
drop policy if exists up_admin_all on public.users_pilates;
create policy up_admin_all on public.users_pilates for all using (public.is_pilates_admin()) with check (public.is_pilates_admin());
drop policy if exists up_self_read on public.users_pilates;
create policy up_self_read on public.users_pilates for select using (id = auth.uid());
drop policy if exists up_self_update on public.users_pilates;
create policy up_self_update on public.users_pilates for update using (id = auth.uid());

alter table public.classes_pilates enable row level security;
drop policy if exists cl_admin_all on public.classes_pilates;
create policy cl_admin_all on public.classes_pilates for all using (public.is_pilates_admin()) with check (public.is_pilates_admin());
drop policy if exists cl_prof_read on public.classes_pilates;
create policy cl_prof_read on public.classes_pilates for select using (professor_id = auth.uid());
drop policy if exists cl_aluno_read on public.classes_pilates;
create policy cl_aluno_read on public.classes_pilates for select using (
  exists (select 1 from public.enrollments_pilates e where e.class_id = classes_pilates.id and e.user_id = auth.uid() and e.is_active)
);

alter table public.enrollments_pilates enable row level security;
drop policy if exists en_admin_all on public.enrollments_pilates;
create policy en_admin_all on public.enrollments_pilates for all using (public.is_pilates_admin()) with check (public.is_pilates_admin());
drop policy if exists en_self_read on public.enrollments_pilates;
create policy en_self_read on public.enrollments_pilates for select using (user_id = auth.uid());
drop policy if exists en_prof_read on public.enrollments_pilates;
create policy en_prof_read on public.enrollments_pilates for select using (
  exists (select 1 from public.classes_pilates c where c.id = enrollments_pilates.class_id and c.professor_id = auth.uid())
);

do $$
declare t text;
begin
  foreach t in array array['physical_evaluations_pilates','attendances_pilates','health_records','payment_history','subscriptions_pilates']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_admin_all on public.%I;', t, t);
    execute format('create policy %I_admin_all on public.%I for all using (public.is_pilates_admin()) with check (public.is_pilates_admin());', t, t);
    execute format('drop policy if exists %I_self_read on public.%I;', t, t);
    execute format('create policy %I_self_read on public.%I for select using (user_id = auth.uid());', t, t);
  end loop;
end $$;

alter table public.physio_cases enable row level security;
drop policy if exists pc_admin_all on public.physio_cases;
create policy pc_admin_all on public.physio_cases for all using (public.is_pilates_admin()) with check (public.is_pilates_admin());
drop policy if exists pc_therapist on public.physio_cases;
create policy pc_therapist on public.physio_cases for all using (therapist_id = auth.uid()) with check (therapist_id = auth.uid());
drop policy if exists pc_patient_read on public.physio_cases;
create policy pc_patient_read on public.physio_cases for select using (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';
*/
-- =============================================================================
-- FIM
-- =============================================================================
