import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseServerClient } from '@/lib/supabase-server';

// TODO: Configurar STRIPE_SECRET_KEY e NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY no .env.local
// Ver PENDENCIAS_WILLIAN.md

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function POST(req: NextRequest) {
  if (!stripeSecretKey || stripeSecretKey === 'sk_live_...') {
    return NextResponse.json({ error: 'Stripe não configurado. Ver PENDENCIAS_WILLIAN.md' }, { status: 503 });
  }

  try {
    const { user_id, price_id, success_url, cancel_url } = await req.json();

    if (!user_id || !price_id) {
      return NextResponse.json({ error: 'user_id e price_id são obrigatórios' }, { status: 400 });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2026-02-25.clover' as Stripe.LatestApiVersion });
    const supabase = getSupabaseServerClient();

    // Get user email
    const { data: userRow } = await supabase
      .from('users_pilates')
      .select('email, full_name')
      .eq('id', user_id)
      .maybeSingle();

    if (!userRow?.email) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Get or create Stripe customer
    let customerId: string;
    const { data: sub } = await supabase
      .from('subscriptions_pilates')
      .select('stripe_customer_id')
      .eq('user_id', user_id)
      .maybeSingle();

    if (sub?.stripe_customer_id) {
      customerId = sub.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: userRow.email,
        name: userRow.full_name ?? undefined,
        metadata: { supabase_user_id: user_id },
      });
      customerId = customer.id;

      // Upsert subscription record
      await supabase.from('subscriptions_pilates').upsert(
        { user_id, stripe_customer_id: customerId },
        { onConflict: 'user_id' }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: price_id, quantity: 1 }],
      success_url: success_url || `${baseUrl}/aluno/financeiro?checkout=success`,
      cancel_url: cancel_url || `${baseUrl}/aluno/financeiro?checkout=cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Erro Stripe checkout:', err);
    return NextResponse.json({ error: 'Erro ao criar checkout' }, { status: 500 });
  }
}
