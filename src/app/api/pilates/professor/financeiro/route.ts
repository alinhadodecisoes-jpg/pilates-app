import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { requireSelfOrRole, ADMIN_ROLES } from '@/lib/api-auth';

// GET /api/pilates/professor/financeiro?professorId=xxx
export async function GET(req: NextRequest) {
  try {
    const professorId = req.nextUrl.searchParams.get('professorId');
    if (!professorId) return NextResponse.json({ error: 'professorId obrigatório' }, { status: 400 });
    const auth = await requireSelfOrRole(req, professorId, ADMIN_ROLES);
    if (auth.error) return auth.error;
    const db = getSupabaseServerClient();

    // Forma de pagamento do professor
    const { data: prof } = await db
      .from('users_pilates')
      .select('pay_mode, pay_rate')
      .eq('id', professorId)
      .maybeSingle();
    const payMode: string = (prof?.pay_mode as string) ?? '';
    const payRate: number = Number(prof?.pay_rate ?? 0);

    // Turmas do professor
    const { data: classes } = await db
      .from('classes_pilates')
      .select('id')
      .eq('professor_id', professorId)
      .eq('is_active', true);
    const classIds = (classes ?? []).map((c) => c.id);

    // Sessões deste mês nas turmas do professor (não canceladas)
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    let classesThisMonth = 0;
    let daysThisMonth = 0;
    if (classIds.length > 0) {
      const { data: sess } = await db
        .from('class_sessions')
        .select('session_date, is_cancelled')
        .in('class_id', classIds)
        .gte('session_date', first)
        .lte('session_date', last);
      const ativas = (sess ?? []).filter((s: { is_cancelled?: boolean }) => s.is_cancelled !== true);
      classesThisMonth = ativas.length;
      daysThisMonth = new Set(ativas.map((s: { session_date: string }) => s.session_date)).size;
    }

    // Total das mensalidades dos alunos nas turmas do professor (para o modo %)
    let alunosMensalidadeTotal = 0;
    let alunosCount = 0;
    if (classIds.length > 0) {
      const { data: enr } = await db
        .from('enrollments_pilates')
        .select('user_id')
        .in('class_id', classIds)
        .eq('is_active', true);
      const userIds = [...new Set((enr ?? []).map((e: { user_id: string }) => e.user_id))];
      alunosCount = userIds.length;
      if (userIds.length > 0) {
        const { data: us } = await db.from('users_pilates').select('monthly_value').in('id', userIds);
        alunosMensalidadeTotal = (us ?? []).reduce((s: number, u: { monthly_value: number | null }) => s + (Number(u.monthly_value) || 0), 0);
      }
    }

    // A receber no mês conforme a forma de pagamento
    let aReceber: number | null = null;
    if (payMode === 'per_class') aReceber = payRate * classesThisMonth;
    else if (payMode === 'per_day') aReceber = payRate * daysThisMonth;
    else if (payMode === 'percent') aReceber = (payRate / 100) * alunosMensalidadeTotal;
    else if (payMode === 'fixed') aReceber = payRate;

    // Histórico de pagamentos do professor (teacher_payments)
    let payments: unknown[] = [];
    const { data: pay, error } = await db
      .from('teacher_payments')
      .select('*')
      .eq('teacher_id', professorId)
      .order('month', { ascending: false });
    if (!error) payments = pay ?? [];

    return NextResponse.json({
      classesThisMonth,
      daysThisMonth,
      alunosCount,
      payMode,
      payRate,
      aReceber,
      payments,
    });
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
