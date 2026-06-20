import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole, requireSelfOrRole, STAFF_ROLES } from '@/lib/api-auth';

// GET /api/pilates/reposicoes?professorId=opcional
// Retorna slots, solicitações e turmas (para o dropdown). Tudo via service role.
export async function GET(req: NextRequest) {
  try {
    const professorId = req.nextUrl.searchParams.get('professorId');
    const userId = req.nextUrl.searchParams.get('userId');
    const db = getSupabaseServerClient();

    // --- Visão do ALUNO: slots futuros + as próprias solicitações ---
    if (userId) {
      const auth = await requireSelfOrRole(req, userId, STAFF_ROLES);
      if (auth.error) return auth.error;
      const today = new Date().toISOString().slice(0, 10);
      const [slotsRes, myReqRes] = await Promise.all([
        db.from('reposition_slots').select('*, classes_pilates(name)').gte('slot_date', today).order('slot_date', { ascending: true }),
        db.from('reposition_requests')
          .select('id, slot_id, status, requested_at, reposition_slots(slot_date, time_start, time_end, classes_pilates(name))')
          .eq('user_id', userId)
          .order('requested_at', { ascending: false }),
      ]);
      return NextResponse.json({ slots: slotsRes.data ?? [], requests: myReqRes.data ?? [] });
    }

    // Visão de gestão (admin/professor): exige papel de staff
    const staffAuth = await requireRole(req, STAFF_ROLES);
    if (staffAuth.error) return staffAuth.error;

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
        .select('*, reposition_slots(slot_date, time_start, time_end, classes_pilates(name))')
        .order('requested_at', { ascending: false }),
      classQuery,
      db.from('enrollments_pilates').select('class_id').eq('is_active', true),
    ]);

    // Nomes dos alunos (sem depender de FK no PostgREST)
    const reqUserIds = [...new Set((requestsRes.data ?? []).map((r: any) => r.user_id).filter(Boolean))];
    const namesById: Record<string, { full_name: string | null; email: string | null }> = {};
    if (reqUserIds.length > 0) {
      const { data: us } = await db.from('users_pilates').select('id, full_name, email').in('id', reqUserIds);
      for (const u of us ?? []) namesById[u.id] = { full_name: u.full_name, email: u.email };
    }
    if (requestsRes.data) {
      for (const r of requestsRes.data as any[]) r.users_pilates = namesById[r.user_id] ?? null;
    }

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

    // Autorização por ação: aluno só mexe nas próprias solicitações; o resto é staff.
    if (action === 'request' || action === 'cancel_request') {
      const auth = await requireSelfOrRole(req, body.user_id, STAFF_ROLES);
      if (auth.error) return auth.error;
    } else {
      const auth = await requireRole(req, STAFF_ROLES);
      if (auth.error) return auth.error;
    }

    const db = getSupabaseServerClient();

    if (action === 'create_slot') {
      const { class_id, slot_date, time_start, time_end, capacity } = body;
      const { error } = await db.from('reposition_slots').insert({
        class_id: class_id ? Number(class_id) : null,
        slot_date,
        time_start,
        time_end,
        capacity: Number(capacity ?? 4),
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
        .select('*, reposition_slots(slot_date, time_start, time_end, class_id)')
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
        // class_id é NOT NULL e a tabela não tem constraint (user_id,attendance_date),
        // então gravamos a presença de reposição com check-then-insert e o class_id do slot.
        if (slot && slot.class_id) {
          const notes = `Reposição aprovada — ${slot.time_start?.slice(0, 5)}–${slot.time_end?.slice(0, 5)}`;
          const { data: existingAtt } = await db
            .from('attendances_pilates')
            .select('id')
            .eq('user_id', reqRow.user_id)
            .eq('class_id', slot.class_id)
            .eq('attendance_date', slot.slot_date)
            .maybeSingle();
          if (existingAtt) {
            await db.from('attendances_pilates').update({ status: 'replacement', notes }).eq('id', existingAtt.id);
          } else {
            await db.from('attendances_pilates').insert({
              user_id: reqRow.user_id,
              class_id: slot.class_id,
              attendance_date: slot.slot_date,
              status: 'replacement',
              notes,
            });
          }
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

    // Aluno solicita reposição num slot.
    // reposition_requests não tem constraint única (user_id, slot_id), então
    // fazemos check-then-insert/update em vez de upsert por onConflict.
    if (action === 'request') {
      const { user_id, slot_id, notes } = body;
      const sid = Number(slot_id);
      const { data: existing } = await db
        .from('reposition_requests')
        .select('id')
        .eq('user_id', user_id)
        .eq('slot_id', sid)
        .maybeSingle();
      if (existing) {
        const { error } = await db
          .from('reposition_requests')
          .update({ status: 'pending', notes: notes ?? null })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await db
          .from('reposition_requests')
          .insert({ user_id, slot_id: sid, status: 'pending', notes: notes ?? null });
        if (error) throw error;
      }
      return NextResponse.json({ success: true });
    }

    // Aluno cancela a própria solicitação (a constraint de status não aceita 'canceled',
    // então removemos a solicitação pendente — some da lista e libera o slot).
    if (action === 'cancel_request') {
      const { request_id, user_id } = body;
      const { error } = await db
        .from('reposition_requests')
        .delete()
        .eq('id', Number(request_id))
        .eq('user_id', user_id)
        .eq('status', 'pending');
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
    const del = await requireRole(req, STAFF_ROLES);
    if (del.error) return del.error;
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
