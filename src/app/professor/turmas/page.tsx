'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface Turma {
  id: number;
  name: string;
  day_of_week: number;
  time_start: string;
  time_end: string;
  capacity: number;
  notes?: string | null;
  enrolled_count?: number;
}

export default function ProfessorTurmasPage() {
  const { user, loading: authLoading } = usePilatesAuth();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingNotes, setEditingNotes] = useState<Turma | null>(null);
  const [notesText, setNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const [cancelingClass, setCancelingClass] = useState<Turma | null>(null);
  const [cancelDate, setCancelDate] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [canceling, setCanceling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pilates/professor?professorId=${user.id}`);
      const data = await res.json();
      const enrollCountMap: Record<number, number> = {};
      for (const s of data.students ?? []) {
        enrollCountMap[s.class_id] = (enrollCountMap[s.class_id] ?? 0) + 1;
      }
      setTurmas(
        (data.classes ?? []).map((c: any) => ({
          ...c,
          enrolled_count: enrollCountMap[c.id] ?? 0,
        }))
      );
    } catch {
      setError('Erro ao carregar turmas.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  const handleSaveNotes = async () => {
    if (!editingNotes || !user) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/pilates/professor/turmas/${editingNotes.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ professorId: user.id, notes: notesText }),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      setTurmas((prev) =>
        prev.map((t) => (t.id === editingNotes.id ? { ...t, notes: notesText } : t))
      );
      setEditingNotes(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar notas.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleCancelarAula = async () => {
    if (!cancelingClass || !user || !cancelDate) return;
    setCanceling(true);
    try {
      const res = await fetch(`/api/pilates/professor/turmas/${cancelingClass.id}/cancelar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ professorId: user.id, date: cancelDate, reason: cancelReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao cancelar');
      setCancelSuccess(true);
      setTimeout(() => {
        setCancelingClass(null);
        setCancelDate('');
        setCancelReason('');
        setCancelSuccess(false);
      }, 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao cancelar.');
    } finally {
      setCanceling(false);
    }
  };

  const nextDateForDay = (dayOfWeek: number) => {
    const today = new Date();
    const diff = (dayOfWeek - today.getDay() + 7) % 7 || 7;
    const next = new Date(today);
    next.setDate(today.getDate() + diff);
    return next.toISOString().slice(0, 10);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Minhas Turmas</h1>
        <span className="text-sm text-slate-400">{turmas.length} turma(s)</span>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-xl px-4 py-3">⚠️ {error}</p>
      )}

      {turmas.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-10 text-center text-slate-500">
          Nenhuma turma atribuída a você.
        </div>
      ) : (
        <div className="grid gap-4">
          {turmas.map((turma) => (
            <div key={turma.id} className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold">{turma.name}</h3>
                  <p className="text-slate-400 text-sm mt-0.5">
                    {DAYS[turma.day_of_week]} · {String(turma.time_start).slice(0, 5)} — {String(turma.time_end).slice(0, 5)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {turma.enrolled_count ?? 0} / {turma.capacity} alunos
                  </p>
                  {turma.notes && (
                    <div className="mt-3 bg-slate-900/60 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-500 mb-0.5">Observações</p>
                      <p className="text-sm text-slate-300">{turma.notes}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => { setEditingNotes(turma); setNotesText(turma.notes ?? ''); }}
                    className="text-xs text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Editar Notas
                  </button>
                  <button
                    onClick={() => { setCancelingClass(turma); setCancelDate(nextDateForDay(turma.day_of_week)); setCancelReason(''); setCancelSuccess(false); }}
                    className="text-xs text-red-400 hover:text-red-300 bg-red-600/10 hover:bg-red-600/20 px-3 py-1.5 rounded-lg transition-colors border border-red-600/20"
                  >
                    Cancelar Aula
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Notas */}
      {editingNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h2 className="text-base font-bold text-white">Editar Observações</h2>
              <button onClick={() => setEditingNotes(null)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-400">{editingNotes.name}</p>
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                rows={5}
                placeholder="Observações sobre a turma: nível, exercícios, particularidades..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
              <div className="flex gap-3">
                <button onClick={() => setEditingNotes(null)} className="flex-1 px-4 py-2.5 text-sm text-slate-400 bg-slate-700 hover:bg-slate-600 rounded-xl">Cancelar</button>
                <button onClick={handleSaveNotes} disabled={savingNotes} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-900 bg-green-500 hover:bg-green-400 rounded-xl disabled:opacity-60">
                  {savingNotes ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cancelar */}
      {cancelingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h2 className="text-base font-bold text-white">Cancelar Aula</h2>
              <button onClick={() => setCancelingClass(null)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {cancelSuccess ? (
                <div className="text-center py-6">
                  <p className="text-green-400 text-3xl mb-2">✓</p>
                  <p className="text-green-400 font-medium">Aula cancelada com sucesso!</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-400">{cancelingClass.name}</p>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Data a cancelar</label>
                    <input type="date" value={cancelDate} onChange={(e) => setCancelDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Motivo (opcional)</label>
                    <input type="text" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Ex: Feriado, doença..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <p className="text-xs text-amber-400 bg-amber-600/10 border border-amber-600/20 rounded-lg px-3 py-2">
                    ⚠️ Reservas dos alunos nessa data serão canceladas automaticamente.
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setCancelingClass(null)} className="flex-1 px-4 py-2.5 text-sm text-slate-400 bg-slate-700 hover:bg-slate-600 rounded-xl">Voltar</button>
                    <button onClick={handleCancelarAula} disabled={canceling || !cancelDate} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-xl disabled:opacity-60">
                      {canceling ? 'Cancelando...' : 'Confirmar'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
