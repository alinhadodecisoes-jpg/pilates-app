'use client';

import { useState, useEffect } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';

interface Booking {
  booking_id: number | null;
  user_id: string;
  status: string;
  full_name: string | null;
  email: string | null;
}

interface ClassSession {
  id: number;
  class_id: number;
  session_date: string;
  time_start: string;
  time_end: string;
  capacity: number;
  status: 'scheduled' | 'canceled' | 'done';
  turma?: { name: string } | null;
  professor_name?: string | null;
  _booked_count?: number;
  _enrolled_count?: number;
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function getWeekDates(referenceDate: Date): Date[] {
  const start = new Date(referenceDate);
  const day = start.getDay();
  start.setDate(start.getDate() - day + 1); // Monday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function AdminAgendaPage() {
  const { loading: authLoading } = usePilatesAuth();
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [weekRef, setWeekRef] = useState(new Date());
  const [generateResult, setGenerateResult] = useState<string>('');
  const [presenceModal, setPresenceModal] = useState<ClassSession | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [markingPresence, setMarkingPresence] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const weekDates = getWeekDates(weekRef);
  const weekStart = weekDates[0].toISOString().slice(0, 10);
  const weekEnd = weekDates[6].toISOString().slice(0, 10);

  const loadSessions = async () => {
    try {
      const res = await fetch(`/api/pilates/agenda?start=${weekStart}&end=${weekEnd}`);
      if (res.ok) {
        const data = await res.json();
        setSessions((data.sessions ?? []) as ClassSession[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Exporta a agenda do MÊS inteiro em CSV (todas as aulas, professores, ocupação)
  const handleExportMonth = async () => {
    setExporting(true);
    try {
      const first = new Date(weekRef.getFullYear(), weekRef.getMonth(), 1).toISOString().slice(0, 10);
      const last = new Date(weekRef.getFullYear(), weekRef.getMonth() + 1, 0).toISOString().slice(0, 10);
      const res = await fetch(`/api/pilates/agenda?start=${first}&end=${last}`);
      const data = await res.json();
      const rows = (data.sessions ?? []) as ClassSession[];
      const header = ['Data', 'Início', 'Fim', 'Turma', 'Professor', 'Reservas', 'Matriculados', 'Capacidade', 'Status'];
      const lines = rows.map((s) => [
        s.session_date,
        s.time_start?.slice(0, 5),
        s.time_end?.slice(0, 5),
        (s.turma as any)?.name ?? `Turma ${s.class_id}`,
        s.professor_name ?? '—',
        s._booked_count ?? 0,
        s._enrolled_count ?? 0,
        s.capacity,
        s.status,
      ].join(';'));
      const csv = '﻿' + [header.join(';'), ...lines].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agenda-${first.slice(0, 7)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (!authLoading) loadSessions();
  }, [authLoading, weekRef]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateResult('');
    try {
      const res = await fetch('/api/sessions/generate', { method: 'POST' });
      const data = await res.json();
      setGenerateResult(data.message || `${data.created ?? 0} sessões criadas!`);
      await loadSessions();
    } catch {
      setGenerateResult('Erro ao gerar sessões.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCancelSession = async (sessionId: number) => {
    if (!confirm('Cancelar esta sessão de aula?')) return;
    await fetch('/api/pilates/agenda', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel_session', sessionId }),
    });
    await loadSessions();
  };

  const openPresenceModal = async (session: ClassSession) => {
    setPresenceModal(session);
    setBookings([]);
    const res = await fetch(`/api/pilates/agenda?sessionId=${session.id}&classId=${session.class_id}`);
    if (res.ok) {
      const data = await res.json();
      setBookings((data.presence ?? []) as Booking[]);
    }
  };

  const handleMarkPresence = async (
    sessionId: number,
    userId: string,
    action: 'attended' | 'no_show'
  ) => {
    const key = `${sessionId}-${userId}`;
    setMarkingPresence(key);
    try {
      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, session_id: sessionId, user_id: userId }),
      });
      // Update local state
      setBookings((prev) =>
        prev.map((b) => (b.user_id === userId ? { ...b, status: action } : b))
      );
    } finally {
      setMarkingPresence(null);
    }
  };

  const prevWeek = () => {
    const d = new Date(weekRef);
    d.setDate(d.getDate() - 7);
    setWeekRef(d);
  };

  const nextWeek = () => {
    const d = new Date(weekRef);
    d.setDate(d.getDate() + 7);
    setWeekRef(d);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const byDate: Record<string, ClassSession[]> = {};
  for (const s of sessions) {
    if (!byDate[s.session_date]) byDate[s.session_date] = [];
    byDate[s.session_date].push(s);
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Agenda de Aulas</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExportMonth}
            disabled={exporting}
            className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-ink px-4 py-2 rounded-xl text-sm font-medium"
          >
            {exporting ? '⏳...' : '⬇️ Exportar Mês (CSV)'}
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-ink px-4 py-2 rounded-xl text-sm font-medium"
          >
            {generating ? '⏳ Gerando...' : '📅 Gerar Agenda do Mês'}
          </button>
        </div>
      </div>

      {generateResult && (
        <div className="bg-green-600/10 border border-green-500/30 rounded-xl p-3 text-green-400 text-sm">
          {generateResult}
        </div>
      )}

      {/* Navegação semanal */}
      <div className="flex items-center gap-4 bg-slate-800 rounded-xl border border-slate-700 p-4">
        <button onClick={prevWeek} className="text-slate-400 hover:text-ink px-3 py-1 rounded-lg hover:bg-slate-700">
          ← Anterior
        </button>
        <div className="flex-1 text-center">
          <p className="text-ink font-semibold">
            {weekDates[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} —{' '}
            {weekDates[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={nextWeek} className="text-slate-400 hover:text-ink px-3 py-1 rounded-lg hover:bg-slate-700">
          Próxima →
        </button>
      </div>

      {/* Grade semanal */}
      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date) => {
          const dateStr = date.toISOString().slice(0, 10);
          const daySessions = byDate[dateStr] ?? [];
          const isToday = dateStr === today;
          const isPast = dateStr < today;

          return (
            <div key={dateStr} className="min-h-[120px]">
              <div className={`text-center mb-2 py-1 rounded-lg ${isToday ? 'bg-green-600' : 'bg-slate-800'}`}>
                <p className="text-xs text-slate-400">{DAYS[date.getDay()]}</p>
                <p className={`text-sm font-bold ${isToday ? 'text-ink' : 'text-slate-300'}`}>
                  {date.getDate()}
                </p>
              </div>
              <div className="space-y-1">
                {daySessions.map((s) => {
                  const isCanceled = s.status === 'canceled';
                  const isFull = (s._booked_count ?? 0) >= (s.capacity ?? 4);
                  return (
                    <div
                      key={s.id}
                      className={`text-xs rounded-lg p-1.5 border transition-opacity ${
                        isCanceled
                          ? 'bg-slate-700/30 border-slate-700 opacity-50 line-through'
                          : isFull
                          ? 'bg-red-600/20 border-red-600/30'
                          : 'bg-green-600/20 border-green-600/30'
                      }`}
                    >
                      <p className="text-ink font-medium truncate">{s.time_start?.slice(0, 5)}</p>
                      <p className="text-slate-300 truncate">
                        {(s.turma as any)?.name || `Turma ${s.class_id}`}
                      </p>
                      {s.professor_name && (
                        <p className="text-slate-500 truncate text-[10px]">👤 {s.professor_name}</p>
                      )}
                      <p className="text-slate-400">{(s._booked_count || s._enrolled_count) ?? 0}/{s.capacity}</p>
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        {!isCanceled && (
                          <button
                            onClick={() => handleCancelSession(s.id)}
                            className="text-red-400 hover:text-red-300 text-[10px]"
                          >
                            Cancelar
                          </button>
                        )}
                        {/* Presença: apenas para aulas passadas ou de hoje */}
                        {(isPast || isToday) && !isCanceled && (
                          <button
                            onClick={() => openPresenceModal(s)}
                            className="text-blue-400 hover:text-blue-300 text-[10px]"
                          >
                            ✅ Presença
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {Object.keys(byDate).length === 0 && (
        <div className="text-center py-10 text-slate-500">
          <p>Nenhuma sessão encontrada para esta semana.</p>
          <p className="text-sm mt-2">Clique em &quot;Gerar Agenda do Mês&quot; para criar sessões.</p>
        </div>
      )}

      {/* Modal de presença */}
      {presenceModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg">
            <div className="p-5 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-ink font-bold text-lg">
                  ✅ Presença —{' '}
                  {(presenceModal.turma as any)?.name || `Turma ${presenceModal.class_id}`}
                </h2>
                <p className="text-slate-400 text-sm">
                  {new Date(presenceModal.session_date + 'T12:00:00').toLocaleDateString('pt-BR')}{' '}
                  {presenceModal.time_start?.slice(0, 5)}–{presenceModal.time_end?.slice(0, 5)}
                </p>
              </div>
              <button onClick={() => setPresenceModal(null)} className="text-slate-400 hover:text-ink text-xl">✕</button>
            </div>
            <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
              {bookings.length === 0 ? (
                <p className="text-slate-400 text-center py-4">Nenhuma reserva para esta sessão.</p>
              ) : (
                bookings.map((b) => {
                  const key = `${presenceModal.id}-${b.user_id}`;
                  return (
                    <div key={b.user_id} className="flex items-center justify-between bg-slate-700/50 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-ink text-sm font-medium">
                          {b.full_name || 'Aluno'}
                        </p>
                        <p className="text-slate-400 text-xs">{b.email}</p>
                      </div>
                      <div className="flex gap-2 items-center">
                        {b.status === 'attended' && (
                          <span className="text-green-400 text-xs font-medium">✅ Presente</span>
                        )}
                        {b.status === 'no_show' && (
                          <span className="text-red-400 text-xs font-medium">❌ Faltou</span>
                        )}
                        {b.status === 'booked' && (
                          <>
                            <button
                              onClick={() => handleMarkPresence(presenceModal.id, b.user_id, 'attended')}
                              disabled={markingPresence === key}
                              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-ink px-3 py-1 rounded-lg text-xs"
                            >
                              ✅ Presente
                            </button>
                            <button
                              onClick={() => handleMarkPresence(presenceModal.id, b.user_id, 'no_show')}
                              disabled={markingPresence === key}
                              className="bg-red-600/20 hover:bg-red-600/40 text-red-400 px-3 py-1 rounded-lg text-xs border border-red-600/30"
                            >
                              ❌ Faltou
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="p-4 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => setPresenceModal(null)}
                className="bg-slate-700 hover:bg-slate-600 text-ink px-4 py-2 rounded-xl text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
