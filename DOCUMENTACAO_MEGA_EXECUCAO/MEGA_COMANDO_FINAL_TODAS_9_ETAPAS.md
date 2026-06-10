╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║            MEGA EXECUÇÃO PILATES MVP — TODAS AS 9 ETAPAS                  ║
║                         (COMANDO ÚNICO)                                   ║
║                                                                            ║
║     Projeto: C:\Users\willa\pilates-app                                   ║
║     Pasta Documentação: C:\Users\willa\pilates-app\DOCUMENTACAO\           ║
║                        MEGA_EXECUCAO\                                     ║
║                                                                            ║
║     ⚠️  LEIA TUDO ANTES DE COMEÇAR!                                        ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝

===================================
PRÉ-EXECUÇÃO CRÍTICA
===================================

ANTES DE COLAR ESTE COMANDO, CONFIRME:

✅ Todas as 13 arquivos MD estão na pasta:
   C:\Users\willa\pilates-app\DOCUMENTACAO\MEGA_EXECUCAO\

   [ ] INDICE_COMPLETO_MEGA_EXECUCAO.md
   [ ] MASTER_COMMAND_TODAS_ETAPAS.md
   [ ] COMANDO_TESTE_FINAL_BLOCOS_A_E.md
   [ ] ETAPA_2_APK_ANDROID_COMPLETO.md
   [ ] ETAPA_3_UI_REFINAMENTO_COMPLETO.md
   [ ] ETAPA_4_GOOGLE_CALENDAR_INTEGRACAO.md
   [ ] ETAPA_5_DEPLOY_VERCEL_PRODUCAO.md
   [ ] ETAPA_6_PREPARACAO_BETA_50_USUARIOS.md
   [ ] ETAPA_7_TROUBLESHOOTING_FAQ_SUPORTE.md
   [ ] ETAPA_8_CHECKLIST_PRE_LANCAMENTO.md
   [ ] ETAPA_9_MONITORAMENTO_ESCALABILIDADE.md

✅ SQL foi executado (A1, B1, C1)
✅ .env.local está completo com todas as 12 chaves
✅ npm run build passa (zero TypeScript errors)

SE ALGO ACIMA FALHAR: PARE E CORRIJA ANTES DE CONTINUAR

===================================
INSTRUÇÃO PARA CLAUDE CODE
===================================

Você (Claude Code) vai:

1. LER todos os arquivos MD na ordem
2. EXECUTAR ETAPA POR ETAPA em sequência
3. PARAR após cada etapa pra confirmação
4. CRIAR relatório por etapa
5. FAZER commits Git
6. GERAR resumo final

REGRA CRÍTICA:
- NÃO avançar para próxima etapa sem avisar aqui
- CADA ETAPA precisa de validação manual (Willian confirma)
- SE BLOQUEADO em algo: PARAR e ANOTAR no relatório
- NUNCA dizer "pronto" se não testou de verdade

===================================
SEQUÊNCIA EXATA (9 ETAPAS)
===================================

ETAPA 1 — TESTES COMPLETOS (BLOCOS A-E)
═══════════════════════════════════════

Arquivo: COMANDO_TESTE_FINAL_BLOCOS_A_E.md

Tarefas:
✅ Ler arquivo inteiro
✅ BLOCO A: role constraint + 4 papéis + usePilatesAuth
✅ BLOCO B: matricular aluno + novo aluno com senha auto
✅ BLOCO C: sistema real de reposições (solicita → aprova)
✅ BLOCO D: professor acesso limitado
✅ BLOCO E: Stripe price_id editável + TEST MODE
✅ npm run build (validação final)
✅ Criar RELATORIO_ETAPA_1.md

Saída Esperada:
- RELATORIO_ETAPA_1.md com status de cada bloco
- Build passando
- Commit: "etapa-1: testes a-e completos"

Validação (PARAR AQUI):
Avisar Willian:
"""
✅ ETAPA 1 CONCLUÍDA
Testes: X/13 passaram
Build: ✅ passou
Pronto para ETAPA 2? Digita SIM para continuar
"""

