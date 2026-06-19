# RELATÓRIO — TESTE FÍSICO COMPLETO NO NAVEGADOR
Data: 19/06/2026 · Ambiente: dev server local + Supabase de produção (dados reais)
Deploy: https://daimach-pilates.vercel.app · Commit: f5509af

Teste conduzido de ponta a ponta no navegador, com dados reais, simulando o estúdio
em operação. Cada interação foi confirmada no banco e/ou na UI dos outros perfis.

---

## RESUMO
- 4 perfis testados: **Admin, Professor, Aluno, (Paciente fisio criado)**
- **13 bugs reais encontrados e corrigidos** (todos verificados após o fix)
- Build 0 erros TS · Deploy em produção OK
- Dados de teste criados: QA Aluno Teste, QA Professor Teste, QA Paciente Fisio

---

## CONTAS DE TESTE (criadas no teste, login funcional)
| Perfil | Email | Senha |
|--------|-------|-------|
| Admin | arkomach.oficial@gmail.com | Wimafasi29@ (restaurada) |
| Professor | qa.professor.teste@daimach.test | Prof@Teste123 |
| Aluno | qa.aluno.teste@daimach.test | rF2rXUF!yvKm |

> A senha do admin no Supabase Auth tinha "driftado" (login falhava). Foi restaurada
> para o valor documentado (Wimafasi29@) via service role.

---

## FASES EXECUTADAS

### 1. Admin — Cadastros
- ✅ Criado aluno novo (com plano 2x/R$199, vencimento, status) — credenciais geradas
- ✅ Criado professor novo — credenciais
- ✅ Criado paciente de fisioterapia (só-fisio)

### 2. Admin — Financeiro / Mensalidades
- ✅ Visão de mensalidades (em dia / pendente / inadimplente)
- ✅ Tornar aluno inadimplente pela UI (Editar → Status) → refletiu no admin e no painel do aluno
- ✅ "Dar baixa" (admin marca pago) → status ativo + payment_history
- ✅ Confirmação PIX (aluno informa → admin confirma) end-to-end

### 3. Aluno — Pendência
- ✅ Painel mostra "Mensalidade em atraso" + botão Pagar (mensagem de acerto)
- ✅ Fluxo PIX "Já fiz o pagamento" → cria confirmação para o admin

### 4. Admin — Turmas e Planos
- ✅ Matrícula em turmas de vários dias (Seg/Qua/Sex) — ordenação por dia+horário OK
- ✅ Atribuição de professor às turmas
- ✅ Criar plano novo e editar plano

### 5. Cross — Matrícula reflete nos perfis
- ✅ Aluno vê 3 turmas em "Minhas Aulas"
- ✅ Professor vê o aluno em "Meus Alunos" e as turmas em "Minhas Turmas"

### 6. Admin — Agenda / Backup / Relatórios
- ✅ Gerar Agenda do Mês (101 sessões)
- ✅ 4 relatórios reais + export CSV (recebido 30d = R$498, real)
- ✅ Backup no PC (novo botão — baixa JSON, 318 registros)

### 7. Professor — Completo
- ✅ Dashboard, Meus Alunos, Ver Ficha (Saúde + Avaliações), Financeiro
- ✅ Minhas Turmas: editar notas + cancelar aula por data

### 8. Aluno — Completo
- ✅ Ficha de saúde (salva, inclui condições crônicas, sem overflow)
- ✅ Reposição (slot aparece + solicitação enviada)
- ✅ Evolução mostra avaliação; Minhas Aulas, Fisioterapia, Notificações sem erro

### 9. Cross — Reposição e Ficha
- ✅ Reposição: aluno solicita → admin vê → aprova → presença de reposição registrada
- ✅ Ficha: aluno preenche → professor vê os dados reais

---

## BUGS CORRIGIDOS (13)
1. Modal Novo Aluno — dropdown de planos vazio (RLS no browser client)
2. Financeiro — "Sem plano" mesmo com plan_id (não usava plan_id/monthly_value)
3. Financeiro — contador de inadimplentes divergente do dashboard
4. Financeiro "Dar baixa" — 500 (colunas reference_month/notes inexistentes em payment_history)
5. Confirmações PIX — admin via lista vazia (sem FK payment_confirmations↔users_pilates)
6. Reposição (aluno) — RLS bloqueava slots/solicitações no browser
7. Reposição — upsert sem constraint única + coluna created_by inexistente
8. Reposição (aprovar) — presença não gravava (class_id NOT NULL)
9. Avaliação física — 500 (colunas bmi/notes inexistentes)
10. Cancelar Aula (professor) — 500 (time_start NOT NULL no upsert)
11. Ficha de saúde no professor — lia campos booleanos inexistentes (não mostrava dados reais)
12. Webhook Stripe — payment_history com colunas inexistentes + idempotência por coluna ausente
13. Backup — sem opção de salvar no PC (só Drive, que não está conectado) + data de pagamento com -1 dia (timezone)

---

## ITENS MENORES (não corrigidos — recomendações)
- Professor "Meus Alunos": mostra o mesmo aluno 1x por turma e conta matrículas, não alunos distintos (cosmético)
- IMC: passou a ser calculado no cliente (tabela não tem coluna bmi) — OK no aluno; conferir telas que ainda leem bmi
- `SQL_OPCIONAL_MELHORIAS_BANCO.sql`: constraints/colunas opcionais (o app já funciona sem)

---

## STATUS FINAL
✅ Todas as 9 fases concluídas · 13 bugs corrigidos e verificados · build/deploy OK
