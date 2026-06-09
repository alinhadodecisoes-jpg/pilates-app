import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { exchangeCodeForTokens, getGoogleUserInfo } from '@/lib/google-auth';

// GET — callback OAuth do Google
// Google redireciona aqui após o usuário autorizar
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state'); // user_id
  const error = url.searchParams.get('error');

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const successUrl = new URL('/admin/dashboard?google=success', siteUrl).toString();
  const errorUrl = (reason: string) =>
    new URL(`/admin/dashboard?google=error&reason=${reason}`, siteUrl).toString();

  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(errorUrl(error));
  }

  if (!code || !state) {
    return NextResponse.redirect(errorUrl('missing_params'));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const googleUser = await getGoogleUserInfo(tokens.access_token);

    const supabase = getSupabaseServerClient();
    const expiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const { error: dbError } = await supabase.from('google_tokens').upsert(
      {
        user_id: state,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        expiry,
        scope: tokens.scope,
        google_email: googleUser.email,
        google_name: googleUser.name,
        is_valid: true,
      },
      { onConflict: 'user_id' }
    );

    if (dbError) {
      console.error('Erro ao salvar Google tokens:', dbError);
      return NextResponse.redirect(errorUrl('db_error'));
    }

    return NextResponse.redirect(successUrl);
  } catch (err: any) {
    console.error('Erro no callback Google:', err);
    return NextResponse.redirect(errorUrl('exchange_failed'));
  }
}
