'use client';

import { useState, useEffect } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';

interface TeacherPayment {
  id: number;
  month: string;
  total_classes: number;
  rate_per_class: number;
  total_amount: number;
  status: string;
}

const PAY_MODE_LABEL: Record<string, string> = {
  per_class: 'Por aula',
  per_day: 'Por dia',
  percent: '% da mensalidade',
  fixed: 'Fixo mensal',
};

export default function ProfessorFinanceiroPage() {
  const { user, loading: authLoading } = usePilatesAuth();
  const [classesThisMonth, setClassesThisMonth] = useState(0);
  const [daysThisMonth, setDaysThisMonth] = useState(0);
  const [alunosCount, setAlunosCount] = useState(0);
  const [payMode, setPayMode] = useState('');
  const [payRate, setPayRate] = useState(0);
  const [aReceber, setAReceber] = useState<number | null>(null);
  const [payments, setPayments] = useState<TeacherPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      fetch(`/api/pilates/professor/financeiro?professorId=${user.id}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d) {
            setClassesThisMonth(d.classesThisMonth ?? 0);
            setDaysThisMonth(d.daysThisMonth ?? 0);
            setAlunosCount(d.alunosCount ?? 0);
            setPayMode(d.payMode ?? '');
            setPayRate(Number(d.payRate ?? 0));
            setAReceber(d.aReceber ?? null);
            setPayments(d.payments ?? []);
          }
        })
        .finally(() => setLoading(false));
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user]);

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const mesAtual = payments.find((p) => p.month === new Date().toISOString().slice(0, 7));
  // Prioriza o valor lançado pelo admin (teacher_payments); senão, a estimativa pela forma de pagamento
  const valorReceber = mesAtual ? Number(mesAtual.total_amount) : aReceber;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white">Meu Financeiro</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <p className="text-slate-400 text-sm">Aulas este mês</p>
          <p className="text-3xl font-bold text-green-400 mt-1">{classesThisMonth}</p>
          <p className="text-xs text-slate-500 mt-1">{daysThisMonth} dia(s) · {alunosCount} aluno(s)</p>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <p className="text-slate-400 text-sm">A receber (mês)</p>
          <p className="text-3xl font-bold text-blue-400 mt-1">
            {valorReceber != null ? `R$ ${Number(valorReceber).toFixed(2)}` : '—'}
          </p>
          {payMode ? (
            <p className="text-xs text-slate-500 mt-1">
              {PAY_MODE_LABEL[payMode] ?? payMode}
              {payMode === 'percent' ? ` · ${payRate}%` : payMode === 'fixed' ? '' : ` · R$ ${payRate.toFixed(2)}`}
              {!mesAtual && aReceber != null ? ' (estimado)' : ''}
            </p>
          ) : (
            <p className="text-xs text-amber-400/80 mt-1">Forma de pagamento não definida pelo admin</p>
          )}
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <p className="text-slate-400 text-sm">Status (mês)</p>
          <p className={`text-xl font-bold mt-1 ${mesAtual?.status === 'pago' ? 'text-green-400' : 'text-yellow-400'}`}>
            {mesAtual?.status ? (mesAtual.status === 'pago' ? 'Pago' : 'Pendente') : 'A lançar'}
          </p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700"><h2 className="text-green-400 font-semibold">Histórico de Pagamentos</h2></div>
        {payments.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">Nenhum pagamento registrado ainda. O administrador lança os pagamentos mensais.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="px-5 py-3 text-slate-400 font-medium">Mês</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Aulas</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Valor/aula</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Total</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3 text-white">{p.month}</td>
                  <td className="px-5 py-3 text-slate-300">{p.total_classes}</td>
                  <td className="px-5 py-3 text-slate-300">R$ {Number(p.rate_per_class).toFixed(2)}</td>
                  <td className="px-5 py-3 text-slate-300">R$ {Number(p.total_amount).toFixed(2)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'pago' ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'}`}>
                      {p.status === 'pago' ? 'Pago' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
