'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { User } from '@supabase/supabase-js';

export function usePilatesAuth(_requiredRole?: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[DEBUG] Auth state change:', event, session?.user?.email ?? 'null');
      try {
        document.cookie = `_auth_debug=${encodeURIComponent(JSON.stringify({ event, email: session?.user?.email ?? null, t: Date.now() }))}; path=/`;
      } catch {}

      setUser(session?.user ?? null);
      setLoading(false);

      if (!session && (event === 'INITIAL_SESSION' || event === 'SIGNED_OUT')) {
        console.log('[DEBUG] Sem sessão, redirecionando para /login');
        router.push('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
