import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/pilates/reposicoes?professorId=opcional
// Retorna slots, solicitações e turmas (para o dropdown). Tudo via service role.
export async function GET(req: NextRequest) {
  try {
    const professorId = req.nextUrl.searchParams.get('professorId');
    const db = getSupabaseServerClient();

    // Se professorId for passado, restringe turmas/slots às turmas do professor
    let classQuery = db
      .from('classes_pilates')
      .select('id, name, day_of_week, time_start, time_end, capacity, professor_id')
      .eq('is_active', true)
      .order('day_of_week')
      .order('time_start');
    if (professorId) classQuery = classQuery.eq('professor_id', professorId);

    const [slotsRes, requestsRes, classesRes, enrollRes] = await Promise.all([
      db.from('reposition_slots').select('*, classes_pilates(name)').order('slot_date', { ascending: true }),
      db
        .from('reposition_requests')
        .select('*, users_pilates(full_name, email), reposition_slots(slot_date, time_start, time_end, classes_pilates(name))')
        .order('requested_at', { ascending: false }),
      classQuery,
      db.from('enrollments_pilates').select('class_id').eq('is_active', true),
    ]);

    // Conta matriculados por turma para mostrar lotação (vazias x cheias)
    const enrolledByClass: Record<number, number> = {};
    for (const e of enrollRes.data ?? []) {
      enrolledByClass[e.class_id] = (enrolledByClass[e.class_id] ?? 0) + 1;
    }
    const classes = (classesRes.data ?? []).map((c) => ({
      ...c,
      enrolled_count: enrolledByClass[c.id] ?? 0,
    }));

    return NextResponse.json({
      slots: slotsRes.data ?? [],
      requests: requestsRes.data ?? [],
      classes,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as any)?.message ?? String(e) }, { status: 500 });
  }
}

// POST /api/pilates/reposicoes  { action, ... }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const db = getSupabaseServerClient();

    if (action === 'create_slot') {
      const { class_id, slot_date, time_start, time_end, capacity, created_by } = body;
      const { error } = await db.from('reposition_slots').insert({
        class_id: class_id ? Number(class_id) : null,
        slot_date,
        time_start,
        time_end,
        capacity: Number(capacity ?? 4),
        created_by: created_by ?? null,
      });
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Cria vários slots de uma vez (turmas selecionadas numa data)
    if (action === 'create_slots_bulk') {
      const { slots } = body as { slots: any[] };
      if (!Array.isArray(slots) || slots.length === 0) {
        return NextResponse.json({ error: 'slots vazio' }, { status: 400 });
      }
      const rows = slots.map((s) => ({
        class_id: s.class_id ? Number(s.class_id) : null,
        slot_date: s.slot_date,
        time_start: s.time_start,
        time_end: s.time_end,
        capacity: Number(s.capacity ?? 4),
        created_by: s.created_by ?? null,
      }));
      const { error } = await db.from('reposition_slots').insert(rows);
      if (error) throw error;
      return NextResponse.json({ success: true, count: rows.length });
    }

    if (action === 'approve') {
      const { request_id, reviewer_id } = body;
      // Carrega a solicitação p/ pegar slot e aluno
      const { data: reqRow } = await db
        .from('reposition_requests')
        .select('*, reposition_slots(slot_date, time_start, time_end)')
        .eq('id', request_id)
        .single();

      const { error: upErr } = await db
        .from('reposition_requests')
        .update({ status: 'approved', reviewed_by: reviewer_id ?? null, reviewed_at: new Date().toISOString() })
        .eq('id', request_id);
      if (upErr) throw upErr;

      // Rejeita outras pendentes do mesmo aluno/slot
      if (reqRow) {
        await db
          .from('reposition_requests')
          .update({ status: 'rejected', reviewed_by: reviewer_id ?? null, reviewed_at: new Date().toISOString() })
          .eq('user_id', reqRow.user_id)
          .eq('slot_id', reqRow.slot_id)
          .neq('id', request_id)
          .eq('status', 'pending');

        const slot = reqRow.reposition_slots as any;
        if (slot) {
          await db.from('attendances_pilates').upsert(
            {
              user_id: reqRow.user_id,
              class_id: null,
              attendance_date: slot.slot_date,
              status: 'replacement',
              notes: `Reposição aprovada — ${slot.time_start?.slice(0, 5)}–${slot.time_end?.slice(0, 5)}`,
            },
            { onConflict: 'user_id,attendance_date' }
          );
        }
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'reject') {
      const { request_id, reviewer_id } = body;
      const { error } = await db
        .from('reposition_requests')
        .update({ status: 'rejected', reviewed_by: reviewer_id ?? null, reviewed_at: new Date().toISOString() })
        .eq('id', request_id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Aluno solicita reposição num slot
    if (action === 'request') {
      const { user_id, slot_id, notes } = body;
      const { error } = await db.from('reposition_requests').insert({
        user_id,
        slot_id: Number(slot_id),
        status: 'pending',
        notes: notes ?? null,
      });
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'ação desconhecida' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as any)?.message ?? String(e) }, { status: 500 });
  }
}

// DELETE /api/pilates/reposicoes?slotId=xx
export async function DELETE(req: NextRequest) {
  try {
    const slotId = req.nextUrl.searchParams.get('slotId');
    if (!slotId) return NextResponse.json({ error: 'slotId obrigatório' }, { status: 400 });
    const db = getSupabaseServerClient();
    const { error } = await db.from('reposition_slots').delete().eq('id', Number(slotId));
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as any)?.message ?? String(e) }, { status: 500 });
  }
}
