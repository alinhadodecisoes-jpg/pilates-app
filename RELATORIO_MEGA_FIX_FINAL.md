# RELATÓRIO — MEGA FIX + REDESIGN
**Atualizado:** 2026-06-11

## ✅ Feito e VERIFICADO (no ar)

### App (https://daimach-pilates.vercel.app)
**Bugs (BLOCO 1):**
- **BUG 1 — AntiCopy crash** (`e.key` undefined): corrigido + deployado. Era crash em produção.
- **BUG 2 — Reposições "[object Object]":** já resolvido (modal reescrito com checkboxes de turma).
- **BUG 3 — Ficha de saúde do aluno:** carregava/salvava via cliente bloqueado por RLS → criada API `/api/pilates/ficha-saude` (GET/POST). Testado: salva e carrega.
- **BUG 4 — Avaliações dropdown vazio:** agora via `/api/pilates/alunos`.
- **BUG 5 — Sessão de fisio não salvava:** a tabela `physical_therapy_sessions` não tinha `duration_minutes`/`notes`; corrigido o insert. Testado: salva e aparece.
- **BUG 6 — Agenda Seg↔Dom:** o código está consistente (1=Seg em todo lugar; agenda usa data real). Não reproduzido.

**Features novas:**
- **Menu mobile** (drawer + hambúrguer) em admin/professor/fisioterapeuta (aluno já tinha bottom-nav).
- **Logo oficial** no login e em todas as sidebars.
- **Atribuir professor à turma** no modal (raiz do "professor não vê turma"). Testado: professor passa a ver a turma.
- **/admin/pacientes** (separado de Alunos): lista só-fisio/ambos, cadastro, conversão de tipo. + item na sidebar.
- **Colunas de pagamento editáveis** (payment_status, due_day, next_due_date) via API.
- **Relatórios** (BLOCO 4): `/api/pilates/relatorios` + página com 4 abas (Alunos, Financeiro, Presença, Turmas) + **Exportar CSV**. Testado: 74/74/12/11 linhas reais. + item na sidebar.
- **Financeiro do aluno** com dados reais (plano, status, pagamento, histórico) via API.

### Site (https://www.daimach.com.br/teste/site)
- **Redesign premium** (verde floresta + dourado): nav + menu mobile, hero, benefícios, diferenciais, contador de inauguração, App, franquia, rodapé com marca d'água DAIMACH + CREFITO + email, WhatsApp flutuante, cookies, banco-visual.
- A landing antiga em `/` continua intacta (não tirei do ar).

## 📄 SQL para você rodar no Supabase (habilita os próximos blocos)
Arquivo **`SQL_BLOCOS_PENDENTES.sql`** (na raiz) cria:
- `studio_config` (BLOCO 8 — dados do estúdio + chave PIX)
- `payment_confirmations` (BLOCO 7 — aluno marca "já paguei", admin confirma)
- `teacher_payments` (BLOCO 2.2 — financeiro do professor)
- gera a **grade de 90 turmas** (Seg–Sáb, 07h–21h)

## ⏳ Ainda pendente (depende do SQL acima OU mais tempo)
- **BLOCO 7 — PIX completo:** painel do aluno (chave PIX + "já paguei") e confirmação pelo admin → depende de `studio_config` + `payment_confirmations`.
- **BLOCO 8 — /admin/configuracoes:** depende de `studio_config`.
- **BLOCO 2.2 — financeiro do professor:** depende de `teacher_payments`.
- **BLOCO 6.3 — cron de inadimplência** (muda status no vencimento).
- **BLOCO 2.3/2.4 — professor ver ficha/avaliação do aluno; editar turma.**
- **Site — subpáginas** completas (/o-pilates, /quem-somos, /franquia, /trabalhe-conosco, /indique, /app) + formulários enviando email (Resend) + substituir a landing.

## Pendências suas
- Rodar `SQL_BLOCOS_PENDENTES.sql` no Supabase → me avisa que eu construo PIX + configurações + financeiro do professor.
- `git push` nos 2 repos (credencial GitHub interativa).
- Olhar `/teste/site` e dizer se aprova o visual para eu construir as subpáginas.
- Instalar o APK nos celulares.
