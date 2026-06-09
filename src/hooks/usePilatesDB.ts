'use client';

import { useState, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { PilatesUser, PilatesPlan, PilatesClass } from '@/types/pilates';

export function usePilatesDB() {
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAlunos = useCallback(() =>
    run(async () => {
      const { data, error } = await supabase
        .from('users_pilates')
        .select('*')
        .eq('role', 'aluno')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PilatesUser[];
    }), [run, supabase]);

  const getPlans = useCallback(() =>
    run(async () => {
      const { data, error } = await supabase
        .from('plans_pilates')
        .select('*')
        .order('price', { ascending: true });
      if (error) throw error;
      return data as PilatesPlan[];
    }), [run, supabase]);

  const getClasses = useCallback(() =>
    run(async () => {
      const { data, error } = await supabase
        .from('classes_pilates')
        .select('*')
        .order('day_of_week', { ascending: true });
      if (error) throw error;
      return data as PilatesClass[];
    }), [run, supabase]);

  const getDashboardStats = useCallback(() =>
    run(async () => {
      const [alunos, inadimplentes, turmas] = await Promise.all([
        supabase.from('users_pilates').select('id', { count: 'exact' }).eq('role', 'aluno'),
        supabase.from('users_pilates').select('id', { count: 'exact' }).eq('status', 'inadimplente'),
        supabase.from('classes_pilates').select('id', { count: 'exact' }).eq('is_active', true),
      ]);
      return {
        total_alunos: alunos.count ?? 0,
        inadimplentes: inadimplentes.count ?? 0,
        turmas_ativas: turmas.count ?? 0,
        faturamento_mes: 0, // conectar ao Stripe futuramente
      };
    }), [run, supabase]);

  return { loading, error, getAlunos, getPlans, getClasses, getDashboardStats };
}
