import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseServerClient } from '@/lib/supabase-server';

// TODO: Configurar STRIPE_WEBHOOK_SECRET no .env.local
// Webhook URL (após deploy): https://<domínio>/api/stripe/webhook

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!stripeSecretKey || stripeSecretKey === 'sk_live_...') {
    return NextResponse.json({ error: 'Stripe não configurado' }, { status: 503 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Sem assinatura Stripe' }, { status: 400 });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2026-02-25.clover' as Stripe.LatestApiVersion });
  let event: Stripe.Event;

  try {
    if (webhookSecret && webhookSecret !== 'whsec_...') {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // Em desenvolvimento sem webhook secret, parse direto
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    console.error('Erro ao verificar webhook:', err);
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        // Find user by Stripe customer ID
        const { data: sub } = await supabase
          .from('subscriptions_pilates')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (sub?.user_id) {
          // Get subscription details
          const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const periodEndTs = (stripeSub as any).current_period_end as number | undefined;
          const periodEnd = periodEndTs ? new Date(periodEndTs * 1000).toISOString().slice(0, 10) : null;

          // Update subscription record
          await supabase.from('subscriptions_pilates').upsert(
            {
              user_id: sub.user_id,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              status: 'active',
              current_period_end: periodEnd,
            },
            { onConflict: 'user_id' }
          );

          // Mark user as active
          await supabase
            .from('users_pilates')
            .update({ status: 'ativo' })
            .eq('id', sub.user_id);

          // Record payment
          await supabase.from('payment_history').insert({
            user_id: sub.user_id,
            amount: (session.amount_total ?? 0) / 100,
            status: 'paid',
            payment_date: new Date().toISOString().slice(0, 10),
            reference_month: new Date().toISOString().slice(0, 7),
            payment_method: 'stripe',
            notes: `Checkout session: ${session.id}`,
          });
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: sub } = await supabase
          .from('subscriptions_pilates')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (sub?.user_id) {
          // Update user status to active
          await supabase.from('users_pilates').update({ status: 'ativo' }).eq('id', sub.user_id);

          // Record payment
          const alreadyExists = await supabase
            .from('payment_history')
            .select('id')
            .eq('user_id', sub.user_id)
            .eq('notes', `Invoice: ${invoice.id}`)
            .maybeSingle();

          if (!alreadyExists.data) {
            await supabase.from('payment_history').insert({
              user_id: sub.user_id,
              amount: (invoice.amount_paid ?? 0) / 100,
              status: 'paid',
              payment_date: new Date().toISOString().slice(0, 10),
              reference_month: new Date().toISOString().slice(0, 7),
              payment_method: 'stripe',
              notes: `Invoice: ${invoice.id}`,
            });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: sub } = await supabase
          .from('subscriptions_pilates')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (sub?.user_id) {
          // Mark user as inadimplente
          await supabase
            .from('users_pilates')
            .update({ status: 'inadimplente' })
            .eq('id', sub.user_id);

          // Send notification
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
          await fetch(`${baseUrl}/api/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: sub.user_id,
              type: 'mensalidade',
              title: '💳 Falha no pagamento',
              body: 'Houve uma falha ao processar seu pagamento. Atualize seus dados de cartão.',
              channels: ['push', 'email'],
            }),
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object as Stripe.Subscription;
        const customerId = stripeSub.customer as string;

        const { data: sub } = await supabase
          .from('subscriptions_pilates')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (sub?.user_id) {
          await supabase.from('subscriptions_pilates').update({ status: 'canceled' }).eq('user_id', sub.user_id);
          await supabase.from('users_pilates').update({ status: 'inativo' }).eq('id', sub.user_id);
        }
        break;
      }

      default:
        // Log unhandled events
        console.log(`Evento Stripe não tratado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Erro ao processar evento Stripe:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
