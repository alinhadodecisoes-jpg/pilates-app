import { createClient } from '@supabase/supabase-js'
import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl) {
  throw new Error(
    'Variável de ambiente NEXT_PUBLIC_SUPABASE_URL não encontrada. Verifique seu arquivo .env.local.'
  )
}

if (!anonKey) {
  throw new Error(
    'Variável de ambiente NEXT_PUBLIC_SUPABASE_ANON_KEY não encontrada. Verifique seu arquivo .env.local.'
  )
}

const STORAGE_KEY = 'daimach-auth-token'
const BACKUP_KEY = 'daimach-session-backup'

type NativeCapacitorWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean
    Plugins?: {
      FloatingBubble?: {
        updateToken?: (args: { token: string }) => void
      }
    }
  }
}

let browserClient: SupabaseClient | null = null
let sessionRestored = false

// Token de acesso mais recente (mantido em sincronia via onAuthStateChange).
// Usado pelo wrapper de fetch para autenticar chamadas às rotas /api.
let currentAccessToken: string | null = null
let fetchPatched = false

/**
 * Instala um wrapper no window.fetch que anexa o JWT do usuário logado
 * (Authorization: Bearer ...) somente em chamadas same-origin para /api/.
 * Assim o servidor consegue validar quem está chamando (a sessão fica em
 * localStorage, não em cookie, então o token precisa ir no header).
 */
function installAuthFetch(client: SupabaseClient) {
  if (fetchPatched || typeof window === 'undefined') return
  fetchPatched = true
  const origFetch = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const isApi =
        !!url &&
        (url.startsWith('/api/') || url.startsWith(window.location.origin + '/api/'))

      if (isApi) {
        let token = currentAccessToken
        if (!token) {
          try {
            const { data } = await client.auth.getSession()
            token = data.session?.access_token ?? null
            if (token) currentAccessToken = token
          } catch {}
        }
        if (token) {
          const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined))
          if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`)
          init = { ...init, headers }
        }
      }
    } catch {
      // Em caso de erro no wrapper, segue com o fetch original sem header.
    }
    return origFetch(input, init)
  }
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: STORAGE_KEY,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      global: {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      },
    })

    if (typeof window !== 'undefined') {
      // Instala o wrapper de fetch que envia o token nas chamadas /api
      installAuthFetch(browserClient)
      // Captura o token atual logo no início (caso já exista sessão salva)
      browserClient.auth.getSession().then(({ data }) => {
        currentAccessToken = data.session?.access_token ?? null
      }).catch(() => {})

      // Listener para manter backup da sessao sincronizado
      browserClient.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          currentAccessToken = session?.access_token ?? currentAccessToken
          if (session) {
            try {
              localStorage.setItem(BACKUP_KEY, JSON.stringify({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
              }))
            } catch {}
            // Save token to native Android SharedPreferences for FloatingBubbleService
            syncTokenToNative(session.access_token)
          }
        } else if (event === 'SIGNED_OUT') {
          currentAccessToken = null
          try {
            localStorage.removeItem(BACKUP_KEY)
          } catch {}
          syncTokenToNative('')
        }
      })
    }
  }

  return browserClient
}

/**
 * Restaura sessao do localStorage no Capacitor WebView.
 * Chamar uma vez no carregamento do app antes de qualquer redirect.
 */
export async function restoreSessionIfNeeded(): Promise<boolean> {
  if (sessionRestored) return false
  sessionRestored = true

  if (typeof window === 'undefined') return false

  const client = getSupabaseBrowserClient()

  // Primeiro tenta getSession normal (usa o storage interno)
  const { data: { session } } = await client.auth.getSession()
  if (session?.access_token) return true

  // Fallback: tenta restaurar do backup
  try {
    const raw = localStorage.getItem(BACKUP_KEY)
    if (!raw) return false
    const backup = JSON.parse(raw)
    if (backup?.access_token && backup?.refresh_token) {
      const { data, error } = await client.auth.setSession({
        access_token: backup.access_token,
        refresh_token: backup.refresh_token,
      })
      if (!error && data.session) return true
      // Backup invalido, limpar
      localStorage.removeItem(BACKUP_KEY)
    }
  } catch {}

  return false
}

/**
 * Sync auth token to Android native SharedPreferences.
 * The FloatingBubbleService reads this token for API calls.
 * Saves via both FloatingBubblePlugin and Capacitor Preferences for redundancy.
 */
async function syncTokenToNative(token: string) {
  try {
    const nativeWindow = window as NativeCapacitorWindow
    if (typeof window === 'undefined' || !nativeWindow.Capacitor?.isNativePlatform?.()) return

    // Method 1: Via FloatingBubble plugin -> daimach_prefs SharedPreferences
    const FloatingBubble = nativeWindow.Capacitor?.Plugins?.FloatingBubble
    if (FloatingBubble?.updateToken) {
      FloatingBubble.updateToken({ token })
    }

    // Method 2: Via Capacitor Preferences -> CapacitorStorage SharedPreferences
    try {
      const { Preferences } = await import('@capacitor/preferences')
      if (token) {
        await Preferences.set({
          key: 'daimach-session-backup',
          value: JSON.stringify({ access_token: token })
        })
      } else {
        await Preferences.remove({ key: 'daimach-session-backup' })
      }
    } catch {}
  } catch {}
}
