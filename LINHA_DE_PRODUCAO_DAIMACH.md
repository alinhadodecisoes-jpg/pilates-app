# 🏭 LINHA DE PRODUÇÃO — DAIMACH.MOVEMENT

> **COMO USAR:** Execute UM sprint por vez no Claude Code. Ao terminar, faça o teste
> do checkpoint. Só passe pro próximo sprint quando o atual estiver 100% validado.
> NÃO pule a ordem. Cada sprint depende do anterior.

**Projeto:** `C:\Users\willa\pilates-app`
**Supabase:** `https://app.supabase.com/project/qgqzbfyvhhnptmfgjpnd`
**Regra de ouro:** Preservar tudo que já funciona (login, dashboards, role detection).

**Decisões já tomadas:**
- Valor da mensalidade: vem do plano, mas admin pode editar por aluno (+ promoção)
- Relatórios: gerar Excel (.xlsx) E PDF
- Reposição: aluno SOLICITA, admin APROVA (admin controla os slots disponíveis)

**Ordem de produção:**
1. SPRINT 1 — Conectar dados reais (admin vê aulas/alunos/turmas de verdade)
2. SPRINT 2 — Criar páginas 404 (professores + fisioterapia)
3. SPRINT 3 — Fluxo de reposição (aluno solicita → admin aprova)
4. SPRINT 4 — Financeiro completo (valor por aluno, baixa, histórico, planilha)

---

# 🔵 SPRINT 1 — CONECTAR DADOS REAIS

**Problema:** Admin lista alunos só com ID (sem nome/telefone). Turmas aparecem vazias.
As aulas que o aluno vê ("Ana Clara · Sala 1") são fixas no código, não vêm do banco.
Admin e aluno não compartilham os mesmos dados.

**Objetivo:** Tudo que aparece na tela deve vir do banco (Supabase), e admin enxerga
os dados reais de todos os alunos.

---

## PASSO 1.1 — SQL no Supabase (cole no SQL Editor e RUN)

```sql
-- Adicionar campos de identificação que faltam em users_pilates
ALTER TABLE users_pilates ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE users_pilates ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users_pilates ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users_pilates ADD COLUMN IF NOT EXISTS monthly_value DECIMAL(10,2);

-- Preencher email e nome a partir do auth.users (sincronizar)
UPDATE users_pilates up
SET email = au.email,
    full_name = COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email,'@',1))
FROM auth.users au
WHERE up.id = au.id AND (up.email IS NULL OR up.full_name IS NULL);

-- Criar 2 professoras de exemplo (Ana Clara e Daiana) se não existirem
-- (elas precisam existir como usuário para as turmas referenciarem)
-- ATENÇÃO: cria só o perfil; o login delas pode ser criado depois pelo admin

-- Inserir turmas de exemplo (vinculadas a um professor real existente)
-- Primeiro pega um id de professor/admin para usar como professor_id provisório
INSERT INTO classes_pilates (professor_id, name, day_of_week, time_start, time_end, capacity)
SELECT 
  (SELECT id FROM users_pilates WHERE role IN ('admin','professor') LIMIT 1),
  turma.name, turma.dow, turma.t_start::time, turma.t_end::time, 4
FROM (VALUES
  ('Pilates Manhã - Ana Clara', 1, '09:00', '10:00'),
  ('Pilates Tarde - Daiana', 1, '18:00', '19:00'),
  ('Pilates Manhã - Ana Clara', 3, '08:00', '09:00'),
  ('Pilates Noite - Daiana', 4, '19:00', '20:00'),
  ('Pilates Manhã - Ana Clara', 5, '07:00', '08:00')
) AS turma(name, dow, t_start, t_end)
WHERE NOT EXISTS (SELECT 1 FROM classes_pilates LIMIT 1);

-- Verificar
SELECT id, full_name, email, role, status FROM users_pilates ORDER BY role;
SELECT id, name, day_of_week, time_start, time_end, capacity FROM classes_pilates;
```

---

## PASSO 1.2 — Comando para o Claude Code (cole inteiro)

