# ✅ ETAPA 8 — CHECKLIST PRÉ-LANCAMENTO PÚBLICO
**Objetivo:** Validação final antes de abrir para público  
**Tempo estimado:** 2-4 horas  
**Bloqueador:** Nenhum  

---

## 🎯 O QUE É ESTA ETAPA

Antes de lançar para PÚBLICO (fora os 50 beta testers), você precisa validar:

- ✅ Nenhum bug crítico conhecido
- ✅ Performance aceita (< 3s pra carregar)
- ✅ Segurança OK (senhas criptografadas, dados privados)
- ✅ Conformidade LGPD
- ✅ Documentação completa
- ✅ Equipe preparada para suporte

Esta etapa é uma **checklist gigante** que você marca conforme valida cada coisa.

---

## 🔴 SEÇÃO 1 — BUGS CRÍTICOS (BLOQUEADORES)

Antes de qualquer coisa, validar que NÃO existem bugs críticos:

```
[ ] Login funciona (email/senha + Google OAuth)
[ ] Dashboard carrega sem erro 500
[ ] Tabelas carregam dados reais
[ ] Botões salvam dados (admin criar aluno, turma, etc)
[ ] Pagamento Stripe: checkout abre e processa cartão teste
[ ] Email de confirmação chega (Resend)
[ ] Push notifications funcionam (VAPID)
[ ] Google Calendar sincroniza
[ ] Logout funciona corretamente
[ ] Relogin após logout funciona
```

**Se qualquer um falhar:** NÃO avançar. Corrigir antes.

---

## 🟡 SEÇÃO 2 — PERFORMANCE (Aceitável)

Testar em 3 scenarios:

### Scenario 1: Desktop (fibra boa)
```
[ ] Dashboard carrega em < 2 segundos
[ ] Tabela com 100 registros carrega em < 3s
[ ] Pagamento Stripe modal abre em < 1s
[ ] PDF export (botão clique) em < 5s
```

### Scenario 2: Mobile (4G)
```
[ ] App abre em < 5 segundos
[ ] Login completa em < 3s
[ ] Dashboard carrega em < 5s
[ ] Scroll é smooth (60 FPS)
```

### Scenario 3: Saturado (muitos dados)
```
[ ] 500 alunos na tabela: < 10s pra carregar (com pagination)
[ ] 100 turmas: lista renderiza em < 5s
[ ] 1000 mensagens em chat: < 8s
```

**Métrica:** Se alguma página > 10s, otimizar antes de lançar.

---

## 🟢 SEÇÃO 3 — SEGURANÇA (Crítico)

### 3.1 Senhas & Auth

```
[ ] Senhas hasheadas (bcrypt ou similar)
[ ] Senhas não aparecem em logs
[ ] Sessão expira após 1 hora inatividade
[ ] Admin não consegue ver senha de outro admin
[ ] Aluno não consegue editar dados de outro aluno (RLS ativo)
```

**Verificar:** Supabase → RLS policies ativas em cada tabela

### 3.2 Dados Sensíveis

```
[ ] Telefone criptografado (ou pelo menos não em logs)
[ ] Email pessoal não visível pro público
[ ] Avaliação física privada (aluno só vê a sua)
[ ] Histórico de pagamento privado
[ ] Documentos do cofre criptografados
```

### 3.3 Chaves & Secrets

```
[ ] .env.local NÃO está no GitHub (verificar .gitignore)
[ ] Stripe webhook secret configurado
[ ] Google secret não exposto no código
[ ] VAPID private key não em localStorage (ficar no servidor)
```

**Verificar:** `git log --all --source -- .env.local` (não deve aparecer)

### 3.4 HTTPS (Se em domínio)

```
[ ] URL usa HTTPS (não HTTP)
[ ] Certificado SSL válido
[ ] Vercel redireciona HTTP → HTTPS
[ ] Headers de segurança presentes:
    - Content-Security-Policy
    - X-Frame-Options
    - X-Content-Type-Options
```

