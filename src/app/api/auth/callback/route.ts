import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/login';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore if called from a Server Component
            }
          },
        },
      }
    );

    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.user) {
      // Create user_pilates profile if it doesn't exist
      const { data: profile } = await supabase
        .from('users_pilates')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (!profile) {
        await supabase
          .from('users_pilates')
          .insert({
            id: data.user.id,
            role: 'aluno',
            status: 'ativo'
          });
        return NextResponse.redirect(`${origin}/aluno/dashboard`);
      }

      if (profile.role === 'admin' || profile.role === 'professor') {
        return NextResponse.redirect(`${origin}/admin/dashboard`);
      } else {
        return NextResponse.redirect(`${origin}/aluno/dashboard`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
