import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole, requireSelfOrRole, ADMIN_ROLES } from '@/lib/api-auth';

// Postgres: tabela inexistente
const UNDEFINED_TABLE = '42P01';

// GET /api/pilates/remarcacoes?professorId=opcional
// - com professorId: turmas do professor + alunos matriculados + as próprias solicitações
// - sem professorId (admin): todas as solicitações com nomes
export async function GET(req: NextRequest) {
  try {
    const professorId = req.nextUrl.searchParams.get('professorId');
    const db = getSupabaseServerClient();

    if (professorId) {
      const auth = await requireSelfOrRole(req, professorId, ADMIN_ROLES);
      if (auth.error) return auth.error;

      const { data: turmas } = await db
        .from('classes_pilates')
        .select('id, name, day_of_week, time_start, time_end')
        .eq('professor_id', professorId)
        .eq('is_active', true)
        .order('day_of_week')
        .order('time_start');
      const classIds = (turmas ?? []).map((t) => t.id);

      // Alunos matriculados nas turmas do professor (p/ o seletor de aluno específico)
      let enrollments: { class_id: number; user_id: string; full_name: string | null }[] = [];
      if (classIds.length > 0) {
        const { data: enr } = await db
          .from('enrollments_pilates')
          .select('class_id, user_id')
          .in('class_id', classIds)
          .eq('is_active', true);
        const ids = [...new Set((enr ?? []).map((e) => e.user_id))];
        const nameById: Record<string, string | null> = {};
        if (ids.length > 0) {
          const { data: us } = await db.from('users_pilates').select('id, full_name').in('id', ids);
          for (const u of us ?? []) nameById[u.id] = u.full_name;
        }
        enrollments = (enr ?? []).map((e) => ({ class_id: e.class_id, user_id: e.user_id, full_name: nameById[e.user_id] ?? null }));
      }

      const reqRes = await db
        .from('class_reschedule_requests')
        .select('*, classes_pilates(name)')
        .eq('professor_id', professorId)
        .order('created_at', { ascending: false });
      if (reqRes.error && reqRes.error.code === UNDEFINED_TABLE) {
        return NextResponse.json({ turmas: turmas ?? [], enrollments, requests: [], needsMigration: true });
      }
      return NextResponse.json({ turmas: turmas ?? [], enrollments, requests: reqRes.data ?? [] });
    }

    // Visão admin: todas as solicitações
    const adminAuth = await requireRole(req, ADMIN_ROLES);
    if (adminAuth.error) return adminAuth.error;

    const reqRes = await db
      .from('class_reschedule_requests')
      .select('*, classes_pilates(name, day_of_week, time_start)')
      .order('created_at', { ascending: false });
    if (reqRes.error && reqRes.error.code === UNDEFINED_TABLE) {
      return NextResponse.json({ requests: [], needsMigration: true });
    }
    const rows = reqRes.data ?? [];
    // Nomes de professor e aluno
    const userIds = [...new Set(rows.flatMap((r) => [r.professor_id, r.aluno_id]).filter(Boolean))] as string[];
    const nameById: Record<string, { full_name: string | null; email: string | null }> = {};
    if (userIds.length > 0) {
      const { data: us } = await db.from('users_pilates').select('id, full_name, email').in('id', userIds);
      for (const u of us ?? []) nameById[u.id] = { full_name: u.full_name, email: u.email };
    }
    for (const r of rows as Record<string, unknown>[]) {
      r.professor = r.professor_id ? nameById[r.professor_id as string] ?? null : null;
      r.aluno = r.aluno_id ? nameById[r.aluno_id as string] ?? null : null;
    }
    return NextResponse.json({ requests: rows });
  } catch (e) {
    return NextResponse.json({ error: (e as { message?: string })?.message ?? String(e) }, { status: 500 });
  }
}

// POST /api/pilates/remarcacoes  { action: 'create' | 'approve' | 'reject', ... }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const db = getSupabaseServerClient();

    if (action === 'create') {
      // Professor (ou admin) cria a solicitação
      const auth = await requireSelfOrRole(req, body.professor_id, ADMIN_ROLES);
      if (auth.error) return auth.error;
      const { professor_id, class_id, scope, aluno_id, original_date, new_date, new_time_start, new_time_end, reason } = body;
      if (!class_id || !original_date || !new_date) {
        return NextResponse.json({ error: 'Turma, data original e nova data são obrigatórias.' }, { status: 400 });
      }
      if (scope === 'aluno' && !aluno_id) {
        return NextResponse.json({ error: 'Selecione o aluno para a remarcação individual.' }, { status: 400 });
      }
      const { error } = await db.from('class_reschedule_requests').insert({
        professor_id: professor_id ?? null,
        class_id: Number(class_id),
        scope: scope === 'aluno' ? 'aluno' : 'turma',
        aluno_id: scope === 'aluno' ? aluno_id : null,
        original_date,
        new_date,
        new_time_start: new_time_start || null,
        new_time_end: new_time_end || null,
        reason: reason || null,
        status: 'pending',
      });
      if (error) {
        if (error.code === UNDEFINED_TABLE) {
          return NextResponse.json({ error: 'Tabela de remarcações ainda não criada. Rode o SQL (class_reschedule_requests).' }, { status: 503 });
        }
        throw error;
      }
      return NextResponse.json({ success: true });
    }

    // approve/reject são só do admin
    const adminAuth = await requireRole(req, ADMIN_ROLES);
    if (adminAuth.error) return adminAuth.error;

    if (action === 'reject') {
      const { request_id, reviewer_id } = body;
      const { error } = await db
        .from('class_reschedule_requests')
        .update({ status: 'rejected', reviewed_by: reviewer_id ?? null, reviewed_at: new Date().toISOString() })
        .eq('id', Number(request_id));
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'approve') {
      const { request_id, reviewer_id } = body;
      const { data: r } = await db.from('class_reschedule_requests').select('*').eq('id', Number(request_id)).single();
      const { error: upErr } = await db
        .from('class_reschedule_requests')
        .update({ status: 'approved', reviewed_by: reviewer_id ?? null, reviewed_at: new Date().toISOString() })
        .eq('id', Number(request_id));
      if (upErr) throw upErr;

      // Para remarcação da turma inteira: cancela a sessão original e cria a nova data na agenda
      if (r && r.scope === 'turma') {
        const hora = r.new_time_start ? ` às ${String(r.new_time_start).slice(0, 5)}` : '';
        try {
          await db
            .from('class_sessions')
            .update({ is_cancelled: true, cancel_reason: `Remarcada para ${r.new_date}${hora}` })
            .eq('class_id', r.class_id)
            .eq('session_date', r.original_date);
        } catch { /* sem sessão original cadastrada — ok */ }
        try {
          const { data: existing } = await db
            .from('class_sessions')
            .select('id')
            .eq('class_id', r.class_id)
            .eq('session_date', r.new_date)
            .maybeSingle();
          if (existing) {
            await db.from('class_sessions').update({ is_cancelled: false, status: 'scheduled' }).eq('id', existing.id);
          } else {
            await db.from('class_sessions').insert({ class_id: r.class_id, session_date: r.new_date, status: 'scheduled', is_cancelled: false });
          }
        } catch { /* não bloqueia a aprovação */ }
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'ação desconhecida' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as { message?: string })?.message ?? String(e) }, { status: 500 });
  }
}