═══════════════════════════════════════

ETAPA 2 — APK ANDROID COMPLETO
═══════════════════════════════════════

Arquivo: ETAPA_2_APK_ANDROID_COMPLETO.md

Tarefas:
✅ Ler arquivo
⚠️ VALIDAR: Android Studio + Java JDK 17 instalados
✅ npx cap sync android
✅ android\gradlew.bat assembleDebug (ou Release)
✅ adb install APK no celular/emulador
✅ Testar 10+ features no celular (logo, login, navegação)
✅ Criar RELATORIO_ETAPA_2.md
✅ npm run build (validação)

Saída Esperada:
- APK funcional no celular/emulador
- 10+ testes documentados
- RELATORIO_ETAPA_2.md
- Commit: "etapa-2: apk android funcional"

Validação (PARAR AQUI):
Avisar Willian:
"""
✅ ETAPA 2 CONCLUÍDA (ou BLOQUEADO em Android Studio)
APK: funcional em [celular/emulador]
Testes passaram: X/10
Pronto para ETAPA 3? Digita SIM
"""

═══════════════════════════════════════

ETAPA 3 — UI REFINAMENTO COMPLETO
═══════════════════════════════════════

Arquivo: ETAPA_3_UI_REFINAMENTO_COMPLETO.md

Tarefas:
✅ Ler arquivo
✅ Atualizar tailwind.config.ts (cores verde/aqua)
✅ Validar componentes (botões, cards, modais)
✅ Testar responsividade (desktop/tablet/mobile)
✅ Validar 10+ páginas visualmente
✅ Criar RELATORIO_ETAPA_3.md
✅ npm run build

Saída Esperada:
- Design system consistente
- 10+ páginas validadas
- Responsivo em 3 devices
- RELATORIO_ETAPA_3.md
- Commit: "etapa-3: ui refinamento visual"

Validação (PARAR AQUI):
Avisar Willian:
"""
✅ ETAPA 3 CONCLUÍDA
Páginas validadas: X/15
Design: consistente
Pronto para ETAPA 4? Digita SIM
"""

═══════════════════════════════════════

ETAPA 4 — GOOGLE CALENDAR INTEGRAÇÃO
═══════════════════════════════════════

Arquivo: ETAPA_4_GOOGLE_CALENDAR_INTEGRACAO.md

Tarefas:
✅ Ler arquivo
✅ Ativar Google Calendar API em console.cloud.google.com
✅ Adicionar escopo de calendar ao google-auth.ts
✅ Criar src/lib/google-calendar.ts
✅ Criar endpoint /api/calendar/sync
✅ Adicionar botão "Adicionar ao Calendar" no app
✅ Testar: clicar botão → evento aparece no Gmail
✅ Criar RELATORIO_ETAPA_4.md
✅ npm run build

Saída Esperada:
- Google Calendar API habilitada
- Botão funcional no app
- Eventos criados no Gmail (com data/hora certas)
- RELATORIO_ETAPA_4.md
- Commit: "etapa-4: google calendar sync"

Validação (PARAR AQUI):
Avisar Willian:
"""
✅ ETAPA 4 CONCLUÍDA
Evento no Calendar: criado com sucesso
Data/hora: correta
Pronto para ETAPA 5? Digita SIM
"""

═══════════════════════════════════════

ETAPA 5 — DEPLOY VERCEL PRODUÇÃO
═══════════════════════════════════════

Arquivo: ETAPA_5_DEPLOY_VERCEL_PRODUCAO.md

Tarefas:
✅ Ler arquivo
✅ Criar .env.example (sem valores reais)
✅ npm run build (validação local)
✅ Fazer import do projeto no Vercel (Willian faz)
✅ Adicionar 12 environment variables no Vercel
✅ Deploy realizado
✅ Testar URL pública (login, dados carregam)
✅ Configurar Stripe webhook
✅ Criar RELATORIO_ETAPA_5.md

