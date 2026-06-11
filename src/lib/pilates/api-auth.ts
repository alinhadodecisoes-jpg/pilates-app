import { getSupabaseServerClient } from '@/lib/supabase-server';
import type { NextRequest } from 'next/server';

export interface AuthUser {
  id: string;
  email: string | null;
  role: string;
}

/**
 * Valida o token Bearer (sessão Supabase) enviado pelo cliente e retorna o usuário + role.
 * Retorna null se não autenticado. Usado para proteger rotas sensíveis sem depender de RLS.
 */
export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const db = getSupabaseServerClient();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: profile } = await db
    .from('users_pilates')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();

  return { id: data.user.id, email: data.user.email ?? null, role: profile?.role ?? 'aluno' };
}

/**
 * Exige que o chamador esteja autenticado e tenha um dos roles permitidos.
 * Uso: const auth = await requireRole(req, ['admin']); if (!auth.ok) return NextResponse.json({error:auth.error},{status:auth.status});
 */
export async function requireRole(
  req: NextRequest,
  roles: string[]
): Promise<{ ok: true; user: AuthUser } | { ok: false; status: number; error: string }> {
  const user = await getAuthUser(req);
  if (!user) return { ok: false, status: 401, error: 'Não autenticado.' };
  if (!roles.includes(user.role)) return { ok: false, status: 403, error: 'Sem permissão para esta ação.' };
  return { ok: true, user };
}
