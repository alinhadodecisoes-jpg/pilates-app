'use client';

import { useState, useEffect } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Modal } from '@/components/pilates/Modal';
import { Button } from '@/components/pilates/Button';
import { ConfirmDialog } from '@/components/pilates/ConfirmDialog';
import type { PhysicalTherapySession, PilatesUser } from '@/types/pilates';

type SessionStatus = 'scheduled' | 'completed' | 'canceled';

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string }> = {
  scheduled:  { label: 'Agendada',   color: 'bg-blue-600/20 text-blue-400' },
  completed:  { label: 'Concluída',  color: 'bg-green-600/20 text-green-400' },
  canceled:   { label: 'Cancelada',  color: 'bg-red-600/20 text-red-400' },
};

interface SessionForm {
  user_id: string;
  therapist_id: string;
  session_date: string;
  therapy_type: string;
  duration_minutes: string;
  cost: string;
  status: SessionStatus;
  notes: string;
}

const EMPTY_FORM: SessionForm = {
  user_id: '',
  therapist_id: '',
  session_date: new Date().toISOString().slice(0, 10),
  therapy_type: '',
  duration_minutes: '60',
  cost: '',
  status: 'scheduled',
  notes: '',
};

export default function FisioterapiaAdminPage() {
  const { loading: authLoading } = usePilatesAuth();
  const [sessions, setSessions] = useState<PhysicalTherapySession[]>([]);
  const [alunos, setAlunos] = useState<PilatesUser[]>([]);
  const [therapists, setTherapists] = useState<PilatesUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editMode, setEditMode] = useState<'create' | 'edit' | null>(null);
  const [editSession, setEditSession] = useState<PhysicalTherapySession | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [form, setForm] = useState<SessionForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const supabase = getSupabaseBrowserClient();

  const loadData = async () => {
    const [sessionsRes, alunosRes, therapistsRes] = await Promise.all([
      supabase
        .from('physical_therapy_sessions')
        .select('*, aluno:users_pilates!user_id(full_name, email), therapist:users_pilates!therapist_id(full_name, email)')
        .order('session_date', { ascending: false }),
      supabase.from('users_pilates').select('id, full_name, email').eq('role', 'aluno').order('full_name'),
      supabase.from('users_pilates').select('id, full_name, email').eq('role', 'fisioterapeuta').order('full_name'),
    ]);

    if (!sessionsRes.error) setSessions(sessionsRes.data as PhysicalTherapySession[]);
    if (!alunosRes.error) setAlunos(alunosRes.data as PilatesUser[]);
    if (!therapistsRes.error) setTherapists(therapistsRes.data as PilatesUser[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading) loadData();
  }, [authLoading]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditSession(null);
    setEditMode('create');
  };

  const openEdit = (s: PhysicalTherapySession) => {
    setEditSession(s);
    setForm({
      user_id: s.user_id,
      therapist_id: s.therapist_id ?? '',
      session_date: s.session_date.slice(0, 10),
      therapy_type: s.therapy_type ?? '',
      duration_minutes: String(s.duration_minutes ?? 60),
      cost: s.cost != null ? String(s.cost) : '',
      status: s.status,
      notes: s.notes ?? '',
    });
    setEditMode('edit');
  };

  const handleSave = async () => {
    if (!form.user_id) return;
    setSaving(true);
    try {
      const payload = {
        user_id: form.user_id,
        therapist_id: form.therapist_id || null,
        session_date: form.session_date,
        therapy_type: form.therapy_type || null,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
        cost: form.cost ? Number(form.cost) : null,
        status: form.status,
        notes: form.notes || null,
      };

      if (editMode === 'create') {
        const { data, error } = await supabase
          .from('physical_therapy_sessions')
          .insert(payload)
          .select()
          .single();
        if (!error && data) await loadData();
      } else if (editMode === 'edit' && editSession) {
        const { error } = await supabase
          .from('physical_therapy_sessions')
          .update(payload)
          .eq('id', editSession.id);
        if (!error) await loadData();
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
      await supabase.from('physical_therapy_sessions').delete().eq('id', deleteTarget);
      setSessions((prev) => prev.filter((s) => s.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filtered = filterStatus === 'all'
    ? sessions
    : sessions.filter((s) => s.status === filterStatus);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Sessões de Fisioterapia</h1>
        <Button variant="primary" size="md" onClick={openCreate}>+ Nova Sessão</Button>
      </div>

      {/* Filtro */}
      <div className="flex gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
        >
          <option value="all">Todos os Status</option>
          <option value="scheduled">Agendadas</option>
          <option value="completed">Concluídas</option>
          <option value="canceled">Canceladas</option>
        </select>
        <span className="text-sm text-slate-400 self-center">{filtered.length} sessão(ões)</span>
      </div>

      {/* Tabela */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="px-5 py-3 text-slate-400 font-medium">Aluno</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Fisioterapeuta</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Data</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Tipo</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Custo</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Status</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                    Nenhuma sessão encontrada.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.scheduled;
                  return (
                    <tr key={s.id} className="hover:bg-slate-750 transition-colors">
                      <td className="px-5 py-4 text-white">
                        {(s.aluno as any)?.full_name || (s.aluno as any)?.email || '—'}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {(s.therapist as any)?.full_name || (s.therapist as any)?.email || '—'}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {new Date(s.session_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-5 py-4 text-slate-300">{s.therapy_type ?? '—'}</td>
                      <td className="px-5 py-4 text-slate-300">
                        {s.cost != null ? `R$ ${Number(s.cost).toFixed(2)}` : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={() => openEdit(s)}>Editar</Button>
                          <Button variant="danger" size="sm" onClick={() => setDeleteTarget(s.id)}>Deletar</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar/Editar */}
      {editMode && (
        <Modal
          title={editMode === 'create' ? 'Nova Sessão' : 'Editar Sessão'}
          onClose={() => setEditMode(null)}
          onConfirm={handleSave}
          confirmText="Salvar"
          loading={saving}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Aluno *</label>
                <select
                  value={form.user_id}
                  onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Selecione...</option>
                  {alunos.map((a) => (
                    <option key={a.id} value={a.id}>{a.full_name || a.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Fisioterapeuta</label>
                <select
                  value={form.therapist_id}
                  onChange={(e) => setForm({ ...form, therapist_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Nenhum</option>
                  {therapists.map((t) => (
                    <option key={t.id} value={t.id}>{t.full_name || t.email}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Data</label>
                <input
                  type="date"
                  value={form.session_date}
                  onChange={(e) => setForm({ ...form, session_date: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as SessionStatus })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="scheduled">Agendada</option>
                  <option value="completed">Concluída</option>
                  <option value="canceled">Cancelada</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Tipo de Terapia</label>
                <input
                  value={form.therapy_type}
                  onChange={(e) => setForm({ ...form, therapy_type: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: RPG, Pilates Clínico"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Duração (min)</label>
                <input
                  type="number"
                  min={15}
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Custo (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Observações</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                placeholder="Notas opcionais..."
              />
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget !== null && (
        <ConfirmDialog
          title="Deletar Sessão"
          message="Deseja deletar esta sessão de fisioterapia?"
          confirmText="Deletar"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
