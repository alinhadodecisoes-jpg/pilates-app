import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/pilates/aluno/dashboard?userId=xxx
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 });
    const db = getSupabaseServerClient();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

    const [userRes, enrollRes, attendRes, confirmRes] = await Promise.all([
      db.from('users_pilates')
        .select('status, payment_status, due_day, next_due_date, plan_id, monthly_value')
        .eq('id', userId)
        .maybeSingle(),
      db.from('enrollments_pilates')
        .select('class_id, classes_pilates(name, day_of_week, time_start, professor:professor_id(full_name))')
        .eq('user_id', userId)
        .eq('is_active', true),
      db.from('attendances_pilates')
        .select('id, status')
        .eq('user_id', userId)
        .gte('attendance_date', monthStart)
        .in('status', ['present', 'attended', 'replacement']),
      db.from('payment_confirmations')
        .select('status')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .limit(1),
    ]);

    let plan = null;
    if (userRes.data?.plan_id) {
      const { data } = await db.from('plans_pilates').select('*').eq('id', userRes.data.plan_id).maybeSingle();
      plan = data;
    }

    return NextResponse.json({
      userInfo: userRes.data ?? null,
      plan,
      enrollments: enrollRes.data ?? [],
      aulasNoMes: attendRes.data?.length ?? 0,
      temPagamentoPendente: (confirmRes.data?.length ?? 0) > 0,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as any)?.message ?? String(e) }, { status: 500 });
  }
}
