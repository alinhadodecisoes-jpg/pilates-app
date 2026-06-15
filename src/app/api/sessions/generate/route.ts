import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

// POST — Gerar class_sessions para as próximas 4 semanas
// Idempotente: usa UNIQUE(class_id, session_date) para não duplicar
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    // Buscar todas as turmas ativas
    const { data: classes, error: classesErr } = await supabase
      .from('classes_pilates')
      .select('id, name, day_of_week, time_start, time_end, capacity')
      .order('day_of_week')
      .order('time_start');

    if (classesErr) throw classesErr;
    if (!classes || classes.length === 0) {
      return NextResponse.json({ message: 'Nenhuma turma encontrada', created: 0 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // day_of_week: 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb, 7=Dom
    // JS getDay(): 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
    const dbDayToJs = (dbDay: number): number => {
      if (dbDay === 7) return 0; // Dom
      return dbDay; // 1-6 são iguais
    };

    const sessionsToInsert: Array<{
      class_id: number;
      session_date: string;
      time_start: string;
      time_end: string;
      capacity: number;
      status: string;
    }> = [];

    // Gerar para as próximas 4 semanas (28 dias)
    for (let dayOffset = 0; dayOffset < 28; dayOffset++) {
      const date = new Date(today);
      date.setDate(today.getDate() + dayOffset);
      const jsDay = date.getDay();

      for (const cls of classes) {
        const clsJsDay = dbDayToJs(cls.day_of_week);
        if (clsJsDay === jsDay) {
          sessionsToInsert.push({
            class_id: cls.id,
            session_date: date.toISOString().slice(0, 10),
            time_start: cls.time_start ?? '09:00:00',
            time_end: cls.time_end ?? '10:00:00',
            capacity: cls.capacity ?? 4,
            status: 'scheduled',
          });
        }
      }
    }

    if (sessionsToInsert.length === 0) {
      return NextResponse.json({ message: 'Nenhuma sessão para gerar', created: 0 });
    }

    // Upsert (ignora duplicatas via onConflict)
    const { data, error } = await supabase
      .from('class_sessions')
      .upsert(sessionsToInsert, { onConflict: 'class_id,session_date', ignoreDuplicates: true })
      .select('id');

    if (error) throw error;

    return NextResponse.json({
      success: true,
      created: data?.length ?? 0,
      total_generated: sessionsToInsert.length,
    });
  } catch (err) {
    console.error('Erro /api/sessions/generate:', err);
    return NextResponse.json({ error: 'Erro ao gerar sessões' }, { status: 500 });
  }
}
