# RELATÓRIO — CORREÇÃO DA COMUNICAÇÃO ENTRE PAINÉIS
**Data:** 2026-06-10

## Causa raiz encontrada
1. **Páginas de professor e aluno usavam o cliente do navegador** (anon key). Como o RLS está ligado no Supabase **sem policies**, essas consultas retornavam **0 linhas** → professor não via turmas/alunos, aluno não via aula.
2. **A matrícula era inserida sem `is_active: true`**, e a consulta do aluno filtra `is_active = true` → a aula matriculada **nunca aparecia** ("não tem nenhuma aula marcada").

## O que foi corrigido e VERIFICADO (no dev server)

| Problema | Status | Verificação |
|---|---|---|
| Aluno não via a aula matriculada | ✅ | Matriculou → aluno passou de 1 p/ 2 aulas (`is_active:true`) |
| Professor não via alunos novos | ✅ | Endpoint professor mostra "Aluno Teste Login" na turma |
| Financeiro 81 vs gestão 74 | ✅ | Agora 75 = 75 (conta só `role='aluno'`) |
| Reposições: "selecionar turma" vazio | ✅ | Dropdown retorna 7 turmas com lotação |
| Erro console ao editar professor (linha 103) | ✅ | Update agora via API `/api/pilates/users/[id]` |
| Agenda do mês vazia | ✅ | Lê 21 sessões/mês com turma, professor e ocupação |
| Sem export financeiro | ✅ | Botão "Exportar CSV" no financeiro |
| Sem export da agenda do mês | ✅ | Botão "Exportar Mês (CSV)" na agenda |

## Como ficou a arquitetura
Tudo que estava "vazio" agora passa por **API routes server-side** (`/api/pilates/*`) que usam o service role (o RLS não bloqueia). Quando o ADM mexe (matrícula, edição, baixa de pagamento, reposição), grava no banco e **aparece para professor e aluno**, porque todos leem da mesma fonte via API.

Novas rotas: `/professor`, `/aluno/aulas`, `/reposicoes`, `/agenda`, `/users/[id]`, e `POST` em `/financeiro` e `/turmas`.

## Reposições — melhoria pedida
O modal "Disponibilizar Horários" agora lista **todas as turmas** (mostrando vazias x cheias) e permite **marcar várias de uma vez** numa data — sem precisar cadastrar turma por turma. Inclui turmas cheias (caso alguém tenha cancelado no particular).

## PENDÊNCIAS que dependem de você (não dá para rodar daqui)
1. **`SQL_MIGRACOES_PENDENTES.sql`** — rodar no SQL Editor do Supabase para habilitar:
   - novo aluno entrar como **pendente** (com dia de vencimento / pago adiantado);
   - paciente que faz **só fisioterapia** (ou ambos).
   O código já está preparado para usar essas colunas quando existirem.

## Ainda NÃO feito (frentes grandes, honestamente)
- **Fisioterapia** (cadastrar paciente mostrando alunos ativos / cadastrar usuário só-fisio) — depende do SQL acima + migração da página para API.
- **Segurança máxima / RLS** (doc `APP_PILATES_SEGURANCA_MAXIMA`) — exige **decisão de arquitetura**: hoje os dados passam por service role (que ignora RLS). Segurança real por usuário precisa migrar para sessão autenticada + policies. Detalho abaixo.
- **APK** — build em andamento; ver observação sobre URL de produção.
- **Site premium** (doc `SITE_DAIMACH_PREMIUM_E_SEGURANCA`) — projeto do site ainda não localizado.
