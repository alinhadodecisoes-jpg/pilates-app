import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

// GET — cron job para lembretes automáticos
// Protegido por CRON_SECRET_KEY no header Authorization
// Configurar no vercel.json ou chamar via cron externo

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET_KEY;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  const results = {
    lembretes_aula: 0,
    lembretes_mensalidade: 0,
    errors: [] as string[],
  };

  try {
    // === LEMBRETES DE AULA ===
    // Buscar preferências dos alunos com lembrete de aula ativo
    const { data: prefsData } = await supabase
      .from('notification_preferences')
      .select('user_id, horas_antes_aula')
      .eq('aula_lembrete', true);

    const prefs = prefsData ?? [];

    for (const pref of prefs) {
      const horasAntes = pref.horas_antes_aula ?? 12;
      const agora = new Date();
      const limite = new Date(agora.getTime() + horasAntes * 60 * 60 * 1000);

      // Buscar aulas do aluno que acontecem dentro do intervalo
      const { data: enrollments } = await supabase
        .from('enrollments_pilates')
        .select('class_id, classes_pilates(name, time_start, day_of_week)')
        .eq('user_id', pref.user_id)
        .eq('is_active', true);

      if (!enrollments) continue;

      // Verificar se alguma turma tem aula nas próximas X horas
      const hoje = agora.getDay(); // 0=Dom, 1=Seg...
      const amanha = (hoje + 1) % 7;

      const dayMap: Record<number, number> = { 0: 7, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };
      const hoje1 = dayMap[hoje];
      const amanha1 = dayMap[amanha];

      for (const enroll of enrollments) {
        const turma = enroll.classes_pilates as unknown as {
          name: string;
          time_start: string;
          day_of_week: number;
        } | null;
        if (!turma) continue;

        const ehHoje = turma.day_of_week === hoje1;
        const ehAmanha = horasAntes > 12 && turma.day_of_week === amanha1;

        if (ehHoje || ehAmanha) {
          // Enviar notificação via /api/notify
          const notifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/notify`;
          const resp = await fetch(notifyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: pref.user_id,
              type: 'aula_lembrete',
              title: '🏋️ Lembrete de Aula',
              body: `Você tem ${turma.name} em breve! Horário: ${turma.time_start?.slice(0, 5)}`,
              channels: ['push'],
            }),
          });
          if (resp.ok) results.lembretes_aula++;
        }
      }
    }

    // === LEMBRETES DE MENSALIDADE ===
    // Alunos inadimplentes ou prestes a vencer (próximos 3 dias)
    const { data: inadimplentes } = await supabase
      .from('users_pilates')
      .select('id')
      .eq('role', 'aluno')
      .eq('status', 'inadimplente');

    for (const aluno of inadimplentes ?? []) {
      // Verificar preferência de mensalidade
      const { data: pref } = await supabase
        .from('notification_preferences')
        .select('mensalidade')
        .eq('user_id', aluno.id)
        .maybeSingle();

      if (pref && !pref.mensalidade) continue;

      const notifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/notify`;
      const resp = await fetch(notifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: aluno.id,
          type: 'mensalidade',
          title: '💳 Mensalidade em atraso',
          body: 'Sua mensalidade está em atraso. Regularize para continuar as aulas!',
          channels: ['push', 'email'],
        }),
      });
      if (resp.ok) results.lembretes_mensalidade++;
    }

    return NextResponse.json({ success: true, ...results });
  } catch (err) {
    console.error('Erro cron/lembretes:', err);
    return NextResponse.json({ error: 'Erro interno', ...results }, { status: 500 });
  }
}

// Configuração do Vercel Cron (adicionar no vercel.json):
// {
//   "crons": [{ "path": "/api/cron/lembretes", "schedule": "0 8 * * *" }]
// }
