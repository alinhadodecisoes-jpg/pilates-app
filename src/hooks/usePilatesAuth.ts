'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { User } from '@supabase/supabase-js';

type UserRole = 'admin' | 'professor' | 'aluno' | 'fisioterapeuta';

let authInitialized = false;

export function usePilatesAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>('aluno');
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        // TENTAR OBTER SESSÃO ATUAL
        const { data: { session } } = await supabase.auth.getSession();

        if (!mounted) return;

        if (!session) {
          console.log('[AUTH] ❌ Nenhuma sessão encontrada');
          setUser(null);
          setRole('aluno');
          setLoading(false);

          // Redirecionar se em rota protegida
          if (typeof window !== 'undefined' &&
              (window.location.pathname.startsWith('/admin') ||
               window.location.pathname.startsWith('/professor') ||
               window.location.pathname.startsWith('/aluno'))) {
            router.push('/login');
          }
          return;
        }

        console.log('[AUTH] ✅ Sessão encontrada:', session.user.email);
        setUser(session.user);

        // BUSCAR ROLE
        const { data: userProfile, error } = await supabase
          .from('users_pilates')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (!mounted) return;

        if (error || !userProfile) {
          console.log('[AUTH] ⚠️  Perfil não encontrado, usando "aluno"');
          setRole('aluno');
          setLoading(false);
          return;
        }

        console.log('[AUTH] 👤 Role:', userProfile.role);
        setRole(userProfile.role as UserRole);
        setLoading(false);

        // REDIRECIONAR SE NECESSÁRIO
        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          if (userProfile.role === 'admin' && !path.startsWith('/admin')) {
            console.log('[ROUTE] → /admin/dashboard');
            router.push('/admin/dashboard');
          } else if (userProfile.role === 'professor' && !path.startsWith('/professor')) {
            console.log('[ROUTE] → /professor/dashboard');
            router.push('/professor/dashboard');
          } else if (userProfile.role === 'aluno' && !path.startsWith('/aluno')) {
            console.log('[ROUTE] → /aluno/dashboard');
            router.push('/aluno/dashboard');
          }
        }
      } catch (err) {
        console.error('[AUTH] 💥 Erro:', err);
        if (mounted) {
          setLoading(false);
          router.push('/login');
        }
      }
    };

    // Executar check na primeira vez
    if (!authInitialized) {
      authInitialized = true;
      checkAuth();
    } else {
      // Próximas chamadas usam listener
      const unsubscribe = supabase.auth.onAuthStateChange((event, session) => {
        if (mounted) {
          if (!session) {
            setUser(null);
            setRole('aluno');
          } else {
            setUser(session.user);
            // Role será atualizado no próximo check
          }
          setLoading(false);
        }
      });

      return () => {
        unsubscribe?.data?.subscription?.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  return { user, loading, role };
}
