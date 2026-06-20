import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { requireSelfOrRole, ADMIN_ROLES } from '@/lib/api-auth';

// Retorna tudo que o painel do professor precisa, usando service role (RLS não bloqueia).
// GET /api/pilates/professor?professorId=xxx
export async function GET(req: NextRequest) {
  try {
    const professorId = req.nextUrl.searchParams.get('professorId');
    if (!professorId) {
      return NextResponse.json({ error: 'professorId obrigatório' }, { status: 400 });
    }
    const auth = await requireSelfOrRole(req, professorId, ADMIN_ROLES);
    if (auth.error) return auth.error;
    const db = getSupabaseServerClient();

    // Minhas turmas
    const { data: classesData, error: classErr } = await db
      .from('classes_pilates')
      .select('*')
      .eq('professor_id', professorId)
      .eq('is_active', true)
      .order('day_of_week')
      .order('time_start');
    if (classErr) throw classErr;

    const classes = classesData ?? [];
    const classIds = classes.map((c) => c.id);

    // Alunos matriculados nas minhas turmas (ativos)
    let students: Array<{
      user_id: string;
      class_id: number;
      full_name: string | null;
      email: string | null;
      phone: string | null;
      status: string | null;
      monthly_value: number | null;
      class_name: string | null;
    }> = [];
    if (classIds.length > 0) {
      const { data: enr } = await db
        .from('enrollments_pilates')
        .select('user_id, class_id, users_pilates!inner(full_name, email, phone, status, monthly_value)')
        .in('class_id', classIds)
        .eq('is_active', true);
      const classNameById: Record<number, string> = {};
      for (const c of classes) classNameById[c.id] = c.name;
      students = (enr ?? []).map((e: any) => ({
        user_id: e.user_id,
        class_id: e.class_id,
        full_name: e.users_pilates?.full_name ?? null,
        email: e.users_pilates?.email ?? null,
        phone: e.users_pilates?.phone ?? null,
        status: e.users_pilates?.status ?? null,
        monthly_value: e.users_pilates?.monthly_value ?? null,
        class_name: classNameById[e.class_id] ?? null,
      }));
    }

    // Solicitações de reposição pendentes
    const { data: reqs } = await db
      .from('reposition_requests')
      .select('id, user_id, slot_id, status, requested_at, users_pilates(full_name, email), reposition_slots(slot_date, time_start, time_end)')
      .eq('status', 'pending')
      .order('requested_at', { ascending: true });

    return NextResponse.json({
      classes,
      studentCount: students.length,
      students,
      pendingRequests: reqs ?? [],
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