```
SPRINT 1 — CONECTAR DADOS REAIS AO PAINEL ADMIN

Projeto: C:\Users\willa\pilates-app
Autorização total: execute tudo, não pergunte, teste no navegador ao final.
PRESERVE tudo que já funciona (login, role detection, dashboards).

CONTEXTO: A tabela users_pilates agora tem colunas: full_name, email, phone, 
monthly_value, role, status, plan_id. A tabela classes_pilates tem turmas reais.

TAREFA 1 — Admin/Alunos mostrar dados reais:
Abrir src/app/admin/alunos/page.tsx
- Trocar a query para buscar: id, full_name, email, phone, status, plan_id, monthly_value
- Na tabela, mostrar COLUNAS: Nome (full_name), Email, Telefone, Plano, Valor (R$), Status, Ações
- Se full_name for null, mostrar email; se email null, mostrar "Sem nome"
- Botão "Editar" abre modal com campos editáveis (nome, telefone, status, plano, valor mensal)
- Botão "Deletar" pede confirmação antes
- Busca por nome/email no campo de busca (não por ID)

TAREFA 2 — Admin/Turmas mostrar turmas reais:
Abrir src/app/admin/turmas/page.tsx
- Buscar de classes_pilates: id, name, day_of_week, time_start, time_end, capacity, professor_id
- Agrupar por dia da semana (0=Dom...6=Sáb OU 1=Seg...7=Dom, confirmar no banco)
- Em cada dia, mostrar as turmas com horário, nome, capacidade e quantos alunos inscritos
- Para contar inscritos: SELECT count de enrollments_pilates WHERE class_id = X
- "Nova Turma" abre modal: nome, dia, hora início, hora fim, capacidade, professor (dropdown de users_pilates role=professor)

TAREFA 3 — Admin/Dashboard KPIs reais:
Abrir src/app/admin/dashboard/page.tsx
- Total de Alunos: count users_pilates WHERE role='aluno'
- Total de Turmas: count classes_pilates
- Inadimplentes: count users_pilates WHERE status='inadimplente'
- (Faturamento fica zerado por enquanto, será no Sprint 4)

TAREFA 4 — Aluno: poder se inscrever em turma:
Abrir src/app/aluno/minhas-aulas/page.tsx
- Buscar enrollments_pilates do aluno logado (JOIN classes_pilates) para mostrar aulas reais
- Se o aluno não tem nenhuma inscrição, mostrar botão "Ver turmas disponíveis"
- Listar turmas com vaga (capacity > inscritos) e botão "Inscrever-se"
- Ao inscrever: INSERT em enrollments_pilates (user_id, class_id)

TESTE (use Claude in Chrome):
1. Login admin (alinhado.decisoes@gmail.com) → /admin/alunos deve mostrar nomes/emails reais
2. /admin/turmas → deve mostrar as 5 turmas distribuídas nos dias
3. /admin/dashboard → Total de Alunos e Turmas com números reais
4. Login aluno → /aluno/minhas-aulas → inscrever em uma turma → admin vê o inscrito

Build (npm run build) antes de testar. Commit ao final: "sprint1: dados reais admin+aluno"
```

---

## ✅ CHECKPOINT SPRINT 1
- [ ] Admin/Alunos mostra nome, email, telefone (não só ID)
- [ ] Editar aluno funciona (salva no banco)
- [ ] Admin/Turmas mostra as turmas reais nos dias certos
- [ ] Dashboard mostra contagem real
- [ ] Aluno consegue se inscrever numa turma
- [ ] Admin vê o aluno inscrito

**Só avance para o Sprint 2 quando tudo acima estiver ✅**

---

# 🟢 SPRINT 2 — CRIAR PÁGINAS 404 (Professores + Fisioterapia)

**Problema:** `/admin/professores` e `/admin/fisioterapia` dão 404.

---

## PASSO 2.1 — Comando para o Claude Code (cole inteiro)

