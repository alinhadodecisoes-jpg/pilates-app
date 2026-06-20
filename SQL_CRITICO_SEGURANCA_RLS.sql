-- =============================================================================
-- 🔴 SQL CRÍTICO DE SEGURANÇA — RODAR NO SUPABASE (SQL Editor) O QUANTO ANTES
-- =============================================================================
-- PROBLEMA (confirmado em teste, 20/06/2026):
--   Um aluno logado consegue, via a API REST do Supabase (direto, sem passar
--   pelo app), dar UPDATE na PRÓPRIA linha de users_pilates e alterar colunas
--   sensíveis. Na prática isso permite:
--     • virar role = 'admin'  →  escalonamento de privilégio (acesso total!)
--     • status = 'ativo' / payment_status = 'em_dia'  →  burlar pagamento
--     • mudar plan_id / monthly_value  →  trocar o próprio plano/valor
--   Nenhum código do app impede isso, pois o acesso é direto ao banco.
--   A correção é no nível do Postgres: revogar UPDATE dessas colunas dos
--   papéis públicos (authenticated/anon). O nome/telefone seguem editáveis.
--   O service_role (usado pelas rotas /api) NÃO é afetado e continua podendo
--   alterar tudo normalmente.
-- =============================================================================

REVOKE UPDATE (
  role,
  status,
  payment_status,
  plan_id,
  monthly_value,
  due_day,
  next_due_date,
  is_physio_patient,
  is_pilates_student
) ON public.users_pilates FROM authenticated, anon;

-- (Opcional, defesa extra) Garante que ninguém público insira linhas de usuário
-- direto na tabela — cadastros já passam pela rota /api/admin/create-user.
REVOKE INSERT ON public.users_pilates FROM authenticated, anon;

-- =============================================================================
-- VERIFICAÇÃO (rode depois; deve listar as colunas sensíveis SEM 'UPDATE')
-- =============================================================================
-- SELECT grantee, privilege_type, column_name
-- FROM information_schema.column_privileges
-- WHERE table_name = 'users_pilates' AND grantee IN ('authenticated','anon')
-- ORDER BY grantee, column_name;
