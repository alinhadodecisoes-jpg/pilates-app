'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';

const DAYS = ['', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

interface MyClass {
  id: number;
  name: string;
  day_of_week: number;
  time_start: string;
  time_end: string;
  capacity: number;
  is_active: boolean;
}

interface PendingRequest {
  id: number;
  user_id: string;
  slot_id: number;
  status: string;
  requested_at: string;
  users_pilates?: { full_name: string | null; email: string | null } | null;
  reposition_slots?: { slot_date: string; time_start: string; time_end: string } | null;
}

export default function ProfessorDashboard() {
  const { user, role, loading: authLoading } = usePilatesAuth();
  const [classes, setClasses] = useState<MyClass[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<number | null>(null);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // Minhas turmas
        const { data: classesData } = await supabase
          .from('classes_pilates')
          .select('*')
          .eq('professor_id', user.id)
          .eq('is_active', true)
          .order('day_of_week')
          .order('time_start');
        setClasses((classesData ?? []) as MyClass[]);

        // Contagem de alunos matriculados nas minhas turmas
        if (classesData && classesData.length > 0) {
          const classIds = classesData.map((c) => c.id);
          const { count } = await supabase
            .from('enrollments_pilates')
            .select('id', { count: 'exact', head: true })
            .in('class_id', classIds);
          setStudentCount(count ?? 0);
        }

        // Solicitações de reposição dos alunos das minhas turmas (pendentes)
        const { data: reqs } = await supabase
          .from('reposition_requests')
          .select('id, user_id, slot_id, status, requested_at, users_pilates(full_name, email), reposition_slots(slot_date, time_start, time_end)')
          .eq('status', 'pending')
          .order('requested_at', { ascending: true });
        setPendingRequests((reqs ?? []) as unknown as PendingRequest[]);
      } catch (err) {
        console.error('[ERROR]:', err);
      }
      setLoading(false);
    };

    if (!authLoading) fetchData();
  }, [authLoading, user, supabase]);

  const handleApprove = async (req: PendingRequest) => {
    if (!user) return;
    setApproving(req.id);
    await supabase
      .from('reposition_requests')
      .update({ status: 'approved', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq('id', req.id);
    // Criar presença
    if (req.reposition_slots) {
      await supabase
        .from('attendances_pilates')
        .upsert({
          user_id: req.user_id,
          class_id: null,
          attendance_date: req.reposition_slots.slot_date,
          status: 'replacement',
          notes: `Reposição aprovada — ${req.reposition_slots.time_start?.slice(0, 5)}`,
        }, { onConflict: 'user_id,attendance_date' });
    }
    setPendingRequests((prev) => prev.filter((r) => r.id !== req.id));
    setApproving(null);
  };

  const handleReject = async (reqId: number) => {
    if (!user) return;
    await supabase
      .from('reposition_requests')
      .update({ status: 'rejected', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq('id', reqId);
    setPendingRequests((prev) => prev.filter((r) => r.id !== reqId));
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white">Meu Dashboard</h1>

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <p className="text-slate-400 text-sm">Minhas Turmas</p>
          <p className="text-3xl font-bold text-green-400 mt-1">{classes.length}</p>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <p className="text-slate-400 text-sm">Alunos Matriculados</p>
          <p className="text-3xl font-bold text-blue-400 mt-1">{studentCount}</p>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <p className="text-slate-400 text-sm">Reposições Pendentes</p>
          <p className={`text-3xl font-bold mt-1 ${pendingRequests.length > 0 ? 'text-yellow-400' : 'text-slate-500'}`}>
            {pendingRequests.length}
          </p>
        </div>
      </div>

      {/* Minhas Turmas */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-green-400 font-semibold">Minhas Turmas</h2>
          <Link href="/professor/alunos" className="text-xs text-slate-400 hover:text-white transition-colors">
            Ver alunos →
          </Link>
        </div>
        {classes.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">
            Nenhuma turma atribuída. O administrador deve vincular turmas ao seu perfil.
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {classes.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-white font-medium text-sm">{c.name}</p>
                  <p className="text-slate-400 text-xs">{DAYS[c.day_of_week]} · {c.time_start?.slice(0, 5)}–{c.time_end?.slice(0, 5)}</p>
                </div>
                <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded-full">{c.capacity} vagas</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reposições Pendentes */}
      {pendingRequests.length > 0 && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700">
            <h2 className="text-yellow-400 font-semibold">⏳ Solicitações de Reposição Pendentes</h2>
          </div>
          <div className="divide-y divide-slate-700">
            {pendingRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between px-5 py-4 gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{req.users_pilates?.full_name || req.users_pilates?.email || '—'}</p>
                  {req.reposition_slots && (
                    <p className="text-slate-400 text-xs mt-0.5">
                      {new Date(req.reposition_slots.slot_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      {' · '}{req.reposition_slots.time_start?.slice(0, 5)}–{req.reposition_slots.time_end?.slice(0, 5)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(req)}
                    disabled={approving === req.id}
                    className="text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    ✅ Aprovar
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    className="text-xs bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    ✕ Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acesso fisioterapia (prof_fisio) */}
      {role === 'prof_fisio' && (
        <div className="bg-teal-900/20 border border-teal-700/50 rounded-xl p-4">
          <p className="text-teal-400 text-sm font-semibold">
            🩺 Você tem acesso ao módulo de Fisioterapia
          </p>
          <Link href="/fisioterapeuta/dashboard" className="text-teal-300 text-xs underline mt-1 block">
            Ir para Fisioterapia →
          </Link>
        </div>
      )}
    </div>
  );
}
