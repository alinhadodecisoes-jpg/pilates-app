import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

// POST — salva subscription de push web (VAPID)
export async function POST(req: NextRequest) {
  try {
    const { user_id, endpoint, p256dh, auth } = await req.json();

    if (!user_id || !endpoint) {
      return NextResponse.json({ error: 'user_id e endpoint são obrigatórios' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id,
        endpoint,
        keys_p256dh: p256dh ?? null,
        keys_auth: auth ?? null,
        platform: 'web',
      },
      { onConflict: 'user_id,endpoint' }
    );

    if (error) {
      console.error('Erro ao salvar subscription:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Erro /api/push/subscribe:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
