# 📊 MD 06 — AVALIAÇÃO FÍSICA COMPLETA

**Objetivo:** Evoluir a tela de "Evolução" atual (só peso/altura/IMC) para avaliações
físicas completas: medidas detalhadas, fotos de postura (antes/depois), gráficos de
progresso ao longo do tempo, e notas do profissional.

**Reaproveita:** Supabase Storage (upload de fotos) — o projeto já usa Storage.

---

## CONTEXTO TÉCNICO
- Hoje existe `physical_evaluations_pilates` (peso, altura, measurements JSONB, image_url).
  Vamos expandir e construir a UI completa com gráficos (recharts/chart.js).
- Fotos no Supabase Storage (bucket privado) — postura frente/lado/costas.

---

## PASSO 1 — SQL no Supabase (cole e RUN)

```sql
-- Expandir avaliações físicas
ALTER TABLE physical_evaluations_pilates ADD COLUMN IF NOT EXISTS evaluator_id UUID REFERENCES users_pilates(id);
ALTER TABLE physical_evaluations_pilates ADD COLUMN IF NOT EXISTS body_fat DECIMAL(5,2);
ALTER TABLE physical_evaluations_pilates ADD COLUMN IF NOT EXISTS muscle_mass DECIMAL(5,2);
ALTER TABLE physical_evaluations_pilates ADD COLUMN IF NOT EXISTS photos JSONB;   -- {frente, lado, costas}
ALTER TABLE physical_evaluations_pilates ADD COLUMN IF NOT EXISTS posture_assessment TEXT;
ALTER TABLE physical_evaluations_pilates ADD COLUMN IF NOT EXISTS flexibility_notes TEXT;
ALTER TABLE physical_evaluations_pilates ADD COLUMN IF NOT EXISTS strength_notes TEXT;
ALTER TABLE physical_evaluations_pilates ADD COLUMN IF NOT EXISTS goals TEXT;

-- measurements JSONB guardará: {bust, waist, hip, thigh_r, thigh_l, arm_r, arm_l, ...}

ALTER TABLE physical_evaluations_pilates DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_eval_user_date ON physical_evaluations_pilates(user_id, evaluation_date DESC);
```

**Storage:** criar bucket `evaluations` (privado) no painel Supabase → Storage → New bucket.

---

## PASSO 2 — COMANDO PARA O CLAUDE CODE

```
MD 06 — AVALIAÇÃO FÍSICA COMPLETA

Projeto: C:\Users\willa\pilates-app
Autorização total. PRESERVE o que já funciona.
Instalar gráfico se faltar: npm install recharts --legacy-peer-deps

CONTEXTO: physical_evaluations_pilates expandida (body_fat, muscle_mass, photos JSONB,
posture, flexibility, strength, goals, measurements JSONB). Bucket Storage 'evaluations'.

TAREFA 1 — Nova avaliação (admin/professor/fisio):
Criar src/app/admin/avaliacoes/nova/page.tsx (e atalho a partir de admin/alunos):
- Selecionar aluno
- Campos: data, peso, altura, IMC (auto-calculado), % gordura, massa muscular
- Medidas (measurements): busto, cintura, quadril, coxa D/E, braço D/E (inputs numéricos)
- Upload de 3 fotos (frente/lado/costas) → Supabase Storage bucket 'evaluations'
  (salvar paths em photos JSONB; gerar signed URLs para exibir)
- Campos de texto: avaliação postural, flexibilidade, força, objetivos, notas
- Salvar em physical_evaluations_pilates com evaluator_id = profissional logado

TAREFA 2 — Histórico e gráficos (aluno e profissional):
Reescrever src/app/aluno/evolucao/page.tsx (e versão admin):
- Card da última avaliação (como hoje, mas completo)
- Gráficos com recharts: peso ao longo do tempo, % gordura, cintura, IMC
  (linha temporal usando todas as avaliações do aluno)
- Comparação antes/depois das fotos (duas avaliações lado a lado)
- Lista de todas as avaliações (data + resumo) com "ver detalhes"

TAREFA 3 — Comparativo de fotos:
- Tela que mostra foto da 1ª avaliação vs última (frente/lado/costas) lado a lado
- Signed URLs do Storage (bucket privado), expiração curta

TAREFA 4 — Export PDF:
- Botão "Exportar avaliação em PDF" (header Daimach, logo, dados, medidas, gráfico, fotos)
- Reaproveitar o helper de PDF do Sprint 4 (report-export.ts)

TESTE (Claude in Chrome):
1. Admin → nova avaliação para um aluno → preencher medidas + upload 3 fotos → salvar
2. Criar uma 2ª avaliação com valores diferentes
3. /aluno/evolucao → gráficos mostram a evolução das 2 avaliações
4. Comparativo de fotos antes/depois funciona
5. Export PDF da avaliação
6. npm run build sem erros

Commit: "md06: avaliacao fisica completa (medidas+fotos+graficos)"
```

---

## ✅ CHECKPOINT MD 06
- [ ] Nova avaliação com medidas detalhadas e 3 fotos
- [ ] Fotos salvas no Storage (bucket privado) e exibidas via signed URL
- [ ] Gráficos de evolução (peso, gordura, cintura, IMC)
- [ ] Comparativo de fotos antes/depois
- [ ] Export PDF da avaliação
- [ ] Aluno vê sua evolução; profissional cria/edita

---

## OBSERVAÇÕES
- Fotos de corpo são dado sensível — bucket **privado** + signed URL com expiração.
- Calcular IMC automaticamente: peso / (altura_m²).
- Gráficos ficam ótimos com recharts (já disponível no ambiente de artifacts/Next).