```
SPRINT 2 — CRIAR PÁGINAS PROFESSORES E FISIOTERAPIA

Projeto: C:\Users\willa\pilates-app
Autorização total. PRESERVE o que já funciona.

TAREFA 1 — Criar src/app/admin/professores/page.tsx:
Página de gestão de professores (mesmo layout visual do admin/alunos).
- Listar users_pilates WHERE role IN ('professor','fisioterapeuta')
- Colunas: Nome, Email, Telefone, Função (professor/fisioterapeuta), Turmas que leciona, Ações
- "Novo Professor" abre modal: nome, email, senha, telefone, função (dropdown professor/fisioterapeuta)
  → ao salvar: supabase.auth.signUp + INSERT users_pilates com role escolhido
- Editar/Deletar com confirmação
- Usar cores daimach (daimach-primary, daimach-dark, etc) e o layout admin existente

TAREFA 2 — Criar src/app/admin/fisioterapia/page.tsx:
Página de gestão de sessões de fisioterapia.
- Listar physical_therapy_sessions (JOIN users_pilates para nome do aluno e do terapeuta)
- Colunas: Aluno, Fisioterapeuta, Data, Tipo (therapy_type), Custo, Status, Ações
- "Nova Sessão" abre modal: aluno (dropdown), fisioterapeuta (dropdown role=fisioterapeuta), 
  data, tipo de terapia (texto), duração, custo, status (scheduled/completed/canceled)
  → INSERT em physical_therapy_sessions
- Filtro por status (agendada/concluída/cancelada)
- Cores daimach + layout admin

TAREFA 3 — Criar src/app/aluno/fisioterapia/page.tsx:
Painel de fisioterapia DO ALUNO (visão dele).
- Buscar physical_therapy_sessions WHERE user_id = aluno logado
- Mostrar cards: próximas sessões (status scheduled) e histórico (completed)
- Cada card: data, tipo, fisioterapeuta, status
- Adicionar item "Fisioterapia" no menu lateral do aluno (Sidebar) se ainda não existe
- Cores daimach

TESTE (Claude in Chrome):
1. Login admin → /admin/professores carrega (não 404) → criar um professor de teste
2. /admin/fisioterapia carrega → criar uma sessão de teste
3. Login aluno → /aluno/fisioterapia → vê a sessão criada para ele
4. Menu lateral do aluno tem "Fisioterapia"

Build antes. Commit: "sprint2: paginas professores + fisioterapia (admin e aluno)"
```

---

## ✅ CHECKPOINT SPRINT 2
- [ ] `/admin/professores` carrega (sem 404) e cria professor
- [ ] `/admin/fisioterapia` carrega (sem 404) e cria sessão
- [ ] `/aluno/fisioterapia` mostra sessões do aluno
- [ ] Menu do aluno tem "Fisioterapia"

---

# 🟡 SPRINT 3 — FLUXO DE REPOSIÇÃO (aluno solicita → admin aprova)

**Conceito:** O aluno NÃO marca reposição sozinho. Ele SOLICITA escolhendo até 3 slots
que o admin abriu. O admin aprova ou recusa. Você mantém o controle total.

---

## PASSO 3.1 — SQL no Supabase (cole e RUN)

```sql
-- Slots de reposição que o ADMIN abre
CREATE TABLE IF NOT EXISTS reposition_slots (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  class_id BIGINT REFERENCES classes_pilates(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  capacity INT DEFAULT 4,
  is_open BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Solicitações de reposição feitas pelo ALUNO
CREATE TABLE IF NOT EXISTS reposition_requests (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES users_pilates(id) ON DELETE CASCADE,
  slot_id BIGINT REFERENCES reposition_slots(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES users_pilates(id),
  notes TEXT
);

ALTER TABLE reposition_slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE reposition_requests DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_repo_slots_date ON reposition_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_repo_req_user ON reposition_requests(user_id, status);

-- Slots de exemplo
INSERT INTO reposition_slots (class_id, slot_date, time_start, time_end, capacity)
SELECT (SELECT id FROM classes_pilates LIMIT 1), CURRENT_DATE + 3, '09:00','10:00', 4
WHERE NOT EXISTS (SELECT 1 FROM reposition_slots LIMIT 1);

SELECT * FROM reposition_slots;
```

---

## PASSO 3.2 — Comando para o Claude Code (cole inteiro)

