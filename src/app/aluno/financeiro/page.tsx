'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

interface Plan {
  id: number;
  name: string;
  price: number;
  stripe_price_id: string | null;
  sessions_per_week: number | null;
}

interface Subscription {
  status: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
}

interface PaymentHistory {
  id: number;
  amount: number;
  status: string;
  payment_date: string;
  reference_month: string | null;
  payment_method: string | null;
}

interface UserInfo {
  plan_id: number | null;
  monthly_value: number | null;
  status: 'ativo' | 'inativo' | 'inadimplente';
}

const STRIPE_CONFIGURED = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY !== 'pk_live_...';

export default function AlunoFinanceiroPage() {
  const { user, loading: authLoading } = usePilatesAuth();
  const searchParams = useSearchParams();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const supabase = getSupabaseBrowserClient();

  const checkoutResult = searchParams.get('checkout');

  useEffect(() => {
    if (!authLoading && user) {
      Promise.all([
        supabase.from('users_pilates').select('plan_id, monthly_value, status').eq('id', user.id).maybeSingle(),
        supabase.from('subscriptions_pilates').select('status, stripe_subscription_id, current_period_end').eq('user_id', user.id).maybeSingle(),
        supabase.from('payment_history').select('*').eq('user_id', user.id).order('payment_date', { ascending: false }).limit(12),
      ]).then(async ([userRes, subRes, paymentsRes]) => {
        if (userRes.data) {
          setUserInfo(userRes.data as UserInfo);
          if (userRes.data.plan_id) {
            const { data: planData } = await supabase
              .from('plans_pilates')
              .select('*')
              .eq('id', userRes.data.plan_id)
              .maybeSingle();
            if (planData) setPlan(planData as Plan);
          }
        }
        if (subRes.data) setSubscription(subRes.data as Subscription);
        if (paymentsRes.data) setPayments(paymentsRes.data as PaymentHistory[]);
        setLoading(false);
      });
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user]);

  const handleCheckout = async () => {
    if (!user || !plan?.stripe_price_id) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, price_id: plan.stripe_price_id }),
      });
      const { url, error } = await res.json();
      if (error) {
        alert(error);
      } else if (url) {
        window.location.href = url;
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePortal = async () => {
    if (!user) return;
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      const { url, error } = await res.json();
      if (error) {
        alert(error);
      } else if (url) {
        window.location.href = url;
      }
    } finally {
      setPortalLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statusMap = {
    ativo: { label: 'Ativo', color: 'bg-green-600/20 text-green-400' },
    inativo: { label: 'Inativo', color: 'bg-slate-600/20 text-slate-400' },
    inadimplente: { label: 'Inadimplente', color: 'bg-red-600/20 text-red-400' },
  };
  const statusCfg = statusMap[userInfo?.status ?? 'inativo'];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <h1 className="text-2xl font-bold text-white">Meu Financeiro</h1>

      {/* Checkout result banner */}
      {checkoutResult === 'success' && (
        <div className="bg-green-600/10 border border-green-500/30 rounded-xl p-4 text-green-400">
          ✅ Pagamento realizado com sucesso! Seu plano foi ativado.
        </div>
      )}
      {checkoutResult === 'cancel' && (
        <div className="bg-yellow-600/10 border border-yellow-500/30 rounded-xl p-4 text-yellow-400">
          ⚠️ Pagamento cancelado. Você pode tentar novamente quando quiser.
        </div>
      )}

      {/* Status geral */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-green-400 font-semibold">Situação</h2>
          <span className={`text-xs px-3 py-1 rounded-full ${statusCfg.color}`}>{statusCfg.label}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-700/50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Plano</p>
            <p className="text-white font-medium text-sm">{plan?.name || 'Sem plano'}</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Mensalidade</p>
            <p className="text-white font-medium text-sm">
              {userInfo?.monthly_value != null
                ? `R$ ${Number(userInfo.monthly_value).toFixed(2)}`
                : plan?.price != null
                ? `R$ ${Number(plan.price).toFixed(2)}`
                : '—'}
            </p>
          </div>
        </div>

        {subscription && (
          <div className="mt-3 text-xs text-slate-400">
            {subscription.status === 'active' && subscription.current_period_end && (
              <p>
                Assinatura Stripe ativa até:{' '}
                {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Ações Stripe */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-3">
        <h2 className="text-green-400 font-semibold">💳 Pagamento Online</h2>

        {!STRIPE_CONFIGURED ? (
          <div className="bg-yellow-600/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-yellow-400 text-sm">
              ⚠️ Pagamento online ainda não configurado. Administrador deve configurar as chaves Stripe.
            </p>
            <p className="text-yellow-400/60 text-xs mt-1">Ver PENDENCIAS_WILLIAN.md</p>
          </div>
        ) : (
          <div className="space-y-3">
            {plan?.stripe_price_id && userInfo?.status !== 'ativo' && (
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {checkoutLoading ? 'Redirecionando...' : '💳 Assinar / Pagar Mensalidade'}
              </button>
            )}

            {subscription?.stripe_subscription_id && (
              <button
                onClick={handlePortal}
                disabled={portalLoading}
                className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors"
              >
                {portalLoading ? 'Abrindo...' : '⚙️ Gerenciar Assinatura (trocar cartão, cancelar)'}
              </button>
            )}

            {!plan?.stripe_price_id && (
              <p className="text-slate-500 text-sm text-center">
                Seu plano ainda não tem um preço configurado no Stripe. Entre em contato com o estúdio.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Histórico de pagamentos */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-green-400 font-semibold">📄 Histórico de Pagamentos</h2>
        </div>
        {payments.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">Nenhum pagamento registrado ainda.</div>
        ) : (
          <div className="divide-y divide-slate-700">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-white text-sm">
                    {p.reference_month
                      ? `${p.reference_month.slice(5, 7)}/${p.reference_month.slice(0, 4)}`
                      : new Date(p.payment_date).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-slate-400 text-xs">{p.payment_method || 'manual'}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium text-sm">R$ {Number(p.amount).toFixed(2)}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      p.status === 'paid' ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'
                    }`}
                  >
                    {p.status === 'paid' ? '✅ Pago' : '⏳ Pendente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
