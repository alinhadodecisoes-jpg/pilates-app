# 🎯 MASTER PROGRESS — DAIMACH PILATES APP
**Data:** 10/06/2026 00:50  
**Projeto:** C:\Users\willa\pilates-app  
**Status:** ⚠️ FASE 1.5 — Erros bloqueantes + Mega-correção  
**Servidor local:** http://localhost:3001 (rodando)  

---

## 📍 ONDE VOCÊ PAROU (ESTADO REAL)

### ✅ QUE JÁ FUNCIONA (NÃO MEXER)
```
✅ Login admin (Google OAuth) + role detection
✅ Sidebar rotos (admin, aluno, professor, fisioterapeuta)
✅ Dashboard admin (KPIs básicos)
✅ Painel aluno (minhas aulas, reposições, evolução)
✅ 5 turmas reais criadas no banco (de segunda a sexta)
✅ Cadastro de professor (na maioria dos casos)
✅ Build limpo (npm run build passa)
✅ PWA (instalar como app)
✅ Git com 18 commits
```

### ❌ OS 3 ERROS BLOQUEANTES (CRÍTICOS)

#### ERRO 1️⃣ — Cadastro de fisioterapeuta falha
**Sintoma:** Erro "new row violates check constraint users_pilates_role_check"  
**Causa:** Tabela only accepts roles: 'admin','professor','aluno' — não tem 'fisioterapeuta'  
**Status:** ⏳ **SQL NÃO RODOU AINDA**  
**Ação esperada:** Willian roda SQL que altera constraint pra aceitar 6 papéis

**SQL que Willian precisa rodar no Supabase:**
```sql
ALTER TABLE users_pilates DROP CONSTRAINT IF EXISTS users_pilates_role_check;
ALTER TABLE users_pilates ADD CONSTRAINT users_pilates_role_check
  CHECK (role IN ('admin','aluno','professor','fisioterapeuta','prof_fisio','prof_edfisica'));
```

#### ERRO 2️⃣ — Salvar avaliação física falha
**Sintoma:** Tela mostra "Erro ao salvar avaliação" (vermelho)  
**Causa:** Desconhecida (provavelmente coluna faltando OU bucket OU JSONB format)  
**Status:** 🔴 **NÃO INVESTIGADO AINDA**  
**Ação esperada:** Claude Code investiga no console, acha o erro real, corrige

#### ERRO 3️⃣ — Email "not confirmed" no login
**Sintoma:** Erro ao tentar fazer login com email/senha  
**Causa:** Supabase exigindo confirmação de email  
**Status:** ⏳ **CLICKABLE NO PAINEL (1 clique resolve)**  
**Ação esperada:** Willian clica 1 opção no Supabase

**Como resolver:**
```
Supabase → Authentication → Providers → Email
Procure: "Confirm email" checkbox
Desmarque: a checkbox
Clique: Save
```

---

## 🤖 O QUE O CLAUDE CODE RECEBEU (MEGA-PROMPT)

Mandei um prompt dividido em **5 BLOCOS** (A até E):

| Bloco | O quê | Status |
|-------|-------|--------|
| **A** | Corrigir fisioterapeuta, avaliação, email | ⏳ Aguardando que Willian rode SQL |
| **B** | Admin matricula aluno em turma (alunos saem de "fora de turma") | ⏳ Aguardando Bloco A |
| **C** | Reposição de aula (aluno solicita → admin aprova) | ⏳ Aguardando Bloco B |
| **D** | Professor vê só seus alunos + edita | ⏳ Aguardando Bloco C |
| **E** | Pagamento Stripe + field price_id na tela | ⏳ Aguardando Bloco D |

**Cada bloco depende do anterior passar no build + teste.**

---

## 🎯 PRÓXIMOS PASSOS (ORDEM EXATA)

### PASSO 1️⃣ — SQL do Fisioterapeuta (Willian — 30 segundos)
```
1. Abra: https://app.supabase.com/project/qgqzbfyvhhnptmfgjpnd/editor
2. Cole o SQL acima (ALTER TABLE users_pilates...)
3. Clique: RUN
4. Avise aqui: "✅ OK rodei"
```

### PASSO 2️⃣ — Desligar Email Confirmation (Willian — 30 segundos)
```
1. Supabase → Authentication → Providers → Email
2. Desmarque "Confirm email"
3. Clique: Save
4. Avise aqui: "✅ OK desligueio"
```

