import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseServerClient } from '@/lib/supabase-server';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function POST(req: NextRequest) {
  if (!stripeSecretKey || stripeSecretKey === 'sk_live_...') {
    return NextResponse.json({ error: 'Stripe não configurado. Ver PENDENCIAS_WILLIAN.md' }, { status: 503 });
  }

  try {
    const { user_id, return_url } = await req.json();

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2026-02-25.clover' as Stripe.LatestApiVersion });
    const supabase = getSupabaseServerClient();

    const { data: sub } = await supabase
      .from('subscriptions_pilates')
      .select('stripe_customer_id')
      .eq('user_id', user_id)
      .maybeSingle();

    if (!sub?.stripe_customer_id) {
      return NextResponse.json({ error: 'Cliente Stripe não encontrado para este usuário' }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: return_url || `${baseUrl}/aluno/financeiro`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Erro Stripe portal:', err);
    return NextResponse.json({ error: 'Erro ao abrir portal' }, { status: 500 });
  }
}