---

## 🔵 SEÇÃO 4 — CONFORMIDADE LGPD (Brasil)

### 4.1 Armazenamento

```
[ ] Dados armazenados em servidor brasileiro (Supabase São Paulo)
[ ] Backup replicado (não só um servidor)
[ ] Política de retenção: dados deletados após 24 meses (soft delete)
```

### 4.2 Privacidade

```
[ ] Existe Política de Privacidade publicada
[ ] Consent de cookies (se usar)
[ ] Direito ao esquecimento (endpoint /api/delete-account)
[ ] Export de dados (endpoint /api/export-data)
```

**Criar:** `docs/POLITICA_PRIVACIDADE.md`

```markdown
# Política de Privacidade — DAIMACH Pilates

## 1. Dados Coletados
- Nome, email, telefone
- Altura, peso (para evolução)
- Fotos de avaliação
- Histórico de aulas
- Pagamentos (integração Stripe)

## 2. Como Usamos
- Gerenciar aulas e matrículas
- Enviar lembretes
- Processar pagamentos
- Melhorar o serviço

## 3. Proteção
- Todos os dados em criptografia
- Backup automático
- Acesso restrito (RLS Supabase)

## 4. Direitos
- Você pode pedir para ver seus dados
- Você pode pedir para deletar (exceto registros de pagamento)
- Você pode fazer download de seus dados

## 5. Contato
Dúvidas sobre privacidade: privacidade@daimach.com.br

Data: 10/06/2026
```

### 4.3 Consentimento

```
[ ] Ao criar conta: aceitar termos de uso
[ ] Ao usar avaliação com foto: consentir uso de imagem
[ ] Newsletter: opt-in (não obrigatório)
```

---

## 🟣 SEÇÃO 5 — DOCUMENTAÇÃO PRONTA

```
[ ] Guia do Aluno (em PDF ou web)
[ ] Guia do Admin
[ ] FAQ (Etapa 7)
[ ] Troubleshooting (Etapa 7)
[ ] Vídeo tutorial de login (30s)
[ ] Vídeo tutorial de uso básico (2 min)
```

**Criar:** `docs/GUIAS.md` com links para tudo

---

## 🟠 SEÇÃO 6 — EQUIPE PREPARADA

### 6.1 Suporte

```
[ ] Responsável pelo suporte definido (você? outra pessoa?)
[ ] Email de suporte funciona (suporte@daimach.com.br)
[ ] WhatsApp de suporte ativo
[ ] SLA (tempo resposta): <= 24 horas em dias úteis
[ ] Template de respostas criado
```

### 6.2 Monitoramento

```
[ ] Logs de erro centralizados (Sentry ou similar)
[ ] Alerta configurado (quando erro > 5/hora)
[ ] Contato de emergência definido
[ ] Plano de rollback (voltar versão anterior) pronto
```

### 6.3 Escalabilidade

```
[ ] Vercel auto-scaling ativo
[ ] Supabase replicação ativa
[ ] CDN para assets estáticos
[ ] Rate limiting nos endpoints (evitar DDoS)
```

---

## 📊 SEÇÃO 7 — TESTES FINAIS (24h antes do lançamento)

### 7.1 Smoke Test (tudo funciona?)

```
[ ] Criar aluno novo
[ ] Matricular em turma
[ ] Admin criar turma nova
[ ] Professor logar (vê só seus alunos)
[ ] Aluno solicitar reposição
[ ] Admin aprovar reposição
[ ] Aluno ver financeiro
[ ] Pagar com cartão teste (Stripe)
[ ] Receber email de confirmação
[ ] Fazer logout
[ ] Fazer login novamente
```

### 7.2 Edge Cases (cenários estranhos)

```
[ ] Aluno tenta deletar outro aluno (não consegue - RLS)
[ ] Admin tenta aproveitar desconto que não existe (erro tratado)
[ ] Usuário tenta trocar senha sem confirmar antiga (pede confirmação)
[ ] Pagamento falha: aluno vê mensagem de erro clara
[ ] Internet cai no meio de transação: app se recupera
```

