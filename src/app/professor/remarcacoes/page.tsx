'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { Button } from '@/components/pilates/Button';

const DAYS = ['', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

interface Turma {
  id: number;
  name: string;
  day_of_week: number;
  time_start: string;
  time_end: string;
}
interface Enrollment {
  class_id: number;
  user_id: string;
  full_name: string | null;
}
interface ReschedReq {
  id: number;
  class_id: number;
  scope: 'turma' | 'aluno';
  aluno_id: string | null;
  original_date: string;
  new_date: string;
  new_time_start: string | null;
  new_time_end: string | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  classes_pilates?: { name: string } | null;
}

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-600/20 text-yellow-400' },
  approved: { label: 'Aprovada', color: 'bg-green-600/20 text-green-400' },
  rejected: { label: 'Recusada', color: 'bg-red-600/20 text-red-400' },
};

export default function ProfessorRemarcacoesPage() {
  const { user, loading: authLoading } = usePilatesAuth();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [requests, setRequests] = useState<ReschedReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [needsMigration, setNeedsMigration] = useState(false);

  // Formulário
  const [classId, setClassId] = useState('');
  const [scope, setScope] = useState<'turma' | 'aluno'>('turma');
  const [alunoId, setAlunoId] = useState('');
  const [originalDate, setOriginalDate] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTimeStart, setNewTimeStart] = useState('');
  const [newTimeEnd, setNewTimeEnd] = useState('');
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/pilates/remarcacoes?professorId=${user.id}`);
      const d = await r.json();
      setTurmas(d.turmas ?? []);
      setEnrollments(d.enrollments ?? []);
      setRequests(d.requests ?? []);
      setNeedsMigration(!!d.needsMigration);
    } catch {
      setError('Erro ao carregar.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) load();
    else if (!authLoading) setLoading(false);
  }, [authLoading, user, load]);

  // Ao escolher a turma, sugere o horário atual dela como novo horário (editável)
  const onPickTurma = (id: string) => {
    setClassId(id);
    setAlunoId('');
    const t = turmas.find((x) => String(x.id) === id);
    if (t) {
      setNewTimeStart(t.time_start?.slice(0, 5) ?? '');
      setNewTimeEnd(t.time_end?.slice(0, 5) ?? '');
    }
  };

  const alunosDaTurma = enrollments.filter((e) => String(e.class_id) === classId);

  const submit = async () => {
    setError(null);
    setOk(null);
    if (!classId || !originalDate || !newDate) {
      setError('Escolha a turma, a data da aula e a nova data.');
      return;
    }
    if (scope === 'aluno' && !alunoId) {
      setError('Escolha o aluno para a remarcação individual.');
      return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/pilates/remarcacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          professor_id: user?.id,
          class_id: classId,
          scope,
          aluno_id: alunoId || null,
          original_date: originalDate,
          new_date: newDate,
          new_time_start: newTimeStart || null,
          new_time_end: newTimeEnd || null,
          reason: reason || null,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Erro');
      setOk('Solicitação enviada ao administrador!');
      setClassId(''); setScope('turma'); setAlunoId(''); setOriginalDate(''); setNewDate('');
      setNewTimeStart(''); setNewTimeEnd(''); setReason('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao enviar.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-ink">Remarcação de Aula</h1>
        <p className="text-sm text-slate-400 mt-1">Peça para remarcar uma aula — para a turma inteira ou para um aluno específico. O administrador aprova.</p>
      </div>

      {needsMigration && (
        <p className="text-sm text-amber-300 bg-amber-900/20 border border-amber-800 rounded-lg px-4 py-3">
          ⚠️ A funcionalidade precisa que o administrador rode o SQL (tabela <code>class_reschedule_requests</code>).
        </p>
      )}
      {error && <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-4 py-3">⚠️ {error}</p>}
      {ok && <p className="text-sm text-green-400 bg-green-900/20 border border-green-800 rounded-lg px-4 py-3">✅ {ok}</p>}

      {/* Formulário */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Turma</label>
          <select value={classId} onChange={(e) => onPickTurma(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Selecione a turma...</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>{t.name} · {DAYS[t.day_of_week]} {t.time_start?.slice(0, 5)}</option>
            ))}
          </select>
          {turmas.length === 0 && <p className="text-xs text-slate-500 mt-1">Você ainda não tem turmas atribuídas.</p>}
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Remarcar para</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setScope('turma')} className={`py-2 rounded-lg text-sm font-medium border transition-colors ${scope === 'turma' ? 'bg-green-600 text-ink border-green-600' : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'}`}>Turma inteira</button>
            <button type="button" onClick={() => setScope('aluno')} className={`py-2 rounded-lg text-sm font-medium border transition-colors ${scope === 'aluno' ? 'bg-green-600 text-ink border-green-600' : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'}`}>Um aluno</button>
          </div>
        </div>

        {scope === 'aluno' && (
          <div>
            <label className="block text-sm text-slate-400 mb-1">Aluno</label>
            <select value={alunoId} onChange={(e) => setAlunoId(e.target.value)} disabled={!classId} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50">
              <option value="">{classId ? 'Selecione o aluno...' : 'Escolha a turma primeiro'}</option>
              {alunosDaTurma.map((a) => (
                <option key={a.user_id} value={a.user_id}>{a.full_name || a.user_id.slice(0, 8)}</option>
              ))}
            </select>
            {classId && alunosDaTurma.length === 0 && <p className="text-xs text-slate-500 mt-1">Nenhum aluno matriculado nesta turma.</p>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Data da aula a remarcar</label>
            <input type="date" value={originalDate} onChange={(e) => setOriginalDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nova data</label>
            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Novo horário (início)</label>
            <input type="time" value={newTimeStart} onChange={(e) => setNewTimeStart(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Novo horário (fim)</label>
            <input type="time" value={newTimeEnd} onChange={(e) => setNewTimeEnd(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Motivo (opcional)</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Ex.: feriado, imprevisto, consulta..." className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>

        <div className="flex justify-end">
          <Button variant="primary" size="md" onClick={submit} disabled={saving || needsMigration}>
            {saving ? 'Enviando...' : 'Solicitar remarcação'}
          </Button>
        </div>
      </div>

      {/* Histórico */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700"><h2 className="text-green-400 font-semibold">Minhas solicitações</h2></div>
        {requests.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">Nenhuma solicitação ainda.</div>
        ) : (
          <div className="divide-y divide-slate-700">
            {requests.map((r) => {
              const cfg = STATUS_CFG[r.status] ?? STATUS_CFG.pending;
              return (
                <div key={r.id} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-ink text-sm font-medium truncate">
                      {r.classes_pilates?.name || `Turma ${r.class_id}`} · {r.scope === 'turma' ? 'turma inteira' : 'aluno'}
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {r.original_date} → {r.new_date}{r.new_time_start ? ` às ${r.new_time_start.slice(0, 5)}` : ''}
                    </p>
                    {r.reason && <p className="text-slate-500 text-xs mt-0.5 truncate">{r.reason}</p>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${cfg.color}`}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
