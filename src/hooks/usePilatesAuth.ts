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
      console.log('[AUTH] Iniciando check de autenticação...');
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError) {
          console.error('[AUTH] Erro ao obter sessão:', sessionError);
          setLoading(false);
          return;
        }

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
            console.log('[ROUTE] Redirecting to /login (sem sessão)');
            router.push('/login');
          }
          return;
        }

        console.log('[AUTH] ✅ Sessão encontrada:', session.user.email);
        setUser(session.user);

        // BUSCAR ROLE DO BANCO
        console.log('[AUTH] Buscando role para ID:', session.user.id);
        const { data: userProfile, error: roleError } = await supabase
          .from('users_pilates')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (!mounted) return;

        if (roleError) {
          console.warn('[AUTH] Erro ao buscar role:', roleError);
          console.log('[AUTH] ⚠️  Usando role padrão: aluno');
          setRole('aluno');
          setLoading(false);
          return;
        }

        if (!userProfile) {
          console.log('[AUTH] ⚠️  Perfil vazio, usando aluno');
          setRole('aluno');
          setLoading(false);
          return;
        }

        console.log('[AUTH] 👤 Role detectado:', userProfile.role);
        setRole(userProfile.role as UserRole);
        setLoading(false);

        // REDIRECIONAR CONFORME ROLE
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          const userRole = userProfile.role as UserRole;

          if (userRole === 'admin' && !currentPath.startsWith('/admin')) {
            console.log('[ROUTE] Redirecionando para /admin/dashboard');
            router.push('/admin/dashboard');
          } else if (userRole === 'professor' && !currentPath.startsWith('/professor')) {
            console.log('[ROUTE] Redirecionando para /professor/dashboard');
            router.push('/professor/dashboard');
          } else if (userRole === 'aluno' && !currentPath.startsWith('/aluno')) {
            console.log('[ROUTE] Redirecionando para /aluno/dashboard');
            router.push('/aluno/dashboard');
          } else if (userRole === 'fisioterapeuta' && !currentPath.startsWith('/fisioterapeuta')) {
            console.log('[ROUTE] Redirecionando para /fisioterapeuta/dashboard');
            router.push('/fisioterapeuta/dashboard');
          }
        }
      } catch (err) {
        console.error('[AUTH] 💥 Erro fatal:', err);
        if (mounted) {
          setLoading(false);
          router.push('/login');
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  return { user, loading, role };
}
