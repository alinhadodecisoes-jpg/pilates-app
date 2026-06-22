import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole, ADMIN_ROLES } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, ADMIN_ROLES);
    if (auth.error) return auth.error;
    const db = getSupabaseServerClient();
    // Mostra alunos de pilates (is_pilates_student true ou NULL p/ legados).
    // Exclui pacientes SÓ-fisioterapia (is_pilates_student = false).
    const { data, error } = await db
      .from('users_pilates')
      .select('*')
      .eq('role', 'aluno')
      .or('is_pilates_student.is.null,is_pilates_student.eq.true')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
