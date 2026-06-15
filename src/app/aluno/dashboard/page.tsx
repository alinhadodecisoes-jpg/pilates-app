'use client';

import { useState, useEffect } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import Link from 'next/link';

const DAYS = ['', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

interface DashboardData {
  userInfo: {
    status: string;
    payment_status: string | null;
    due_day: number | null;
    next_due_date: string | null;
    plan_id: number | null;
    monthly_value: number | null;
  } | null;
  plan: { name: string; classes_per_week: number; price: number } | null;
  enrollments: Array<{
    class_id: number;
    classes_pilates: {
      name: string;
      day_of_week: number;
      time_start: string;
      professor: { full_name: string | null } | null;
    } | null;
  }>;
  aulasNoMes: number;
  temPagamentoPendente: boolean;
}

export default function AlunoDashboard() {
  const { user, loading: authLoading } = usePilatesAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      fetch(`/api/pilates/aluno/dashboard?userId=${user.id}`)
        .then((r) => r.json())
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { userInfo, plan, enrollments, aulasNoMes, temPagamentoPendente } = data ?? {};

  const statusPagamento = userInfo?.payment_status ?? userInfo?.status ?? 'ativo';
  const isEmDia = statusPagamento === 'em_dia' || statusPagamento === 'ativo' || userInfo?.status === 'ativo';
  const isInadimplente = userInfo?.status === 'inadimplente' || statusPagamento === 'atrasado';

  const vencimentoLabel = userInfo?.due_day
    ? `Dia ${userInfo.due_day} de cada mês`
    : userInfo?.next_due_date
    ? new Date(userInfo.next_due_date.slice(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR')
    : null;

  const proximaAula = enrollments && enrollments.length > 0 ? enrollments[0].classes_pilates : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Meu Painel</h1>
        <p className="text-slate-400 mt-1">Bem-vindo de volta!</p>
      </div>

      {temPagamentoPendente && (
        <div className="bg-yellow-600/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3">
          <span className="text-yellow-400 text-xl">⏳</span>
          <div className="flex-1">
            <p className="text-yellow-300 font-medium text-sm">Pagamento aguardando confirmação</p>
            <p className="text-yellow-400/70 text-xs mt-0.5">O admin irá confirmar em breve.</p>
          </div>
          <Link href="/aluno/financeiro" className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 rounded-lg transition-colors">
            Ver
          </Link>
        </div>
      )}

      {isInadimplente && (
        <div className="bg-red-600/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <span className="text-red-400 text-xl">⚠️</span>
          <div className="flex-1">
            <p className="text-red-300 font-medium text-sm">Mensalidade em atraso</p>
            <p className="text-red-400/70 text-xs mt-0.5">Regularize seu pagamento para continuar participando das aulas.</p>
          </div>
          <Link href="/aluno/financeiro" className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors">
            Pagar
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Próxima Aula */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
          <div className="pl-1">
            <p className="text-xs font-medium text-slate-400 mb-1">PRÓXIMA AULA</p>
            {proximaAula ? (
              <>
                <p className="text-xl font-bold text-white">
                  {DAYS[proximaAula.day_of_week]} · {proximaAula.time_start?.slice(0, 5)}
                </p>
                <p className="text-sm text-slate-300 mt-1">
                  {proximaAula.professor?.full_name || proximaAula.name}
                </p>
                <div className="mt-3">
                  <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded-full">
                    {enrollments!.length} turma{enrollments!.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-slate-400">Sem matrícula</p>
                <p className="text-sm text-slate-500 mt-1">Nenhuma turma ativa</p>
                <div className="mt-3">
                  <span className="text-xs bg-slate-600/20 text-slate-400 px-2 py-1 rounded-full">—</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Status Pagamento */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-1 h-full ${isInadimplente ? 'bg-red-500' : 'bg-cyan-500'}`} />
          <div className="pl-1">
            <p className="text-xs font-medium text-slate-400 mb-1">MENSALIDADE</p>
            <p className={`text-xl font-bold ${isInadimplente ? 'text-red-400' : 'text-green-400'}`}>
              {isInadimplente ? 'Em Atraso' : 'Em Dia'}
            </p>
            {vencimentoLabel && (
              <p className="text-sm text-slate-300 mt-1">Vence {vencimentoLabel}</p>
            )}
            <div className="mt-3">
              <span className={`text-xs px-2 py-1 rounded-full ${
                isInadimplente
                  ? 'bg-red-600/20 text-red-400'
                  : 'bg-green-600/20 text-green-400'
              }`}>
                {isInadimplente ? 'Pendente' : 'Pago ✅'}
              </span>
            </div>
          </div>
        </div>

        {/* Plano Atual */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500" />
          <div className="pl-1">
            <p className="text-xs font-medium text-slate-400 mb-1">PLANO</p>
            {plan ? (
              <>
                <p className="text-xl font-bold text-white">{plan.name}</p>
                <p className="text-sm text-slate-300 mt-1">{plan.classes_per_week}x por semana</p>
                <div className="mt-3">
                  <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded-full">
                    R$ {(userInfo?.monthly_value ?? plan.price).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </>
            ) : (
              <>
                <p className="text-xl font-bold text-slate-400">Sem plano</p>
                <p className="text-sm text-slate-500 mt-1">Contate o admin</p>
                <div className="mt-3">
                  <span className="text-xs bg-slate-600/20 text-slate-400 px-2 py-1 rounded-full">—</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Turmas matriculadas */}
      {enrollments && enrollments.length > 0 && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Minhas Turmas</h3>
          <div className="space-y-2">
            {enrollments.map((e) => {
              const cls = e.classes_pilates;
              if (!cls) return null;
              return (
                <div key={e.class_id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">{cls.name}</p>
                    <p className="text-slate-400 text-xs">
                      {DAYS[cls.day_of_week]} · {cls.time_start?.slice(0, 5)}
                      {cls.professor?.full_name ? ` · Prof. ${cls.professor.full_name}` : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Banner Presença */}
      <div className="bg-gradient-to-r from-green-900/40 to-cyan-900/30 rounded-xl p-6 border border-green-700/30">
        <h3 className="text-lg font-bold text-white mb-1">
          {aulasNoMes && aulasNoMes > 0 ? `Continue assim! 💪` : 'Boas-vindas ao Daimach!'}
        </h3>
        <p className="text-slate-300 text-sm">
          {aulasNoMes && aulasNoMes > 0
            ? `Você completou ${aulasNoMes} aula${aulasNoMes !== 1 ? 's' : ''} este mês. A consistência é a chave para o seu bem-estar!`
            : 'Comece sua jornada de bem-estar com o pilates.'}
        </p>
      </div>
    </div>
  );
}
