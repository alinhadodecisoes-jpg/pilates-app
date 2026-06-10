# 👨‍💼 GUIA DO ADMINISTRADOR — DAIMACH PILATES (BETA)

**Bem-vindo ao Dashboard do Daimach Pilates!**

Este guia mostra como gerenciar o sistema durante o período de beta.

---

## 🔑 ACESSO

### Login

**Opção A — Email + Senha**
```
URL: https://localhost:3000 (local) ou https://pilates.daimach.com.br (produção)
Email: seu@email.com
Senha: [sua senha]
```

**Opção B — Google (Recomendado)**
```
Clique: "Entrar com Google"
Use sua conta Google de administrador
```

---

## 📊 DASHBOARD

Ao fazer login, você verá:

- **Total de Alunos:** número de matriculados
- **Turmas Ativas:** quantas aulas estão rodando
- **Inadimplentes:** alunos com pagamento vencido
- **Reposições Pendentes:** solicitações aguardando aprovação

---

## 👥 GERENCIAR ALUNOS

### Ver Lista de Alunos
```
Menu: Alunos
Buscar por: nome, email, telefone, status
Filtrar por: plano, status (ativo/inativo)
```

### Criar Novo Aluno
```
Clique: "+ Novo Aluno"
Preencha:
  - Nome completo
  - Email (única na base)
  - Telefone (WhatsApp)
  - Altura (cm)
  - Peso (kg)
  - Plano (2x/Semana, Livre, Particular)
  
✅ Sistema gera senha automática
✅ Você pode compartilhar via:
   - WhatsApp
   - Email (Resend)
   - Copiar credenciais manualmente
```

### Editar Aluno
```
Clique no aluno
Modifique: nome, telefone, email, status
Clique: "Salvar"
```

### Desativar Aluno
```
Clique no aluno
Altere status para: "Inativo"
Clique: "Salvar"

Nota: Dados não são deletados, apenas marcados como inativos
```

---

## 📅 GERENCIAR TURMAS

### Ver Turmas
```
Menu: Turmas
Veja grade de horários
Cada turma mostra: nome, professor, horários, capacidade
```

### Criar Nova Turma
```
Clique: "+ Nova Turma"
Preencha:
  - Nome (ex: "Pilates Manhã - Ana Clara")
  - Professor (dropdown)
  - Dia da semana (seg-sáb)
  - Horário início (08:00)
  - Horário fim (09:00)
  - Capacidade (4-10 alunos)
  
Clique: "Criar"
```

### Matricular Aluno em Turma
```
Clique: "👥 Alunos" (na turma)
Modal abre com:
  - Lista de "Matriculados"
  - Dropdown "Adicionar Aluno"
  
Selecione aluno → Clique "+ Matricular"
Aluno aparece em "Matriculados"
```

### Cancelar Aula
```
Em produção:
  - Clique no dia da semana
  - Clique "Cancelar Aula"
  - Notificação é enviada a alunos
  - Aulas podem ser reposicionadas
```

---

## 🔄 GERENCIAR REPOSIÇÕES

### Criar Slot de Reposição
```
Menu: Reposições
Aba: "Horários Disponíveis"
Clique: "+ Novo Slot"

Preencha:
  - Turma (dropdown)
  - Data (calendario)
  - Horário início
  - Horário fim
  - Capacidade (vagas)
  
Clique: "Criar Slot"
```

### Aprovar Reposição
```
Menu: Reposições
Aba: "Solicitações"

Para cada solicitação:
  - Nome do aluno
  - Horário solicitado
  - Botão "✅ Aprovar"
  
Clique: "Aprovar"
  → Status muda para "Aprovada"
  → Presença é criada automaticamente
  → Notificação é enviada
```

### Recusar Reposição
```
Clique: "✕ Recusar"
  → Status muda para "Recusada"
  → Motivo (opcional)
  → Notificação é enviada
```

---

## 💳 GERENCIAR PLANOS

### Ver Planos
```
Menu: Planos
Veja 3 planos:
  - Plano 2x/Semana (R$ 199)
  - Plano Livre (R$ 299)
  - Plano Particular (R$ 450)
```

### Editar Preço
```
Clique no plano → "Editar"
Modifique: nome, preço, descrições
Clique: "Salvar"
```

### Configurar Stripe
```
Para cada plano, configure o "Stripe Price ID":

1. Vá ao Stripe Dashboard
2. Crie um "Price" recorrente
3. Copie o ID (price_xxx)
4. Cole no campo "Stripe Price ID" do plano
5. Clique: "Salvar"

Nota: Use price_test_ para testes, price_ para produção
```

---

## 📈 RELATÓRIOS

### Ver Receita
```
Menu: Financeiro
Veja:
  - Faturamento do mês
  - Alunos inativos (inadimplentes)
  - Histórico de pagamentos
  - Gráfico de crescimento
```

### Exportar Dados
```
(Em breve) Clique: "📥 Exportar"
Escolha formato: CSV, PDF, Excel
Salve no seu computador
```

---

## 🛡️ SEGURANÇA

### Senhas
- ✅ Nunca compartilhe sua senha
- ✅ Mude a senha a cada 3 meses
- ✅ Use senhas fortes (12+ caracteres)

### Backup
```
Menu: Backups
Clique: "🔄 Fazer Backup Agora"
Sistema salva no Google Drive
```

### Logs de Atividade
```
Menu: Relatórios → Logs
Veja histórico de:
  - Quem criou/editou alunos
  - Quem criou turmas
  - Quem aprovou reposições
  - Timestamps de cada ação
```

---

## 🐛 PROBLEMAS COMUNS

**P: Aluno não consegue entrar**
A: Verifique se o email existe e está ativo. Resete a senha.

**P: Reposição não foi aprovada**
A: Verifique RLS policy do Supabase. Pode ser erro de permissão.

**P: Preço do Stripe não atualiza**
A: Salve novamente o Stripe Price ID. Limpe cache do navegador.

**P: Alunos não recebem notificação**
A: Verifique se Resend API está configurada. Veja logs em `/api/notify`.

---

## 📞 SUPORTE TÉCNICO

| Problema | Solução |
|----------|---------|
| App não carrega | Limpe cache (F12 → Storage → Clear All) |
| Erro 500 | Verifique .env.local, restartar servidor |
| Banco desconectado | Veja status Supabase em supabase.com |
| Stripe falha | Veja chaves em .env.local, RELOADLOCALHOST |

---

## ✅ CHECKLIST DE SETUP

- [ ] Criar 50 alunos (SQL script ou manual)
- [ ] Criar 5 turmas de teste
- [ ] Matricular alunos em turmas
- [ ] Configurar Stripe Price IDs
- [ ] Testar: criar turma
- [ ] Testar: matricular aluno
- [ ] Testar: criar reposição
- [ ] Testar: aprovar reposição
- [ ] Testar: login como aluno
- [ ] Testar: navegação completa

---

> Versão Beta — Junho 2026  
> Daimach.Movement Pilates & Fisioterapia