```
SPRINT 3 — FLUXO DE REPOSIÇÃO (solicitar → aprovar)

Projeto: C:\Users\willa\pilates-app
Autorização total. PRESERVE o que já funciona.

CONTEXTO: Duas tabelas novas: reposition_slots (slots que admin abre) e 
reposition_requests (pedidos do aluno, status pending/approved/rejected).

TAREFA 1 — Admin abre slots de reposição:
Criar/editar src/app/admin/reposicoes/page.tsx
- Listar reposition_slots (data, horário, capacidade, quantos já solicitaram, is_open)
- "Abrir Novo Slot": modal com class_id (dropdown turmas), data, hora início/fim, capacidade
  → INSERT em reposition_slots
- Toggle is_open (abrir/fechar slot)
- Adicionar "Reposições" no menu lateral admin se não existe

TAREFA 2 — Admin aprova/recusa pedidos:
Na mesma página (ou aba), seção "Solicitações Pendentes":
- Listar reposition_requests WHERE status='pending' (JOIN aluno + slot)
- Mostrar: nome do aluno, slot solicitado (data/hora), data do pedido
- Botões "Aprovar" e "Recusar"
  → Aprovar: UPDATE status='approved', reviewed_at=now(), reviewed_by=admin_id
    E criar registro em attendances_pilates com status='replacement'
  → Recusar: UPDATE status='rejected'

TAREFA 3 — Aluno solicita reposição:
Reescrever src/app/aluno/reposicoes/page.tsx
- REMOVER o botão "Marcar" direto que existe hoje (aluno não marca sozinho!)
- Mostrar slots abertos: reposition_slots WHERE is_open=true AND slot_date >= hoje
- Aluno seleciona até 3 slots e clica "Solicitar Reposição"
  → INSERT em reposition_requests (user_id, slot_id, status='pending') para cada selecionado
- Mostrar também "Minhas Solicitações" com status (pendente/aprovada/recusada) e cor
  (amarelo=pendente, verde=aprovada, vermelho=recusada)

TESTE (Claude in Chrome):
1. Login admin → /admin/reposicoes → abrir um slot novo
2. Login aluno → /aluno/reposicoes → solicitar esse slot → vê "pendente"
3. Login admin → vê o pedido pendente → aprovar
4. Login aluno → vê "aprovada" + aula aparece em minhas-aulas como Reposição

Build antes. Commit: "sprint3: fluxo reposicao solicitar-aprovar"
```

---

## ✅ CHECKPOINT SPRINT 3
- [ ] Admin abre slots de reposição
- [ ] Aluno vê só os slots abertos e solicita (não marca direto)
- [ ] Admin aprova/recusa
- [ ] Aprovação vira aula de reposição em minhas-aulas
- [ ] Aluno acompanha status do pedido

---

# 🔴 SPRINT 4 — FINANCEIRO COMPLETO

**O mais robusto.** Valor por aluno (do plano + editável + promoção), dar baixa em
pagamento, histórico por aluno, e exportar Excel + PDF. Aluno vê o próprio financeiro.

---

## PASSO 4.1 — SQL no Supabase (cole e RUN)

```sql
-- Garantir colunas de promoção/valor no aluno
ALTER TABLE users_pilates ADD COLUMN IF NOT EXISTS monthly_value DECIMAL(10,2);
ALTER TABLE users_pilates ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5,2) DEFAULT 0;

-- payment_history já existe (Sprint 2 anterior). Garantir colunas:
ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS reference_month DATE;
ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS paid_by_admin UUID REFERENCES users_pilates(id);

-- Inicializar monthly_value a partir do plano (quem não tem valor manual)
UPDATE users_pilates up
SET monthly_value = pp.price
FROM plans_pilates pp
WHERE up.plan_id = pp.id AND up.monthly_value IS NULL;

SELECT id, full_name, plan_id, monthly_value, discount_percent, status FROM users_pilates WHERE role='aluno';
```

---

## PASSO 4.2 — Comando para o Claude Code (cole inteiro)

