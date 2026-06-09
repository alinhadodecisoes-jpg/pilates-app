import webPush from 'web-push';

webPush.setVapidDetails(
  'mailto:contato@pilates.com.br',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
  process.env.VAPID_PRIVATE_KEY ?? ''
);

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

/**
 * Envia uma notificação push para uma subscription específica.
 */
export async function sendPushNotification(
  subscription: webPush.PushSubscription,
  payload: PushPayload
): Promise<void> {
  try {
    await webPush.sendNotification(subscription, JSON.stringify(payload));
  } catch (error) {
    console.error('Erro ao enviar push notification:', error);
    throw error;
  }
}

/**
 * Envia push para todos os alunos de uma turma.
 * Busca as subscriptions no banco e dispara em paralelo.
 */
export async function notifyClass(
  supabase: import('@supabase/supabase-js').SupabaseClient,
  classId: number,
  payload: PushPayload
): Promise<void> {
  // Busca alunos matriculados na turma
  const { data: enrollments } = await supabase
    .from('enrollments_pilates')
    .select('user_id')
    .eq('class_id', classId)
    .eq('is_active', true);

  if (!enrollments || enrollments.length === 0) return;

  const userIds = enrollments.map((e: { user_id: string }) => e.user_id);

  // Busca push subscriptions de cada aluno
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .in('user_id', userIds);

  if (!subscriptions) return;

  await Promise.allSettled(
    subscriptions.map((row: { subscription: webPush.PushSubscription }) =>
      sendPushNotification(row.subscription, payload)
    )
  );
}

/**
 * Notifica um único usuário.
 */
export async function notifyUser(
  supabase: import('@supabase/supabase-js').SupabaseClient,
  userId: string,
  payload: PushPayload
): Promise<void> {
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', userId);

  if (!subscriptions) return;

  await Promise.allSettled(
    subscriptions.map((row: { subscription: webPush.PushSubscription }) =>
      sendPushNotification(row.subscription, payload)
    )
  );
}
