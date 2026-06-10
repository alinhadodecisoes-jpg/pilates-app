import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = getSupabaseServerClient();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [paymentsRes, pendingRes, alunosRes, subsRes, lastPayRes] = await Promise.all([
      db.from('payment_history').select('amount').eq('status', 'paid').gte('payment_date', thirtyDaysAgo.toISOString().split('T')[0]),
      db.from('payment_history').select('amount').eq('status', 'pending'),
      db.from('users_pilates').select('id, full_name, email, status, phone').neq('role', 'admin').order('full_name'),
      db.from('subscriptions_pilates').select('user_id, stripe_subscription_id, stripe_customer_id, current_period_end, plan:plan_id(name, monthly_value)').not('user_id', 'is', null),
      db.from('payment_history').select('user_id, amount, payment_date, status').order('payment_date', { ascending: false }),
    ]);

    const totalRevenue = paymentsRes.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const totalPending = pendingRes.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    const users = alunosRes.data ?? [];
    const subs = subsRes.data ?? [];
    const pays = lastPayRes.data ?? [];

    const subsByUser: Record<string, any> = {};
    for (const s of subs) subsByUser[s.user_id] = s;

    const lastPayByUser: Record<string, any> = {};
    for (const p of pays) {
      if (!lastPayByUser[p.user_id]) lastPayByUser[p.user_id] = p;
    }

    const alunos = users.map((u) => ({
      ...u,
      subscription: subsByUser[u.id] ? {
        stripe_subscription_id: subsByUser[u.id].stripe_subscription_id,
        stripe_customer_id: subsByUser[u.id].stripe_customer_id,
        current_period_end: subsByUser[u.id].current_period_end,
        plan_name: (subsByUser[u.id].plan as any)?.name ?? null,
        monthly_value: (subsByUser[u.id].plan as any)?.monthly_value ?? null,
      } : null,
      lastPayment: lastPayByUser[u.id] ?? null,
    }));

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalPending,
        alunosAtivos: users.filter((u) => u.status === 'ativo').length,
        inadimplentes: users.filter((u) => u.status === 'inadimplente').length,
      },
      alunos,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
