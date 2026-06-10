# 🆘 ETAPA 7 — TROUBLESHOOTING + FAQ COMPLETO
**Objetivo:** Guia de problemas comuns + respostas rápidas  
**Tempo estimado:** 1 hora (apenas criação, não execução)  
**Bloqueador:** Nenhum  

---

## 🎯 O QUE É ESTA ETAPA

Quando os 50 beta testers começarem a usar, vão aparecer problemas:
- "App não abre"
- "Senha não funciona"
- "Avaliação não salva"
- "Google Calendar não sincroniza"

Este MD é um **guia de troubleshooting automático** que você pode:
- Compartilhar com beta testers
- Usar pra resolver problemas rápido
- Coletar dados de bugs

---

## 📋 SEÇÃO 1 — LOGIN NÃO FUNCIONA

### Problema: "Email ou senha incorretos"

**Causas possíveis:**
1. Email digitado errado
2. CAPS LOCK ativado
3. Conta não ativada
4. Senha expirou

**Solução:**
```
1. Verificar se email está correto (sem espaços)
2. Desativar CAPS LOCK
3. Tentar "Esqueci a Senha" → receber email
4. Se não recebe email, contactar suporte@daimach.com.br
```

### Problema: "Email not confirmed" (Supabase)

**Causa:** Supabase exigindo confirmação de email (raro em beta)

**Solução:**
```
Contactar admin: "Email não foi confirmado"
Admin vai: Supabase → Desligar "Confirm email" ou confirmar manualmente
Tentar login novamente
```

### Problema: "Google OAuth não funciona"

**Causas:**
1. Navegador bloqueou pop-up
2. Cookies desabilitados
3. VPN ativa

**Solução:**
```
1. Permitir pop-ups do site
2. Limpar cookies (Ctrl+Shift+Delete)
3. Desativar VPN
4. Tentar em navegador anônimo
5. Se ainda não funcionar: contactar suporte
```

---

## 📋 SEÇÃO 2 — PROBLEMAS NA INTERFACE

### Problema: "Página branca / Erro 500"

**Causa:** Erro no servidor ou em um componente

**Solução:**
```
1. F12 → Console → ver mensagem de erro exata
2. Print da mensagem
3. Enviar para: dev@daimach.com.br
4. Recarregar página (Ctrl+R)
5. Se persistir, contactar suporte
```

### Problema: "Botão não funciona"

**Causa:** Requisição não respondeu ou erro silencioso

**Solução:**
```
1. F12 → Network → clicar botão novamente
2. Ver se aparece requisição POST/GET em vermelho
3. Se sim, error: [XXX]
4. Print + enviar para dev@daimach.com.br
5. Tentar outra navegador
```

### Problema: "Tabela não carrega"

**Causa:** Supabase lento ou erro na query

**Solução:**
```
1. Esperar 5 segundos (pode estar carregando)
2. Se não carrega, F5 (refresh)
3. Se ainda não, F12 → Network → procurar /api/...
4. Se erro 500: supabase problem
5. Se erro 401: problema de auth (fazer login novamente)
```

---

## 📋 SEÇÃO 3 — PROBLEMAS DE DADOS

### Problema: "Não consigo matricular aluno em turma"

**Causa:** RLS (Row Level Security) bloqueando, ou SQL não rodou

**Solução para admin:**
```
1. Verificar se SQL B1 foi executado: SELECT * FROM enrollments_pilates;
2. Se table não existe: rodar SQL do PENDENCIAS_WILLIAN.md seção B1
3. Se existe mas erro RLS: rodar ALTER TABLE enrollments_pilates DISABLE ROW LEVEL SECURITY;
4. Tentar novamente
```

### Problema: "Avaliação não salva"

**Causa:** Coluna faltando, ou bucket 'evaluations' não existe

**Solução:**
```
1. F12 → Console → ver erro exato
2. Se erro menciona "column": coluna não existe
3. Se erro menciona "bucket": Storage não tem 'evaluations'
4. Admin vai Supabase Storage → criar bucket 'evaluations' (privado)
5. Tentar salvar novamente
```

### Problema: "Reposição não funciona"

**Causa:** SQL C1 não rodou

**Solução:**
```
1. Admin verifica: SELECT * FROM reposition_slots;
2. Se vazio: SQL C1 não rodou
3. Rodar SQL do PENDENCIAS_WILLIAN.md seção C1
4. Tentar criar slot novamente
```

---

## 📋 SEÇÃO 4 — PROBLEMAS DE PAGAMENTO (Stripe)

### Problema: "Botão 'Assinar' não aparece"

**Causa:** Price ID não configurado no plano

**Solução para admin:**
```
1. Ir para /admin/planos
2. Clicar no plano
3. Verificar se tem "Stripe Price ID" preenchido
4. Se vazio: colar um price_id válido (do Stripe)
5. Salvar
6. Mostrar para aluno de novo
```

### Problema: "Checkout do Stripe não abre"

**Causa:** Price ID inválido, ou Stripe secret key errada

**Solução:**
```
1. F12 → Network → clicar "Assinar" → procurar /api/stripe/...
2. Se erro 500: secret key errada (.env.local)
3. Se erro 400: price_id inválido
4. Admin verifica Stripe dashboard: produto existe?
5. Se não: criar novo produto + price_id
6. Tentar novamente
```

### Problema: "Pagamento foi debitado, mas não aparece no app"

**Causa:** Webhook não chegou, ou status não sincronizou

