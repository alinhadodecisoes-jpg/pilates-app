/**
 * Google Calendar Integration
 * Sincroniza aulas de Pilates com Google Calendar do usuário
 */

import { google } from 'googleapis';
import { getSupabaseServerClient } from './supabase-server';

const supabase = getSupabaseServerClient();

export async function syncClassToGoogleCalendar(
  userId: string,
  classId: number,
  action: 'create' | 'update' | 'delete'
) {
  try {
    // 1. Buscar aula no Supabase
    const { data: cls, error: classError } = await supabase
      .from('classes_pilates')
      .select('*')
      .eq('id', classId)
      .single();

    if (classError || !cls) {
      throw new Error(`Turma não encontrada: ${classError?.message}`);
    }

    // 2. Buscar token Google do usuário
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_tokens')
      .select('access_token, refresh_token, expiry')
      .eq('user_id', userId)
      .single();

    if (tokenError || !tokenData?.access_token) {
      throw new Error('Token Google não encontrado. User precisa fazer login com Google.');
    }

    // 3. Criar cliente do Calendar
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    auth.setCredentials({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expiry_date: tokenData.expiry ? new Date(tokenData.expiry).getTime() : undefined,
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // 4. Construir evento
    const dayOfWeek = cls.day_of_week || 1; // 1 = segunda (padrão)
    const today = new Date();
    const daysUntilNextClass = (dayOfWeek - today.getDay() + 7) % 7;
    const classDate = new Date(today);
    classDate.setDate(classDate.getDate() + daysUntilNextClass);

    const dateStr = classDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const [startHour, startMin] = (cls.time_start || '08:00').split(':');
    const [endHour, endMin] = (cls.time_end || '09:00').split(':');

    const startDateTime = new Date(`${dateStr}T${startHour}:${startMin}:00`);
    const endDateTime = new Date(`${dateStr}T${endHour}:${endMin}:00`);

    const event = {
      summary: `Pilates - ${cls.name}`,
      description: `Aula de Pilates\nTurma: ${cls.name}\nCapacidade: ${cls.capacity} vagas`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      location: cls.location || 'Daimach.Movement',
    };

    // 5. Executar ação
    if (action === 'create') {
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });

      // Salvar ID do evento no Supabase para referência futura
      if (response.data.id) {
        await supabase
          .from('class_calendar_events')
          .upsert({
            class_id: classId,
            user_id: userId,
            google_event_id: response.data.id,
            created_at: new Date().toISOString(),
          }, { onConflict: 'class_id,user_id' });
      }

      return { success: true, eventId: response.data.id };
    } else if (action === 'update') {
      // Buscar event ID armazenado
      const { data: eventData } = await supabase
        .from('class_calendar_events')
        .select('google_event_id')
        .eq('class_id', classId)
        .eq('user_id', userId)
        .single();

      if (eventData?.google_event_id) {
        await calendar.events.update({
          calendarId: 'primary',
          eventId: eventData.google_event_id,
          requestBody: event,
        });
        return { success: true };
      }
    } else if (action === 'delete') {
      // Buscar event ID armazenado
      const { data: eventData } = await supabase
        .from('class_calendar_events')
        .select('google_event_id')
        .eq('class_id', classId)
        .eq('user_id', userId)
        .single();

      if (eventData?.google_event_id) {
        await calendar.events.delete({
          calendarId: 'primary',
          eventId: eventData.google_event_id,
        });

        // Deletar referência no Supabase
        await supabase
          .from('class_calendar_events')
          .delete()
          .eq('class_id', classId)
          .eq('user_id', userId);

        return { success: true };
      }
    }

    return { success: false, error: 'Ação não reconhecida' };
  } catch (error) {
    console.error('[Google Calendar Error]:', error);
    throw error;
  }
}

/**
 * Sincronizar múltiplas aulas para o calendar do usuário
 * Usado em onboarding ou bulk sync
 */
export async function syncAllClassesToGoogleCalendar(userId: string) {
  try {
    // Buscar todas as classes ativas
    const { data: classes, error } = await supabase
      .from('classes_pilates')
      .select('*')
      .eq('is_active', true);

    if (error || !classes) {
      throw new Error(`Erro ao buscar turmas: ${error?.message}`);
    }

    const results = [];

    for (const cls of classes) {
      try {
        const result = await syncClassToGoogleCalendar(userId, cls.id, 'create');
        results.push({ classId: cls.id, success: true, eventId: result.eventId });
      } catch (syncError) {
        results.push({ classId: cls.id, success: false, error: String(syncError) });
      }
    }

    return results;
  } catch (error) {
    console.error('[Bulk Sync Error]:', error);
    throw error;
  }
}
