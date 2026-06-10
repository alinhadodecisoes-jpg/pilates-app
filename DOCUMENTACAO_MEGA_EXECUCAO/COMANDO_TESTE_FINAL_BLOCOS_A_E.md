EXECUÇÃO FINAL — BLOCOS A-E COM TESTES NAVEGADOR (Pilates MVP)

Projeto: C:\Users\willa\pilates-app
Servidor: http://localhost:3001 (já rodando)
Status SQL: ✅ Executado (A1, B1, C1)
Status Chaves: ✅ Completo (.env.local pronto)
Status Stripe: ✅ 2 price_ids confirmados

===================================
AUTORIZAÇÃO TOTAL: Execute tudo sozinho, teste no navegador, não pergunte nada.
===================================

CONTEXTO:
- Build deve passar (npm run build)
- Servidor deve rodar (npm run dev)
- Testar em navegador anônimo com Google OAuth (alinhado.decisoes@gmail.com = admin)
- Price IDs já existem no Stripe:
  * Plano 2x/Semana: price_1TgdZkH9bJrBIHmOPegBf6eQ (R$ 199)
  * Plano TESTE: price_1TgbyGH9bJrBIHmOBm5ctKyB (R$ 1)

INSTRUÇÃO CRÍTICA:
Você vai testar CADA BLOCO no navegador com Google OAuth logado. 
Se algo falhar, log o erro real, tenta corrigir, testa novamente.
Se conseguir testar de verdade, ótimo. Se não conseguir (por Google OAuth), anota no relatório que foi bloqueado.

===================================
BLOCO A — CORRIGIR ERROS BLOQUEANTES
===================================

A1. Role Constraint (SQL já rodado, só validar)
Teste: /admin/professores → Novo Professor → verificar 4 opções no dropdown:
  - Professor
  - Fisioterapeuta
  - Professor + Fisioterapeuta (prof_fisio)
  - Prof. Educação Física (prof_edfisica)
Resultado esperado: dropdown mostra as 4 opções

A2. Cadastro de Profissional com 4 papéis
Teste: /admin/professores → Novo Professor → selecionar cada uma das 4 opções → salvar
Resultado esperado: cada profissional é criado com seu papel correto e aparece na lista com badge de cor

A3. Erro de Avaliação Melhorado
Teste: /admin/avaliacoes/nova → preencher formulário → salvar
Resultado esperado: se der erro, mensagem de erro é clara (não é "undefined")

CHECKPOINT A: Rodar npm run build. Deve passar.

===================================
BLOCO B — ADMIN GERENCIA TURMAS E ALUNOS
===================================

B1. Matricular Aluno em Turma
Teste: /admin/turmas → clicar "👥 Alunos" em uma turma → adicionar aluno → salvar
Resultado esperado: aluno aparece na lista "Matriculados" e contagem atualiza

B2. Novo Aluno com Senha Auto-Gerada
Teste: /admin/alunos → Novo Aluno → preencher (nome, email, telefone, altura, peso, plano) → salvar
Resultado esperado: 
  - Modal mostra login e senha gerada
  - Botões funcionam: WhatsApp, Email, Copiar
  - Aluno novo aparece na lista

CHECKPOINT B: Testar criar 1 professor novo, 1 aluno novo, matricular aluno em 1 turma. Tudo deve funcionar.

===================================
BLOCO C — REPOSIÇÃO (IMPLEMENTAÇÃO REAL)
===================================

C1. Admin Disponibiliza Slots
Teste: /admin/reposicoes → Novo Slot → selecionar turma, data, horário, capacidade → salvar
Resultado esperado: slot aparece na lista com badge de vagas

C2. Aluno SOLICITA Reposições
Teste: /aluno/reposicoes → selecionar múltiplos slots (checkbox) → Solicitar
Resultado esperado: cada solicitação cria um request com status "pending"

C3. Admin/Professor Aprova
Teste: /admin/reposicoes → listar solicitações → Aprovar uma → status muda para "approved"
Resultado esperado: attendances criado automaticamente, aluno notificado (ou tentativa de notificação)

CHECKPOINT C: Criar 1 slot de reposição, aluno solicitar, admin aprovar. Validar status muda.

===================================
BLOCO D — PROFESSOR (ACESSO LIMITADO)
===================================

