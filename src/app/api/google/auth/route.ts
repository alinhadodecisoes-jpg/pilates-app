import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthUrl, isGoogleConfigured } from '@/lib/google-auth';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// GET — inicia o fluxo OAuth do Google
// Redireciona para accounts.google.com
export async function GET(req: NextRequest) {
  if (!isGoogleConfigured()) {
    return NextResponse.json(
      {
        error: 'Google OAuth não configurado. Adicione GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_REDIRECT_URI no .env.local',
      },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const authUrl = getGoogleAuthUrl(user.id);
  return NextResponse.redirect(authUrl);
}
