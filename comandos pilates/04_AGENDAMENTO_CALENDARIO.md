# 📅 MD 04 — AGENDAMENTO + CALENDÁRIO (com Google Calendar)

**Objetivo:** Calendário visual de aulas, aluno reserva vaga em aula específica, lista de
espera quando lota, cancelamento com regra de prazo, e sincronização opcional com o
Google Calendar do estúdio/aluno.

**Reaproveitar do projeto antigo (companion-os):** já tinha Google Calendar completo —
`/api/google/auth`, `/callback`, `/create-event`, `/update-event`, `/delete-event`,
`/sync-calendar`, tabela `google_tokens`, e `src/lib/google-tools.ts`. Reaproveitar tudo.

---

## CONTEXTO TÉCNICO
- Hoje as turmas são fixas por dia (Sprint 1). Este MD adiciona **ocorrências de aula
  por data** (uma aula concreta em 12/06 às 09:00) e **reservas** nelas.
- Google Calendar: ao criar/cancelar aula, refletir no calendário Google (estúdio).
  Aluno pode conectar o Google dele e receber a aula na agenda pessoal.

---

## PASSO 1 — SQL no Supabase (cole e RUN)

```sql
-- Ocorrências concretas de aula (instâncias por data, geradas a partir de classes_pilates)
CREATE TABLE IF NOT EXISTS class_sessions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  class_id BIGINT NOT NULL REFERENCES classes_pilates(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  capacity INT DEFAULT 4,
  status TEXT DEFAULT 'scheduled',     -- scheduled | canceled | done
  google_event_id TEXT,                -- id do evento no Google Calendar
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(class_id, session_date)
);

-- Reservas do aluno numa ocorrência
CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  session_id BIGINT NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users_pilates(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'booked',        -- booked | waitlist | canceled | attended | no_show
  booked_at TIMESTAMP DEFAULT NOW(),
  canceled_at TIMESTAMP,
  UNIQUE(session_id, user_id)
);

-- Tokens Google (reaproveitar do projeto antigo)
CREATE TABLE IF NOT EXISTS google_tokens (
  user_id UUID PRIMARY KEY REFERENCES users_pilates(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  expiry TIMESTAMP,
  scope TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE class_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE google_tokens DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_sessions_date ON class_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_bookings_session ON bookings(session_id, status);
```

---

## PASSO 2 — COMANDO PARA O CLAUDE CODE

```
MD 04 — AGENDAMENTO + CALENDÁRIO + GOOGLE CALENDAR

Projeto: C:\Users\willa\pilates-app
Projeto antigo (reaproveitar): C:\Users\willa\companion-os
Autorização total. PRESERVE o que já funciona. day_of_week: 1=Seg..7=Dom.

CONTEXTO: Tabelas novas: class_sessions (ocorrências por data), bookings (reservas),
google_tokens. Reaproveitar Google Calendar do companion-os.

TAREFA 1 — Gerar ocorrências de aula:
Criar src/app/api/sessions/generate/route.ts:
- A partir de classes_pilates, gerar class_sessions para as próximas 4 semanas
  (respeitando day_of_week e horários). Idempotente (não duplica — usa UNIQUE class_id+date).
- Admin pode chamar via botão "Gerar agenda do mês" em /admin/turmas.

TAREFA 2 — Calendário visual:
Criar src/app/admin/agenda/page.tsx e src/app/aluno/agenda/page.tsx:
- Vista semanal (grade dias x horários) e/ou mensal das class_sessions
- Admin: vê todas as aulas, lotação (X/capacity), pode cancelar uma ocorrência
- Aluno: vê aulas com vaga e botão "Reservar"
- Usar uma lib leve de calendário ou montar a grade com CSS grid + cores daimach
- Adicionar "Agenda" no menu lateral (admin e aluno)

TAREFA 3 — Reserva + lista de espera:
- Aluno "Reservar": se vaga (bookings booked < capacity) → status 'booked';
  se lotado → 'waitlist'
- Aluno "Cancelar": regra de prazo — só pode cancelar até X horas antes (config, ex: 4h).
  Ao cancelar, se havia waitlist, promover o primeiro da fila para 'booked' + notificar (MD02).
- Mostrar a posição na lista de espera.

TAREFA 4 — Integração Google Calendar (reaproveitar):
- Copiar do companion-os: google-tools.ts e rotas /api/google/auth, /callback,
  /create-event, /update-event, /delete-event, /sync-calendar
- Adaptar paths. Pedir ao usuário as variáveis GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI do .env antigo (me avise quais faltam)
- Ao criar class_session → criar evento no Google Calendar do estúdio → salvar google_event_id
- Ao cancelar → deletar/atualizar o evento
- Botão "Conectar Google" no perfil do aluno: ao reservar, cria evento na agenda dele

TAREFA 5 — Presença a partir da reserva:
- Admin/professor marca quem compareceu (booking status attended/no_show)
- Refletir em attendances_pilates para manter histórico (Sprint 1/3)

TESTE (Claude in Chrome):
1. Admin → "Gerar agenda do mês" → class_sessions criadas para 4 semanas
2. Admin/aluno → /agenda mostra grade com as aulas e lotação
3. Aluno reserva → vira booked; lotar a turma → próximo vira waitlist
4. Aluno cancela dentro do prazo → waitlist promovido + notificado
5. (Se Google conectado) evento aparece no Google Calendar
6. npm run build sem erros

Commit: "md04: agendamento+calendario+google calendar"
```

---

## ✅ CHECKPOINT MD 04
- [ ] Ocorrências de aula geradas para 4 semanas
- [ ] Calendário visual (admin e aluno)
- [ ] Reserva com vaga e lista de espera
- [ ] Cancelamento com regra de prazo + promoção da fila
- [ ] Google Calendar criando/cancelando eventos (reaproveitado)
- [ ] Presença a partir da reserva

---

## OBSERVAÇÕES
- Comece SEM Google Calendar (só o agendamento interno). Adicione a sincronização Google depois
  que o core de reservas estiver estável — assim isola problemas de OAuth.
- A regra de prazo de cancelamento evita "furo" de última hora — defina o número de horas com a dona.
- Este MD pode substituir/expandir o Sprint 3 (reposição) no futuro, integrando tudo num só calendário.
