'use client';

import { useState, useEffect } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { getDashboardStats } from '@/lib/pilates/pilates-db';
import Link from 'next/link';

export default function AdminDashboard() {
  const { loading: authLoading } = usePilatesAuth();
  const [stats, setStats] = useState<{
    total_alunos: number;
    inadimplentes: number;
    turmas_ativas: number;
    faturamento_mes: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      getDashboardStats()
        .then(setStats)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-ink">Painel Administrativo</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <p className="text-sm text-slate-400 mb-1">Total de Alunos</p>
          <p className="text-4xl font-bold text-ink">{stats?.total_alunos ?? 0}</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <p className="text-sm text-slate-400 mb-1">Turmas Ativas</p>
          <p className="text-4xl font-bold text-green-400">{stats?.turmas_ativas ?? 0}</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <p className="text-sm text-slate-400 mb-1">Inadimplentes</p>
          <p className="text-4xl font-bold text-red-400">{stats?.inadimplentes ?? 0}</p>
        </div>
      </div>

      {/* Links rápidos */}
      <div>
        <h2 className="text-lg font-semibold text-slate-300 mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/alunos"
            className="bg-slate-800 border border-slate-700 hover:border-green-600 rounded-xl p-5 text-center transition-colors"
          >
            <p className="text-2xl mb-1">👥</p>
            <p className="text-sm font-medium text-ink">Alunos</p>
          </Link>
          <Link
            href="/admin/turmas"
            className="bg-slate-800 border border-slate-700 hover:border-green-600 rounded-xl p-5 text-center transition-colors"
          >
            <p className="text-2xl mb-1">📚</p>
            <p className="text-sm font-medium text-ink">Turmas</p>
          </Link>
          <Link
            href="/admin/professores"
            className="bg-slate-800 border border-slate-700 hover:border-green-600 rounded-xl p-5 text-center transition-colors"
          >
            <p className="text-2xl mb-1">👨‍🏫</p>
            <p className="text-sm font-medium text-ink">Professores</p>
          </Link>
          <Link
            href="/admin/financeiro"
            className="bg-slate-800 border border-slate-700 hover:border-green-600 rounded-xl p-5 text-center transition-colors"
          >
            <p className="text-2xl mb-1">💰</p>
            <p className="text-sm font-medium text-ink">Financeiro</p>
          </Link>
          <Link
            href="/admin/relatorios"
            className="bg-slate-800 border border-slate-700 hover:border-green-600 rounded-xl p-5 text-center transition-colors"
          >
            <p className="text-2xl mb-1">📊</p>
            <p className="text-sm font-medium text-ink">Relatórios</p>
          </Link>
          <Link
            href="/admin/fisioterapia"
            className="bg-slate-800 border border-slate-700 hover:border-green-600 rounded-xl p-5 text-center transition-colors"
          >
            <p className="text-2xl mb-1">🏥</p>
            <p className="text-sm font-medium text-ink">Fisioterapia</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
