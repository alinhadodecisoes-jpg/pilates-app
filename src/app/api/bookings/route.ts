import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

// POST — Reservar ou cancelar uma sessão
// Body: { action: 'book'|'cancel', session_id, user_id }
export async function POST(req: NextRequest) {
  try {
    const { action, session_id, user_id } = await req.json();

    if (!action || !session_id || !user_id) {
      return NextResponse.json({ error: 'action, session_id e user_id são obrigatórios' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    if (action === 'book') {
      // Verificar lotação
      const [sessionRes, bookingsRes] = await Promise.all([
        supabase.from('class_sessions').select('capacity, status').eq('id', session_id).maybeSingle(),
        supabase.from('bookings').select('id').eq('session_id', session_id).eq('status', 'booked'),
      ]);

      if (!sessionRes.data || sessionRes.data.status === 'canceled') {
        return NextResponse.json({ error: 'Sessão não disponível' }, { status: 400 });
      }

      const capacity = sessionRes.data.capacity ?? 4;
      const booked = bookingsRes.data?.length ?? 0;
      const status = booked < capacity ? 'booked' : 'waitlist';

      const { error } = await supabase.from('bookings').upsert(
        { session_id, user_id, status, booked_at: new Date().toISOString(), canceled_at: null },
        { onConflict: 'session_id,user_id' }
      );

      if (error) throw error;

      return NextResponse.json({ success: true, status });
    }

    if (action === 'cancel') {
      // Verificar prazo de cancelamento (4 horas antes)
      const { data: sessionRow } = await supabase
        .from('class_sessions')
        .select('session_date, time_start')
        .eq('id', session_id)
        .maybeSingle();

      if (sessionRow) {
        const sessionDateTime = new Date(`${sessionRow.session_date}T${sessionRow.time_start}`);
        const now = new Date();
        const diffHours = (sessionDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (diffHours < 4) {
          return NextResponse.json({
            error: 'Cancelamento não permitido. Prazo mínimo: 4 horas antes da aula.',
          }, { status: 400 });
        }
      }

      // Cancel the booking
      const { data: canceledBooking } = await supabase
        .from('bookings')
        .update({ status: 'canceled', canceled_at: new Date().toISOString() })
        .eq('session_id', session_id)
        .eq('user_id', user_id)
        .select()
        .maybeSingle();

      if (canceledBooking) {
        // Promover próximo da lista de espera
        const { data: waitlist } = await supabase
          .from('bookings')
          .select('id, user_id')
          .eq('session_id', session_id)
          .eq('status', 'waitlist')
          .order('booked_at', { ascending: true })
          .limit(1);

        if (waitlist && waitlist.length > 0) {
          const promoted = waitlist[0];
          await supabase
            .from('bookings')
            .update({ status: 'booked' })
            .eq('id', promoted.id);

          // TODO: Notificar usuário promovido via /api/notify quando VAPID configurado
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'action inválida' }, { status: 400 });
  } catch (err) {
    console.error('Erro /api/bookings:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
