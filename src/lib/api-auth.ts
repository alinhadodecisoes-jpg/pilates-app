import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServerClient } from './supabase-server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export interface Caller {
  id: string;
  role: string | null;
}

function getBearerToken(req: NextRequest): string | null {
  const h = req.headers.get('authorization') || req.headers.get('Authorization');
  if (h && h.startsWith('Bearer ')) return h.slice(7).trim();
  return null;
}

/**
 * Valida o JWT enviado pelo cliente (Authorization: Bearer ...) e retorna
 * o id + papel do usuário, ou null se não autenticado/inválido.
 */
export async function getCaller(req: NextRequest): Promise<Caller | null> {
  const token = getBearerToken(req);
  if (!token) return null;
  try {
    const authClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    const { data, error } = await authClient.auth.getUser(token);
    if (error || !data.user) return null;
    const db = getSupabaseServerClient();
    const { data: profile } = await db
      .from('users_pilates')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();
    return { id: data.user.id, role: (profile?.role as string) ?? null };
  } catch {
    return null;
  }
}

/**
 * Exige que o chamador tenha um dos papéis informados.
 * Retorna { caller } ou { error: NextResponse } (401/403).
 */
export async function requireRole(
  req: NextRequest,
  roles: string[]
): Promise<{ caller: Caller; error?: never } | { caller?: never; error: NextResponse }> {
  const caller = await getCaller(req);
  if (!caller) return { error: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) };
  if (!caller.role || !roles.includes(caller.role)) {
    return { error: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) };
  }
  return { caller };
}

/**
 * Exige que o chamador seja o próprio dono do recurso (caller.id === userId)
 * OU tenha um dos papéis informados (ex.: admin/professor/fisioterapeuta).
 */
export async function requireSelfOrRole(
  req: NextRequest,
  userId: string | null,
  roles: string[]
): Promise<{ caller: Caller; error?: never } | { caller?: never; error: NextResponse }> {
  const caller = await getCaller(req);
  if (!caller) return { error: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) };
  if (userId && caller.id === userId) return { caller };
  if (caller.role && roles.includes(caller.role)) return { caller };
  return { error: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) };
}

export const STAFF_ROLES = ['admin', 'professor', 'fisioterapeuta', 'prof_fisio', 'prof_edfisica'];
export const ADMIN_ROLES = ['admin'];
