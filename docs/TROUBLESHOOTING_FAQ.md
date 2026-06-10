# 🔧 TROUBLESHOOTING + FAQ — DAIMACH PILATES

---

## ❓ FAQ — ALUNOS

### 1. Não consigo fazer login

**Problema:** Erro "Email ou senha incorretos"

**Soluções:**
- ✅ Verifique se digitou o email correto
- ✅ Verifique se Caps Lock está desativado
- ✅ Clique "Esqueci minha senha" e resete
- ✅ Tente login com Google em vez disso

**Contato:** suporte@daimach.com.br

---

### 2. Aplicativo congelou/fechou

**Problema:** App congela ou fecha ao clicar em algo

**Soluções:**
- ✅ Feche o app completamente
- ✅ Reinicie seu celular
- ✅ Limpe cache do app (Configurações → Apps → Daimach → Limpar Cache)
- ✅ Desinstale e reinstale o app
- ✅ Verifique se tem espaço em disco

**Se persistir:** Tire screenshot e envie para suporte

---

### 3. Não vejo meus horários

**Problema:** Dashboard vazio ou aulas não aparecem

**Soluções:**
- ✅ Verifique internet (2G/3G/4G/WiFi)
- ✅ Puxe para baixo para recarregar
- ✅ Faça logout e login novamente
- ✅ Atualize o app para a última versão

**Se persistir:** Você pode estar sem plano ativo

---

### 4. Reposição não aparece como solicitada

**Problema:** Solicitei mas não vejo na lista "Minhas Solicitações"

**Soluções:**
- ✅ Atualize a tela (puxe para baixo)
- ✅ Feche e abra de novo a aba "Reposições"
- ✅ Saia e entre novamente no app
- ✅ Verifique se realmente clicou em "Solicitar"

**Se persistir:** Pode ter falta de internet na hora do envio

---

### 5. Devo pagar para usar o app?

**Resposta:** Não! O app é gratuito. Você paga apenas pela aula/plano de pilates (igual antes).

O app apenas facilita o gerenciamento de suas aulas.

---

### 6. Meus dados estão seguros?

**Resposta:** Sim! Seus dados:
- ✅ São criptografados em trânsito (HTTPS)
- ✅ Ficam no Supabase (banco de dados seguro)
- ✅ Nunca são compartilhados
- ✅ Você pode deletar sua conta quando quiser

---

### 7. Posso usar em múltiplos celulares?

**Resposta:** Sim! Faça login com o mesmo email em quantos celulares quiser. Dados sincronizam em tempo real.

---

### 8. O app funciona offline?

**Resposta:** Parcialmente. Você pode ver dados que já carregou, mas não consegue:
- Enviar reposições
- Fazer pagamento
- Editar perfil

Dados sincronizam assim que voltar online.

---

## ❓ FAQ — ADMIN/PROFESSOR

### 1. Não consigo acessar o dashboard

**Soluções:**
- ✅ Confirme que seu email/senha estão corretos
- ✅ Limpe cookies do navegador (F12 → Application → Clear Storage)
- ✅ Tente em navegador diferente
- ✅ Tente modo anônimo/incógnito
- ✅ Verifique se sua conta tem permissão de admin

---

### 2. Aluno não aparece na lista

**Problema:** Criei aluno mas não vejo em "/admin/alunos"

**Soluções:**
- ✅ Atualize a página (F5)
- ✅ Filtre por status "ativo"
- ✅ Procure pelo email exato
- ✅ Verifique se realmente salvou (erro aparecia?)

---

### 3. Não consigo matricular aluno

**Problema:** Botão "+ Matricular" não funciona

**Soluções:**
- ✅ Verifique se aluno existe
- ✅ Verifique se turma tem vagas disponíveis
- ✅ Tente em outro navegador
- ✅ Verifique console (F12 → Console) para ver erro

**Se ver erro RLS:** Isso significa falta de permissão no Supabase (contato técnico)

---

### 4. Stripe não está pegando o price_id

**Problema:** Configurei price_id mas Stripe diz que não existe

**Soluções:**
- ✅ Verifique se price_id está correto (começa com "price_")
- ✅ Verifique se é da conta certa (test_ ou prod)
- ✅ Aguarde 1-2 minutos e recarregue
- ✅ Tente em navegador anônimo (sem cache)
- ✅ Verifique se price_id está ativo no Stripe Dashboard

---

### 5. Pagamento não foi processado

**Problema:** Aluno tentou pagar mas falhou

**Soluções:**
- ✅ Verifique se Stripe Keys estão corretas (.env.local)
- ✅ Veja logs em `/api/stripe/webhook`
- ✅ Verifique se cartão testado é 4242 4242 4242 4242
- ✅ Teste com "test mode" ativo (pk_test_)

---

### 6. Não consigo deletar aluno

**Problema:** Quer remover aluno da base

**Resposta:** Por segurança, alunos não são deletados. Em vez disso:
1. Clique no aluno
2. Mude status para "Inativo"
3. Clique "Salvar"

Dados ficam na base (auditoria) mas aluno não pode logar.

---

### 7. Backup está grande demais

**Problema:** Backup ao Google Drive é lento/grande

**Solução:**
- ✅ Faça backups menos frequentemente
- ✅ Limpe dados antigos (alunos inativos, arquivos temporários)
- ✅ Use exporte em CSV em vez de backup completo

---

## 🐛 TROUBLESHOOTING TÉCNICO

| Erro | Causa | Solução |
|------|-------|---------|
| **Error 500** | Servidor erro | Restart Next.js: `npm run dev` |
| **Cannot read property 'id'** | Dado faltando | Verifique se objeto existe antes de acessar |
| **RLS policy violation** | Sem permissão | Verifique policy no Supabase |
| **Stripe API invalid request** | Key errada | Check .env.local STRIPE_SECRET_KEY |
| **OAuth login fails** | Google ID errado | Gerar novo em console.cloud.google.com |
| **Image upload fails** | Storage sem permissão | Verifique Supabase Storage bucket policies |
| **Email not sent** | Resend API erro | Check RESEND_API_KEY em .env.local |
| **Push notification silent** | VAPID key inválida | Regenerar em VAPID keygen |

---

## 🔍 COMO DEBUGAR

### No Navegador

```
1. Pressione F12 (Developer Tools)
2. Vá em "Console"
3. Procure por erros vermelhos
4. Copie e envie ao suporte
```

### No Backend

```
1. Vercel Logs: https://vercel.com → Logs
2. Supabase Logs: https://supabase.com → Logs
3. Local: Verifique terminal onde npm run dev está rodando
```

### Logs de Aplicação

```
Arquivo: .next/logs/* (não commitado)
Ou: console.log() no código para debug
```

---

## 📞 CONTATO SUPORTE

| Problema | Canal | Tempo |
|----------|-------|-------|
| **Bug urgente** | WhatsApp | 5 min |
| **Dúvida rápida** | WhatsApp | 15 min |
| **Bug relatório** | Email | 2 horas |
| **Feature request** | Google Form | 24h (resposta) |
| **Técnico** | Email tech | 1 hora |

**Email:** suporte@daimach.com.br  
**WhatsApp:** (11) 99999-9999  
**Tech:** tech@daimach.com.br  

---

> Última atualização: Junho 2026

