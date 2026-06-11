'use client';

import { useState, useEffect } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { Modal } from '@/components/pilates/Modal';
import { Button } from '@/components/pilates/Button';
import { ConfirmDialog } from '@/components/pilates/ConfirmDialog';
import type { PhysicalTherapySession } from '@/types/pilates';

interface Patient {
  id: string;
  full_name: string | null;
  email: string | null;
  tipo?: 'pilates' | 'fisio' | 'ambos';
}

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
  const [alunos, setAlunos] = useState<Patient[]>([]);
  const [therapists, setTherapists] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editMode, setEditMode] = useState<'create' | 'edit' | null>(null);
  const [editSession, setEditSession] = useState<PhysicalTherapySession | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [form, setForm] = useState<SessionForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Cadastro de paciente só-fisio / ambos
  const [showPatient, setShowPatient] = useState(false);
  const [patientForm, setPatientForm] = useState({ full_name: '', phone: '', email: '', tambem_pilates: false });
  const [savingPatient, setSavingPatient] = useState(false);
  const [patientError, setPatientError] = useState('');

  const loadData = async () => {
    try {
      const res = await fetch('/api/pilates/fisioterapia');
      if (res.ok) {
        const data = await res.json();
        setSessions((data.sessions ?? []) as PhysicalTherapySession[]);
        setAlunos((data.patients ?? []) as Patient[]);
        setTherapists((data.therapists ?? []) as Patient[]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatient = async () => {
    if (!patientForm.full_name) { setPatientError('Nome é obrigatório.'); return; }
    setSavingPatient(true);
    setPatientError('');
    try {
      const res = await fetch('/api/pilates/fisioterapia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_patient',
          full_name: patientForm.full_name,
          phone: patientForm.phone || null,
          email: patientForm.email || null,
          create_login: false,
          is_physio_patient: true,
          is_pilates_student: patientForm.tambem_pilates,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Erro');
      setShowPatient(false);
      setPatientForm({ full_name: '', phone: '', email: '', tambem_pilates: false });
      await loadData();
      if (j.patient?.id) setForm((f) => ({ ...f, user_id: j.patient.id }));
    } catch (e: unknown) {
      setPatientError(e instanceof Error ? e.message : 'Erro');
    } finally {
      setSavingPatient(false);
    }
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
      await fetch('/api/pilates/fisioterapia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: editMode === 'edit' ? 'update_session' : 'create_session',
          id: editSession?.id,
          user_id: form.user_id,
          therapist_id: form.therapist_id || null,
          session_date: form.session_date,
          therapy_type: form.therapy_type || null,
          duration_minutes: form.duration_minutes || null,
          cost: form.cost || null,
          status: form.status,
          notes: form.notes || null,
        }),
      });
      await loadData();
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
      await fetch(`/api/pilates/fisioterapia?sessionId=${deleteTarget}`, { method: 'DELETE' });
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
        <div className="flex gap-2">
          <Button variant="secondary" size="md" onClick={() => { setPatientError(''); setShowPatient(true); }}>+ Novo Paciente</Button>
          <Button variant="primary" size="md" onClick={openCreate}>+ Nova Sessão</Button>
        </div>
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
                    <option key={a.id} value={a.id}>
                      {(a.full_name || a.email)}{a.tipo === 'fisio' ? ' (só fisio)' : a.tipo === 'ambos' ? ' (pilates+fisio)' : ''}
                    </option>
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

      {/* Modal Novo Paciente (só-fisio / ambos) */}
      {showPatient && (
        <Modal
          title="Novo Paciente de Fisioterapia"
          onClose={() => setShowPatient(false)}
          onConfirm={handleCreatePatient}
          confirmText="Cadastrar Paciente"
          loading={savingPatient}
        >
          <div className="space-y-4">
            {patientError && (
              <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-4 py-2">{patientError}</p>
            )}
            <p className="text-xs text-slate-400">
              Para quem ainda não é aluno de pilates. Se já for aluno, é só selecioná-lo no campo &ldquo;Aluno&rdquo; da sessão.
            </p>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nome completo *</label>
              <input
                value={patientForm.full_name}
                onChange={(e) => setPatientForm({ ...patientForm, full_name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Nome do paciente"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Telefone</label>
                <input
                  value={patientForm.phone}
                  onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="(21) 99999-9999"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email (opcional)</label>
                <input
                  type="email"
                  value={patientForm.email}
                  onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={patientForm.tambem_pilates}
                onChange={(e) => setPatientForm({ ...patientForm, tambem_pilates: e.target.checked })}
                className="w-4 h-4 accent-green-500" />
              Também é aluno de pilates (faz os dois)
            </label>
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
