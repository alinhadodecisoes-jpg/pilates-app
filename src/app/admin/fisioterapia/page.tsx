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

const PAYMENT_METHODS = ['PIX', 'Dinheiro', 'Cartão de crédito', 'Cartão de débito', 'Transferência', 'Outro'];
const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// Campos de agendamento (compartilhados entre "Nova Sessão" e "Novo Paciente")
interface SchedForm {
  therapist_id: string;
  session_date: string;
  session_time: string;
  therapy_type: string;
  duration_minutes: string;
  cost: string;
  discount: string;
  paid: boolean;
  payment_method: string;
  status: SessionStatus;
  notes: string;
  repeat: boolean;
  repeat_count: string;
  frequency: 'weekly' | 'biweekly' | 'daily';
}

const EMPTY_SCHED = (): SchedForm => ({
  therapist_id: '',
  session_date: new Date().toISOString().slice(0, 10),
  session_time: '',
  therapy_type: '',
  duration_minutes: '60',
  cost: '150',
  discount: '0',
  paid: false,
  payment_method: 'PIX',
  status: 'scheduled',
  notes: '',
  repeat: false,
  repeat_count: '1',
  frequency: 'weekly',
});

interface SessionForm extends SchedForm { user_id: string; }

// Próxima data (>= hoje) que cai no dia da semana escolhido
function nextDateForWeekday(weekday: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  const diff = (weekday - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

// Bloco reutilizável de campos de agendamento
function SchedFields({ s, on, therapists, allowRepeat }: {
  s: SchedForm; on: (patch: Partial<SchedForm>) => void; therapists: Patient[]; allowRepeat: boolean;
}) {
  const inp = 'w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500';
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Fisioterapeuta</label>
          <select value={s.therapist_id} onChange={(e) => on({ therapist_id: e.target.value })} className={inp}>
            <option value="">Nenhum</option>
            {therapists.map((t) => <option key={t.id} value={t.id}>{t.full_name || t.email}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Tipo de terapia</label>
          <input value={s.therapy_type} onChange={(e) => on({ therapy_type: e.target.value })} className={inp} placeholder="Ex: RPG, Fisio motora" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Data {s.repeat ? '(1ª sessão)' : ''}</label>
          <input type="date" value={s.session_date} onChange={(e) => on({ session_date: e.target.value })} className={inp} />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Horário</label>
          <input type="time" value={s.session_time} onChange={(e) => on({ session_time: e.target.value })} className={inp} />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Duração (min)</label>
          <input type="number" min={15} value={s.duration_minutes} onChange={(e) => on({ duration_minutes: e.target.value })} className={inp} />
        </div>
      </div>

      {/* Pacote (várias sessões de uma vez) */}
      {allowRepeat && (
        <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3 space-y-3">
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input type="checkbox" checked={s.repeat} onChange={(e) => on({ repeat: e.target.checked })} className="w-4 h-4 accent-green-500" />
            Marcar várias sessões de uma vez (pacote)
          </label>
          {s.repeat && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Qtd. de sessões</label>
                <input type="number" min={1} max={60} value={s.repeat_count} onChange={(e) => on({ repeat_count: e.target.value })} className={inp} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Frequência</label>
                <select value={s.frequency} onChange={(e) => on({ frequency: e.target.value as SchedForm['frequency'] })} className={inp}>
                  <option value="weekly">Semanal (a cada 7 dias)</option>
                  <option value="biweekly">Quinzenal (a cada 14 dias)</option>
                  <option value="daily">Diária</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Dia da semana</label>
                <select value={String(new Date(s.session_date + 'T12:00:00').getDay())} onChange={(e) => on({ session_date: nextDateForWeekday(Number(e.target.value)) })} className={inp}>
                  {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
            </div>
          )}
          {s.repeat && <p className="text-xs text-slate-500">Serão criadas {s.repeat_count} sessões a partir de {new Date(s.session_date + 'T12:00:00').toLocaleDateString('pt-BR')}{s.session_time ? ` às ${s.session_time}` : ''}.</p>}
        </div>
      )}

      {/* Valor / pagamento */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Valor por sessão (R$)</label>
          <input type="number" step="0.01" min="0" value={s.cost} onChange={(e) => on({ cost: e.target.value })} className={inp} placeholder="0.00" />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Desconto (R$)</label>
          <input type="number" step="0.01" min="0" value={s.discount} onChange={(e) => on({ discount: e.target.value })} className={inp} placeholder="0.00" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 items-end">
        <div>
          <label className="flex items-center gap-2 text-sm text-slate-200 mb-2">
            <input type="checkbox" checked={s.paid} onChange={(e) => on({ paid: e.target.checked })} className="w-4 h-4 accent-green-500" />
            Já está pago
          </label>
        </div>
        {s.paid && (
          <div>
            <label className="block text-sm text-slate-400 mb-1">Forma de pagamento</label>
            <select value={s.payment_method} onChange={(e) => on({ payment_method: e.target.value })} className={inp}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Status</label>
          <select value={s.status} onChange={(e) => on({ status: e.target.value as SessionStatus })} className={inp}>
            <option value="scheduled">Agendada</option>
            <option value="completed">Concluída</option>
            <option value="canceled">Cancelada</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Observações</label>
          <input value={s.notes} onChange={(e) => on({ notes: e.target.value })} className={inp} placeholder="Notas opcionais" />
        </div>
      </div>
    </>
  );
}

export default function FisioterapiaAdminPage() {
  const { loading: authLoading } = usePilatesAuth();
  const [sessions, setSessions] = useState<PhysicalTherapySession[]>([]);
  const [alunos, setAlunos] = useState<Patient[]>([]);
  const [therapists, setTherapists] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTherapist, setFilterTherapist] = useState('all');
  const [filterWeekday, setFilterWeekday] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterTime, setFilterTime] = useState('all');

  const [editMode, setEditMode] = useState<'create' | 'edit' | null>(null);
  const [editSession, setEditSession] = useState<PhysicalTherapySession | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [form, setForm] = useState<SessionForm>({ user_id: '', ...EMPTY_SCHED() });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Novo paciente (+ agendar)
  const [showPatient, setShowPatient] = useState(false);
  const [patientForm, setPatientForm] = useState({ full_name: '', phone: '', email: '', tambem_pilates: false });
  const [agendarNovo, setAgendarNovo] = useState(false);
  const [patientSched, setPatientSched] = useState<SchedForm>(EMPTY_SCHED());
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
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { if (!authLoading) loadData(); }, [authLoading]);

  // Cria 1 sessão ou pacote para um paciente
  const createSessions = async (userId: string, s: SchedForm) => {
    const n = s.repeat ? Math.max(1, Number(s.repeat_count) || 1) : 1;
    const action = n > 1 ? 'create_sessions_bulk' : 'create_session';
    const res = await fetch('/api/pilates/fisioterapia', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action, user_id: userId, count: n, frequency: s.frequency,
        therapist_id: s.therapist_id || null, session_date: s.session_date, session_time: s.session_time || null,
        therapy_type: s.therapy_type || null, duration_minutes: s.duration_minutes || null,
        cost: s.cost || null, discount: s.discount || 0, paid: s.paid, payment_method: s.paid ? s.payment_method : null,
        status: s.status, notes: s.notes || null,
      }),
    });
    if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || 'Erro ao salvar sessão'); }
  };

  const handleCreatePatient = async () => {
    if (!patientForm.full_name) { setPatientError('Nome é obrigatório.'); return; }
    setSavingPatient(true); setPatientError('');
    try {
      const res = await fetch('/api/pilates/fisioterapia', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_patient', full_name: patientForm.full_name,
          phone: patientForm.phone || null, email: patientForm.email || null,
          create_login: false, is_physio_patient: true, is_pilates_student: patientForm.tambem_pilates,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Erro');
      // Já agendar a(s) sessão(ões) do novo paciente
      if (agendarNovo && j.patient?.id) await createSessions(j.patient.id, patientSched);
      setShowPatient(false);
      setPatientForm({ full_name: '', phone: '', email: '', tambem_pilates: false });
      setAgendarNovo(false); setPatientSched(EMPTY_SCHED());
      await loadData();
    } catch (e: unknown) {
      setPatientError(e instanceof Error ? e.message : 'Erro');
    } finally { setSavingPatient(false); }
  };

  const openCreate = () => { setForm({ user_id: '', ...EMPTY_SCHED() }); setEditSession(null); setEditMode('create'); };

  const openEdit = (s: PhysicalTherapySession) => {
    setEditSession(s);
    setForm({
      user_id: s.user_id,
      therapist_id: s.therapist_id ?? '',
      session_date: s.session_date.slice(0, 10),
      session_time: s.session_time ? s.session_time.slice(0, 5) : '',
      therapy_type: s.therapy_type ?? '',
      duration_minutes: String(s.duration_minutes ?? 60),
      cost: s.cost != null ? String(s.cost) : '',
      discount: s.discount != null ? String(s.discount) : '0',
      paid: !!s.paid,
      payment_method: s.payment_method ?? 'PIX',
      status: s.status,
      notes: s.notes ?? '',
      repeat: false, repeat_count: '1', frequency: 'weekly',
    });
    setEditMode('edit');
  };

  const handleSave = async () => {
    if (!form.user_id) { return; }
    setSaving(true);
    try {
      if (editMode === 'edit') {
        await fetch('/api/pilates/fisioterapia', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_session', id: editSession?.id, user_id: form.user_id,
            therapist_id: form.therapist_id || null, session_date: form.session_date, session_time: form.session_time || null,
            therapy_type: form.therapy_type || null, duration_minutes: form.duration_minutes || null,
            cost: form.cost || null, discount: form.discount || 0, paid: form.paid,
            payment_method: form.paid ? form.payment_method : null, status: form.status, notes: form.notes || null,
          }),
        });
      } else {
        await createSessions(form.user_id, form);
      }
      await loadData();
      setEditMode(null);
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/pilates/fisioterapia?sessionId=${deleteTarget}`, { method: 'DELETE' });
      setSessions((prev) => prev.filter((s) => s.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) { console.error(err); } finally { setDeleting(false); }
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  // Horários distintos p/ o filtro
  const times = [...new Set(sessions.map((s) => s.session_time?.slice(0, 5)).filter(Boolean))].sort();

  const filtered = sessions.filter((s) => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (filterTherapist !== 'all' && (s.therapist_id ?? '') !== filterTherapist) return false;
    if (filterDate && s.session_date.slice(0, 10) !== filterDate) return false;
    if (filterWeekday !== 'all' && new Date(s.session_date.slice(0, 10) + 'T12:00:00').getDay() !== Number(filterWeekday)) return false;
    if (filterTime !== 'all' && s.session_time?.slice(0, 5) !== filterTime) return false;
    return true;
  });

  const selCls = 'bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Sessões de Fisioterapia</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="md" onClick={() => { setPatientError(''); setAgendarNovo(false); setPatientSched(EMPTY_SCHED()); setShowPatient(true); }}>+ Novo Paciente</Button>
          <Button variant="primary" size="md" onClick={openCreate}>+ Nova Sessão</Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selCls}>
          <option value="all">Todos os Status</option>
          <option value="scheduled">Agendadas</option>
          <option value="completed">Concluídas</option>
          <option value="canceled">Canceladas</option>
        </select>
        <select value={filterTherapist} onChange={(e) => setFilterTherapist(e.target.value)} className={selCls}>
          <option value="all">Todos fisioterapeutas</option>
          {therapists.map((t) => <option key={t.id} value={t.id}>{t.full_name || t.email}</option>)}
        </select>
        <select value={filterWeekday} onChange={(e) => setFilterWeekday(e.target.value)} className={selCls}>
          <option value="all">Todo dia da semana</option>
          {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
        </select>
        <select value={filterTime} onChange={(e) => setFilterTime(e.target.value)} className={selCls}>
          <option value="all">Todo horário</option>
          {times.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className={selCls} />
        {(filterStatus !== 'all' || filterTherapist !== 'all' || filterWeekday !== 'all' || filterTime !== 'all' || filterDate) && (
          <button onClick={() => { setFilterStatus('all'); setFilterTherapist('all'); setFilterWeekday('all'); setFilterTime('all'); setFilterDate(''); }} className="text-xs text-slate-400 hover:text-white underline">limpar filtros</button>
        )}
        <span className="text-sm text-slate-400 self-center">{filtered.length} sessão(ões)</span>
      </div>

      {/* Tabela */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="px-5 py-3 text-slate-400 font-medium">Paciente</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Fisioterapeuta</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Data</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Horário</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Tipo</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Valor</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Pago</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Status</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-slate-500">Nenhuma sessão encontrada.</td></tr>
              ) : (
                filtered.map((s) => {
                  const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.scheduled;
                  const liquido = Math.max(0, (Number(s.cost) || 0) - (Number(s.discount) || 0));
                  return (
                    <tr key={s.id} className="hover:bg-slate-750 transition-colors">
                      <td className="px-5 py-4 text-white">{s.aluno?.full_name || s.aluno?.email || '—'}</td>
                      <td className="px-5 py-4 text-slate-300">{s.therapist?.full_name || s.therapist?.email || '—'}</td>
                      <td className="px-5 py-4 text-slate-300">{new Date(s.session_date.slice(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                      <td className="px-5 py-4 text-slate-300">{s.session_time ? s.session_time.slice(0, 5) : '—'}</td>
                      <td className="px-5 py-4 text-slate-300">{s.therapy_type ?? '—'}</td>
                      <td className="px-5 py-4 text-slate-300">
                        {s.cost != null ? `R$ ${liquido.toFixed(2)}` : '—'}
                        {Number(s.discount) > 0 && <span className="block text-[10px] text-slate-500">desc. R$ {Number(s.discount).toFixed(2)}</span>}
                      </td>
                      <td className="px-5 py-4">
                        {s.paid
                          ? <span className="text-xs px-2 py-1 rounded-full bg-green-600/20 text-green-400">{s.payment_method || 'Pago'}</span>
                          : <span className="text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-400">Em aberto</span>}
                      </td>
                      <td className="px-5 py-4"><span className={`text-xs px-2 py-1 rounded-full ${cfg.color}`}>{cfg.label}</span></td>
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

      {/* Modal Criar/Editar Sessão */}
      {editMode && (
        <Modal
          title={editMode === 'create' ? 'Nova Sessão' : 'Editar Sessão'}
          onClose={() => setEditMode(null)}
          onConfirm={handleSave}
          confirmText={editMode === 'create' && form.repeat ? `Agendar ${form.repeat_count} sessões` : 'Salvar'}
          loading={saving}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Paciente *</label>
              <select value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Selecione...</option>
                {alunos.map((a) => (
                  <option key={a.id} value={a.id}>{a.full_name || a.email}{a.tipo === 'fisio' ? ' (só fisio)' : a.tipo === 'ambos' ? ' (pilates+fisio)' : ''}</option>
                ))}
              </select>
            </div>
            <SchedFields s={form} on={(p) => setForm({ ...form, ...p })} therapists={therapists} allowRepeat={editMode === 'create'} />
          </div>
        </Modal>
      )}

      {/* Modal Novo Paciente (+ agendar) */}
      {showPatient && (
        <Modal
          title="Novo Paciente de Fisioterapia"
          onClose={() => setShowPatient(false)}
          onConfirm={handleCreatePatient}
          confirmText={agendarNovo ? 'Cadastrar e agendar' : 'Cadastrar Paciente'}
          loading={savingPatient}
          size="lg"
        >
          <div className="space-y-4">
            {patientError && <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-4 py-2">{patientError}</p>}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nome completo *</label>
              <input value={patientForm.full_name} onChange={(e) => setPatientForm({ ...patientForm, full_name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Nome do paciente" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Telefone</label>
                <input value={patientForm.phone} onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="(21) 99999-9999" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email (opcional)</label>
                <input type="email" value={patientForm.email} onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="email@exemplo.com" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={patientForm.tambem_pilates} onChange={(e) => setPatientForm({ ...patientForm, tambem_pilates: e.target.checked })} className="w-4 h-4 accent-green-500" />
              Também é aluno de pilates (faz os dois)
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-200 pt-2 border-t border-slate-700">
              <input type="checkbox" checked={agendarNovo} onChange={(e) => setAgendarNovo(e.target.checked)} className="w-4 h-4 accent-green-500" />
              Já agendar sessão(ões) para este paciente
            </label>
            {agendarNovo && (
              <div className="space-y-4 rounded-lg border border-slate-700 bg-slate-900/30 p-3">
                <SchedFields s={patientSched} on={(p) => setPatientSched({ ...patientSched, ...p })} therapists={therapists} allowRepeat />
              </div>
            )}
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
