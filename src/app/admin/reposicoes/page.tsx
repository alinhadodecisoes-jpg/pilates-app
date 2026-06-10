'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Modal } from '@/components/pilates/Modal';
import { Button } from '@/components/pilates/Button';

interface RepoSlot {
  id: number;
  class_id: number;
  slot_date: string;
  time_start: string;
  time_end: string;
  capacity: number;
  created_at: string;
  classes_pilates?: { name: string } | null;
  requests_count?: number;
}

interface RepoRequest {
  id: number;
  user_id: string;
  slot_id: number;
  status: 'pending' | 'approved' | 'rejected' | 'canceled';
  requested_at: string;
  notes?: string | null;
  users_pilates?: { full_name: string | null; email: string | null } | null;
  reposition_slots?: { slot_date: string; time_start: string; time_end: string; classes_pilates?: { name: string } | null } | null;
}

interface PilatesClassBasic {
  id: number;
  name: string;
}

export default function AdminReposicoesPage() {
  const { user, loading: authLoading } = usePilatesAuth();
  const [slots, setSlots] = useState<RepoSlot[]>([]);
  const [requests, setRequests] = useState<RepoRequest[]>([]);
  const [classes, setClasses] = useState<PilatesClassBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'slots' | 'requests'>('requests');
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabaseBrowserClient();

  const [form, setForm] = useState({
    class_id: '',
    slot_date: new Date().toISOString().slice(0, 10),
    time_start: '09:00',
    time_end: '10:00',
    capacity: 4,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [slotsRes, requestsRes, classesRes] = await Promise.all([
        supabase
          .from('reposition_slots')
          .select('*, classes_pilates(name)')
          .order('slot_date', { ascending: true }),
        supabase
          .from('reposition_requests')
          .select('*, users_pilates(full_name, email), reposition_slots(slot_date, time_start, time_end, classes_pilates(name))')
          .order('requested_at', { ascending: false }),
        supabase
          .from('classes_pilates')
          .select('id, name')
          .eq('is_active', true)
          .order('name'),
      ]);
      setSlots((slotsRes.data ?? []) as RepoSlot[]);
      setRequests((requestsRes.data ?? []) as RepoRequest[]);
      setClasses((classesRes.data ?? []) as PilatesClassBasic[]);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar. Verifique se o SQL C1 foi rodado (PENDENCIAS_WILLIAN.md).');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (!authLoading) loadData();
  }, [authLoading, loadData]);

  const handleCreateSlot = async () => {
    if (!form.class_id) { setError('Selecione a turma.'); return; }
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from('reposition_slots')
      .insert({
        class_id: Number(form.class_id),
        slot_date: form.slot_date,
        time_start: form.time_start,
        time_end: form.time_end,
        capacity: form.capacity,
        created_by: user?.id,
      });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setShowCreate(false);
    loadData();
  };

  const handleApprove = async (req: RepoRequest) => {
    if (!user) return;
    setSaving(true);
    // Aprovar esta solicitação
    const { error: approveErr } = await supabase
      .from('reposition_requests')
      .update({ status: 'approved', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq('id', req.id);

    if (approveErr) { setError(approveErr.message); setSaving(false); return; }

    // Rejeitar outras pendentes do mesmo aluno para o mesmo slot
    await supabase
      .from('reposition_requests')
      .update({ status: 'rejected', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq('user_id', req.user_id)
      .eq('slot_id', req.slot_id)
      .neq('id', req.id)
      .eq('status', 'pending');

    // Criar presença (attendances_pilates)
    const slot = req.reposition_slots;
    if (slot) {
      await supabase
        .from('attendances_pilates')
        .upsert({
          user_id: req.user_id,
          class_id: null, // slot independente de class_id direto
          attendance_date: slot.slot_date,
          status: 'replacement',
          notes: `Reposição aprovada via slot — ${slot.time_start?.slice(0, 5)}–${slot.time_end?.slice(0, 5)}`,
        }, { onConflict: 'user_id,attendance_date' });
    }

    // Tentar notificar
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: req.user_id,
          type: 'reposicao_aprovada',
          title: 'Reposição Aprovada!',
          body: `Sua reposição foi aprovada para ${slot?.slot_date} às ${slot?.time_start?.slice(0, 5)}.`,
        }),
      });
    } catch { /* notificação não é crítica */ }

    setSaving(false);
    loadData();
  };

  const handleReject = async (reqId: number) => {
    if (!user) return;
    await supabase
      .from('reposition_requests')
      .update({ status: 'rejected', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq('id', reqId);
    loadData();
  };

  const handleDeleteSlot = async (slotId: number) => {
    await supabase.from('reposition_slots').delete().eq('id', slotId);
    loadData();
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Reposições</h1>
        {tab === 'slots' && (
          <Button variant="primary" size="md" onClick={() => { setError(null); setShowCreate(true); }}>
            + Novo Slot
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-4 py-3">
          ⚠️ {error}
        </p>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('requests')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'requests' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Solicitações {pendingCount > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
        </button>
        <button
          onClick={() => setTab('slots')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'slots' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Horários Disponíveis ({slots.length})
        </button>
      </div>

      {/* TAB: SOLICITAÇÕES */}
      {tab === 'requests' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {requests.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Nenhuma solicitação ainda.</div>
          ) : (
            <div className="divide-y divide-slate-700">
              {requests.map((req) => {
                const slot = req.reposition_slots;
                const statusMap = {
                  pending: { label: 'Pendente', color: 'bg-yellow-600/20 text-yellow-400' },
                  approved: { label: 'Aprovada', color: 'bg-green-600/20 text-green-400' },
                  rejected: { label: 'Recusada', color: 'bg-red-600/20 text-red-400' },
                  canceled: { label: 'Cancelada', color: 'bg-slate-600/20 text-slate-400' },
                };
                const cfg = statusMap[req.status] ?? statusMap.pending;
                return (
                  <div key={req.id} className="flex items-center justify-between px-5 py-4 gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">
                        {req.users_pilates?.full_name || req.users_pilates?.email || '—'}
                      </p>
                      {slot && (
                        <p className="text-slate-400 text-xs mt-0.5">
                          {slot.slot_date} · {slot.time_start?.slice(0, 5)}–{slot.time_end?.slice(0, 5)}
                          {slot.classes_pilates?.name ? ` · ${slot.classes_pilates.name}` : ''}
                        </p>
                      )}
                      <p className="text-slate-500 text-xs">{new Date(req.requested_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full ${cfg.color}`}>{cfg.label}</span>
                      {req.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(req)}
                            disabled={saving}
                            className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
                          >
                            ✅ Aprovar
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            className="text-xs bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1 rounded-lg transition-colors"
                          >
                            ✕ Recusar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: SLOTS */}
      {tab === 'slots' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {slots.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Nenhum slot criado ainda. Clique em &ldquo;+ Novo Slot&rdquo;.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-left">
                    <th className="px-5 py-3 text-slate-400 font-medium">Data</th>
                    <th className="px-5 py-3 text-slate-400 font-medium">Horário</th>
                    <th className="px-5 py-3 text-slate-400 font-medium">Turma</th>
                    <th className="px-5 py-3 text-slate-400 font-medium">Vagas</th>
                    <th className="px-5 py-3 text-slate-400 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {slots.map((slot) => (
                    <tr key={slot.id}>
                      <td className="px-5 py-3 text-white">
                        {new Date(slot.slot_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-5 py-3 text-slate-300">
                        {slot.time_start?.slice(0, 5)}–{slot.time_end?.slice(0, 5)}
                      </td>
                      <td className="px-5 py-3 text-slate-300">
                        {slot.classes_pilates?.name || '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">{slot.capacity}</span>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="text-xs text-red-400 hover:text-white bg-red-900/20 hover:bg-red-600 px-2 py-1 rounded transition-colors"
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Novo Slot */}
      {showCreate && (
        <Modal
          title="Novo Slot de Reposição"
          onClose={() => setShowCreate(false)}
          onConfirm={handleCreateSlot}
          confirmText="Criar Slot"
          loading={saving}
        >
          <div className="space-y-4">
            {error && (
              <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">{error}</p>
            )}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Turma *</label>
              <select
                value={form.class_id}
                onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Selecione...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Data</label>
              <input
                type="date"
                value={form.slot_date}
                onChange={(e) => setForm({ ...form, slot_date: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Início</label>
                <input
                  type="time"
                  value={form.time_start}
                  onChange={(e) => setForm({ ...form, time_start: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Fim</label>
                <input
                  type="time"
                  value={form.time_end}
                  onChange={(e) => setForm({ ...form, time_end: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Vagas</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
