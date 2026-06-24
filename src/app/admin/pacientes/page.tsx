'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { updateAluno } from '@/lib/pilates/pilates-db';
import { Modal } from '@/components/pilates/Modal';
import { Button } from '@/components/pilates/Button';

interface Patient {
  id: string;
  full_name: string | null;
  email: string | null;
  phone?: string | null;
  tipo?: 'pilates' | 'fisio' | 'ambos';
}

export default function PacientesPage() {
  const { loading: authLoading } = usePilatesAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', tambem_pilates: false });

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/pilates/fisioterapia');
      if (res.ok) {
        const data = await res.json();
        // só pacientes de fisioterapia (fisio ou ambos)
        setPatients((data.patients ?? []).filter((p: Patient) => p.tipo === 'fisio' || p.tipo === 'ambos'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  const handleCreate = async () => {
    if (!form.full_name) { setError('Nome é obrigatório.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/pilates/fisioterapia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_patient',
          full_name: form.full_name,
          phone: form.phone || null,
          email: form.email || null,
          create_login: false,
          is_physio_patient: true,
          is_pilates_student: form.tambem_pilates,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Erro');
      setShowCreate(false);
      setForm({ full_name: '', phone: '', email: '', tambem_pilates: false });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro');
    } finally {
      setSaving(false);
    }
  };

  // Alterna se o paciente também é aluno de pilates
  const toggleTipo = async (p: Patient) => {
    const novoPilates = p.tipo !== 'ambos'; // se não é ambos, vira ambos; se é ambos, deixa só fisio
    await updateAluno(p.id, { is_pilates_student: novoPilates } as never);
    await load();
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return !q || (p.full_name ?? '').toLowerCase().includes(q) || (p.email ?? '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Pacientes (Fisioterapia)</h1>
          <p className="text-sm text-slate-400">{filtered.length} paciente(s)</p>
        </div>
        <Button variant="primary" size="md" onClick={() => { setError(''); setShowCreate(true); }}>+ Novo Paciente</Button>
      </div>

      <input
        type="text"
        placeholder="Buscar por nome ou email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-left">
              <th className="px-5 py-3 text-slate-400 font-medium">Nome</th>
              <th className="px-5 py-3 text-slate-400 font-medium">Email</th>
              <th className="px-5 py-3 text-slate-400 font-medium">Tipo</th>
              <th className="px-5 py-3 text-slate-400 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filtered.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-500">Nenhum paciente de fisioterapia.</td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-700/30">
                <td className="px-5 py-4 text-ink font-medium">{p.full_name || '—'}</td>
                <td className="px-5 py-4 text-slate-300 text-xs">{p.email || '—'}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${p.tipo === 'ambos' ? 'bg-teal-600/20 text-teal-400' : 'bg-purple-600/20 text-purple-400'}`}>
                    {p.tipo === 'ambos' ? 'Pilates + Fisio' : 'Só Fisio'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <button onClick={() => toggleTipo(p)} className="text-xs text-slate-300 hover:text-ink bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors">
                    {p.tipo === 'ambos' ? 'Tornar só fisio' : 'Marcar também pilates'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <Modal title="Novo Paciente de Fisioterapia" onClose={() => setShowCreate(false)} onConfirm={handleCreate} confirmText="Cadastrar" loading={saving}>
          <div className="space-y-4">
            {error && <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-4 py-2">{error}</p>}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nome completo *</label>
              <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Nome do paciente" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Telefone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="(21) 99999-9999" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email (opcional)</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="email@exemplo.com" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={form.tambem_pilates} onChange={(e) => setForm({ ...form, tambem_pilates: e.target.checked })} className="w-4 h-4 accent-green-500" />
              Também é aluno de pilates (faz os dois)
            </label>
          </div>
        </Modal>
      )}
    </div>
  );
}
