import { Capacitor } from '@capacitor/core';

export async function startDaimachService() {
  if (Capacitor.getPlatform() !== 'android') return;

  try {
    const { ForegroundService } = await import(
      '@capawesome-team/capacitor-android-foreground-service'
    );

    await ForegroundService.startForegroundService({
      id: 1,
      title: 'DAIMACH ativo',
      body: 'Daimach está pronto para ajudar',
      smallIcon: 'ic_stat_daimach',
      silent: false,
    });

    console.log('[DAIMACH] Foreground service iniciado');
  } catch (err) {
    console.error('[DAIMACH] Erro foreground:', err);
  }
}

export async function stopDaimachService() {
  if (Capacitor.getPlatform() !== 'android') return;

  try {
    const { ForegroundService } = await import(
      '@capawesome-team/capacitor-android-foreground-service'
    );
    await ForegroundService.stopForegroundService();
  } catch (err) {
    console.error('[DAIMACH] Erro ao parar foreground:', err);
  }
}
