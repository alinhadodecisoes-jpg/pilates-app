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

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          console.log('[DEBUG] Sem sessão, redirecionando para /login');
          setLoading(false);
          router.push('/login');
          return;
        }

        console.log('[DEBUG] Sessão encontrada:', session.user.email);
        setUser(session.user);

        // BUSCAR ROLE DO BANCO
        const { data: userProfile, error } = await supabase
          .from('users_pilates')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (!error && userProfile) {
          console.log('[DEBUG] Role detectado:', userProfile.role);
          setRole(userProfile.role as UserRole);
          localStorage.setItem('user_role', userProfile.role);

          // REDIRECIONAR CONFORME ROLE
          const currentPath = window.location.pathname;
          if (userProfile.role === 'admin' && !currentPath.startsWith('/admin')) {
            console.log('[DEBUG] Redirecionando ADMIN para /admin/dashboard');
            router.push('/admin/dashboard');
          } else if (userProfile.role === 'professor' && !currentPath.startsWith('/professor')) {
            console.log('[DEBUG] Redirecionando PROFESSOR para /professor/dashboard');
            router.push('/professor/dashboard');
          } else if (userProfile.role === 'aluno' && !currentPath.startsWith('/aluno')) {
            console.log('[DEBUG] Redirecionando ALUNO para /aluno/dashboard');
            router.push('/aluno/dashboard');
          } else if (userProfile.role === 'fisioterapeuta' && !currentPath.startsWith('/fisioterapeuta')) {
            console.log('[DEBUG] Redirecionando FISIOTERAPEUTA');
            router.push('/fisioterapeuta/dashboard');
          }
        } else {
          console.warn('[WARN] Perfil não encontrado, usando role padrão: aluno');
          setRole('aluno');
        }

        setLoading(false);
      } catch (err) {
        console.error('[ERROR] Auth check failed:', err);
        setLoading(false);
        router.push('/login');
      }
    };

    if (mounted) {
      checkAuth();
    }

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  return { user, loading, role };
}
