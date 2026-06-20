import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole, ADMIN_ROLES } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, ADMIN_ROLES);
    if (auth.error) return auth.error;
    const db = getSupabaseServerClient();
    const { data, error } = await db
      .from('users_pilates')
      .select('*')
      .in('role', ['professor', 'fisioterapeuta', 'prof_fisio', 'prof_edfisica'])
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
