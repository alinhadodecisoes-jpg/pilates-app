import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/pilates/aluno/financeiro?userId=xxx
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 });
    const db = getSupabaseServerClient();

    const [userRes, subRes, payRes] = await Promise.all([
      db.from('users_pilates').select('plan_id, monthly_value, status, payment_status, due_day, next_due_date').eq('id', userId).maybeSingle(),
      db.from('subscriptions_pilates').select('status, stripe_subscription_id, current_period_end').eq('user_id', userId).maybeSingle(),
      db.from('payment_history').select('*').eq('user_id', userId).order('payment_date', { ascending: false }).limit(12),
    ]);

    let plan = null;
    if (userRes.data?.plan_id) {
      const { data } = await db.from('plans_pilates').select('*').eq('id', userRes.data.plan_id).maybeSingle();
      plan = data;
    }

    return NextResponse.json({
      userInfo: userRes.data ?? null,
      plan,
      subscription: subRes.data ?? null,
      payments: payRes.data ?? [],
    });
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
