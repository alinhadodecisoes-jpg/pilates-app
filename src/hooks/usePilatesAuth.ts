'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { User } from '@supabase/supabase-js';

export function usePilatesAuth(_requiredRole?: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[DEBUG] Sessão verificada:', session?.user?.email);

      if (!session) {
        console.log('[DEBUG] Sem sessão, redirecionando para /login');
        setLoading(false);
        router.push('/login');
        return;
      }

      console.log('[DEBUG] Usuário autenticado:', session.user.email);
      setUser(session.user);
      setLoading(false);
    });
  }, [supabase, router]);

  return { user, loading };
}
