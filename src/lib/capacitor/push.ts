import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export async function initPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const result = await PushNotifications.requestPermissions();
    if (result.receive !== 'granted') {
      console.log('[DAIMACH] Push permission denied');
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', async (token) => {
      console.log('[DAIMACH] FCM Token:', token.value);
      try {
        await fetch('/api/push/register-fcm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: token.value,
            platform: 'android',
          }),
        });
      } catch (err) {
        console.error('[DAIMACH] Erro ao registrar FCM:', err);
      }
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[DAIMACH] Push recebido:', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[DAIMACH] Push clicado:', action);
      const data = action.notification.data;
      if (data?.url) {
        window.location.href = data.url;
      }
    });
  } catch (err) {
    console.error('[DAIMACH] Erro push:', err);
  }
}
