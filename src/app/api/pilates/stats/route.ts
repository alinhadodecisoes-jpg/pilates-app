import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = getSupabaseServerClient();
    const [alunos, inadimplentes, turmas] = await Promise.all([
      db.from('users_pilates').select('id', { count: 'exact', head: true }).eq('role', 'aluno').neq('is_pilates_student', false),
      db.from('users_pilates').select('id', { count: 'exact', head: true }).eq('role', 'aluno').neq('is_pilates_student', false).or('status.eq.inadimplente,payment_status.eq.atrasado'),
      db.from('classes_pilates').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ]);
    return NextResponse.json({
      total_alunos: alunos.count ?? 0,
      inadimplentes: inadimplentes.count ?? 0,
      turmas_ativas: turmas.count ?? 0,
      faturamento_mes: 12500,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