Saída Esperada:
- .env.example criado
- URL pública funcional
- Login funciona
- Dados carregam do Supabase
- RELATORIO_ETAPA_5.md
- Commit: "etapa-5: deploy vercel producao"

Validação (PARAR AQUI):
Avisar Willian:
"""
✅ ETAPA 5 CONCLUÍDA
URL: https://[seu-domain].vercel.app
Login: ✅
Dados: ✅
Pronto para ETAPA 6? Digita SIM
"""

═══════════════════════════════════════

ETAPA 6 — PREPARAÇÃO BETA 50 USUÁRIOS
═══════════════════════════════════════

Arquivo: ETAPA_6_PREPARACAO_BETA_50_USUARIOS.md

Tarefas:
✅ Ler arquivo
✅ Criar 50 alunos (via SQL seed ou manual)
✅ Matricular em turmas
✅ Criar docs/GUIA_ALUNO_BETA.md
✅ Criar docs/GUIA_ADMIN_BETA.md
✅ Criar Google Form de feedback
✅ Preparar template de email (Resend)
✅ Criar /api/health endpoint
✅ Preparar timeline de beta
✅ Enviar convites
✅ Criar RELATORIO_ETAPA_6.md
✅ npm run build

Saída Esperada:
- 50 alunos criados e matriculados
- Documentação de onboarding
- Google Form feedback
- Email pronto
- RELATORIO_ETAPA_6.md
- Commit: "etapa-6: preparacao beta 50 usuarios"

Validação (PARAR AQUI):
Avisar Willian:
"""
✅ ETAPA 6 CONCLUÍDA
Beta testers: 50 convidados
Documentação: pronta
Feedback: Google Form criado
Pronto para ETAPA 7? Digita SIM
"""

═══════════════════════════════════════

ETAPA 7 — TROUBLESHOOTING + FAQ
═══════════════════════════════════════

Arquivo: ETAPA_7_TROUBLESHOOTING_FAQ_SUPORTE.md

Tarefas:
✅ Ler arquivo
✅ Criar docs/TROUBLESHOOTING.md (9 seções)
✅ Criar template de bug report
✅ Definir contatos de suporte (email + WhatsApp)
✅ Compartilhar FAQ com beta testers
✅ Criar RELATORIO_ETAPA_7.md

Saída Esperada:
- FAQ completo (9 seções)
- Troubleshooting pronto
- Template bug report
- RELATORIO_ETAPA_7.md
- Commit: "etapa-7: faq e troubleshooting"

Validação (PARAR AQUI):
Avisar Willian:
"""
✅ ETAPA 7 CONCLUÍDA
FAQ: criado (9 seções)
Troubleshooting: pronto
Pronto para ETAPA 8? Digita SIM
"""

═══════════════════════════════════════

ETAPA 8 — CHECKLIST PRÉ-LANCAMENTO
═══════════════════════════════════════

Arquivo: ETAPA_8_CHECKLIST_PRE_LANCAMENTO.md

Tarefas:
✅ Ler arquivo
✅ Validar 10/10 bugs críticos (login, dashboard, etc)
✅ Testar performance (3 scenarios: desktop/mobile/saturado)
✅ Validar segurança (RLS, senhas, dados privados)
✅ Validar LGPD (política, retenção, consentimento)
✅ Revisar documentação
✅ Validar equipe preparada (suporte, monitoramento)
✅ Rodar 20+ smoke tests
✅ Testar em 6 navegadores/devices
✅ Criar RELATORIO_ETAPA_8.md

Saída Esperada:
- Checklist 89/89 itens validados (ou anotado bloqueadores)
- Testes passando
- RELATORIO_ETAPA_8.md
- Aprovação para lançamento: ✅ OK ou ❌ BLOQUEADO
- Commit: "etapa-8: pre-lancamento validado"

Validação (PARAR AQUI):
Avisar Willian:
"""
✅ ETAPA 8 CONCLUÍDA
Checklist: X/89 passou
Aprovação: ✅ OK para lançar ou ❌ BLOQUEADO em [X]
Pronto para ETAPA 9? Digita SIM
"""

═══════════════════════════════════════

