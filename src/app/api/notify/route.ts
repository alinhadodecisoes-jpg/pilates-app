import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { Resend } from 'resend';

// TODO: Configurar VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY e RESEND_API_KEY no .env.local
// Ver PENDENCIAS_WILLIAN.md para as variáveis necessárias

export async function POST(req: NextRequest) {
  try {
    const { user_id, type, title, body, channels = ['push'] } = await req.json();

    if (!user_id || !title) {
      return NextResponse.json({ error: 'user_id e title são obrigatórios' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // Verificar preferências do usuário
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    if (type === 'aula_lembrete' && prefs && !prefs.aula_lembrete) {
      return NextResponse.json({ skipped: true, reason: 'aula_lembrete desativado' });
    }
    if (type === 'mensalidade' && prefs && !prefs.mensalidade) {
      return NextResponse.json({ skipped: true, reason: 'mensalidade desativado' });
    }
    if (type === 'reposicao' && prefs && !prefs.reposicao) {
      return NextResponse.json({ skipped: true, reason: 'reposicao desativado' });
    }

    const results: Record<string, string> = {};

    // Push web-push
    if (channels.includes('push')) {
      const vapidPublic = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

      if (vapidPublic && vapidPrivate) {
        try {
          const { data: subs } = await supabase
            .from('push_subscriptions')
            .select('endpoint, keys_p256dh, keys_auth')
            .eq('user_id', user_id)
            .eq('platform', 'web');

          if (subs && subs.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const webpush = await import('web-push') as any;
            const webPush = webpush.default ?? webpush;
            webPush.setVapidDetails(
              'mailto:contato@daimach.com.br',
              vapidPublic,
              vapidPrivate
            );

            const payload = JSON.stringify({ title, body: body || '', url: '/aluno/dashboard' });
            let sent = 0;
            for (const sub of subs) {
              if (!sub.endpoint) continue;
              try {
                await webPush.sendNotification(
                  { endpoint: sub.endpoint, keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth } },
                  payload
                );
                sent++;
              } catch (e: unknown) {
                const err = e as { statusCode?: number };
                if (err.statusCode === 410 || err.statusCode === 404) {
                  await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
                }
              }
            }
            results.push = `${sent} enviado(s)`;
          } else {
            results.push = 'sem subscriptions';
          }
        } catch (e) {
          results.push = `erro: ${e}`;
        }
      } else {
        results.push = 'VAPID não configurado';
      }
    }

    // Email via Resend
    if (channels.includes('email')) {
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey && resendKey !== 're_...') {
        try {
          const { data: userRow } = await supabase
            .from('users_pilates')
            .select('email, full_name')
            .eq('id', user_id)
            .maybeSingle();

          if (userRow?.email) {
            const resend = new Resend(resendKey);
            await resend.emails.send({
              from: 'Daimach.Movement <noreply@daimach.com.br>',
              to: userRow.email,
              subject: title,
              html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #22c55e;">${title}</h2>
                <p style="color: #374151;">${body || ''}</p>
                <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="color: #9ca3af; font-size: 12px;">Daimach.Movement — Seu estúdio de Pilates</p>
              </div>`,
            });
            results.email = 'enviado';
          }
        } catch (e) {
          results.email = `erro: ${e}`;
        }
      } else {
        results.email = 'RESEND_API_KEY não configurado';
      }
    }

    // Registrar no log
    await supabase.from('notifications_log').insert({
      user_id,
      type: type ?? 'custom',
      title,
      body: body ?? null,
      channel: channels.join(','),
      status: 'sent',
    });

    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error('Erro /api/notify:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
