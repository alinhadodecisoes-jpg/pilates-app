'use client';
import { useEffect, useState } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';

interface AlunoFinanceiro {
  id: string;
  full_name: string | null;
  email: string | null;
  status: string | null;
  payment_status?: string | null;
  is_overdue?: boolean;
  plan_name?: string | null;
  monthly_value?: number | null;
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
  const [pendentes, setPendentes] = useState<Array<{ id: number; amount: number | null; reference_month: string | null; users_pilates?: { full_name: string | null; email: string | null } | null }>>([]);

  const loadPendentes = async () => {
    try {
      const res = await fetch('/api/pilates/financeiro/confirmacoes');
      if (res.ok) { const d = await res.json(); setPendentes(d.pendentes ?? []); }
    } catch { /* tabela pode não existir ainda */ }
  };
  useEffect(() => { loadPendentes(); }, []);

  const handleConfirmar = async (id: number, acao: 'confirm' | 'reject') => {
    await fetch('/api/pilates/financeiro/confirmacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: acao, id }),
    });
    await loadPendentes();
    if (acao === 'confirm') window.location.reload();
  };

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
    await fetch('/api/pilates/financeiro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount }),
    });
    setMarkingPaid(null);
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

  const handleExportCSV = () => {
    const header = ['Nome', 'Email', 'Telefone', 'Status', 'Mensalidade', 'Plano', 'Último Pagamento'];
    const lines = alunos.map((a: any) => [
      a.full_name ?? '',
      a.email ?? '',
      a.phone ?? '',
      a.status ?? '',
      a.subscription?.monthly_value ?? a.monthly_value ?? '',
      a.subscription?.plan_name ?? '',
      a.lastPayment?.payment_date ?? '',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';'));
    const csv = '﻿' + [header.join(';'), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeiro-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Gestão Financeira</h1>
        <button
          onClick={handleExportCSV}
          className="bg-slate-700 hover:bg-slate-600 text-ink px-4 py-2 rounded-xl text-sm font-medium"
        >
          ⬇️ Exportar CSV
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-green-600 text-ink p-5 rounded-xl">
          <p className="text-xs opacity-80">Receita (30 dias)</p>
          <p className="text-2xl font-bold">R$ {(summary?.totalRevenue || 0).toFixed(2)}</p>
        </div>
        <div className="bg-yellow-600 text-white p-5 rounded-xl">
          <p className="text-xs opacity-80">Pendente</p>
          <p className="text-2xl font-bold">R$ {(summary?.totalPending || 0).toFixed(2)}</p>
        </div>
        <div className="bg-slate-700 text-ink p-5 rounded-xl">
          <p className="text-xs opacity-80">Alunos ativos</p>
          <p className="text-2xl font-bold">{summary?.alunosAtivos || 0}</p>
        </div>
        <div className="bg-red-700 text-white p-5 rounded-xl">
          <p className="text-xs opacity-80">Inadimplentes</p>
          <p className="text-2xl font-bold">{summary?.inadimplentes || 0}</p>
        </div>
      </div>

      {/* Pagamentos informados (aguardando confirmação) */}
      <div className="bg-yellow-900/10 border border-yellow-700/40 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-yellow-700/30">
          <h2 className="text-yellow-400 font-semibold">⏳ Confirmações Pendentes ({pendentes.length})</h2>
        </div>
        {pendentes.length === 0 ? (
          <div className="px-5 py-4 text-slate-500 text-sm">Nenhum pagamento aguardando confirmação.</div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {pendentes.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3 gap-4">
                <div>
                  <p className="text-ink text-sm font-medium">{p.users_pilates?.full_name || p.users_pilates?.email || '—'}</p>
                  <p className="text-slate-400 text-xs">
                    {p.amount != null ? `R$ ${Number(p.amount).toFixed(2)}` : 'valor não informado'}
                    {p.reference_month ? ` · ${p.reference_month}` : ''}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleConfirmar(p.id, 'confirm')} className="text-xs bg-green-600 hover:bg-green-700 text-ink px-3 py-1.5 rounded-lg">✅ Confirmar</button>
                  <button onClick={() => handleConfirmar(p.id, 'reject')} className="text-xs bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1.5 rounded-lg">✕ Rejeitar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar aluno..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-ink rounded-xl px-4 py-2 text-sm flex-1 min-w-[200px]"
        />
        {['todos', 'ativo', 'inadimplente', 'inativo', 'pendente'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
              filterStatus === s
                ? 'bg-green-600 text-ink'
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
                      <p className="text-ink font-medium">{aluno.full_name || '—'}</p>
                      <p className="text-slate-400 text-xs">{aluno.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const efetivo = aluno.is_overdue ? 'inadimplente' : (aluno.status || 'inativo');
                        return (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                              STATUS_BADGE[efetivo] || STATUS_BADGE.inativo
                            }`}
                          >
                            {efetivo}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {aluno.plan_name || aluno.monthly_value != null ? (
                        <>
                          <p>{aluno.plan_name || 'Plano avulso'}</p>
                          {aluno.monthly_value != null && (
                            <p className="text-xs text-slate-400">
                              R$ {Number(aluno.monthly_value).toFixed(2)}/mês
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
                            {new Date(aluno.lastPayment.payment_date.slice(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">Sem pagamentos</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {/* Dar baixa manual */}
                        {(aluno.is_overdue || aluno.status === 'inadimplente' || aluno.status === 'pendente' || aluno.payment_status === 'pendente') && (
                          <button
                            onClick={() =>
                              handleDarBaixa(
                                aluno.id,
                                aluno.monthly_value || aluno.subscription?.monthly_value || 0
                              )
                            }
                            disabled={markingPaid === aluno.id}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-ink px-2 py-1 rounded-lg text-xs"
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
                            className="bg-green-700 hover:bg-green-600 text-ink px-2 py-1 rounded-lg text-xs"
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
