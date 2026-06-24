'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

interface RepoSlot {
  id: number;
  class_id: number;
  slot_date: string;
  time_start: string;
  time_end: string;
  capacity: number;
  classes_pilates?: { name: string } | null;
  // contagem de aprovados
  approved_count?: number;
}

interface MyRequest {
  id: number;
  slot_id: number;
  status: 'pending' | 'approved' | 'rejected' | 'canceled';
  requested_at: string;
  reposition_slots?: { slot_date: string; time_start: string; time_end: string; classes_pilates?: { name: string } | null } | null;
}

export default function AlunoReposicoesPage() {
  const { user, loading: authLoading } = usePilatesAuth();
  const [slots, setSlots] = useState<RepoSlot[]>([]);
  const [myRequests, setMyRequests] = useState<MyRequest[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabaseBrowserClient();

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pilates/reposicoes?userId=${user.id}`);
      if (!res.ok) throw new Error('Falha ao carregar');
      const data = await res.json();
      setSlots((data.slots ?? []) as unknown as RepoSlot[]);
      setMyRequests((data.requests ?? []) as unknown as MyRequest[]);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar reposições.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) loadData();
  }, [authLoading, user, loadData]);

  const toggleSlot = (slotId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return next;
    });
  };

  const handleSolicitar = async () => {
    if (!user || selected.size === 0) { setError('Selecione pelo menos um horário.'); return; }
    setSubmitting(true);
    setError(null);
    const slotIds = Array.from(selected);
    try {
      for (const slotId of slotIds) {
        const res = await fetch('/api/pilates/reposicoes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'request', user_id: user.id, slot_id: slotId }),
        });
        if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Erro'); }
      }
      setSelected(new Set());
      setSuccess(`${slotIds.length} solicitação(ões) enviada(s)! Aguarde aprovação.`);
      loadData();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao solicitar.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelar = async (reqId: number) => {
    if (!user) return;
    await fetch('/api/pilates/reposicoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel_request', request_id: reqId, user_id: user.id }),
    });
    loadData();
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Slots onde o aluno já tem solicitação
  const alreadyRequestedSlots = new Set(myRequests.map((r) => r.slot_id));

  const statusMap = {
    pending: { label: 'Aguardando', color: 'bg-yellow-600/20 text-yellow-400' },
    approved: { label: '✅ Aprovada', color: 'bg-green-600/20 text-green-400' },
    rejected: { label: '✕ Recusada', color: 'bg-red-600/20 text-red-400' },
    canceled: { label: 'Cancelada', color: 'bg-slate-600/20 text-slate-400' },
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <h1 className="text-2xl font-bold text-ink">Reposições</h1>

      {success && (
        <div className="bg-green-600/20 border border-green-600/50 text-green-400 p-4 rounded-xl text-sm">
          ✅ {success}
        </div>
      )}
      {error && (
        <div className="bg-red-600/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Horários Disponíveis */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-green-400 font-semibold">Horários Disponíveis</h2>
          {selected.size > 0 && (
            <button
              onClick={handleSolicitar}
              disabled={submitting}
              className="text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 text-ink px-4 py-2 rounded-lg transition-colors"
            >
              {submitting ? 'Enviando...' : `Solicitar ${selected.size} horário(s)`}
            </button>
          )}
        </div>

        {slots.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Nenhum horário de reposição disponível no momento.<br />
            <span className="text-xs text-slate-600">O professor disponibilizará novos slots em breve.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {slots.map((slot) => {
              const alreadyRequested = alreadyRequestedSlots.has(slot.id);
              const isSelected = selected.has(slot.id);
              return (
                <div
                  key={slot.id}
                  className={`flex items-center justify-between px-5 py-4 cursor-pointer transition-colors ${
                    alreadyRequested ? 'opacity-50 cursor-not-allowed' : isSelected ? 'bg-green-900/20' : 'hover:bg-slate-700/50'
                  }`}
                  onClick={() => !alreadyRequested && toggleSlot(slot.id)}
                >
                  <div>
                    <p className="text-ink font-medium text-sm">
                      {new Date(slot.slot_date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                      {' · '}
                      {slot.time_start?.slice(0, 5)}–{slot.time_end?.slice(0, 5)}
                    </p>
                    {slot.classes_pilates?.name && (
                      <p className="text-slate-400 text-xs mt-0.5">{slot.classes_pilates.name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{slot.capacity} vagas</span>
                    {alreadyRequested ? (
                      <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded-full">Solicitado</span>
                    ) : (
                      <div className={`w-5 h-5 rounded border-2 transition-colors ${isSelected ? 'bg-green-500 border-green-500' : 'border-slate-500'}`}>
                        {isSelected && <svg className="w-full h-full text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Minhas Solicitações */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700">
          <h2 className="text-green-400 font-semibold">Minhas Solicitações</h2>
        </div>
        {myRequests.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">Nenhuma solicitação ainda.</div>
        ) : (
          <div className="divide-y divide-slate-700">
            {myRequests.map((req) => {
              const slot = req.reposition_slots;
              const cfg = statusMap[req.status] ?? statusMap.pending;
              return (
                <div key={req.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    {slot ? (
                      <>
                        <p className="text-ink text-sm font-medium">
                          {new Date(slot.slot_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                          {' · '}{slot.time_start?.slice(0, 5)}–{slot.time_end?.slice(0, 5)}
                        </p>
                        {slot.classes_pilates?.name && (
                          <p className="text-slate-400 text-xs">{slot.classes_pilates.name}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-slate-400 text-sm">Slot removido</p>
                    )}
                    <p className="text-slate-500 text-xs mt-0.5">
                      Solicitado em {new Date(req.requested_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${cfg.color}`}>{cfg.label}</span>
                    {req.status === 'pending' && (
                      <button
                        onClick={() => handleCancelar(req.id)}
                        className="text-xs text-slate-400 hover:text-red-400 transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
