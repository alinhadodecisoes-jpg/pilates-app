'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { Modal } from '@/components/pilates/Modal';
import { Button } from '@/components/pilates/Button';

const DAYS = ['', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

interface RepoSlot {
  id: number;
  class_id: number | null;
  slot_date: string;
  time_start: string;
  time_end: string;
  capacity: number;
  created_at: string;
  classes_pilates?: { name: string } | null;
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

interface ClassRow {
  id: number;
  name: string;
  day_of_week: number;
  time_start: string;
  time_end: string;
  capacity: number;
  enrolled_count: number;
}

export default function AdminReposicoesPage() {
  const { user, loading: authLoading } = usePilatesAuth();
  const [slots, setSlots] = useState<RepoSlot[]>([]);
  const [requests, setRequests] = useState<RepoRequest[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'slots' | 'requests'>('requests');
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [slotDate, setSlotDate] = useState(new Date().toISOString().slice(0, 10));
  const [selected, setSelected] = useState<Record<number, boolean>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pilates/reposicoes');
      if (!res.ok) throw new Error('Falha ao carregar');
      const data = await res.json();
      setSlots(data.slots ?? []);
      setRequests(data.requests ?? []);
      setClasses(data.classes ?? []);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar reposições.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) loadData();
  }, [authLoading, loadData]);

  const toggleClass = (id: number) =>
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleCreateSlots = async () => {
    const chosen = classes.filter((c) => selected[c.id]);
    if (chosen.length === 0) { setError('Selecione ao menos uma turma.'); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/pilates/reposicoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_slots_bulk',
          slots: chosen.map((c) => ({
            class_id: c.id,
            slot_date: slotDate,
            time_start: c.time_start,
            time_end: c.time_end,
            capacity: c.capacity,
            created_by: user?.id,
          })),
        }),
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Erro'); }
      setShowCreate(false);
      setSelected({});
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar slots.');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (req: RepoRequest) => {
    setSaving(true);
    try {
      await fetch('/api/pilates/reposicoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', request_id: req.id, reviewer_id: user?.id }),
      });
      try {
        const slot = req.reposition_slots;
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
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async (reqId: number) => {
    await fetch('/api/pilates/reposicoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', request_id: reqId, reviewer_id: user?.id }),
    });
    loadData();
  };

  const handleDeleteSlot = async (slotId: number) => {
    await fetch(`/api/pilates/reposicoes?slotId=${slotId}`, { method: 'DELETE' });
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
  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Reposições</h1>
        {tab === 'slots' && (
          <Button variant="primary" size="md" onClick={() => { setError(null); setSelected({}); setShowCreate(true); }}>
            + Disponibilizar Horários
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-4 py-3">⚠️ {error}</p>
      )}

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
            <div className="p-8 text-center text-slate-500">Nenhum horário disponível ainda. Clique em &ldquo;+ Disponibilizar Horários&rdquo;.</div>
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
                      <td className="px-5 py-3 text-slate-300">{slot.classes_pilates?.name || '—'}</td>
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

      {/* Modal Disponibilizar Horários (multi-seleção de turmas) */}
      {showCreate && (
        <Modal
          title="Disponibilizar Horários de Reposição"
          onClose={() => setShowCreate(false)}
          onConfirm={handleCreateSlots}
          confirmText={selectedCount > 0 ? `Disponibilizar ${selectedCount} horário(s)` : 'Disponibilizar'}
          loading={saving}
        >
          <div className="space-y-4">
            {error && (
              <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">{error}</p>
            )}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Data da reposição</label>
              <input
                type="date"
                value={slotDate}
                onChange={(e) => setSlotDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-2">
                Selecione as turmas que ficarão disponíveis nesta data (mesmo as cheias — alguém pode ter cancelado):
              </p>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {classes.length === 0 ? (
                  <p className="text-slate-500 text-sm">Nenhuma turma cadastrada.</p>
                ) : (
                  classes.map((c) => {
                    const cheia = c.enrolled_count >= c.capacity;
                    return (
                      <label
                        key={c.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selected[c.id] ? 'border-green-500 bg-green-900/15' : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!selected[c.id]}
                          onChange={() => toggleClass(c.id)}
                          className="w-4 h-4 accent-green-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium">{c.name}</p>
                          <p className="text-slate-400 text-xs">
                            {DAYS[c.day_of_week]} · {c.time_start?.slice(0, 5)}–{c.time_end?.slice(0, 5)}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                            cheia ? 'bg-red-600/20 text-red-400' : 'bg-green-600/20 text-green-400'
                          }`}
                        >
                          {c.enrolled_count}/{c.capacity} {cheia ? 'cheia' : 'vaga'}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
