# 📅 ETAPA 4 — GOOGLE CALENDAR INTEGRAÇÃO COMPLETA
**Objetivo:** Sincronizar turmas do Pilates com Google Calendar do usuário  
**Tempo estimado:** 1-2 horas  
**Bloqueador:** Google OAuth já funciona (ETAPA 1)  

---

## 🎯 O QUE VAI FUNCIONAR

| Ação | Resultado |
|------|-----------|
| **Aluno clica "Adicionar ao Google Calendar"** | Aula é adicionada ao calendar do Gmail dele |
| **Professor cria turma** | Evento automático criado no calendário (se integração on) |
| **Admin cancela aula** | Evento no calendar é deletado automaticamente |
| **Aluno confirma reposição aprovada** | Evento criado no calendar com nova data |

---

## ✅ PRÉ-REQUISITOS

Validar que você tem:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Se não tiver, AVISE e PULE esta etapa.

---

## 🎯 ETAPA 4.1 — VALIDAR ROTAS GOOGLE (Já criadas em ETAPA 1)

Verificar se existem:

```
src/app/api/google/auth/route.ts
src/app/api/google/callback/route.ts
src/app/api/google/status/route.ts
```

**Esperado:** Arquivos existem, compilam sem erro

---

## 🎯 ETAPA 4.2 — HABILITAR GOOGLE CALENDAR API

1. Ir para: https://console.cloud.google.com
2. Projeto: `Daimach Pilates`
3. Ir para "Biblioteca de APIs"
4. Procurar: "Google Calendar API"
5. Clicar: "Ativar"

**Resultado:** API habilitada para seu projeto

---

## 🎯 ETAPA 4.3 — ADICIONAR ESCOPO DE CALENDAR

Editar: `src/lib/google-auth.ts`

Adicionar ao array de scopes:

```typescript
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',        // ← ADICIONAR
  'https://www.googleapis.com/auth/calendar.events', // ← ADICIONAR
  'https://www.googleapis.com/auth/drive',
];
```

---

## 🎯 ETAPA 4.4 — CRIAR FUNÇÃO PARA SINCRONIZAR AULAS

Criar: `src/lib/google-calendar.ts`

```typescript
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function syncClassToGoogleCalendar(
  userId: string,
  classId: string,
  action: 'create' | 'update' | 'delete'
) {
  // 1. Buscar aula no Supabase
  const { data: cls } = await supabase
    .from('classes_pilates')
    .select('*')
    .eq('id', classId)
    .single();

  if (!cls) throw new Error('Turma não encontrada');

  // 2. Buscar token Google do usuário
  const { data: tokenData } = await supabase
    .from('google_tokens')
    .select('access_token')
    .eq('user_id', userId)
    .single();

  if (!tokenData?.access_token) throw new Error('Token Google não encontrado');

  // 3. Criar cliente do Calendar
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: tokenData.access_token });

  const calendar = google.calendar({ version: 'v3', auth });

  // 4. Criar evento
  const event = {
    summary: cls.name,
    description: `Aula de Pilates - ${cls.name}`,
    start: {
      dateTime: new Date(`${new Date().toISOString().split('T')[0]}T${cls.time_start}`).toISOString(),
      timeZone: 'America/Sao_Paulo',
    },
    end: {
      dateTime: new Date(`${new Date().toISOString().split('T')[0]}T${cls.time_end}`).toISOString(),
      timeZone: 'America/Sao_Paulo',
    },
  };

  if (action === 'create') {
    await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });
  } else if (action === 'delete') {
    // Buscar event ID do Supabase (armazenar após criar)
    // delete logic
  }
}
```

---

## 🎯 ETAPA 4.5 — ADICIONAR BOTÃO NO APP

### Em `/aluno/minhas-aulas`

Adicionar botão para cada aula:

```jsx
<button
  onClick={() => syncClassToCalendar(classId, 'create')}
  className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
>
  📅 Adicionar ao Google Calendar
</button>
```

---

## 🎯 ETAPA 4.6 — CRIAR ENDPOINT API

Criar: `src/app/api/calendar/sync/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { syncClassToGoogleCalendar } from '@/lib/google-calendar';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, classId, action } = body;

    await syncClassToGoogleCalendar(userId, classId, action);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
```

---

## 🎯 ETAPA 4.7 — TESTAR INTEGRAÇÃO

1. **Login como aluno** (Google OAuth)
2. **Ir para `/aluno/minhas-aulas`**
3. **Clicar "📅 Adicionar ao Google Calendar"**
4. **Verificar se aparece no Google Calendar** (abrir gmail.com → Calendário)

**Esperado:** Evento aparece com nome da aula, hora correta, data da semana

---

## 🎯 ETAPA 4.8 — SINCRONIZAÇÃO AUTOMÁTICA (Opcional)

Se houver tempo, adicionar sincronização automática quando:
- Admin cria turma nova
- Admin edita horário da turma
- Admin cancela turma

**Implementação:** Trigger no banco de dados ou API call na ação

---

## 📝 CHECKLIST ETAPA 4

- [ ] Google Calendar API habilitada no Console
- [ ] Escopo de calendar adicionado (`google-auth.ts`)
- [ ] `src/lib/google-calendar.ts` criado
- [ ] Botão "Adicionar ao Calendar" aparece
- [ ] API endpoint `/api/calendar/sync` criado
- [ ] Teste realizado (evento aparece no Gmail)
- [ ] Sincronização automática (opcional)
- [ ] Relatório atualizado

---

## 🚨 POSSÍVEIS ERROS

| Erro | Solução |
|------|---------|
| `Google Calendar API not enabled` | Ativar em console.cloud.google.com |
| `Invalid refresh token` | Token expirou, user precisa fazer login novamente |
| `Permission denied` | Escopo de calendar não foi adicionado |
| `Event not created` | Verificar formato de data/hora (timezone) |

---

## ✅ RESULTADO FINAL

Quando terminar:

✅ Botão "Adicionar ao Calendar" funciona  
✅ Eventos criados no Google Calendar do usuário  
✅ Datas/horas corretas (timezone São Paulo)  

---

## 🎯 PRÓXIMO PASSO (Quando Terminar)

Avise:
```
✅ ETAPA 4 CONCLUÍDA
Evento apareceu no Google Calendar?
Qual a data/hora?
```

Aí sigo pra **ETAPA 5 — DEPLOY VERCEL PRODUÇÃO**.

---

> **Data estimada:** Hoje à noite  
> **Status:** Aguardando execução  
> **Dependência:** Google OAuth funcionando
