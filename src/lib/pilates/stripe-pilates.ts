import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

/**
 * Cria um cliente Stripe se ainda não existir.
 */
export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  // Busca na tabela subscriptions_pilates
  const { createServerClient } = await import('@supabase/ssr');
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data } = await supabase
    .from('subscriptions_pilates')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  if (data?.stripe_customer_id) return data.stripe_customer_id;

  const customer = await stripe.customers.create({ email, metadata: { supabase_user_id: userId } });
  return customer.id;
}

/**
 * Cria uma sessão de checkout para um plano Pilates.
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  return session;
}

/**
 * Cancela uma assinatura no Stripe.
 */
export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Processa eventos do webhook Stripe.
 */
export async function constructWebhookEvent(body: string, signature: string) {
  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}

export { stripe };
