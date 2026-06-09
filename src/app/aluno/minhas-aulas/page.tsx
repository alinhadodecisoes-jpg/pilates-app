'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { ConfirmDialog } from '@/components/pilates/ConfirmDialog';

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const MOCK_AULAS = [
  { id: 1, data: '2026-06-11', horario: '09:00–10:00', professor: 'Ana Clara', local: 'Sala 1', status: 'present' },
  { id: 2, data: '2026-06-13', horario: '18:00–19:00', professor: 'Daiana', local: 'Sala 2', status: 'present' },
  { id: 3, data: '2026-06-18', horario: '09:00–10:00', professor: 'Ana Clara', local: 'Sala 1', status: 'absent' },
  { id: 4, data: '2026-06-20', horario: '18:00–19:00', professor: 'Daiana', local: 'Sala 2', status: 'replacement' },
];

const statusConfig = {
  present:             { label: 'Confirmada', color: 'bg-green-600/20 text-green-400',   icon: '✅' },
  absent:              { label: 'Ausente',    color: 'bg-red-600/20 text-red-400',       icon: '❌' },
  canceled_in_advance: { label: 'Cancelada',  color: 'bg-slate-600/20 text-slate-400',   icon: '🚫' },
  replacement:         { label: 'Reposição',  color: 'bg-yellow-600/20 text-yellow-400', icon: '⭐' },
};

export default function MinhasAulasPage() {
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<number | null>(null);
  const [canceling, setCanceling] = useState(false);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login');
      else setLoading(false);
    });
  }, [router, supabase]);

  const handleCancel = async () => {
    setCanceling(true);
    // TODO: Chamar cancelarAula() da pilates-db
    await new Promise(r => setTimeout(r, 800));
    setCanceling(false);
    setCancelTarget(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Minhas Aulas</h1>

      {MOCK_AULAS.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
          <p className="text-slate-400">Você não tem aulas marcadas. Marque uma reposição!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {MOCK_AULAS.map((aula) => {
            const st = statusConfig[aula.status as keyof typeof statusConfig];
            return (
              <div
                key={aula.id}
                className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-slate-700 rounded-lg p-2 text-center min-w-[56px]">
                    <p className="text-[10px] text-slate-400">
                      {new Date(aula.data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase()}
                    </p>
                    <p className="text-lg font-bold text-white">
                      {new Date(aula.data + 'T00:00:00').getDate()}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{aula.horario}</p>
                    <p className="text-sm text-slate-400">{aula.professor} · {aula.local}</p>
                    <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full ${st.color}`}>
                      {st.icon} {st.label}
                    </span>
                  </div>
                </div>
                {aula.status === 'present' && (
                  <button
                    onClick={() => setCancelTarget(aula.id)}
                    className="text-sm text-red-400 hover:text-red-300 border border-red-800 hover:border-red-500 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Cancelar Aula
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {cancelTarget !== null && (
        <ConfirmDialog
          title="Cancelar Aula"
          message="Tem certeza que deseja cancelar esta aula? Você pode cancelar com até 24h de antecedência para ganhar uma reposição."
          confirmText="Sim, cancelar"
          onConfirm={handleCancel}
          onCancel={() => setCancelTarget(null)}
          loading={canceling}
        />
      )}
    </div>
  );
}
