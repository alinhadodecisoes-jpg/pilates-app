import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ role: 'aluno' });
    }
    const db = getSupabaseServerClient();
    const { data, error } = await db
      .from('users_pilates')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({ role: data?.role ?? 'aluno' });
  } catch (e) {
    return NextResponse.json({ role: 'aluno', error: String(e) });
  }
}
