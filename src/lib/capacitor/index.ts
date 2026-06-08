'use client';

import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { initPushNotifications } from './push';

let initialized = false;

export async function initCapacitor() {
  if (initialized) return;
  if (!Capacitor.isNativePlatform()) return;

  console.log('[DAIMACH] Plataforma:', Capacitor.getPlatform());

  await initPushNotifications();

  // Deep links e share intent
  App.addListener('appUrlOpen', (data) => {
    const url = data.url;
    if (url) {
      console.log('[DAIMACH] appUrlOpen:', url);
      // Deep link daimach://open/... ou https://www.daimach.com.br/...
      try {
        const parsed = new URL(url);
        const path = parsed.pathname || parsed.host || '';

        // Verificar se é share intent (conteúdo compartilhado de outros apps)
        const sharedText = parsed.searchParams.get('text') || parsed.searchParams.get('title') || '';
        if (sharedText) {
          window.location.href = `/chat?shared=${encodeURIComponent(sharedText)}`;
          return;
        }

        if (path && path !== '/' && path !== 'open') {
          const cleanPath = path.startsWith('/') ? path : `/${path}`;
          window.location.href = cleanPath;
          return;
        }
      } catch (_) {
        // URL inválida, tratar como conteúdo compartilhado
      }
      // Share intent — redirecionar pro chat com conteúdo
      window.location.href = `/chat?shared=${encodeURIComponent(url)}`;
    }
  });

  // Foreground service desativado: plugin capawesome só suporta
  // serviceType Location/Microphone, incompatível com targetSdk 36.
  // await startDaimachService();

  initialized = true;
  console.log('[DAIMACH] Capacitor inicializado com push FCM + deep links');
}
