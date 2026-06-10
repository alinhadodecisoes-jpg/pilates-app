# 🏥 MD 07 — PRONTUÁRIO DE FISIOTERAPIA

**Objetivo:** Prontuário clínico para os atendimentos de fisioterapia: queixa principal,
diagnóstico, plano de tratamento, evolução por sessão (SOAP), e histórico. Diferente do
Pilates — é registro clínico profissional.

**Depende de:** MD05 (ficha de saúde) e da tabela `physical_therapy_sessions` (Sprint 2).

---

## CONTEXTO TÉCNICO
- Padrão clínico **SOAP** (Subjetivo, Objetivo, Avaliação, Plano) por evolução.
- Um aluno pode ter um **caso/tratamento** (queixa) com várias **evoluções** (sessões).
- Acesso restrito ao fisioterapeuta e admin (dado clínico sensível, LGPD).

---

## PASSO 1 — SQL no Supabase (cole e RUN)

```sql
-- Caso de tratamento (uma queixa/condição em tratamento)
CREATE TABLE IF NOT EXISTS physio_cases (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES users_pilates(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES users_pilates(id),
  chief_complaint TEXT,            -- queixa principal
  diagnosis TEXT,                  -- diagnóstico/hipótese
  treatment_plan TEXT,            -- plano de tratamento
  start_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active',    -- active | discharged | paused
  discharge_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Evolução por sessão (SOAP)
CREATE TABLE IF NOT EXISTS physio_evolutions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  case_id BIGINT NOT NULL REFERENCES physio_cases(id) ON DELETE CASCADE,
  session_id BIGINT REFERENCES physical_therapy_sessions(id),
  evolution_date TIMESTAMP DEFAULT NOW(),
  subjective TEXT,                 -- S: relato do paciente
  objective TEXT,                  -- O: achados/medidas
  assessment TEXT,                 -- A: avaliação do profissional
  plan TEXT,                       -- P: conduta/próximos passos
  pain_scale INT,                  -- 0-10
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

## PASSO 2 — COMANDO PARA O CLAUDE CODE

```
MD 07 — PRONTUÁRIO DE FISIOTERAPIA

Projeto: C:\Users\willa\pilates-app
Autorização total. PRESERVE o que já funciona.

CONTEXTO: Tabelas novas physio_cases (caso/tratamento) e physio_evolutions (SOAP por sessão).
Ligadas a users_pilates e physical_therapy_sessions (Sprint 2). Acesso: fisioterapeuta e admin.

TAREFA 1 — Lista de pacientes em tratamento (fisio/admin):
Criar src/app/fisio/pacientes/page.tsx (e link no painel admin/fisioterapia):
- Listar physio_cases (JOIN aluno) com queixa, diagnóstico, status, nº de evoluções
- Filtro por status (ativo/alta/pausado)
- "Novo Caso": modal selecionar aluno + queixa principal + diagnóstico + plano

TAREFA 2 — Prontuário do paciente:
Criar src/app/fisio/paciente/[caseId]/page.tsx:
- Topo: dados do aluno + resumo do caso (queixa, diagnóstico, plano, status)
- Mostrar a Ficha de Saúde (MD05) resumida (lesões/restrições) em destaque
- Linha do tempo de evoluções (SOAP) — mais recente primeiro
- "Nova Evolução": formulário SOAP (Subjetivo, Objetivo, Avaliação, Plano) +
  escala de dor 0-10 + técnicas usadas + vincular a uma physical_therapy_session se houver
- Botão "Dar Alta": status='discharged' + discharge_notes

TAREFA 3 — Acesso e papel:
- Garantir que role 'fisioterapeuta' acessa /fisio/* (atualizar usePilatesAuth/proxy se preciso)
- Admin também acessa. Aluno NÃO acessa o prontuário clínico (só vê suas sessões em /aluno/fisioterapia).
- Adicionar menu lateral para o papel fisioterapeuta (Pacientes, Agenda, etc)

TAREFA 4 — Export PDF do prontuário:
- Botão "Exportar Prontuário em PDF" (header Daimach, dados do caso + todas as evoluções SOAP)
- Reaproveitar helper report-export.ts (Sprint 4)

TESTE (Claude in Chrome):
1. Login admin/fisio → /fisio/pacientes → criar novo caso para um aluno
2. Abrir prontuário → adicionar 2 evoluções SOAP com escala de dor
3. Ficha de saúde do aluno aparece resumida no topo
4. Dar alta → status muda para discharged
5. Export PDF do prontuário
6. npm run build sem erros

Commit: "md07: prontuario de fisioterapia (casos + evolucoes SOAP)"
```

---

## ✅ CHECKPOINT MD 07
- [ ] Criar caso de tratamento (queixa, diagnóstico, plano)
- [ ] Prontuário com linha do tempo de evoluções SOAP
- [ ] Escala de dor e técnicas registradas
- [ ] Ficha de saúde (MD05) integrada no topo
- [ ] Dar alta funciona
- [ ] Export PDF do prontuário
- [ ] Papel fisioterapeuta acessa /fisio/*; aluno não acessa prontuário

---

## OBSERVAÇÕES
- Prontuário clínico é dado sensível e tem implicações legais — acesso restrito e log de quem editou.
- SOAP é o padrão usado por fisioterapeutas; facilita a adoção pela profissional.
- Integra com a agenda (MD04) e sessões de fisio (Sprint 2) para um fluxo completo.