```
SPRINT 4 — FINANCEIRO COMPLETO + RELATÓRIOS

Projeto: C:\Users\willa\pilates-app
Autorização total. PRESERVE tudo. Instalar libs se precisar:
npm install xlsx jspdf jspdf-autotable --legacy-peer-deps

DECISÕES:
- Valor da mensalidade vem do plano, MAS admin pode editar por aluno (campo monthly_value)
- Promoção: campo discount_percent no aluno (desconto %)
- Exportar relatórios em Excel (.xlsx) E PDF

TAREFA 1 — Admin/Financeiro completo (reescrever src/app/admin/financeiro/page.tsx):
Seções:
A) Cards de topo (selecionável por período: 30/60/90 dias):
   - Receita recebida (sum payment_history status=paid no período)
   - Pendente (sum dos alunos com status != em dia, valor mensal)
   - Total de alunos em dia / pendentes / inadimplentes
B) Tabela de alunos com financeiro:
   - Nome, Plano, Valor mensal (editável inline), Desconto %, Valor final, Status pagamento
   - Botão "Dar Baixa" → registra payment_history (paid) do mês atual + marca status='ativo'
   - Botão "Ver Histórico" → abre modal com payment_history daquele aluno (até 24 meses)
   - Botão "Editar Valor" → muda monthly_value e discount_percent do aluno
C) Exportar:
   - "Exportar Excel" (xlsx): planilha com todos os alunos, valores, status, telefone, email
   - "Exportar PDF" (jspdf + autotable): relatório bonito com header Daimach.Movement, 
     logo, data de geração, tabela de alunos e totais

TAREFA 2 — Relatórios (reescrever src/app/admin/relatorios/page.tsx):
- Selecionar aluno (dropdown com nomes reais)
- Mostrar resumo: dados pessoais, plano, valor, histórico de pagamentos, aulas frequentadas,
  sessões de fisioterapia
- Botão "Gerar Excel" e "Gerar PDF" do relatório individual do aluno
- Botão "Relatório Geral" (todos os alunos) em Excel e PDF
- PDF com header Daimach, logo (public/images/logo-daimach-oficial.jpeg), cores daimach

TAREFA 3 — Aluno vê o próprio financeiro:
Criar src/app/aluno/financeiro/page.tsx
- Card de status: "Em dia" (verde) / "Pendente" (amarelo) / "Inadimplente" (vermelho)
- Valor da mensalidade dele, plano, próximo vencimento
- Histórico de pagamentos dele (payment_history WHERE user_id = ele)
- Adicionar "Financeiro" no menu lateral do aluno
- Aluno NÃO pode editar nada aqui, só visualizar

TAREFA 4 — Helper de relatórios:
Criar src/lib/pilates/report-export.ts com funções:
- exportToExcel(data, filename) usando xlsx
- exportToPDF(data, title, filename) usando jspdf + autotable + logo daimach
Reutilizável pelo financeiro e relatórios.

TESTE (Claude in Chrome):
1. Login admin → /admin/financeiro → editar valor de um aluno → dar baixa → ver no histórico
2. Exportar Excel → arquivo baixa. Exportar PDF → arquivo baixa com logo
3. /admin/relatorios → selecionar aluno → gerar PDF individual
4. Login aluno → /aluno/financeiro → vê status, valor e histórico dele
5. Menu do aluno tem "Financeiro"

Build antes. Commit: "sprint4: financeiro completo + relatorios excel/pdf"
```

---

## ✅ CHECKPOINT SPRINT 4
- [ ] Admin edita valor mensal por aluno (+ desconto %)
- [ ] Admin dá baixa em pagamento (vai pro histórico)
- [ ] Admin vê histórico de cada aluno (até 24 meses)
- [ ] Receita/pendente por período (30/60/90 dias)
- [ ] Exporta Excel e PDF (geral e individual)
- [ ] Aluno vê o próprio financeiro (só leitura)
- [ ] Menu do aluno tem "Financeiro"

---

# 🎯 ORDEM FINAL DE EXECUÇÃO

```
Sprint 1 → testar → ✅ → Sprint 2 → testar → ✅ → Sprint 3 → testar → ✅ → Sprint 4 → testar → ✅
```

**Regra:** nunca execute dois sprints juntos. Um de cada vez, testando no meio.
Se um sprint quebrar algo, conserte antes de avançar. Cada sprint termina com `git commit`.

---

## 📌 OBSERVAÇÕES IMPORTANTES
- Sempre `npm run build` antes de testar (pega erro de TypeScript cedo)
- Sempre testar em **aba anônima** (limpa cache/sessão)
- Se aparecer erro 406/409: provavelmente RLS ligado numa tabela nova → rodar
  `ALTER TABLE <tabela> DISABLE ROW LEVEL SECURITY;` no Supabase
- Confirmar no banco se day_of_week é 0-6 (Dom-Sáb) ou 1-7 antes de mapear os dias
- Manter o logo em `public/images/logo-daimach-oficial.jpeg` para os PDFs
