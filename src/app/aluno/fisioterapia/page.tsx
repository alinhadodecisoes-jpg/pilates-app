'use client';

import { useState, useEffect } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { PhysicalTherapySession } from '@/types/pilates';

const STATUS_CONFIG = {
  scheduled:  { label: 'Agendada',  color: 'bg-blue-600/20 text-blue-400',   icon: '📅' },
  completed:  { label: 'Concluída', color: 'bg-green-600/20 text-green-400', icon: '✅' },
  canceled:   { label: 'Cancelada', color: 'bg-red-600/20 text-red-400',     icon: '❌' },
};

export default function AlunoFisioterapiaPage() {
  const { user, loading: authLoading } = usePilatesAuth();
  const [sessions, setSessions] = useState<PhysicalTherapySession[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (!authLoading && user) {
      supabase
        .from('physical_therapy_sessions')
        .select('*, therapist:users_pilates!therapist_id(full_name, email)')
        .eq('user_id', user.id)
        .order('session_date', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) setSessions(data as PhysicalTherapySession[]);
          setLoading(false);
        });
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const proximas = sessions.filter((s) => s.status === 'scheduled');
  const historico = sessions.filter((s) => s.status !== 'scheduled');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Fisioterapia</h1>

      {sessions.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-10 border border-slate-700 text-center space-y-3">
          <p className="text-4xl">🏥</p>
          <p className="text-slate-300 font-medium">Nenhuma sessão de fisioterapia encontrada.</p>
          <p className="text-slate-500 text-sm">Fale com o seu instrutor para agendar uma sessão.</p>
        </div>
      ) : (
        <>
          {/* Próximas sessões */}
          {proximas.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-300">Próximas Sessões</h2>
              {proximas.map((s) => (
                <SessionCard key={s.id} session={s} />
              ))}
            </section>
          )}

          {/* Histórico */}
          {historico.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-300">Histórico</h2>
              {historico.map((s) => (
                <SessionCard key={s.id} session={s} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function SessionCard({ session: s }: { session: PhysicalTherapySession }) {
  const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.scheduled;
  const therapistName = (s.therapist as any)?.full_name || (s.therapist as any)?.email || null;

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-start gap-4">
      {/* Data */}
      <div className="bg-slate-700 rounded-lg p-3 text-center min-w-[60px]">
        <p className="text-[10px] text-slate-400 font-medium uppercase">
          {new Date(s.session_date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
        </p>
        <p className="text-xl font-bold text-white">
          {new Date(s.session_date + 'T00:00:00').getDate()}
        </p>
      </div>

      {/* Info */}
      <div className="flex-1">
        <p className="font-semibold text-white">{s.therapy_type || 'Fisioterapia'}</p>
        {therapistName && (
          <p className="text-sm text-slate-400">{therapistName}</p>
        )}
        <div className="flex items-center gap-3 mt-1">
          <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>
            {cfg.icon} {cfg.label}
          </span>
          {s.duration_minutes && (
            <span className="text-xs text-slate-500">{s.duration_minutes} min</span>
          )}
          {s.cost != null && (
            <span className="text-xs text-slate-500">R$ {Number(s.cost).toFixed(2)}</span>
          )}
        </div>
        {s.notes && (
          <p className="text-xs text-slate-500 mt-1">{s.notes}</p>
        )}
      </div>
    </div>
  );
}