### PASSO 3️⃣ — Verificar chave Stripe (Willian — 1 minuto)
```
1. Abra: C:\Users\willa\pilates-app\.env.local
2. Procure a linha: STRIPE_SECRET_KEY=
3. Veja se começa com: sk_test_ (teste) ou sk_live_ (ao vivo)
4. Avise aqui: "minha chave é sk_test_..." ou "sk_live_..."
```

**POR QUÊ:** Se for sk_live_ (dinheiro real), a gente gera chave nova antes de testar.

### PASSO 4️⃣ — Claude Code executa BLOCO A (Claude — ~30 min)
```
Assim que Willian avisar "ok rodei SQL e desligueio email", mandar:

EXECUTE BLOCO A — CORRIGIR ERROS BLOQUEANTES (ficha-saúde/avaliação/email/cadastro fisio)

[ele investiga avaliação, cria form de fisio com 4 opções, testa login com email/senha]
[npm run build → google chrome test]
[git commit "bloco-a: fisioterapeuta + avaliacao + email confirmacao"]
```

### PASSO 5️⃣ — Claude Code executa BLOCOS B, C, D, E (Claude — ~3-4 horas)
```
Sequencial:
BLOCO B → matricular alunos em turmas
BLOCO C → reposição (solicita/aprova)
BLOCO D → professor vê só seus alunos
BLOCO E → pagamento Stripe
```

### PASSO 6️⃣ — Validação (Willian — quando voltar à noite)
```
RELATORIO_NOITE.md novo
PENDENCIAS_WILLIAN.md atualizado
Me manda os 2 arquivos que a gente confere o que funcionou
```

---

## 🔐 Informações Sensíveis

⚠️ **CRÍTICO:** As chaves Stripe que você subiu aqui precisam ser rotacionadas depois (gerar novas). Mas pra TESTE elas servem. Não deixe de me avisar a chave (test vs live) no PASSO 3.

---

## 📁 Arquivos Importantes

```
C:\Users\willa\pilates-app\
├── MASTER_PROGRESS_WILLIAN.md      ← VOCÊ ESTÁ AQUI (este arquivo)
├── MASTER_STATUS_DAIMACH.md        ← Status anterior (histórico)
├── RELATORIO_NOITE.md              ← Relatório do que Claude Code fez
├── PENDENCIAS_WILLIAN.md           ← SQLs e ações que só você faz
├── LINHA_DE_PRODUCAO_DAIMACH.md    ← Plano dos 4 sprints (Fase 1)
├── 00_INDICE_FASE2.md até 08_*     ← MDs da Fase 2 já implementados
├── .env.local                       ← Chaves (não compartilhar mais!)
└── src/app/                         ← Código
```

---

## 📊 Banco de Dados (Supabase)

**Tabelas que existem:**
- ✅ users_pilates (role precisa de SQL pra expandir)
- ✅ classes_pilates (5 turmas de teste)
- ✅ enrollments_pilates (vazio — alunos vão entrar no BLOCO B)
- ✅ physical_evaluations_pilates (tabela existe mas erro ao salvar)
- ✅ health_records, physio_cases, physio_evolutions
- ✅ reposition_slots, reposition_requests (para BLOCO C)
- ✅ notification_preferences, notifications_log, push_subscriptions
- ✅ google_tokens, bookings, class_sessions
- ✅ plans_pilates, subscriptions_pilates
- ✅ backup_log, payment_history

**Bucket de Storage:**
- ✅ evaluations (privado — fotos das avaliações)
- ✅ uploads (público)

---

## 🚀 ANTES DE SAIR HOJE

Se sair sem fazer os 3 passos acima, o Claude Code vai travar esperando SQL. Então:

- [ ] Passo 1 — SQL fisioterapeuta (30 seg)
- [ ] Passo 2 — Desligar email confirmation (30 seg)
- [ ] Passo 3 — Ver tipo de chave Stripe (1 min)
- [ ] Avisar aqui que está tudo feito

Depois disso, mandar o BLOCO A e deixa ele trabalhar.

---

## 🎬 COMECE AGORA

**Se está em casa agora:** faça os 3 passos acima e me avisa. Depois a gente dispara o BLOCO A.

**Se vai sair agora:** deixa o PC ligado, roda os 3 passos antes de sair (levam 2 minutos) e depois o Claude Code trabalha sozinho.

---

*Próxima conversa: comece daqui, vê onde parou, e siga pro próximo bloco.*

**Status final esperado:** Todos os 5 blocos rodando, sem erros, e você testando as telas novas amanhã à noite.

Bora! 🚀