**Solução:**
```
1. Verificar Stripe Dashboard → Payments → procurar transação
2. Se "succeeded": pagamento ok, problema é só visual
3. Fazer refresh no app (Ctrl+R)
4. Verificar /aluno/financeiro
5. Se ainda não mostra: webhook não chegou
6. Admin contacta dev@daimach.com.br com ID da transação
```

---

## 📋 SEÇÃO 5 — PROBLEMAS DE NOTIFICAÇÃO

### Problema: "Não recebi email de confirmação"

**Causa:** Resend API key errada, ou email digitado errado

**Solução:**
```
1. Verificar se email está correto (sem typos)
2. Verificar pasta SPAM/Lixeira
3. Aguardar 5 minutos (pode estar lento)
4. Se não chegar: admin contacta Resend support
5. Ou usar outro email
```

### Problema: "Push notification não funciona"

**Causa:** VAPID keys erradas, ou navegador bloqueou

**Solução:**
```
1. Verificar permissão de notificação no navegador
2. Ir para settings → site → notifications → Allow
3. Recarregar página
4. Se ainda não: VAPID keys podem estar erradas
5. Admin gera novas: npx web-push generate-vapid-keys
```

---

## 📋 SEÇÃO 6 — PROBLEMAS DE PERFORMANCE

### Problema: "App muito lento"

**Causas:**
1. Internet lenta
2. Muitos dados (tabela com 1000+ registros)
3. Browser com muitas abas abertas
4. Cache cheio

**Solução:**
```
1. Testar internet: speedtest.net
2. Se < 10 Mbps: trocar internet
3. Limpar cache (Ctrl+Shift+Delete)
4. Fechar outras abas
5. Tentar em incógnito
6. Se ainda lento: contactar dev@daimach.com.br
```

### Problema: "App trava depois de usar por 1 hora"

**Causa:** Memory leak (raro, mas possível)

**Solução:**
```
1. Recarregar página (F5)
2. Fazer logout + login
3. Limpar cache do navegador
4. Se problema persiste: reportar com:
   - O que você estava fazendo
   - Quanto tempo usava
   - Quantas abas abertas
```

---

## 📋 SEÇÃO 7 — PROBLEMAS COM GOOGLE CALENDAR

### Problema: "Evento não aparece no Google Calendar"

**Causa:** Token expirou, ou API não respondeu

**Solução:**
```
1. Fazer logout + login novamente (renova token)
2. Tentar adicionar ao calendar novamente
3. Verificar Google Calendar (gmail.com → Calendar)
4. Se ainda não aparece: API pode estar down
5. Tentar em outra browser
```

### Problema: "Data/hora errada no Calendar"

**Causa:** Timezone configurado errado

**Solução:**
```
1. Verificar timezone do navegador (Windows)
2. Painel de Controle → Data e Hora
3. Confirmar: "América/São Paulo"
4. Se errado: corrigir
5. Fazer logout + login
6. Tentar novamente
```

---

## 📋 SEÇÃO 8 — PROBLEMAS DO ANDROID APK

### Problema: "APK não instala"

**Causa:** Versão incompatível, ou espaço insuficiente

**Solução:**
```
1. Verificar Android version: Settings → About → Android version
2. Mínimo: Android 6.0 (Marshmallow)
3. Se compatível: liberar espaço (1 GB mínimo)
4. Tentar instalar novamente via: adb install
5. Se erro "INSTALL_FAILED_INVALID_APK": APK corrompido
   - Baixar novamente
```

### Problema: "App abre mas fecha sozinho"

**Causa:** Crash no Capacitor, ou permissões faltando

**Solução:**
```
1. Verificar permissões: Settings → Apps → Pilates → Permissions
2. Ativar: Camera, Location, Contacts (se pedido)
3. Desinstalar app: adb uninstall br.com.pilates.app
4. Instalar novamente
5. Se continua: contactar dev@daimach.com.br com:
   - Android version
   - Modelo do celular
   - Se tem espaço livre
```

---

## 📋 SEÇÃO 9 — CONTATO DE SUPORTE

### Quando contactar cada um:

| Problema | Contacte | Canal |
|----------|----------|-------|
| Login, senha, reset | Admin (Willian) | WhatsApp / Email |
| Bug visual, interface | Dev | dev@daimach.com.br |
| Pagamento, Stripe | Admin | suporte@daimach.com.br |
| Google Calendar, integração | Dev | dev@daimach.com.br |
| Android APK | Dev | dev@daimach.com.br |
| Dados não salvam | Dev | dev@daimach.com.br com print |

### Informações para incluir em bug report:

```
Título: [O que não funciona em 1 frase]

Descrição:
- O que você estava fazendo
- O que deveria acontecer
- O que aconteceu de verdade
- Screenshot ou vídeo (se possível)

Ambiente:
- Device (celular, desktop)
- Browser (Chrome, Safari, etc)
- Sistema operacional (Windows, Android, etc)
- Versão do app (se souber)

Erro (se houver):
- Mensagem de erro exata
- Código de erro (status 500, etc)
```

---

## ✅ RESULTADO FINAL

Quando terminar esta etapa:

✅ FAQ completo criado
✅ Troubleshooting for every major feature
✅ Contatos de suporte definidos
✅ Template de bug report pronto

---

## 📝 CHECKLIST ETAPA 7

- [ ] FAQ criado (9 seções)
- [ ] Troubleshooting para cada feature
- [ ] Contatos de suporte definidos
- [ ] Template de bug report criado
- [ ] Compartilhado com beta testers
- [ ] Relatório atualizado

---

> **Data estimada:** 1 hora (leitura + customização)  
> **Status:** Criação de documentação  
> **Próximo:** ETAPA 8 — Checklist Pré-Lancamento
