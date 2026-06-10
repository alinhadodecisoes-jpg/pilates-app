'use client';
import { useEffect, useState } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';

interface AlunoFinanceiro {
  id: string;
  full_name: string | null;
  email: string | null;
  status: string | null;
  phone: string | null;
  subscription?: {
    stripe_subscription_id: string | null;
    stripe_customer_id: string | null;
    current_period_end: string | null;
    plan_name?: string | null;
    monthly_value?: number | null;
  } | null;
  lastPayment?: {
    amount: number;
    payment_date: string;
    status: string;
  } | null;
}

const STATUS_BADGE: Record<string, string> = {
  ativo: 'bg-green-600/20 text-green-400 border border-green-600/30',
  inadimplente: 'bg-red-600/20 text-red-400 border border-red-600/30',
  inativo: 'bg-slate-600/20 text-slate-400 border border-slate-600/30',
  pendente: 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30',
};

export default function FinanceiroAdmin() {
  const { loading: authLoading } = usePilatesAuth();
  const [summary, setSummary] = useState<{
    totalRevenue: number;
    totalPending: number;
    alunosAtivos: number;
    inadimplentes: number;
  } | null>(null);
  const [alunos, setAlunos] = useState<AlunoFinanceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/pilates/financeiro');
        if (res.ok) {
          const data = await res.json();
          setAlunos(data.alunos ?? []);
          setSummary(data.summary ?? null);
        }
      } catch (err) {
        console.error('[ERROR financeiro admin]:', err);
      }
      setLoading(false);
    };

    if (!authLoading) fetchData();
  }, [authLoading]);

  const handleDarBaixa = async (userId: string, amount: number) => {
    if (!confirm(`Confirmar pagamento manual de R$ ${amount.toFixed(2)}?`)) return;
    setMarkingPaid(userId);
    const refMonth = new Date().toISOString().slice(0, 7);
    await supabase.from('payment_history').insert({
      user_id: userId,
      amount,
      status: 'paid',
      payment_date: new Date().toISOString().split('T')[0],
      reference_month: refMonth,
      payment_method: 'manual',
    });
    await supabase
      .from('users_pilates')
      .update({ status: 'ativo' })
      .eq('id', userId);
    setMarkingPaid(null);
    // Reload
    window.location.reload();
  };

  if (authLoading || loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const filtered = alunos.filter((a) => {
    const matchSearch =
      !search ||
      a.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === 'todos' || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Gestão Financeira</h1>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-green-600 text-white p-5 rounded-xl">
          <p className="text-xs opacity-80">Receita (30 dias)</p>
          <p className="text-2xl font-bold">R$ {(summary?.totalRevenue || 0).toFixed(2)}</p>
        </div>
        <div className="bg-yellow-600 text-white p-5 rounded-xl">
          <p className="text-xs opacity-80">Pendente</p>
          <p className="text-2xl font-bold">R$ {(summary?.totalPending || 0).toFixed(2)}</p>
        </div>
        <div className="bg-slate-700 text-white p-5 rounded-xl">
          <p className="text-xs opacity-80">Alunos ativos</p>
          <p className="text-2xl font-bold">{summary?.alunosAtivos || 0}</p>
        </div>
        <div className="bg-red-700 text-white p-5 rounded-xl">
          <p className="text-xs opacity-80">Inadimplentes</p>
          <p className="text-2xl font-bold">{summary?.inadimplentes || 0}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar aluno..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm flex-1 min-w-[200px]"
        />
        {['todos', 'ativo', 'inadimplente', 'inativo', 'pendente'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
              filterStatus === s
                ? 'bg-green-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Tabela de alunos */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
                <th className="text-left px-4 py-3">Aluno</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Plano / Valor</th>
                <th className="text-left px-4 py-3">Assinatura Stripe</th>
                <th className="text-left px-4 py-3">Último Pag.</th>
                <th className="text-left px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Nenhum aluno encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((aluno) => (
                  <tr key={aluno.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{aluno.full_name || '—'}</p>
                      <p className="text-slate-400 text-xs">{aluno.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          STATUS_BADGE[aluno.status || 'inativo'] || STATUS_BADGE.inativo
                        }`}
                      >
                        {aluno.status || 'inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {aluno.subscription?.plan_name ? (
                        <>
                          <p>{aluno.subscription.plan_name}</p>
                          {aluno.subscription.monthly_value && (
                            <p className="text-xs text-slate-400">
                              R$ {Number(aluno.subscription.monthly_value).toFixed(2)}/mês
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-500 text-xs">Sem plano</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {aluno.subscription?.stripe_subscription_id ? (
                        <div>
                          <span className="text-green-400 text-xs">✅ Ativa</span>
                          {aluno.subscription.current_period_end && (
                            <p className="text-slate-500 text-xs">
                              Vence:{' '}
                              {new Date(aluno.subscription.current_period_end).toLocaleDateString(
                                'pt-BR'
                              )}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">Sem assinatura Stripe</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {aluno.lastPayment ? (
                        <div>
                          <p
                            className={
                              aluno.lastPayment.status === 'paid'
                                ? 'text-green-400 text-xs'
                                : 'text-yellow-400 text-xs'
                            }
                          >
                            {aluno.lastPayment.status === 'paid' ? '✅' : '⏳'} R${' '}
                            {Number(aluno.lastPayment.amount).toFixed(2)}
                          </p>
                          <p className="text-slate-500 text-xs">
                            {new Date(aluno.lastPayment.payment_date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">Sem pagamentos</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {/* Dar baixa manual */}
                        {(aluno.status === 'inadimplente' || aluno.status === 'pendente') && (
                          <button
                            onClick={() =>
                              handleDarBaixa(
                                aluno.id,
                                aluno.subscription?.monthly_value || 0
                              )
                            }
                            disabled={markingPaid === aluno.id}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-2 py-1 rounded-lg text-xs"
                          >
                            {markingPaid === aluno.id ? '...' : '✅ Dar baixa'}
                          </button>
                        )}
                        {/* WhatsApp */}
                        {aluno.phone && (
                          <a
                            href={`https://wa.me/55${aluno.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                              `Olá ${aluno.full_name?.split(' ')[0] || ''}! Passando para verificar sobre sua mensalidade na Daimach.Movement.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded-lg text-xs"
                          >
                            WhatsApp
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
