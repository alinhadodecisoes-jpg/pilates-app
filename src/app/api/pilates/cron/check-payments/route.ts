import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// Vercel Cron chama via GET. Protegido por CRON_SECRET / CRON_SECRET_KEY.
// Marca como 'atrasado' alunos cujo dia de vencimento já passou e que ainda estão 'pendente'.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const ok =
    authHeader === `Bearer ${process.env.CRON_SECRET_KEY}` ||
    authHeader === `Bearer ${process.env.CRON_SECRET}`;
  if (!ok) return NextResponse.json({ error: 'não autorizado' }, { status: 401 });

  try {
    const db = getSupabaseServerClient();
    const hoje = new Date().getDate();

    const { data: alunos } = await db
      .from('users_pilates')
      .select('id, due_day, payment_status, status')
      .eq('role', 'aluno')
      .not('due_day', 'is', null);

    const atrasar = (alunos ?? []).filter(
      (a) =>
        a.due_day != null &&
        hoje > a.due_day &&
        (a.payment_status === 'pendente' || a.payment_status == null),
    );

    let updated = 0;
    for (const a of atrasar) {
      const { error } = await db
        .from('users_pilates')
        .update({ payment_status: 'atrasado' })
        .eq('id', a.id);
      if (!error) updated++;
    }

    return NextResponse.json({ success: true, verificados: alunos?.length ?? 0, atualizados: updated });
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
