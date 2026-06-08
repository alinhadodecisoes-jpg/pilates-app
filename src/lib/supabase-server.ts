import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl) {
  throw new Error(
    'Variável de ambiente NEXT_PUBLIC_SUPABASE_URL não encontrada. Verifique seu arquivo .env.local.'
  )
}

if (!serviceRoleKey) {
  throw new Error(
    'Variável de ambiente SUPABASE_SERVICE_ROLE_KEY não encontrada. Verifique seu arquivo .env.local.'
  )
}

let supabaseServerClient: SupabaseClient | null = null

/**
 * Cliente Supabase com cookies da requisição (SSR). Use em API Routes para obter sessão do usuário.
 * Necessário para que user_id não seja null ao salvar mensagens.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignorar erro em Server Components (read-only)
          }
        },
      },
    }
  )
}

/**
 * Cliente Supabase para uso em Server Components, server actions e rotas API.
 * Usa a Service Role Key, portanto NUNCA importe este módulo em componentes client.
 */
export function getSupabaseServerClient(): SupabaseClient {
  if (!supabaseServerClient) {
    supabaseServerClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    })
  }

  return supabaseServerClient
}

