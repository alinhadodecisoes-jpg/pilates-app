import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

/**
 * Retorna o header Authorization com o token da sessão atual (se houver).
 * A sessão fica em localStorage, então precisamos anexar o token manualmente
 * nas chamadas a rotas protegidas.
 */
export async function authHeaders(): Promise<Record<string, string>> {
  try {
    const { data } = await getSupabaseBrowserClient().auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

/** fetch que já anexa o token da sessão e Content-Type JSON. */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const auth = await authHeaders();
  return fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...auth,
      ...(init.headers as Record<string, string> | undefined),
    },
  });
}