Teste: Criar professor novo com role "professor" (não admin), logar como esse professor
Problemas esperados: Google OAuth só funciona se você logado, então talvez não conseguir testar login como professor

Plano B: Se Google OAuth travar, pule o teste de login professor. Só valide que:
- Código do painel professor existe (/professor/dashboard)
- Rotas existem (/professor/alunos, /professor/reposicoes)
- TypeScript compila

CHECKPOINT D: Validar que /professor/* rotas existem e compilam.

===================================
BLOCO E — STRIPE EDITÁVEL + TEST MODE
===================================

E1. Admin: Editar Stripe Price ID
Teste: /admin/planos → clicar em um plano → field "Stripe Price ID" → colar price_id → salvar
Resultado esperado: price_id é salvo (pode usar price_1TgdZkH9bJrBIHmOPegBf6eQ do Plano 2x/Semana)

E2. TEST MODE Banner
Teste: /aluno/financeiro → procurar banner amarelo "🧪 MODO TESTE"
Resultado esperado: banner aparece com instrução cartão 4242 4242 4242 4242

E3. Pagamento (Teste Stripe)
Teste: Aluno clica "Assinar" num plano que tem price_id → redireciona pro Stripe Checkout
Resultado esperado: Checkout carrega corretamente

CHECKPOINT E: Validar price_id salva em um plano, TEST MODE banner aparece, botão "Assinar" funciona.

===================================
TESTES FINAIS (Após todos os blocos)
===================================

Build: npm run build (deve passar)
Routes count: Quantas rotas você tem? (deve ser ~47+)
TypeScript errors: Deve ser 0
Git: fazer commit final

===================================
RELATÓRIO FINAL (OBRIGATÓRIO)
===================================

Crie/atualize: C:\Users\willa\pilates-app\RELATORIO_TESTE_FINAL.md

Contendo:

BLOCO A
- [ ] Role constraint (4 papéis) — ✅ PASSOU / ❌ FALHOU
- [ ] Cadastro profissional — ✅ PASSOU / ❌ FALHOU
- [ ] Erro avaliação melhorado — ✅ PASSOU / ❌ FALHOU
Notas: [se falhou, qual é o erro?]

BLOCO B
- [ ] Matricular aluno em turma — ✅ PASSOU / ❌ FALHOU
- [ ] Novo aluno com senha auto — ✅ PASSOU / ❌ FALHOU
Notas: [testes específicos]

BLOCO C
- [ ] Admin cria slot reposição — ✅ PASSOU / ❌ FALHOU
- [ ] Aluno solicita reposição — ✅ PASSOU / ❌ FALHOU
- [ ] Admin aprova reposição — ✅ PASSOU / ❌ FALHOU
Notas: [testes específicos]

BLOCO D
- [ ] Painel professor existe — ✅ PASSOU / ❌ FALHOU
- [ ] Rotas professor compilam — ✅ PASSOU / ❌ FALHOU
Notas: [Google OAuth bloqueou ou funcionou?]

BLOCO E
- [ ] Price ID editável — ✅ PASSOU / ❌ FALHOU
- [ ] TEST MODE banner — ✅ PASSOU / ❌ FALHOU
- [ ] Checkout Stripe funciona — ✅ PASSOU / ❌ FALHOU
Notas: [testes específicos]

BUILD
- [ ] npm run build — ✅ PASSOU / ❌ FALHOU
- [ ] TypeScript errors: 0 — ✅ SIM / ❌ NÃO (quantos?)
- [ ] Rotas totais: [número]

RESUMO GERAL
- Quantos testes passaram: [X]/13
- Quanto tempo levou: [tempo]
- Bloqueadores: [quais?]
- Próximos passos: [o que fazer?]

===================================
COMECE AGORA
===================================

1. npm run build (deve passar)
2. npm run dev (se não estiver rodando)
3. Abra navegador anônimo
4. Logar em http://localhost:3001 com Google OAuth (alinhado.decisoes@gmail.com)
5. Testar BLOCO A completo
6. Testar BLOCO B completo
7. Testar BLOCO C completo
8. Validar BLOCO D (pode ser parcial)
9. Testar BLOCO E completo
10. Rodar npm run build novamente (verificação final)
11. Criar RELATORIO_TESTE_FINAL.md

GO!
