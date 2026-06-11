'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { getClassesWithEnrolledCount, createClass, updateClass, deleteClass } from '@/lib/pilates/pilates-db';
import { Modal } from '@/components/pilates/Modal';
import { Button } from '@/components/pilates/Button';
import { ConfirmDialog } from '@/components/pilates/ConfirmDialog';
import type { PilatesClass, PilatesUser } from '@/types/pilates';

// day_of_week no banco: 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb, 7=Dom
const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

interface EnrolledStudent {
  user_id: string;
  users_pilates: { full_name: string | null; email: string | null } | null;
}

export default function TurmasPage() {
  const { user, loading: authLoading } = usePilatesAuth();
  const [classes, setClasses] = useState<PilatesClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<PilatesClass | null>(null);
  const [editMode, setEditMode] = useState<'create' | 'edit' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Modal Gerenciar Alunos
  const [enrollClass, setEnrollClass] = useState<PilatesClass | null>(null);
  const [allAlunos, setAllAlunos] = useState<PilatesUser[]>([]);
  const [enrolled, setEnrolled] = useState<EnrolledStudent[]>([]);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const [professors, setProfessors] = useState<{ id: string; full_name: string | null; email: string | null }[]>([]);

  const [form, setForm] = useState({
    name: '',
    day_of_week: 1,
    time_start: '09:00',
    time_end: '10:00',
    capacity: 4,
    is_active: true,
    professor_id: '' as string,
  });

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (!authLoading) {
      getClassesWithEnrolledCount()
        .then(setClasses)
        .catch(console.error)
        .finally(() => setLoading(false));
      fetch('/api/pilates/professores')
        .then((r) => (r.ok ? r.json() : []))
        .then(setProfessors)
        .catch(console.error);
    }
  }, [authLoading]);

  const openCreate = () => {
    setForm({ name: '', day_of_week: 1, time_start: '09:00', time_end: '10:00', capacity: 4, is_active: true, professor_id: '' });
    setEditMode('create');
  };

  const openEdit = (c: PilatesClass) => {
    setSelectedClass(c);
    setForm({ name: c.name, day_of_week: c.day_of_week, time_start: c.time_start, time_end: c.time_end, capacity: c.capacity, is_active: c.is_active, professor_id: (c as { professor_id?: string }).professor_id ?? '' });
    setEditMode('edit');
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (editMode === 'create') {
        const nova = await createClass(form.professor_id || user.id, form.name, form.day_of_week, form.time_start, form.time_end, form.capacity);
        setClasses((prev) => [...prev, { ...nova, enrolled_count: 0 }]);
      } else if (editMode === 'edit' && selectedClass) {
        const updated = await updateClass(selectedClass.id, { ...form, professor_id: form.professor_id || null } as Partial<PilatesClass>);
        setClasses((prev) =>
          prev.map((c) =>
            c.id === updated.id ? { ...updated, enrolled_count: c.enrolled_count } : c
          )
        );
      }
      setEditMode(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteClass(deleteTarget);
      setClasses((prev) => prev.filter((c) => c.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  // ===== GERENCIAR ALUNOS =====
  const openEnrollModal = useCallback(async (c: PilatesClass) => {
    setEnrollClass(c);
    setEnrollError(null);
    setEnrollLoading(true);
    try {
      const res = await fetch(`/api/pilates/turmas/${c.id}/alunos`);
      if (!res.ok) throw new Error('Erro ao carregar alunos');
      const data = await res.json();
      setAllAlunos((data.alunos ?? []) as PilatesUser[]);
      setEnrolled((data.enrolled ?? []) as unknown as EnrolledStudent[]);
    } catch (err) {
      console.error(err);
      setEnrollError('Erro ao carregar alunos da turma.');
    } finally {
      setEnrollLoading(false);
    }
  }, []);

  const handleEnroll = async (userId: string) => {
    if (!enrollClass) return;
    if (enrolled.length >= enrollClass.capacity) {
      setEnrollError(`Turma lotada (capacidade: ${enrollClass.capacity}).`);
      return;
    }
    setEnrollError(null);
    const res = await fetch(`/api/pilates/turmas/${enrollClass.id}/alunos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const data = await res.json();
      setEnrollError(data.error || 'Erro ao matricular');
      return;
    }
    const aluno = allAlunos.find((a) => a.id === userId);
    setEnrolled((prev) => [
      ...prev,
      { user_id: userId, users_pilates: { full_name: aluno?.full_name ?? null, email: aluno?.email ?? null } },
    ]);
    setClasses((prev) =>
      prev.map((c) => c.id === enrollClass.id ? { ...c, enrolled_count: (c.enrolled_count ?? 0) + 1 } : c)
    );
  };

  const handleUnenroll = async (userId: string) => {
    if (!enrollClass) return;
    setEnrollError(null);
    const res = await fetch(`/api/pilates/turmas/${enrollClass.id}/alunos`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const data = await res.json();
      setEnrollError(data.error || 'Erro ao desmatricular');
      return;
    }
    setEnrolled((prev) => prev.filter((e) => e.user_id !== userId));
    setClasses((prev) =>
      prev.map((c) => c.id === enrollClass.id ? { ...c, enrolled_count: Math.max(0, (c.enrolled_count ?? 1) - 1) } : c)
    );
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const byDay: Record<number, PilatesClass[]> = {};
  classes.forEach((c) => {
    if (!byDay[c.day_of_week]) byDay[c.day_of_week] = [];
    byDay[c.day_of_week].push(c);
  });

  const enrolledIds = new Set(enrolled.map((e) => e.user_id));
  const availableAlunos = allAlunos.filter((a) => !enrolledIds.has(a.id));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Gestão de Turmas</h1>
        <Button variant="primary" size="md" onClick={openCreate}>+ Nova Turma</Button>
      </div>

      {/* Grid Semanal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {DAYS.map((dayName, idx) => {
          const dayClasses = byDay[idx + 1] ?? [];
          return (
            <div key={idx} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="px-4 py-3 bg-slate-700/50 border-b border-slate-700 flex items-center justify-between">
                <h3 className="font-semibold text-white">{dayName}</h3>
                <span className="text-xs text-slate-400">{dayClasses.length} turma(s)</span>
              </div>
              <div className="p-3 space-y-2">
                {dayClasses.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">Sem turmas</p>
                ) : (
                  dayClasses.map((c) => (
                    <div
                      key={c.id}
                      className={`p-3 rounded-lg border ${
                        c.is_active ? 'border-slate-600 bg-slate-700/50' : 'border-slate-700 bg-slate-800/50 opacity-50'
                      }`}
                    >
                      <p className="font-medium text-white text-sm">{c.time_start?.slice(0, 5)}–{c.time_end?.slice(0, 5)}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{c.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{c.enrolled_count ?? 0}/{c.capacity} alunos</p>
                      <div className="flex gap-1 mt-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="text-xs text-slate-400 hover:text-white bg-slate-600/50 hover:bg-slate-600 px-2 py-1 rounded transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => openEnrollModal(c)}
                          className="text-xs text-green-400 hover:text-white bg-green-900/30 hover:bg-green-600 px-2 py-1 rounded transition-colors"
                        >
                          👥 Alunos
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Criar/Editar */}
      {editMode && (
        <Modal
          title={editMode === 'create' ? 'Nova Turma' : 'Editar Turma'}
          onClose={() => setEditMode(null)}
          onConfirm={handleSave}
          confirmText="Salvar"
          loading={saving}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nome da Turma</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ex: Pilates Solo"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Professor</label>
              <select value={form.professor_id} onChange={(e) => setForm({ ...form, professor_id: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Sem professor</option>
                {professors.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Dia</label>
                <select value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  {DAYS.map((d, i) => <option key={i + 1} value={i + 1}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Capacidade</label>
                <input type="number" min={1} max={20} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Início</label>
                <input type="time" value={form.time_start} onChange={(e) => setForm({ ...form, time_start: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Fim</label>
                <input type="time" value={form.time_end} onChange={(e) => setForm({ ...form, time_end: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            {editMode === 'edit' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 accent-green-500"
                />
                <span className="text-sm text-slate-300">Turma ativa</span>
              </label>
            )}
            {editMode === 'edit' && selectedClass && (
              <div className="pt-2 border-t border-slate-700">
                <Button variant="danger" size="sm" onClick={() => { setEditMode(null); setDeleteTarget(selectedClass.id); }}>Deletar esta turma</Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal Gerenciar Alunos */}
      {enrollClass && (
        <Modal
          title={`👥 Alunos — ${enrollClass.name}`}
          onClose={() => setEnrollClass(null)}
          onConfirm={() => setEnrollClass(null)}
          confirmText="Fechar"
          loading={false}
        >
          {enrollLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-5">
              {enrollError && (
                <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
                  ⚠️ {enrollError}
                </p>
              )}

              {/* Matriculados */}
              <div>
                <h3 className="text-sm font-semibold text-green-400 mb-2">
                  Matriculados ({enrolled.length}/{enrollClass.capacity})
                </h3>
                {enrolled.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">Nenhum aluno matriculado.</p>
                ) : (
                  <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                    {enrolled.map((e) => (
                      <div key={e.user_id} className="flex items-center justify-between bg-slate-700/50 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-white text-sm">{e.users_pilates?.full_name || '—'}</p>
                          <p className="text-slate-400 text-xs">{e.users_pilates?.email || ''}</p>
                        </div>
                        <button
                          onClick={() => handleUnenroll(e.user_id)}
                          className="text-red-400 hover:text-white text-xs bg-red-900/20 hover:bg-red-600 px-2 py-1 rounded transition-colors"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Disponíveis */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Adicionar Aluno</h3>
                {availableAlunos.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    {allAlunos.length === 0
                      ? 'Nenhum aluno ativo. Crie alunos em /admin/alunos.'
                      : 'Todos os alunos ativos já estão matriculados.'}
                  </p>
                ) : (
                  <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                    {availableAlunos.map((a) => (
                      <div key={a.id} className="flex items-center justify-between bg-slate-700/30 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-white text-sm">{a.full_name || '—'}</p>
                          <p className="text-slate-400 text-xs">{a.email || ''}</p>
                        </div>
                        <button
                          onClick={() => handleEnroll(a.id)}
                          disabled={enrolled.length >= enrollClass.capacity}
                          className="text-green-400 hover:text-white text-xs bg-green-900/20 hover:bg-green-600 px-2 py-1 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          + Matricular
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}

      {deleteTarget !== null && (
        <ConfirmDialog
          title="Deletar Turma"
          message="Deseja deletar esta turma permanentemente? Todas as matrículas e presenças associadas serão afetadas."
          confirmText="Deletar"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
