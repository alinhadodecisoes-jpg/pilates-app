import { createBrowserClient } from '@supabase/ssr'
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

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: STORAGE_KEY,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    })

    if (typeof window !== 'undefined') {
      // Listener para manter backup da sessao sincronizado
      browserClient.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
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
