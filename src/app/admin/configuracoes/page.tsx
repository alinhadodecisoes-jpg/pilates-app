'use client';

import { useState, useEffect } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { Button } from '@/components/pilates/Button';

const FIELDS: { key: string; label: string; placeholder?: string; section: string }[] = [
  { key: 'studio_name', label: 'Nome do estúdio', section: 'Dados do estúdio' },
  { key: 'studio_whatsapp', label: 'WhatsApp (só números, com DDI)', placeholder: '5521763000055', section: 'Dados do estúdio' },
  { key: 'studio_instagram', label: 'Instagram', placeholder: '@daimach.movement', section: 'Dados do estúdio' },
  { key: 'studio_email', label: 'Email', placeholder: 'Daimach.movement@gmail.com', section: 'Dados do estúdio' },
  { key: 'pix_key', label: 'Chave PIX', placeholder: 'CPF, email, telefone ou chave aleatória', section: 'Pagamentos (PIX)' },
  { key: 'pix_name', label: 'Nome do beneficiário', placeholder: 'Daiana Alves da Silva', section: 'Pagamentos (PIX)' },
  { key: 'payment_deadline_days', label: 'Prazo de confirmação (dias)', placeholder: '5', section: 'Pagamentos (PIX)' },
];

export default function ConfiguracoesPage() {
  const { loading: authLoading } = usePilatesAuth();
  const [cfg, setCfg] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [ready, setReady] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      fetch('/api/pilates/config')
        .then((r) => r.json())
        .then((d) => { setCfg(d.config ?? {}); setReady(d.ready !== false); })
        .finally(() => setLoading(false));
    }
  }, [authLoading]);

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/pilates/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: cfg }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Erro');
      setMsg('✅ Configurações salvas!');
    } catch (e) {
      setMsg('⚠️ ' + (e instanceof Error ? e.message : 'Erro'));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const sections = [...new Set(FIELDS.map((f) => f.section))];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-ink">Configurações</h1>

      {!ready && (
        <p className="text-sm text-yellow-400 bg-yellow-900/20 border border-yellow-800 rounded-lg px-4 py-3">
          ⚠️ A tabela <code>studio_config</code> ainda não existe no banco. Rode o SQL e recarregue para salvar.
        </p>
      )}

      {sections.map((sec) => (
        <div key={sec} className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
          <h2 className="text-green-400 font-semibold">{sec}</h2>
          {FIELDS.filter((f) => f.section === sec).map((f) => (
            <div key={f.key}>
              <label className="block text-sm text-slate-400 mb-1">{f.label}</label>
              <input
                value={cfg[f.key] ?? ''}
                onChange={(e) => setCfg({ ...cfg, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          ))}
        </div>
      ))}

      <div className="flex items-center gap-4">
        <Button variant="primary" size="md" onClick={save} loading={saving}>Salvar Configurações</Button>
        {msg && <span className="text-sm text-slate-300">{msg}</span>}
      </div>
    </div>
  );
}
