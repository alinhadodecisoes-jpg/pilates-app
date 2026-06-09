'use client';

import { usePilatesAuth } from '@/hooks/usePilatesAuth';

export default function AlunoDashboard() {
  const { user, loading } = usePilatesAuth('aluno');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Meu Painel</h1>
        <p className="text-slate-400 mt-1">Bem-vindo de volta!</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Próxima Aula */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
          <div className="pl-1">
            <p className="text-xs font-medium text-slate-400 mb-1">PRÓXIMA AULA</p>
            <p className="text-xl font-bold text-white">Qua, 18:00</p>
            <p className="text-sm text-slate-300 mt-1">Prof. Ana Clara</p>
            <div className="mt-3">
              <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded-full">Confirmada ✅</span>
            </div>
          </div>
        </div>

        {/* Status Pagamento */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
          <div className="pl-1">
            <p className="text-xs font-medium text-slate-400 mb-1">MENSALIDADE</p>
            <p className="text-xl font-bold text-green-400">Em Dia</p>
            <p className="text-sm text-slate-300 mt-1">Vence 10/Jul</p>
            <div className="mt-3">
              <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded-full">Pago ✅</span>
            </div>
          </div>
        </div>

        {/* Plano Atual */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500" />
          <div className="pl-1">
            <p className="text-xs font-medium text-slate-400 mb-1">PLANO</p>
            <p className="text-xl font-bold text-white">Pilates 2x</p>
            <p className="text-sm text-slate-300 mt-1">2 aulas/semana</p>
            <div className="mt-3">
              <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded-full">Ativo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Banner Motivacional */}
      <div className="bg-gradient-to-r from-green-900/40 to-cyan-900/30 rounded-xl p-6 border border-green-700/30">
        <h3 className="text-lg font-bold text-white mb-1">Continue assim! 💪</h3>
        <p className="text-slate-300 text-sm">Você já completou 8 aulas neste mês. A consistência é a chave para o seu bem-estar!</p>
      </div>
    </div>
  );
}
