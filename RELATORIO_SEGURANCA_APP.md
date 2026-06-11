# RELATÓRIO — TAREFA 2: SEGURANÇA DO APP
**Data:** 2026-06-10

## Arquitetura confirmada
A sessão do usuário é guardada em **localStorage** (não em cookie) — logo os `fetch` não enviam a sessão automaticamente. Por isso, exigir auth em **todas** as rotas de uma vez quebraria o app (que acabou de ir ao ar). A estratégia foi: proteger o que é crítico **sem quebrar**, e deixar o restante com um caminho seguro de migração.

## O que foi implementado e VERIFICADO

### 1. 🔒 Trancamento da criação de contas (buraco mais grave)
Antes, **qualquer um** podia chamar `/api/admin/create-user` e criar até um admin.
- Criado helper `src/lib/pilates/api-auth.ts` → `requireRole(req, ['admin'])` valida o **token Bearer** da sessão e o **role** no banco.
- Criado helper cliente `src/lib/pilates/api-client.ts` → `apiFetch` anexa o token da sessão.
- `/api/admin/create-user` agora exige **admin**. Callers (admin/alunos, admin/professores) atualizados para enviar o token.

**Testes:**
| Cenário | Resultado |
|---|---|
| POST sem token | ✅ **HTTP 401** (bloqueado) |
| POST com token de admin | ✅ **HTTP 200** (admin continua criando) |

### 2. 🛡️ Headers de segurança (`next.config.ts`)
Já havia X-Frame-Options (DENY), X-Content-Type-Options, X-XSS-Protection, Referrer-Policy. **Adicionados:**
- `Strict-Transport-Security` (HSTS, 2 anos, includeSubDomains; preload) → força HTTPS.
- `Permissions-Policy` (camera/microphone/payment desligados).

### 3. 🚫 Anti-cópia (`AntiCopy.tsx`, montado no layout raiz)
- Bloqueia botão direito, arrastar imagens, e atalhos F12 / Ctrl+Shift+I/J/C / Ctrl+U / Ctrl+S.
- Bloqueia seleção de texto, **exceto** inputs/textarea e qualquer elemento com `data-allow-copy`
  (use `data-allow-copy` em campos de PIX/pagamento que precisam ser copiados).

### 4. 📄 RLS preparado para decisão futura (`SQL_RLS_POLICIES.sql`)
Conforme sua instrução de **não religar RLS agora**. O arquivo traz policies sem recursão
(função `SECURITY DEFINER`), por tabela e por role (admin/professor/aluno/fisio).
> Como o app usa service role (que ignora RLS), rodar esse SQL **não quebra** o app —
> só adiciona defesa contra acesso direto pela anon key. Mas o isolamento real por
> usuário na aplicação exige migrar a leitura para sessão autenticada (ver abaixo).

## ⚠️ O que falta (com plano seguro)
- **Auth/role/ownership em TODAS as API routes:** hoje só a criação de conta está trancada.
  Para as demais sem quebrar, o caminho é: (a) trocar a maioria dos `fetch` por `apiFetch`
  (já pronto) e adicionar `requireRole`/ownership em cada rota; **ou** (b) migrar a sessão
  para cookies (`@supabase/ssr` no browser) e então o RLS isola sozinho. Recomendo (b) a médio prazo.
- **Rate limiting:** há `UPSTASH_REDIS_REST_URL` no `.env` — dá para limitar `/api/admin/create-user`
  e rotas de escrita. Não incluído neste lote para não arriscar o app recém-publicado.
- **Rotacionar chaves Stripe** que foram usadas em desenvolvimento (manual, no painel Stripe).
- **CSP** (Content-Security-Policy): não adicionada ainda porque exige allowlist cuidadosa
  (Supabase, Stripe, Google Maps) para não quebrar — fazer com teste em preview.

## Status
✅ Itens críticos entregues e testados (criação de conta trancada, headers, anti-cópia, RLS preparado).
⚠️ Auth nas demais rotas + rate limiting + CSP + rotação Stripe: próximos passos com plano acima.
