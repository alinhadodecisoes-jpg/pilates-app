'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const res = await fetch(`/api/pilates/professor?professorId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setClasses((data.classes ?? []) as MyClass[]);
          setStudentCount(data.studentCount ?? 0);
          setPendingRequests((data.pendingRequests ?? []) as unknown as PendingRequest[]);
        }
      } catch (err) {
        console.error('[ERROR]:', err);
      }
      setLoading(false);
    };

    if (!authLoading) fetchData();
  }, [authLoading, user]);

  const handleApprove = async (req: PendingRequest) => {
    if (!user) return;
    setApproving(req.id);
    await fetch('/api/pilates/reposicoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', request_id: req.id, reviewer_id: user.id }),
    });
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: req.user_id,
          type: 'reposicao_aprovada',
          title: 'Reposição Aprovada!',
          body: `Sua reposição foi aprovada para ${req.reposition_slots?.slot_date} às ${req.reposition_slots?.time_start?.slice(0, 5)}.`,
        }),
      });
    } catch { /* notificação não é crítica */ }
    setPendingRequests((prev) => prev.filter((r) => r.id !== req.id));
    setApproving(null);
  };

  const handleReject = async (reqId: number) => {
    if (!user) return;
    await fetch('/api/pilates/reposicoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', request_id: reqId, reviewer_id: user.id }),
    });
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
      <h1 className="text-2xl font-bold text-ink">Meu Dashboard</h1>

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
          <Link href="/professor/alunos" className="text-xs text-slate-400 hover:text-ink transition-colors">
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
                  <p className="text-ink font-medium text-sm">{c.name}</p>
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
                  <p className="text-ink text-sm font-medium">{req.users_pilates?.full_name || req.users_pilates?.email || '—'}</p>
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
                    className="text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50 text-ink px-3 py-1.5 rounded-lg transition-colors"
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
