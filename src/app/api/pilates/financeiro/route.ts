import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole, ADMIN_ROLES } from '@/lib/api-auth';

// POST — dar baixa em pagamento manual (admin)
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, ADMIN_ROLES);
    if (auth.error) return auth.error;
    const { userId, amount } = await req.json();
    const db = getSupabaseServerClient();
    const { error: payErr } = await db.from('payment_history').insert({
      user_id: userId,
      amount,
      status: 'paid',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'manual',
    });
    if (payErr) throw payErr;
    const { error: upErr } = await db
      .from('users_pilates')
      .update({ status: 'ativo', payment_status: 'em_dia' })
      .eq('id', userId);
    if (upErr) throw upErr;
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, ADMIN_ROLES);
    if (auth.error) return auth.error;
    const db = getSupabaseServerClient();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [paymentsRes, pendingRes, alunosRes, subsRes, lastPayRes, plansRes] = await Promise.all([
      db.from('payment_history').select('amount').eq('status', 'paid').gte('payment_date', thirtyDaysAgo.toISOString().split('T')[0]),
      db.from('payment_history').select('amount').eq('status', 'pending'),
      db.from('users_pilates').select('id, full_name, email, status, payment_status, phone, monthly_value, plan_id').eq('role', 'aluno').neq('is_pilates_student', false).order('full_name'),
      db.from('subscriptions_pilates').select('user_id, stripe_subscription_id, stripe_customer_id, current_period_end, plan:plan_id(name, monthly_value)').not('user_id', 'is', null),
      db.from('payment_history').select('user_id, amount, payment_date, status').order('payment_date', { ascending: false }),
      db.from('plans_pilates').select('id, name, price'),
    ]);

    const totalRevenue = paymentsRes.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const totalPending = pendingRes.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    const users = alunosRes.data ?? [];
    const subs = subsRes.data ?? [];
    const pays = lastPayRes.data ?? [];

    // Mapa de planos (id → nome/preço) para resolver plano do aluno matriculado manualmente
    const planById: Record<number, { name: string; price: number }> = {};
    for (const p of plansRes.data ?? []) planById[p.id] = { name: p.name, price: p.price };

    const subsByUser: Record<string, any> = {};
    for (const s of subs) subsByUser[s.user_id] = s;

    const lastPayByUser: Record<string, any> = {};
    for (const p of pays) {
      if (!lastPayByUser[p.user_id]) lastPayByUser[p.user_id] = p;
    }

    // overdue = inadimplente (status) OU atrasado (payment_status) — mesma definição do dashboard
    const isOverdue = (u: any) => u.status === 'inadimplente' || u.payment_status === 'atrasado';

    const alunos = users.map((u: any) => {
      const sub = subsByUser[u.id];
      const planFromId = u.plan_id ? planById[u.plan_id] : null;
      const planName = sub?.plan?.name ?? planFromId?.name ?? null;
      const monthlyValue = u.monthly_value ?? sub?.plan?.monthly_value ?? planFromId?.price ?? null;
      return {
        ...u,
        plan_name: planName,
        monthly_value: monthlyValue,
        is_overdue: isOverdue(u),
        subscription: sub ? {
          stripe_subscription_id: sub.stripe_subscription_id,
          stripe_customer_id: sub.stripe_customer_id,
          current_period_end: sub.current_period_end,
          plan_name: planName,
          monthly_value: monthlyValue,
        } : null,
        lastPayment: lastPayByUser[u.id] ?? null,
      };
    });

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalPending,
        alunosAtivos: users.filter((u: any) => u.status === 'ativo' && !isOverdue(u)).length,
        inadimplentes: users.filter((u: any) => isOverdue(u)).length,
      },
      alunos,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
