# 👥 ETAPA 6 — PREPARAÇÃO BETA 50 USUÁRIOS
**Objetivo:** Preparar app para 50 beta testers (alunos reais)  
**Tempo estimado:** 2-3 horas  
**Bloqueador:** Nenhum (tudo é documentação + setup)  

---

## 🎯 O QUE VOCÊ VAI FAZER NESTA ETAPA

1. ✅ Criar 50 contas de teste para alunos
2. ✅ Preparar documentação de onboarding
3. ✅ Criar sistema de feedback (Google Form)
4. ✅ Monitorar erros (Sentry ou logs simples)
5. ✅ Preparar servidor de suporte (email/WhatsApp)

---

## 🎯 ETAPA 6.1 — CRIAR DADOS DE TESTE (50 ALUNOS)

### Opção A — Manualmente (não recomendado)

Criar cada aluno em `/admin/alunos` → Novo Aluno

**Tempo:** ~2-3 horas

### Opção B — Script SQL (Recomendado)

Criar: `sql/seed_50_alunos.sql`

```sql
-- Gerar 50 alunos fictícios para teste
INSERT INTO users_pilates (email, full_name, phone, height, weight, role, plan_id, status, password_hash)
SELECT 
  'aluno' || i || '@teste.daimach.com.br' as email,
  'Aluno Teste ' || i as full_name,
  '11999999' || LPAD(CAST(i AS TEXT), 3, '0') as phone,
  FLOOR(150 + RANDOM() * 30)::INTEGER as height,
  FLOOR(50 + RANDOM() * 40)::INTEGER as weight,
  'aluno' as role,
  (ARRAY[1, 2, 3])[1 + (i % 3)] as plan_id,  -- Distribui entre 3 planos
  'ativo' as status,
  crypt('senha123', gen_salt('bf')) as password_hash
FROM GENERATE_SERIES(1, 50) i
ON CONFLICT(email) DO NOTHING;

-- Matricular alunos em turmas (distribuir entre as 5 turmas)
INSERT INTO enrollments_pilates (class_id, user_id, enrolled_at)
SELECT 
  classes_pilates.id,
  users_pilates.id,
  NOW()
FROM classes_pilates
CROSS JOIN (SELECT id FROM users_pilates WHERE role = 'aluno' ORDER BY RANDOM() LIMIT 50)
  AS users_pilates
ON CONFLICT(class_id, user_id) DO NOTHING;
```

**Como executar:**

1. Copiar SQL acima
2. Ir para Supabase SQL Editor
3. Colar e clicar "RUN"
4. Resultado esperado: 50 alunos criados

---

## 🎯 ETAPA 6.2 — CRIAR DOCUMENTAÇÃO DE ONBOARDING

### Documento para Alunos

Criar: `docs/GUIA_ALUNO_BETA.md`

```markdown
# 📱 GUIA DO ALUNO — DAIMACH PILATES

## Bem-vindo ao Beta!

Você foi selecionado para testar nosso novo app de Pilates.

### 1. Download

**Android:**
- [Link APK ou Play Store interno]
- Instalar no celular
- Abrir app

### 2. Login

```
Email: aluno.teste@daimach.com.br
Senha: [enviada por email]
```

OU

```
Clique "Entrar com Google"
Use sua conta Google pessoal
```

### 3. Primeiros Passos

**Painel Aluno:**
- ✅ Ver minhas aulas (calendário)
- ✅ Solicitar reposição (se aula cancelada)
- ✅ Ver histórico (peso, fotos, evolução)
- ✅ Pagamento (ver situação)

### 4. Reportar Bugs

Se encontrar erro:
1. Tirar screenshot
2. Descrever o que você estava fazendo
3. Enviar para: suporte@daimach.com.br
4. Ou preencher: [Google Form link]

### 5. Dúvidas?

WhatsApp: [seu número]
Email: suporte@daimach.com.br
```

### Documento para Professores/Admin

Criar: `docs/GUIA_ADMIN_BETA.md`

```markdown
# 👨‍💼 GUIA DO ADMINISTRADOR — DAIMACH PILATES

## Bem-vindo ao Dashboard!

### Seu Acesso

```
URL: https://pilates.daimach.com.br
Email: seu@email.com
Senha: [sua senha]
```

OU

```
Clique "Entrar com Google"
```

### Funcionalidades Principais

**Dashboard:**
- [ ] Total de alunos
- [ ] Faturamento do mês
- [ ] Turmas ativas
- [ ] Inadimplentes

**Gerenciar Alunos:**
- [ ] Ver lista de alunos
- [ ] Editar dados
- [ ] Matricular em turma
- [ ] Dar baixa em pagamento

**Reposições:**
- [ ] Abrir slots de reposição
- [ ] Aprovar solicitações
- [ ] Ver histórico

**Financeiro:**
- [ ] Ver planos e preços
- [ ] Editar stripe_price_id
- [ ] Histórico de pagamentos

### Suporte Técnico

Problema? Reportar:
- Email: dev@daimach.com.br
- WhatsApp: [seu número]
```

---

## 🎯 ETAPA 6.3 — CRIAR GOOGLE FORM DE FEEDBACK