### 7.3 Navegadores

```
[ ] Chrome (versão recente)
[ ] Firefox (versão recente)
[ ] Safari (versão recente)
[ ] Edge (versão recente)
[ ] Android Chrome
[ ] iOS Safari
```

### 7.4 Devices

```
[ ] Desktop 1920px (big screen)
[ ] Laptop 1366px
[ ] Tablet 768px
[ ] Mobile 375px (iPhone SE)
[ ] Mobile 414px (iPhone 12)
[ ] Mobile 360px (Android antigo)
```

---

## 🎉 SEÇÃO 8 — LANÇAMENTO (Dia D)

### 8.1 Antes de publicar

```
[ ] Backup completo feito (Supabase + Google Drive)
[ ] Versão estável tagueada no Git: git tag -a v1.0.0 -m "MVP Launch"
[ ] Equipe de suporte reunida (WhatsApp, email, phone)
[ ] Dashboard de monitoramento aberto (Vercel, Supabase, Sentry)
[ ] Plano de rollback revisado
[ ] Announcement preparado (Email, Instagram, WhatsApp)
```

### 8.2 Publicação

```
[ ] Deploy final em vercel.app
[ ] Validar URL pública funciona
[ ] Enviar email para beta testers: "App lançado! Convida amigos"
[ ] Publicar no Instagram (story + post)
[ ] Enviar WhatsApp marketing aos 50 testers
```

### 8.3 Depois de publicar (Primeiras 24h)

```
[ ] Monitorar erros a cada 1 hora
[ ] Responder dúvidas de beta testers
[ ] Checar performance (Vercel analytics)
[ ] Checar pagamentos (Stripe dashboard)
[ ] Anotar feedbacks pra próxima versão
```

---

## 📝 CHECKLIST COMPLETO

```
SEÇÃO 1 (Bugs Críticos): [ ] 10/10
SEÇÃO 2 (Performance): [ ] 12/12
SEÇÃO 3 (Segurança): [ ] 12/12
SEÇÃO 4 (LGPD): [ ] 8/8
SEÇÃO 5 (Documentação): [ ] 6/6
SEÇÃO 6 (Equipe): [ ] 9/9
SEÇÃO 7 (Testes): [ ] 20/20
SEÇÃO 8 (Lançamento): [ ] 12/12

TOTAL: [ ] 89/89
```

**Se não chegar a 89/89: NÃO LANÇAR.**

---

## 🚨 PROBLEMAS DESCOBERTOS NA ETAPA 8

Se encontrar problema:

```
Problema: [descrição]
Severidade: CRÍTICA / ALTA / MÉDIA / BAIXA
Solução: [como corrigir]
Tempo: [quanto tempo pra corrigir]
Bloqueador: SIM / NÃO

Se CRÍTICA ou bloqueador: não lançar até corrigir
Se ALTA: corrigir antes se possível
Se MÉDIA/BAIXA: pode lançar com nota de conhecida
```

---

## ✅ RESULTADO FINAL

Quando terminar:

✅ Validação 100% completa  
✅ Nenhum bug crítico  
✅ Performance OK  
✅ Segurança OK  
✅ LGPD OK  
✅ Equipe pronta  
✅ **PRONTO PARA LANÇAR**

---

## 📊 APROVAÇÃO FINAL

```
Data de conclusão: [quando terminou]
Responsável: [nome]
Assinatura (virtual): [OK / BLOQUEADO]

Se BLOQUEADO: descrever por quê

Se OK:
Status: ✅ APROVADO PARA LANÇAMENTO
Data de lançamento: [quando vai publicar]
```

---

> **Data estimada:** 2-4 horas  
> **Status:** Checklist / Validação  
> **Próximo:** ETAPA 9 — Monitoramento Contínuo (Pós-Lançamento)
