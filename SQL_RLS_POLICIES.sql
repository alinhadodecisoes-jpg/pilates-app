-- ============================================================
-- RLS POLICIES — DAIMACH PILATES  (DECISÃO FUTURA — NÃO RODAR AINDA)
-- ------------------------------------------------------------
-- Contexto: hoje o app acessa os dados via API routes com SERVICE ROLE
-- (que IGNORA o RLS). Logo, ligar o RLS abaixo NÃO quebra o app — apenas
-- protege contra acesso direto com a anon key (ex.: alguém com o anon key
-- tentando ler dados de outro usuário pelo navegador/REST).
--
-- ⚠️ Para o RLS realmente isolar por usuário NA APLICAÇÃO, é preciso
-- migrar a leitura para a sessão autenticada do usuário (cookies SSR)
-- em vez de service role. Enquanto isso não acontecer, estas policies
-- são uma camada de defesa extra (defense-in-depth), não a principal.
--
-- Técnica anti-recursão: função SECURITY DEFINER que lê o role sem
-- disparar as policies da própria tabela.
-- ============================================================

-- 1) Função helper (SECURITY DEFINER evita recursão nas policies)
create or replace function public.current_pilates_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.users_pilates where id = auth.uid()
$$;

create or replace function public.is_pilates_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(select 1 from public.users_pilates where id = auth.uid() and role = 'admin')
$$;

-- ============================================================
-- 2) users_pilates
-- ============================================================
alter table public.users_pilates enable row level security;

drop policy if exists up_admin_all on public.users_pilates;
create policy up_admin_all on public.users_pilates
  for all using (public.is_pilates_admin()) with check (public.is_pilates_admin());

drop policy if exists up_self_read on public.users_pilates;
create policy up_self_read on public.users_pilates
  for select using (id = auth.uid());

drop policy if exists up_self_update on public.users_pilates;
create policy up_self_update on public.users_pilates
  for update using (id = auth.uid());

-- ============================================================
-- 3) classes_pilates  (turmas)
-- ============================================================
alter table public.classes_pilates enable row level security;

drop policy if exists cl_admin_all on public.classes_pilates;
create policy cl_admin_all on public.classes_pilates
  for all using (public.is_pilates_admin()) with check (public.is_pilates_admin());

drop policy if exists cl_prof_read on public.classes_pilates;
create policy cl_prof_read on public.classes_pilates
  for select using (professor_id = auth.uid());

-- aluno pode ver turmas em que está matriculado
drop policy if exists cl_aluno_read on public.classes_pilates;
create policy cl_aluno_read on public.classes_pilates
  for select using (
    exists (select 1 from public.enrollments_pilates e
            where e.class_id = classes_pilates.id and e.user_id = auth.uid() and e.is_active)
  );

-- ============================================================
-- 4) enrollments_pilates  (matrículas)
-- ============================================================
alter table public.enrollments_pilates enable row level security;

drop policy if exists en_admin_all on public.enrollments_pilates;
create policy en_admin_all on public.enrollments_pilates
  for all using (public.is_pilates_admin()) with check (public.is_pilates_admin());

drop policy if exists en_self_read on public.enrollments_pilates;
create policy en_self_read on public.enrollments_pilates
  for select using (user_id = auth.uid());

drop policy if exists en_prof_read on public.enrollments_pilates;
create policy en_prof_read on public.enrollments_pilates
  for select using (
    exists (select 1 from public.classes_pilates c
            where c.id = enrollments_pilates.class_id and c.professor_id = auth.uid())
  );

-- ============================================================
-- 5) Dados do próprio aluno (avaliações, presenças, saúde, financeiro)
--    Padrão: admin tudo; aluno só os próprios; (prof/fisio conforme vínculo)
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array[
    'physical_evaluations_pilates',
    'attendances_pilates',
    'health_records',
    'payment_history',
    'subscriptions_pilates'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_admin_all on public.%I;', t, t);
    execute format('create policy %I_admin_all on public.%I for all using (public.is_pilates_admin()) with check (public.is_pilates_admin());', t, t);
    execute format('drop policy if exists %I_self_read on public.%I;', t, t);
    execute format('create policy %I_self_read on public.%I for select using (user_id = auth.uid());', t, t);
  end loop;
end $$;

-- ============================================================
-- 6) Fisioterapia (prontuários) — admin + fisioterapeuta responsável + paciente
-- ============================================================
alter table public.physio_cases enable row level security;

drop policy if exists pc_admin_all on public.physio_cases;
create policy pc_admin_all on public.physio_cases
  for all using (public.is_pilates_admin()) with check (public.is_pilates_admin());

drop policy if exists pc_therapist on public.physio_cases;
create policy pc_therapist on public.physio_cases
  for all using (therapist_id = auth.uid()) with check (therapist_id = auth.uid());

drop policy if exists pc_patient_read on public.physio_cases;
create policy pc_patient_read on public.physio_cases
  for select using (user_id = auth.uid());

-- ============================================================
-- ROLLBACK (se precisar voltar atrás rapidamente):
--   alter table public.<tabela> disable row level security;
-- ============================================================
