'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { User } from '@supabase/supabase-js';

type UserRole = 'admin' | 'professor' | 'aluno' | 'fisioterapeuta';

export function usePilatesAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>('aluno');
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    let mounted = true;

    const fetchRole = async (userId: string): Promise<UserRole> => {
      try {
        const { data } = await supabase
          .from('users_pilates')
          .select('role')
          .eq('id', userId)
          .maybeSingle();
        return (data?.role as UserRole) || 'aluno';
      } catch {
        return 'aluno';
      }
    };

    // onAuthStateChange dispara INITIAL_SESSION com a sessão real do localStorage
    // Isso resolve o problema de getSession() retornar null no primeiro render
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('[AUTH] Event:', event, '| User:', session?.user?.email ?? 'null');

        if (session?.user) {
          setUser(session.user);

          const userRole = await fetchRole(session.user.id);
          if (!mounted) return;

          setRole(userRole);
          setLoading(false);

          console.log('[AUTH] Role detectado:', userRole);

          // Redirecionar só se estiver na rota errada
          const path = window.location.pathname;
          if (userRole === 'admin' && !path.startsWith('/admin') && !path.startsWith('/fisioterapeuta')) {
            console.log('[ROUTE] → /admin/dashboard');
            router.push('/admin/dashboard');
          } else if (userRole === 'professor' && !path.startsWith('/professor')) {
            console.log('[ROUTE] → /professor/dashboard');
            router.push('/professor/dashboard');
          } else if (userRole === 'aluno' && !path.startsWith('/aluno')) {
            console.log('[ROUTE] → /aluno/dashboard');
            router.push('/aluno/dashboard');
          } else if (userRole === 'fisioterapeuta' && !path.startsWith('/fisioterapeuta')) {
            console.log('[ROUTE] → /fisioterapeuta/dashboard');
            router.push('/fisioterapeuta/dashboard');
          }
        } else {
          // Sem sessão
          setUser(null);
          setLoading(false);

          const path = window.location.pathname;
          const isProtected =
            path.startsWith('/admin') ||
            path.startsWith('/aluno') ||
            path.startsWith('/professor') ||
            path.startsWith('/fisioterapeuta');

          if (isProtected) {
            console.log('[AUTH] Sem sessão em rota protegida → /login');
            router.push('/login');
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  return { user, loading, role };
}
