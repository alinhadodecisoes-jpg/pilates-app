'use client';

import { useState, useEffect } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

interface NotifPrefs {
  aula_lembrete: boolean;
  mensalidade: boolean;
  reposicao: boolean;
  horas_antes_aula: number;
}

const DEFAULT_PREFS: NotifPrefs = {
  aula_lembrete: true,
  mensalidade: true,
  reposicao: true,
  horas_antes_aula: 12,
};

export default function NotificacoesPage() {
  const { user, loading: authLoading } = usePilatesAuth();
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [pushStatus, setPushStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'>('idle');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (!authLoading && user) {
      supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setPrefs({
              aula_lembrete: data.aula_lembrete ?? true,
              mensalidade: data.mensalidade ?? true,
              reposicao: data.reposicao ?? true,
              horas_antes_aula: data.horas_antes_aula ?? 12,
            });
          }
          setLoading(false);
        });

      // Check current push permission
      if (typeof Notification !== 'undefined') {
        if (Notification.permission === 'granted') setPushStatus('granted');
        else if (Notification.permission === 'denied') setPushStatus('denied');
        else setPushStatus('idle');
      } else {
        setPushStatus('unsupported');
      }
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user]);

  const requestPushPermission = async () => {
    if (!user) return;
    setPushStatus('requesting');
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Register service worker and subscribe
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const registration = await navigator.serviceWorker.ready;
          const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

          if (vapidPublicKey) {
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as ArrayBuffer,
            });

            const subJson = subscription.toJSON();
            await fetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: user.id,
                endpoint: subJson.endpoint,
                p256dh: subJson.keys?.p256dh,
                auth: subJson.keys?.auth,
              }),
            });
          }
        }
        setPushStatus('granted');
      } else {
        setPushStatus('denied');
      }
    } catch (e) {
      console.error('Erro ao solicitar permissão:', e);
      setPushStatus('denied');
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert(
          {
            user_id: user.id,
            aula_lembrete: prefs.aula_lembrete,
            mensalidade: prefs.mensalidade,
            reposicao: prefs.reposicao,
            horas_antes_aula: prefs.horas_antes_aula,
          },
          { onConflict: 'user_id' }
        );
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Notificações</h1>
        {saved && <span className="text-green-400 text-sm">✅ Salvo!</span>}
      </div>

      {/* Push permission */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-3">
        <h2 className="text-green-400 font-semibold">🔔 Notificações Push</h2>
        {pushStatus === 'unsupported' ? (
          <p className="text-slate-400 text-sm">Seu navegador não suporta notificações push.</p>
        ) : pushStatus === 'granted' ? (
          <p className="text-green-400 text-sm flex items-center gap-2">
            <span>✅</span> Notificações push ativadas neste dispositivo.
          </p>
        ) : pushStatus === 'denied' ? (
          <div>
            <p className="text-red-400 text-sm">❌ Permissão negada. Para reativar, vá em Configurações do navegador.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-slate-300 text-sm">
              Receba lembretes de aulas, mensalidades e reposições diretamente no seu dispositivo.
            </p>
            <button
              onClick={requestPushPermission}
              disabled={pushStatus === 'requesting'}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-ink px-4 py-2 rounded-lg text-sm font-medium"
            >
              {pushStatus === 'requesting' ? 'Aguardando...' : 'Ativar Notificações Push'}
            </button>
          </div>
        )}
      </div>

      {/* Preferências */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
        <h2 className="text-green-400 font-semibold">⚙️ O que desejo receber</h2>

        {[
          { key: 'aula_lembrete', label: 'Lembrete de aula', desc: 'Aviso antes das suas aulas agendadas' },
          { key: 'mensalidade', label: 'Aviso de mensalidade', desc: 'Lembrete de pagamento pendente' },
          { key: 'reposicao', label: 'Atualização de reposição', desc: 'Aprovação ou recusa de reposição' },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-ink text-sm font-medium">{label}</p>
              <p className="text-slate-400 text-xs">{desc}</p>
            </div>
            <button
              onClick={() => setPrefs({ ...prefs, [key]: !prefs[key as keyof NotifPrefs] })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                prefs[key as keyof NotifPrefs] ? 'bg-green-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  prefs[key as keyof NotifPrefs] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}

        {/* Horas antes da aula */}
        <div className="pt-2 border-t border-slate-700">
          <label className="block text-sm text-ink font-medium mb-2">
            Avisar quantas horas antes da aula?
          </label>
          <select
            value={prefs.horas_antes_aula}
            onChange={(e) => setPrefs({ ...prefs, horas_antes_aula: Number(e.target.value) })}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-ink text-sm w-full"
          >
            <option value={1}>1 hora antes</option>
            <option value={2}>2 horas antes</option>
            <option value={6}>6 horas antes</option>
            <option value={12}>12 horas antes</option>
            <option value={24}>1 dia antes</option>
            <option value={48}>2 dias antes</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-ink font-semibold py-3 rounded-xl"
      >
        {saving ? 'Salvando...' : 'Salvar Preferências'}
      </button>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
