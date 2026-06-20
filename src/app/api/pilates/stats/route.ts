import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole, ADMIN_ROLES } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, ADMIN_ROLES);
    if (auth.error) return auth.error;
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
