'use client';
import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';

export default function FinanceiroAdmin() {
  const { loading: authLoading } = usePilatesAuth();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const fetchFinancial = async () => {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: recentPayments } = await supabase
          .from('payment_history')
          .select('amount')
          .eq('status', 'paid')
          .gte('payment_date', thirtyDaysAgo.toISOString().split('T')[0]);

        const totalRevenue = recentPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        const { data: pending } = await supabase
          .from('payment_history')
          .select('amount')
          .eq('status', 'pending');

        const totalPending = pending?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        setSummary({ totalRevenue, totalPending });
      } catch (err) {
        console.error('[ERROR]:', err);
      }
      setLoading(false);
    };

    if (!authLoading) fetchFinancial();
  }, [authLoading, supabase]);

  if (authLoading || loading) return <div>Loading...</div>;

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-50">
      <h1 className="text-2xl font-bold mb-6">💰 Gestão Financeira</h1>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-green-600 text-white p-6 rounded">
          <p className="text-sm">Receita (30 dias)</p>
          <p className="text-3xl font-bold">R\$ {(summary?.totalRevenue || 0).toFixed(2)}</p>
        </div>
        <div className="bg-yellow-600 text-white p-6 rounded">
          <p className="text-sm">Pendente</p>
          <p className="text-3xl font-bold">R\$ {(summary?.totalPending || 0).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
