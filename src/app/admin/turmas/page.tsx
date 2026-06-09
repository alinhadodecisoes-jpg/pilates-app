'use client';

import { useState, useEffect } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { getClasses, createClass, updateClass, deleteClass } from '@/lib/pilates/pilates-db';
import { Modal } from '@/components/pilates/Modal';
import { Button } from '@/components/pilates/Button';
import { ConfirmDialog } from '@/components/pilates/ConfirmDialog';
import type { PilatesClass } from '@/types/pilates';

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export default function TurmasPage() {
  const { user, loading: authLoading } = usePilatesAuth();
  const [classes, setClasses] = useState<PilatesClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<PilatesClass | null>(null);
  const [editMode, setEditMode] = useState<'create' | 'edit' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    day_of_week: 0,
    time_start: '09:00',
    time_end: '10:00',
    capacity: 4,
    is_active: true,
  });

  useEffect(() => {
    if (!authLoading) {
      getClasses()
        .then(setClasses)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [authLoading]);

  const openCreate = () => {
    setForm({ name: '', day_of_week: 0, time_start: '09:00', time_end: '10:00', capacity: 4, is_active: true });
    setEditMode('create');
  };

  const openEdit = (c: PilatesClass) => {
    setSelectedClass(c);
    setForm({ name: c.name, day_of_week: c.day_of_week, time_start: c.time_start, time_end: c.time_end, capacity: c.capacity, is_active: c.is_active });
    setEditMode('edit');
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (editMode === 'create') {
        const nova = await createClass(user.id, form.name, form.day_of_week, form.time_start, form.time_end, form.capacity);
        setClasses((prev) => [...prev, nova]);
      } else if (editMode === 'edit' && selectedClass) {
        const updated = await updateClass(selectedClass.id, form);
        setClasses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
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

  if (authLoading || loading) {
    return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  // Group by day
  const byDay: Record<number, PilatesClass[]> = {};
  classes.forEach((c) => {
    if (!byDay[c.day_of_week]) byDay[c.day_of_week] = [];
    byDay[c.day_of_week].push(c);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Gestão de Turmas</h1>
        <Button variant="primary" size="md" onClick={openCreate}>+ Nova Turma</Button>
      </div>

      {/* Grid Semanal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {DAYS.map((dayName, idx) => (
          <div key={idx} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="px-4 py-3 bg-slate-700/50 border-b border-slate-700">
              <h3 className="font-semibold text-white">{dayName}</h3>
            </div>
            <div className="p-3 space-y-2">
              {(byDay[idx] ?? []).length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Sem turmas</p>
              ) : (
                (byDay[idx] ?? []).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openEdit(c)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors hover:border-green-600 ${
                      c.is_active ? 'border-slate-600 bg-slate-700/50' : 'border-slate-700 bg-slate-800/50 opacity-50'
                    }`}
                  >
                    <p className="font-medium text-white text-sm">{c.time_start}–{c.time_end}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{c.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Cap: {c.capacity}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        ))}
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Dia</label>
                <select value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
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
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 accent-green-500"
                  />
                  <span className="text-sm text-slate-300">Turma ativa</span>
                </label>
              </div>
            )}
            {editMode === 'edit' && selectedClass && (
              <div className="pt-2 border-t border-slate-700">
                <Button variant="danger" size="sm" onClick={() => { setEditMode(null); setDeleteTarget(selectedClass.id); }}>Deletar esta turma</Button>
              </div>
            )}
          </div>
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
