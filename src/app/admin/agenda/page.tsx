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
  turma?: { name: string; professor?: { full_name: string | null } | null } | null;
  _booked_count?: number;
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
  const supabase = getSupabaseBrowserClient();

  const weekDates = getWeekDates(weekRef);
  const weekStart = weekDates[0].toISOString().slice(0, 10);
  const weekEnd = weekDates[6].toISOString().slice(0, 10);

  const loadSessions = async () => {
    const [sessionsRes, bookingsRes] = await Promise.all([
      supabase
        .from('class_sessions')
        .select('*, turma:classes_pilates!class_id(name)')
        .gte('session_date', weekStart)
        .lte('session_date', weekEnd)
        .order('session_date')
        .order('time_start'),
      supabase
        .from('bookings')
        .select('session_id')
        .eq('status', 'booked'),
    ]);

    if (!sessionsRes.error && sessionsRes.data) {
      const countBySession: Record<number, number> = {};
      for (const b of bookingsRes.data ?? []) {
        countBySession[b.session_id] = (countBySession[b.session_id] ?? 0) + 1;
      }
      setSessions(
        sessionsRes.data.map((s) => ({
          ...s,
          _booked_count: countBySession[s.id] ?? 0,
        })) as ClassSession[]
      );
    }
    setLoading(false);
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
    await supabase.from('class_sessions').update({ status: 'canceled' }).eq('id', sessionId);
    await loadSessions();
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

  // Group sessions by date
  const byDate: Record<string, ClassSession[]> = {};
  for (const s of sessions) {
    if (!byDate[s.session_date]) byDate[s.session_date] = [];
    byDate[s.session_date].push(s);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Agenda de Aulas</h1>
        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium"
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
        <button onClick={prevWeek} className="text-slate-400 hover:text-white px-3 py-1 rounded-lg hover:bg-slate-700">
          ← Anterior
        </button>
        <div className="flex-1 text-center">
          <p className="text-white font-semibold">
            {weekDates[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} —{' '}
            {weekDates[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={nextWeek} className="text-slate-400 hover:text-white px-3 py-1 rounded-lg hover:bg-slate-700">
          Próxima →
        </button>
      </div>

      {/* Grade semanal */}
      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date, i) => {
          const dateStr = date.toISOString().slice(0, 10);
          const daySessions = byDate[dateStr] ?? [];
          const isToday = dateStr === new Date().toISOString().slice(0, 10);

          return (
            <div key={dateStr} className="min-h-[120px]">
              <div className={`text-center mb-2 py-1 rounded-lg ${isToday ? 'bg-green-600' : 'bg-slate-800'}`}>
                <p className="text-xs text-slate-400">{DAYS[date.getDay()]}</p>
                <p className={`text-sm font-bold ${isToday ? 'text-white' : 'text-slate-300'}`}>
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
                      <p className="text-white font-medium truncate">
                        {s.time_start?.slice(0, 5)}
                      </p>
                      <p className="text-slate-300 truncate">
                        {(s.turma as any)?.name || `Turma ${s.class_id}`}
                      </p>
                      <p className="text-slate-400">
                        {s._booked_count}/{s.capacity}
                      </p>
                      {!isCanceled && (
                        <button
                          onClick={() => handleCancelSession(s.id)}
                          className="text-red-400 hover:text-red-300 text-[10px] mt-0.5"
                        >
                          Cancelar
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
        <div className="text-center py-10 text-slate-500">
          <p>Nenhuma sessão encontrada para esta semana.</p>
          <p className="text-sm mt-2">Clique em &quot;Gerar Agenda do Mês&quot; para criar sessões.</p>
        </div>
      )}
    </div>
  );
}
