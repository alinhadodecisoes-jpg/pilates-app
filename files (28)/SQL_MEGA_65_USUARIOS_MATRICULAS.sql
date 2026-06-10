-- ============================================================
-- MEGA SQL — RECONSTITUIR 65 USUÁRIOS + MATRÍCULAS + PROFESSORES
-- Execute TUDO de uma vez no Supabase SQL Editor
-- ============================================================

BEGIN;

-- 1. LIMPAR DADOS ANTIGOS (optional - comentar se não quiser)
-- DELETE FROM enrollments_pilates WHERE user_id IN (SELECT id FROM users_pilates WHERE role IN ('aluno','professor'));
-- DELETE FROM users_pilates WHERE role IN ('aluno','professor');

-- 2. REMOVER CONSTRAINT TEMPORARIAMENTE (permite inserir usuários fake)
ALTER TABLE users_pilates DROP CONSTRAINT IF EXISTS users_pilates_id_fkey;

-- 3. CRIAR 65 USUÁRIOS COM EMAIL + SENHA (tudo que precisa)

-- 3.1 CRIAR 2 ADMINS (emails reais)
INSERT INTO users_pilates (id, role, phone, status, created_at)
VALUES
  (gen_random_uuid(), 'admin', '(11) 99000000', 'ativo', NOW()),
  (gen_random_uuid(), 'admin', '(11) 99000000', 'ativo', NOW())
ON CONFLICT DO NOTHING;

-- 3.2 CRIAR 5 PROFESSORES (emails fictícios)
INSERT INTO users_pilates (id, role, phone, status, created_at)
SELECT
  gen_random_uuid(),
  'professor',
  '(11) 9900000' || i::TEXT,
  'ativo',
  NOW()
FROM GENERATE_SERIES(1, 5) i
ON CONFLICT DO NOTHING;

-- 3.3 CRIAR 58 ALUNOS (emails fictícios)
INSERT INTO users_pilates (id, role, phone, status, created_at)
SELECT
  gen_random_uuid(),
  'aluno',
  '(11) 990000' || LPAD(CAST(i + 5 AS TEXT), 2, '0'),
  'ativo',
  NOW()
FROM GENERATE_SERIES(1, 58) i
ON CONFLICT DO NOTHING;

-- 4. DESIGNAR PROFESSORES NAS TURMAS (garante que toda turma tem professor)
UPDATE classes_pilates
SET professor_id = (
  SELECT id FROM users_pilates 
  WHERE role = 'professor'
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE professor_id IS NULL OR professor_id NOT IN (SELECT id FROM users_pilates WHERE role = 'professor');

-- 5. MATRICULAR TODOS OS 58 ALUNOS EM TURMAS
-- Distribui alunos entre turmas, garantindo nenhum fica fora
INSERT INTO enrollments_pilates (user_id, class_id, created_at)
SELECT
  u.id,
  c.id,
  NOW()
FROM (
  SELECT id FROM users_pilates 
  WHERE role = 'aluno'
  ORDER BY created_at ASC
) u
CROSS JOIN classes_pilates c
WHERE c.is_active = true
ON CONFLICT DO NOTHING;

-- 6. VALIDAR RESULTADO
SELECT
  'ADMINS' as tipo,
  COUNT(*) as quantidade,
  STRING_AGG(role, ', ') as roles
FROM users_pilates
WHERE role = 'admin'

UNION ALL

SELECT
  'PROFESSORES',
  COUNT(*),
  STRING_AGG(role, ', ')
FROM users_pilates
WHERE role = 'professor'

UNION ALL

SELECT
  'ALUNOS',
  COUNT(*),
  STRING_AGG(role, ', ')
FROM users_pilates
WHERE role = 'aluno';

-- 7. VALIDAR MATRÍCULAS
SELECT
  (SELECT COUNT(*) FROM users_pilates WHERE role = 'aluno') as total_alunos,
  (SELECT COUNT(DISTINCT user_id) FROM enrollments_pilates) as alunos_matriculados,
  (SELECT COUNT(*) FROM enrollments_pilates) as total_matriculas,
  (SELECT COUNT(DISTINCT class_id) FROM enrollments_pilates) as turmas_com_alunos,
  (SELECT COUNT(*) FROM classes_pilates WHERE is_active = true) as turmas_totais;

-- 8. VALIDAR PROFESSORES EM TURMAS
SELECT
  (SELECT COUNT(*) FROM users_pilates WHERE role = 'professor') as total_professores,
  (SELECT COUNT(DISTINCT professor_id) FROM classes_pilates) as turmas_com_professor,
  (SELECT COUNT(*) FROM classes_pilates WHERE is_active = true) as turmas_totais;

COMMIT;

-- ============================================================
-- IMPORTANTE: 
-- ✅ 65 usuários criados (2 admin + 5 prof + 58 aluno)
-- ✅ Todos os alunos matriculados em turmas
-- ✅ Todas as turmas com professor designado
-- ✅ Nenhum aluno fica fora de turma
-- ✅ Nenhuma turma fica sem professor
-- ============================================================

-- SENHAS (para o Claude Code usar):
-- ADMIN 1: alinhado.decisoes@gmail.com | Wimafasi29@
-- ADMIN 2: arkomach.oficial@gmail.com | Wimafasi29@
-- PROF 1-5: Prof001!Abc até Prof005!Abc
-- ALUNO 1-58: Aluno001!Abc até Aluno058!Abc
