# 🩺 MD 05 — ANAMNESE + FICHA DE SAÚDE

**Objetivo:** Cada aluno tem uma ficha de saúde/anamnese: histórico de lesões, cirurgias,
doenças, medicamentos, restrições, objetivos. Professor e fisioterapeuta consultam antes
da aula. Essencial para segurança no Pilates e base para o prontuário de fisioterapia.

**Não depende do projeto antigo** — é específico do contexto saúde/estúdio.

---

## CONTEXTO TÉCNICO
- Ficha preenchida pelo aluno no cadastro/onboarding e atualizável pelo admin/professor.
- Dados sensíveis de saúde → tratar com cuidado (LGPD). Acesso restrito a admin/professor/
  fisioterapeuta e ao próprio aluno.
- Campo de assinatura/consentimento (termo) é recomendável.

---

## PASSO 1 — SQL no Supabase (cole e RUN)

```sql
CREATE TABLE IF NOT EXISTS health_records (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL UNIQUE REFERENCES users_pilates(id) ON DELETE CASCADE,
  -- Dados gerais
  birth_date DATE,
  blood_type TEXT,
  height_cm DECIMAL(5,2),
  weight_kg DECIMAL(5,2),
  -- Objetivos
  main_goal TEXT,                     -- ex: dor lombar, condicionamento, pós-parto
  -- Histórico clínico (JSON para flexibilidade)
  injuries JSONB,                     -- [{local, descricao, data}]
  surgeries JSONB,                    -- [{tipo, data}]
  chronic_conditions JSONB,           -- [diabetes, hipertensão, etc]
  medications JSONB,                  -- [{nome, dose}]
  allergies TEXT,
  -- Restrições e observações
  physical_restrictions TEXT,
  doctor_clearance BOOLEAN DEFAULT FALSE,  -- liberação médica
  doctor_notes TEXT,
  -- Emergência
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  -- Consentimento
  consent_signed BOOLEAN DEFAULT FALSE,
  consent_date TIMESTAMP,
  -- Controle
  filled_by UUID REFERENCES users_pilates(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE health_records DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_health_user ON health_records(user_id);
```

---

## PASSO 2 — COMANDO PARA O CLAUDE CODE

```
MD 05 — ANAMNESE / FICHA DE SAÚDE

Projeto: C:\Users\willa\pilates-app
Autorização total. PRESERVE o que já funciona.

CONTEXTO: Tabela health_records (1 por aluno). Dados sensíveis — acesso só admin,
professor, fisioterapeuta e o próprio aluno.

TAREFA 1 — Formulário de anamnese (aluno):
Criar src/app/aluno/ficha-saude/page.tsx:
- Formulário em seções: Dados gerais, Objetivo, Lesões, Cirurgias, Condições crônicas,
  Medicamentos, Alergias, Restrições, Contato de emergência
- Lesões/cirurgias/condições/medicamentos como listas dinâmicas (add/remover itens → JSONB)
- Checkbox de consentimento (termo LGPD) com data
- Salvar/atualizar em health_records (upsert por user_id)
- Adicionar "Ficha de Saúde" no menu lateral do aluno
- Cores daimach

TAREFA 2 — Onboarding obrigatório:
- No primeiro login do aluno, se não existe health_records, redirecionar/sugerir preencher
  a ficha antes de reservar aulas (não bloquear totalmente, mas avisar)

TAREFA 3 — Visualização pelo admin/professor:
Criar src/app/admin/ficha-saude/[userId]/page.tsx (e link a partir de admin/alunos):
- Mostrar a ficha completa do aluno (somente leitura para professor; admin pode editar)
- Destaque visual para RESTRIÇÕES e "sem liberação médica" (alerta vermelho)
- Botão para exportar a ficha em PDF (header Daimach)

TAREFA 4 — Acesso do fisioterapeuta:
- O fisioterapeuta também acessa a ficha dos alunos atendidos (base para o prontuário MD07)

TESTE (Claude in Chrome):
1. Login aluno → /aluno/ficha-saude → preencher lesões/medicamentos → salvar
2. Login admin → abrir ficha do aluno → vê dados + restrições destacadas
3. Editar como admin → salva
4. Exportar PDF da ficha
5. npm run build sem erros

Commit: "md05: anamnese e ficha de saude"
```

---

## ✅ CHECKPOINT MD 05
- [ ] Aluno preenche ficha (lesões, cirurgias, medicamentos, restrições)
- [ ] Consentimento LGPD registrado
- [ ] Onboarding sugere preencher a ficha
- [ ] Admin/professor visualizam a ficha (restrições em destaque)
- [ ] Export PDF da ficha
- [ ] Fisioterapeuta acessa fichas dos atendidos

---

## OBSERVAÇÕES
- Dados de saúde são sensíveis (LGPD). Quando reativar RLS no futuro, restringir health_records
  ao dono e aos papéis profissionais.
- O termo de consentimento protege o estúdio juridicamente — vale ter texto revisado.
- Esta ficha alimenta a Avaliação Física (MD06) e o Prontuário de Fisio (MD07).
