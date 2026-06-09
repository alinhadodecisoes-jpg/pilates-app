import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { isGoogleConfigured } from '@/lib/google-auth';

// GET — verifica se o usuário tem Google conectado
// Query: ?user_id=xxx  (admin pode verificar outro user)
export async function GET(req: NextRequest) {
  if (!isGoogleConfigured()) {
    return NextResponse.json({
      configured: false,
      connected: false,
      message: 'Google OAuth não configurado no servidor (faltam GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)',
    });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  const { data } = await supabase
    .from('google_tokens')
    .select('google_email, google_name, is_valid, expiry, scope')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ configured: true, connected: false });
  }

  return NextResponse.json({
    configured: true,
    connected: data.is_valid !== false,
    google_email: data.google_email,
    google_name: data.google_name,
    expiry: data.expiry,
    scope: data.scope,
  });
}
