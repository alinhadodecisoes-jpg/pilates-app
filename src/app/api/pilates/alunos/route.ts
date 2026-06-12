import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = getSupabaseServerClient();
    const { data, error } = await db
      .from('users_pilates')
      .select('*')
      .eq('role', 'aluno')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
