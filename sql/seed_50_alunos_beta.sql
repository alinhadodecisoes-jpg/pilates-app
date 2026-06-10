-- SEED: 50 Alunos de Teste para Beta
-- Execute no Supabase SQL Editor
-- Cria 50 alunos fictícios e os matricula em turmas

BEGIN;

-- 1. Gerar 50 alunos com dados aleatórios
INSERT INTO users_pilates (
  email,
  full_name,
  phone,
  height,
  weight,
  role,
  plan_id,
  status,
  created_at
)
SELECT
  'aluno.teste' || LPAD(CAST(i AS TEXT), 3, '0') || '@daimach.com.br' as email,
  'Aluno Beta ' || i as full_name,
  '(11) 9' || LPAD(CAST(9000000 + i AS TEXT), 8, '0') as phone,
  150 + (RANDOM() * 30)::INTEGER as height,
  50 + (RANDOM() * 40)::INTEGER as weight,
  'aluno' as role,
  (ARRAY[1, 2, 3])[(i % 3) + 1] as plan_id,  -- Distribui entre 3 planos
  'ativo' as status,
  NOW() as created_at
FROM GENERATE_SERIES(1, 50) i
ON CONFLICT(email) DO NOTHING;

-- 2. Matricular alunos em turmas (distribuir randomicamente)
INSERT INTO enrollments_pilates (
  class_id,
  user_id,
  enrolled_at
)
SELECT DISTINCT
  c.id,
  u.id,
  NOW()
FROM classes_pilates c
CROSS JOIN (
  SELECT id
  FROM users_pilates
  WHERE email LIKE 'aluno.teste%'
  ORDER BY RANDOM()
  LIMIT 50
) u
WHERE c.is_active = true
ON CONFLICT(class_id, user_id) DO NOTHING;

-- 3. Log do resultado
SELECT
  (SELECT COUNT(*) FROM users_pilates WHERE email LIKE 'aluno.teste%') as total_alunos_criados,
  (SELECT COUNT(*) FROM enrollments_pilates WHERE user_id IN (SELECT id FROM users_pilates WHERE email LIKE 'aluno.teste%')) as total_matriculas;

COMMIT;

-- ============================================
-- RESULTADO ESPERADO:
-- ✅ 50 alunos criados
-- ✅ Distribuídos entre 3 planos
-- ✅ Matriculados em turmas ativas
-- ✅ Telefone único por aluno
-- ✅ Senha: deve ser resetada na primeira vez
-- ============================================

-- LIMPAR (se precisar recomeçar):
-- DELETE FROM enrollments_pilates WHERE user_id IN (SELECT id FROM users_pilates WHERE email LIKE 'aluno.teste%');
-- DELETE FROM users_pilates WHERE email LIKE 'aluno.teste%';
