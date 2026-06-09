import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {}
        },
      },
    }
  );
}

type PilatesRole = 'admin' | 'professor' | 'aluno';

/**
 * Verifica se o usuário atual tem a role exigida.
 * Retorna { userId, role } se autorizado, ou null se não.
 */
export async function checkRole(requiredRole: PilatesRole): Promise<{ userId: string; role: PilatesRole } | null> {
  const supabase = await getSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data } = await supabase
    .from('users_pilates')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!data) return null;
  const role = data.role as PilatesRole;

  const hierarchy: Record<PilatesRole, PilatesRole[]> = {
    admin:     ['admin'],
    professor: ['admin', 'professor'],
    aluno:     ['admin', 'professor', 'aluno'],
  };

  if (!hierarchy[requiredRole].includes(role)) return null;
  return { userId: session.user.id, role };
}

export async function isAdmin(): Promise<boolean> {
  return (await checkRole('admin')) !== null;
}

export async function isProfessor(): Promise<boolean> {
  return (await checkRole('professor')) !== null;
}
