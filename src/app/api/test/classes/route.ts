import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    // Fetch with service role (bypass RLS)
    const { data, error, count } = await supabase
      .from('classes_pilates')
      .select('*', { count: 'exact' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      total: count,
      data: data || []
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
