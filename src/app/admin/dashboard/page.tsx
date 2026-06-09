'use client';

import Link from 'next/link';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';

const KPI_DATA = [
  { label: 'Alunos Ativos', value: '150', sub: '↑ 5 este mês', subColor: 'text-green-400', icon: '👥', accent: 'bg-green-500' },
  { label: 'Faturamento (Mês)', value: 'R$ 12.500', sub: '↑ R$ 2.000 vs anterior', subColor: 'text-green-400', icon: '💰', accent: 'bg-cyan-500' },
  { label: 'Inadimplentes', value: '8', sub: 'Requer atenção', subColor: 'text-red-400', icon: '⚠️', accent: 'bg-red-500' },
  { label: 'Turmas Ativas', value: '12', sub: '85% de ocupação', subColor: 'text-slate-400', icon: '📅', accent: 'bg-yellow-500' },
];

const AULAS_HOJE = [
  { horario: '08:00', professor: 'Ana Clara', turma: 'Pilates Solo', inscritos: '4/4', status: 'Lotado' },
  { horario: '09:00', professor: 'Daiana',    turma: 'Pilates Equip.', inscritos: '3/4', status: 'Disponível' },
  { horario: '18:00', professor: 'Ana Clara', turma: 'Pilates Solo', inscritos: '2/4', status: 'Disponível' },
];

const ULTIMAS_INSCRICOES = [
  { nome: 'Maria Silva',  data: '07/06/2026', plano: 'Pilates 2x' },
  { nome: 'João Santos',  data: '06/06/2026', plano: 'Pilates Livre' },
  { nome: 'Ana Costa',   data: '05/06/2026', plano: 'Pilates 3x' },
];

export default function AdminDashboard() {
  const { user, loading } = usePilatesAuth('professor');

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/admin/alunos" className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">+ Aluno</Link>
          <Link href="/admin/turmas" className="border border-slate-600 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">+ Turma</Link>
          <Link href="/admin/planos" className="border border-slate-600 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">+ Plano</Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_DATA.map((kpi) => (
          <div key={kpi.label} className="bg-slate-800 rounded-xl p-5 border border-slate-700 relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${kpi.accent}`} />
            <div className="pl-2">
              <p className="text-xs font-medium text-slate-400 mb-1">{kpi.icon} {kpi.label}</p>
              <p className="text-2xl font-bold text-white">{kpi.value}</p>
              <p className={`text-xs mt-1 ${kpi.subColor}`}>{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aulas de Hoje */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-white">Aulas de Hoje</h3>
            <Link href="/admin/turmas" className="text-sm text-green-400 hover:text-green-300">Ver todas</Link>
          </div>
          <div className="divide-y divide-slate-700">
            {AULAS_HOJE.map((aula, i) => (
              <div key={i} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{aula.horario} — {aula.turma}</p>
                  <p className="text-sm text-slate-400">{aula.professor} · {aula.inscritos}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  aula.status === 'Lotado'
                    ? 'bg-yellow-600/20 text-yellow-400'
                    : 'bg-green-600/20 text-green-400'
                }`}>{aula.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Últimas Inscrições */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-white">Últimas Inscrições</h3>
            <Link href="/admin/alunos" className="text-sm text-green-400 hover:text-green-300">Ver todas</Link>
          </div>
          <div className="divide-y divide-slate-700">
            {ULTIMAS_INSCRICOES.map((inscricao, i) => (
              <div key={i} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{inscricao.nome}</p>
                  <p className="text-sm text-slate-400">{inscricao.data}</p>
                </div>
                <span className="text-xs bg-cyan-600/20 text-cyan-400 px-2 py-1 rounded-full">{inscricao.plano}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
