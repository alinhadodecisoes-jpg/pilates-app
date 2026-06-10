import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// ⚠️ APENAS PARA TESTE - REMOVE ISSO EM PRODUÇÃO!
export async function POST() {
  try {
    const supabase = getSupabaseServerClient();

    const tables = [
      'users_pilates',
      'classes_pilates',
      'enrollments_pilates',
      'plans_pilates',
      'payments_pilates',
      'evaluations_pilates',
      'presenca_pilates'
    ];

    for (const table of tables) {
      try {
        await supabase.rpc('exec', {
          sql_query: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`
        });
      } catch {
        // RPC may not exist, that's ok
      }
    }

    // Verify
    const { data: classes, error } = await supabase
      .from('classes_pilates')
      .select('*');

    return NextResponse.json({
      message: 'RLS disabled',
      classes: classes?.length || 0,
      error: error?.message || null
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