### Formulário de Feedback

```
https://forms.gle/...

Pergunta 1: Qual sua função? (Admin / Professor / Aluno)
Pergunta 2: Encontrou algum erro? (Sim / Não)
Pergunta 3: Se sim, qual foi? (texto)
Pergunta 4: O que podemos melhorar? (textarea)
Pergunta 5: Nota de 1-10: (escala)
```

**Ação:** Compartilhar link com todos os beta testers

---

## 🎯 ETAPA 6.4 — MONITORAR ERROS (Opção: Sentry)

### Setup básico (sem Sentry, só logs)

Adicionar ao `.env.local`:

```env
NEXT_PUBLIC_ENVIRONMENT=beta
LOG_LEVEL=debug
```

Na aplicação, logar erros:

```typescript
// src/lib/pilates/logger.ts
export function logError(context: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${new Date().toISOString()}] ${context}: ${message}`);
  
  // Opcional: enviar para backend (para salvar logs)
  // fetch('/api/logs', { method: 'POST', body: JSON.stringify({ context, message }) })
}
```

### Checker de Status

Criar: `/api/health/route.ts`

```typescript
export async function GET() {
  const checks = {
    supabase: 'ok',
    stripe: 'ok',
    timestamp: new Date().toISOString(),
  };
  
  return Response.json(checks);
}
```

**Acessar:** `https://pilates.daimach.com.br/api/health`

---

## 🎯 ETAPA 6.5 — PREPARAR EMAIL DE BOAS-VINDAS

Template: `emails/welcome.tsx` (usando Resend)

```typescript
export function WelcomeEmail({ name, loginUrl, password }) {
  return (
    <div>
      <h1>Bem-vindo ao DAIMACH Pilates! 🎉</h1>
      <p>Olá {name},</p>
      <p>Você foi selecionado para testar nosso novo app de Pilates.</p>
      
      <h2>Seus Dados de Acesso:</h2>
      <p><strong>URL:</strong> {loginUrl}</p>
      <p><strong>Email:</strong> {email}</p>
      <p><strong>Senha:</strong> {password}</p>
      
      <h2>Próximos Passos:</h2>
      <ol>
        <li>Acesse o app</li>
        <li>Faça login com seus dados</li>
        <li>Complete seu perfil</li>
        <li>Comece a usar!</li>
      </ol>
      
      <h2>Feedbacks?</h2>
      <p>Preencha nosso formulário: {feedbackUrl}</p>
      
      <p>Obrigado por testar! 🙏</p>
    </div>
  );
}
```

---

## 🎯 ETAPA 6.6 — CRIAR TIMELINE DE BETA

```
DIA 1 — Convite + Acesso
- Enviar email de boas-vindas com dados de login
- Enviar link do guia de onboarding
- Disponibilizar suporte por WhatsApp

DIAS 2-7 — Testes Básicos
- Alunos: testar login, ver aulas, marcar reposição
- Admin: testar dashboard, matricular alunos, dar baixa

DIAS 8-14 — Testes Avançados
- Pagamento com Stripe (teste com cartão 4242 4242...)
- Google Calendar sync (se implementado)
- Avaliações físicas + fotos
- PDF export

DIA 15 — Feedback Consolidado
- Coletar formulários de feedback
- Analisar erros
- Priorizar correções

DIA 16+ — Ajustes Finais
- Corrigir bugs encontrados
- Melhorias baseadas em feedback
- Preparar para lancamento público
```

---

## 📝 CHECKLIST ETAPA 6

- [ ] 50 alunos criados no banco
- [ ] Alunos matriculados em turmas
- [ ] Documentação de onboarding criada
- [ ] Google Form de feedback criado
- [ ] Template de email de boas-vindas preparado
- [ ] Emails enviados para beta testers
- [ ] Sistema de logs/monitoramento funciona
- [ ] Endpoint `/api/health` criado
- [ ] WhatsApp de suporte configurado
- [ ] Timeline de beta definida
- [ ] Relatório final atualizado

---

## ✅ RESULTADO FINAL

Quando terminar:

✅ 50 beta testers com acesso  
✅ Documentação clara para todos os papéis  
✅ Sistema de feedback pronto  
✅ Monitoramento de erros  
✅ Suporte configurado  

---

## 🎯 PRÓXIMOS PASSOS (Pós-Beta)

```
SE tudo passar no beta:
→ Correções de bugs
→ Deploy em produção real
→ Lancamento público

SE encontrar muitos erros:
→ Priorizar correções críticas
→ Re-validar com subset dos beta testers
→ Iterar
```

---

## 📊 MÉTRICAS PARA ACOMPANHAR

Durante o beta, anotar:

- [ ] Quantos usuários fizeram login? (meta: >40)
- [ ] Quantos bugs foram reportados?
- [ ] Qual é a taxa de erro por dia?
- [ ] Qual feature é mais usada?
- [ ] Qual é a nota média de satisfação?

---

> **Data estimada:** Hoje à noite + próximos dias  
> **Status:** Aguardando execução  
> **Dependência:** Nenhuma (tudo é preparação)
