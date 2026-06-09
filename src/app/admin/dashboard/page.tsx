'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';

export default function AdminDashboard() {
  const { loading: authLoading } = usePilatesAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: totalUsers } = await supabase
          .from('users_pilates')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'aluno');

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: payments } = await supabase
          .from('payment_history')
          .select('amount')
          .eq('status', 'paid')
          .gte('payment_date', thirtyDaysAgo.toISOString().split('T')[0]);

        const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        const { count: overdue } = await supabase
          .from('payment_history')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'overdue');

        setStats({
          totalUsers: totalUsers || 0,
          totalRevenue,
          overdue: overdue || 0,
        });
      } catch (err) {
        console.error('[ERROR]:', err);
      }
      setLoading(false);
    };

    if (!authLoading) fetchStats();
  }, [authLoading, supabase]);

  if (authLoading || loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin">Loading...</div></div>;

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-50">
      <h1 className="text-3xl font-bold mb-6">🎯 Painel Admin</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-green-600 text-white p-6 rounded"><p className="text-sm">Alunos</p><p className="text-4xl font-bold">{stats?.totalUsers || 0}</p></div>
        <div className="bg-blue-600 text-white p-6 rounded"><p className="text-sm">Faturado</p><p className="text-4xl font-bold">R$ {(stats?.totalRevenue || 0).toFixed(2)}</p></div>
        <div className="bg-red-600 text-white p-6 rounded"><p className="text-sm">Inadimplentes</p><p className="text-4xl font-bold">{stats?.overdue || 0}</p></div>
      </div>
    </div>
  );
}
