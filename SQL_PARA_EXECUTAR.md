# 🚀 SQLs PARA EXECUTAR NO SUPABASE (Crítico para Testes)

> **Data:** 2026-06-10  
> **Bloqueador:** Estes 3 SQLs precisam ser executados para continuar os testes dos BLOCOS B, C e D

---

## 📌 COMO EXECUTAR

1. Abrir Supabase: https://supabase.com/dashboard
2. Entrar em seu projeto Daimach
3. Ir para **SQL Editor** (menu lateral esquerdo)
4. Copiar cada SQL abaixo e clicar **RUN**
5. Aguardar mensagem de sucesso

---

## SQL 1️⃣ — A1: ROLE CONSTRAINT (Executado? Conferir)

**Descrição:** Permite que a tabela `users_pilates` aceite os 4 novos papéis de profissionais.

```sql
ALTER TABLE users_pilates DROP CONSTRAINT IF EXISTS users_pilates_role_check;
ALTER TABLE users_pilates ADD CONSTRAINT users_pilates_role_check
  CHECK (role IN ('admin','aluno','professor','fisioterapeuta','prof_fisio','prof_edfisica'));
```

**Status esperado:** ✅ "Constraint created successfully"

---

## SQL 2️⃣ — B1: ENROLLMENTS_PILATES TABLE (Crítico para BLOCO B)

**Descrição:** Tabela para matricular alunos em turmas. **Necessária para modal "Gerenciar Alunos"** funcionar.

```sql
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

**Status esperado:** ✅ "Table created successfully" (ou "already exists")

**Teste após:** Ir para /admin/turmas, abrir modal de alunos, clicar "+ Matricular" — deve funcionar sem erro de RLS

---

## SQL 3️⃣ — C1: REPOSITION TABLES (Crítico para BLOCO C)

**Descrição:** Tabelas para sistema de reposições (slots e solicitações). **Necessárias para alunos solicitarem reposições e professores aprovarem**.

```sql
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

**Status esperado:** ✅ "Tables created successfully" (ou "already exist")

**Teste após:** Ir para /admin/reposicoes, criar novo slot — deve funcionar

---

## ✅ CHECKLIST PÓS-EXECUÇÃO

- [ ] SQL A1 executado com sucesso
- [ ] SQL B1 executado com sucesso
- [ ] SQL C1 executado com sucesso (2 tabelas)
- [ ] Voltar a /admin/turmas e testar modal de enrollment → deve funcionar sem erro
- [ ] Voltar a /admin/reposicoes e testar criar slot → deve funcionar
- [ ] **Próximo:** Logar como aluno e testar /aluno/reposicoes para solicitar slots

---

## 🔍 SE DER ERRO

Se ao executar um SQL der erro como:
- `"table already exists"` → tudo bem, continue para o próximo
- `"relation does not exist"` → verifique se a tabela pai existe (ex: classes_pilates)
- `"permission denied"` → verifique se você está logado como admin no Supabase

---

> Após executar todos os 3 SQLs, os testes dos BLOCOS B1, C e D deverão passar! 🎉