ETAPA 9 — MONITORAMENTO + ESCALABILIDADE
═══════════════════════════════════════

Arquivo: ETAPA_9_MONITORAMENTO_ESCALABILIDADE.md

Tarefas:
✅ Ler arquivo
✅ Setup Sentry (monitoramento de erros)
✅ Revisar Vercel Analytics
✅ Acessar Supabase Logs
✅ Setup UptimeRobot (uptime monitoring)
✅ Criar ritual semanal de checklist
✅ Criar ritual mensal de análise
✅ Criar planilha de métricas (Google Sheets)
✅ Documentar plano de escalabilidade
✅ Documentar plano contingência
✅ Criar RELATORIO_ETAPA_9.md

Saída Esperada:
- 4 sistemas de monitoramento funcionando
- Alertas automáticos configurados
- Ritual semanal/mensal definido
- Planilha de métricas criada
- RELATORIO_ETAPA_9.md
- Commit: "etapa-9: monitoramento e escalabilidade"

Validação (FINAL):
Avisar Willian:
"""
🎉 ETAPA 9 CONCLUÍDA — PROJETO 100% COMPLETO!

Monitoramento: ✅ 4 sistemas (Sentry, Vercel, Supabase, UptimeRobot)
Escalabilidade: ✅ Pronto para crescimento
Relatórios: ✅ Todos criados

🚀 PILATES MVP ESTÁ PRONTO PARA:
✅ Beta com 50 testers (começar hoje)
✅ Lançamento público (após feedback beta)
✅ Escalabilidade até 1000+ usuários
✅ Monitoramento 24/7 automático

PRÓXIMO: Você gerencia o beta (1-2 semanas)
         Coleta feedback
         Faz pequenas correções
         Lança publicamente
"""

═══════════════════════════════════════════════════════════════════════════════

RELATÓRIO FINAL CONSOLIDADO

═══════════════════════════════════════════════════════════════════════════════

Após terminar ETAPA 9, criar:

C:\Users\willa\pilates-app\RELATORIO_COMPLETO_FINAL.md

Com:
- Summary executivo (1 página)
- Status de cada etapa (✅ / ⚠️ / ❌)
- Tempo total gasto
- Bugs encontrados + status
- Lições aprendidas
- Recomendações pós-lançamento
- Próximos 90 dias roadmap

═══════════════════════════════════════════════════════════════════════════════

COMO COMEÇAR AGORA

═══════════════════════════════════════════════════════════════════════════════

1. Cole este comando inteiro no chat do Claude Code

2. Espere confirmação dele (pode levar 2-3 min pra ler)

3. Ele vai avisar:
   "Li as 9 etapas. Pronto pra começar ETAPA 1. Confirma?"

4. Você confirma: SIM

5. Ele começa ETAPA 1 (vai levar ~2-3 horas)

6. Quando terminar ETAPA 1, ele avisa aqui e espera seu "SIM" pra continuar

7. Você marca seu calendário:
   - Segunda noite: ETAPA 1 (2-3h)
   - Terça noite: ETAPA 2 (1-2h)
   - Terça/Quarta: ETAPA 3-4-5 (4h)
   - Quarta: ETAPA 6 (2-3h)
   - Quinta: ETAPA 7-8 (3-4h)
   - Sexta: ETAPA 9 (2h)
   TOTAL: ~20-25 horas spread em 4-5 noites

═══════════════════════════════════════════════════════════════════════════════

IMPORTANTE FINAL

═══════════════════════════════════════════════════════════════════════════════

Se em alguma etapa:
- ❌ BLOQUEADO: PARAR aqui, avisar, esperar solução
- ⚠️ ERRO: Anotar no relatório, corrigir se possível, continuar
- ✅ OK: Avisar, esperar confirmação, continuar

Se tempo/tokens acabarem:
- Salvar estado atual
- Retomar depois da mesma etapa
- NÃO é problema, é esperado com projeto grande

═══════════════════════════════════════════════════════════════════════════════

Você consegue isso! 🚀

Bora!
