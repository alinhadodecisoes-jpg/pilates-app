'use client';

import { useState, useEffect } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

interface ClassSession {
  id: number;
  class_id: number;
  session_date: string;
  time_start: string;
  time_end: string;
  capacity: number;
  status: 'scheduled' | 'canceled' | 'done';
  turma?: { name: string } | null;
  _booked_count?: number;
  _my_booking?: { status: string; id: number } | null;
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function getWeekDates(referenceDate: Date): Date[] {
  const start = new Date(referenceDate);
  const day = start.getDay();
  start.setDate(start.getDate() - day + 1);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function AlunoAgendaPage() {
  const { user, loading: authLoading } = usePilatesAuth();
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [weekRef, setWeekRef] = useState(new Date());
  const supabase = getSupabaseBrowserClient();

  const weekDates = getWeekDates(weekRef);
  const weekStart = weekDates[0].toISOString().slice(0, 10);
  const weekEnd = weekDates[6].toISOString().slice(0, 10);

  const loadSessions = async () => {
    if (!user) return;
    const [sessionsRes, bookingsRes, myBookingsRes] = await Promise.all([
      supabase
        .from('class_sessions')
        .select('*, turma:classes_pilates!class_id(name)')
        .gte('session_date', weekStart)
        .lte('session_date', weekEnd)
        .eq('status', 'scheduled')
        .order('session_date')
        .order('time_start'),
      supabase
        .from('bookings')
        .select('session_id')
        .eq('status', 'booked'),
      supabase
        .from('bookings')
        .select('session_id, status, id')
        .eq('user_id', user.id)
        .in('status', ['booked', 'waitlist']),
    ]);

    if (!sessionsRes.error && sessionsRes.data) {
      const countBySession: Record<number, number> = {};
      for (const b of bookingsRes.data ?? []) {
        countBySession[b.session_id] = (countBySession[b.session_id] ?? 0) + 1;
      }
      const myBySession: Record<number, { status: string; id: number }> = {};
      for (const b of myBookingsRes.data ?? []) {
        myBySession[b.session_id] = { status: b.status, id: b.id };
      }
      setSessions(
        sessionsRes.data.map((s) => ({
          ...s,
          _booked_count: countBySession[s.id] ?? 0,
          _my_booking: myBySession[s.id] ?? null,
        })) as ClassSession[]
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && user) loadSessions();
    else if (!authLoading && !user) setLoading(false);
  }, [authLoading, user, weekRef]);

  const handleBook = async (sessionId: number) => {
    if (!user) return;
    setBookingId(sessionId);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'book', session_id: sessionId, user_id: user.id }),
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      await loadSessions();
    } finally {
      setBookingId(null);
    }
  };

  const handleCancel = async (sessionId: number) => {
    if (!user) return;
    setBookingId(sessionId);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', session_id: sessionId, user_id: user.id }),
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      await loadSessions();
    } finally {
      setBookingId(null);
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

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <h1 className="text-2xl font-bold text-white">Agenda de Aulas</h1>

      {/* Navegação semanal */}
      <div className="flex items-center gap-4 bg-slate-800 rounded-xl border border-slate-700 p-3">
        <button onClick={prevWeek} className="text-slate-400 hover:text-white px-3 py-1 rounded-lg hover:bg-slate-700 text-sm">
          ←
        </button>
        <div className="flex-1 text-center">
          <p className="text-white font-semibold text-sm">
            {weekDates[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} —{' '}
            {weekDates[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <button onClick={nextWeek} className="text-slate-400 hover:text-white px-3 py-1 rounded-lg hover:bg-slate-700 text-sm">
          →
        </button>
      </div>

      {/* Grid semanal */}
      <div className="grid grid-cols-7 gap-1.5">
        {weekDates.map((date) => {
          const dateStr = date.toISOString().slice(0, 10);
          const daySessions = byDate[dateStr] ?? [];
          const isToday = dateStr === new Date().toISOString().slice(0, 10);
          const isPast = date < new Date();

          return (
            <div key={dateStr}>
              <div className={`text-center mb-1.5 py-1 rounded-lg ${isToday ? 'bg-green-600' : 'bg-slate-800'}`}>
                <p className="text-[9px] text-slate-400">{DAYS[date.getDay()]}</p>
                <p className={`text-sm font-bold ${isToday ? 'text-white' : isPast ? 'text-slate-600' : 'text-slate-300'}`}>
                  {date.getDate()}
                </p>
              </div>
              <div className="space-y-1">
                {daySessions.map((s) => {
                  const myBooking = s._my_booking;
                  const isFull = (s._booked_count ?? 0) >= (s.capacity ?? 4);
                  const isBooked = myBooking?.status === 'booked';
                  const isWaitlist = myBooking?.status === 'waitlist';
                  const isLoading = bookingId === s.id;

                  return (
                    <div
                      key={s.id}
                      className={`text-[10px] rounded-lg p-1.5 border ${
                        isBooked
                          ? 'bg-green-600/30 border-green-500/50'
                          : isWaitlist
                          ? 'bg-yellow-600/20 border-yellow-500/40'
                          : isFull
                          ? 'bg-slate-700/50 border-slate-600'
                          : 'bg-slate-800 border-slate-700'
                      }`}
                    >
                      <p className="text-white font-semibold">{s.time_start?.slice(0, 5)}</p>
                      <p className="text-slate-300 truncate">{(s.turma as any)?.name}</p>
                      <p className={`text-[9px] ${isFull && !myBooking ? 'text-red-400' : 'text-slate-500'}`}>
                        {s._booked_count}/{s.capacity}
                      </p>

                      {isBooked && (
                        <div className="mt-1">
                          <span className="text-green-400 text-[9px]">✅ Reservado</span>
                          <button
                            onClick={() => handleCancel(s.id)}
                            disabled={isLoading || isPast}
                            className="block text-red-400 hover:text-red-300 text-[9px] mt-0.5 disabled:opacity-50"
                          >
                            {isLoading ? '...' : 'Cancelar'}
                          </button>
                        </div>
                      )}

                      {isWaitlist && (
                        <div className="mt-1">
                          <span className="text-yellow-400 text-[9px]">⏳ Fila</span>
                          <button
                            onClick={() => handleCancel(s.id)}
                            disabled={isLoading || isPast}
                            className="block text-red-400 hover:text-red-300 text-[9px] mt-0.5 disabled:opacity-50"
                          >
                            {isLoading ? '...' : 'Sair'}
                          </button>
                        </div>
                      )}

                      {!myBooking && !isPast && (
                        <button
                          onClick={() => handleBook(s.id)}
                          disabled={isLoading}
                          className={`mt-1 text-[9px] px-1.5 py-0.5 rounded font-medium transition-colors ${
                            isFull
                              ? 'bg-yellow-600/30 text-yellow-300 hover:bg-yellow-600/50'
                              : 'bg-green-600/30 text-green-300 hover:bg-green-600/50'
                          } disabled:opacity-50`}
                        >
                          {isLoading ? '...' : isFull ? 'Fila' : 'Reservar'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {Object.keys(byDate).length === 0 && (
        <div className="bg-slate-800 rounded-xl p-10 border border-slate-700 text-center">
          <p className="text-slate-500 text-sm">Nenhuma aula disponível esta semana.</p>
          <p className="text-slate-600 text-xs mt-2">
            O administrador precisa gerar a agenda primeiro.
          </p>
        </div>
      )}

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-600/30 border border-green-500/50"></span> Reservado</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-600/20 border border-yellow-500/40"></span> Lista de espera</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-700/50 border border-slate-600"></span> Lotado</span>
      </div>
    </div>
  );
}
