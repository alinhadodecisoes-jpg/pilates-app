'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import Link from 'next/link';

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

        const { data: payments } = await supabase
          .from('payment_history')
          .select('amount')
          .eq('status', 'paid');

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

  if (authLoading || loading) return <div className="p-6 text-daimach-light">Carregando...</div>;

  return (
    <div className="p-6 bg-daimach-dark min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-daimach-light">🎯 Painel Administrativo Daimach</h1>
      
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-daimach-primary text-daimach-dark p-6 rounded-lg font-bold">
          <p className="text-sm mb-2">Total de Alunos</p>
          <p className="text-4xl">{stats?.totalUsers || 0}</p>
        </div>
        
        <div className="bg-daimach-accent text-daimach-dark p-6 rounded-lg font-bold">
          <p className="text-sm mb-2">Faturado (Mês)</p>
          <p className="text-4xl">R\$ {(stats?.totalRevenue || 0).toFixed(2)}</p>
        </div>
        
        <div className="bg-daimach-secondary text-white p-6 rounded-lg font-bold">
          <p className="text-sm mb-2">Inadimplentes</p>
          <p className="text-4xl">{stats?.overdue || 0}</p>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4 text-daimach-light">Ferramentas Administrativas</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/admin/usuarios" className="bg-daimach-primary text-daimach-dark p-6 rounded-lg text-center hover:bg-daimach-primary/90 transition font-bold">
          👥 Gerenciar Usuários
        </Link>
        <Link href="/admin/professores" className="bg-daimach-secondary text-white p-6 rounded-lg text-center hover:bg-daimach-secondary/90 transition font-bold">
          👨‍🏫 Professores
        </Link>
        <Link href="/admin/turmas" className="bg-daimach-accent text-daimach-dark p-6 rounded-lg text-center hover:bg-daimach-accent/90 transition font-bold">
          📚 Turmas
        </Link>
        <Link href="/admin/relatorios" className="bg-daimach-primary text-daimach-dark p-6 rounded-lg text-center hover:bg-daimach-primary/90 transition font-bold">
          📊 Relatórios
        </Link>
        <Link href="/admin/financeiro" className="bg-daimach-accent text-daimach-dark p-6 rounded-lg text-center hover:bg-daimach-accent/90 transition font-bold">
          💰 Financeiro
        </Link>
        <Link href="/admin/fisioterapia" className="bg-daimach-secondary text-white p-6 rounded-lg text-center hover:bg-daimach-secondary/90 transition font-bold">
          🏥 Fisioterapia
        </Link>
      </div>
    </div>
  );
}
