'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';

interface Patient {
  id: string;
  full_name: string | null;
  email: string | null;
  phone?: string | null;
  tipo?: 'pilates' | 'fisio' | 'ambos';
}

interface PhysioCase {
  id: number;
  user_id: string;
  therapist_id: string | null;
  chief_complaint: string | null;
  diagnosis: string | null;
  treatment_plan: string | null;
  start_date: string;
  status: 'active' | 'discharged' | 'paused';
  discharge_notes: string | null;
  created_at: string;
  aluno?: { full_name: string | null; email: string | null } | null;
  _evo_count?: number;
}

interface CaseForm {
  user_id: string;
  chief_complaint: string;
  diagnosis: string;
  treatment_plan: string;
  start_date: string;
}

const STATUS_CONFIG = {
  active:     { label: 'Ativo',    color: 'bg-green-600/20 text-green-400' },
  discharged: { label: 'Alta',     color: 'bg-slate-600/20 text-slate-400' },
  paused:     { label: 'Pausado',  color: 'bg-yellow-600/20 text-yellow-400' },
};

const EMPTY_FORM: CaseForm = {
  user_id: '',
  chief_complaint: '',
  diagnosis: '',
  treatment_plan: '',
  start_date: new Date().toISOString().slice(0, 10),
};

export default function FisioPacientesPage() {
  const { user, loading: authLoading } = usePilatesAuth();
  const [cases, setCases] = useState<PhysioCase[]>([]);
  const [alunos, setAlunos] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CaseForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Cadastro de novo paciente (só-fisio / ambos)
  const [showPatient, setShowPatient] = useState(false);
  const [patientForm, setPatientForm] = useState({ full_name: '', phone: '', email: '', tambem_pilates: false, criar_login: false, password: '' });
  const [savingPatient, setSavingPatient] = useState(false);
  const [patientError, setPatientError] = useState('');

  const loadData = async () => {
    try {
      const res = await fetch('/api/pilates/fisioterapia');
      if (res.ok) {
        const data = await res.json();
        setCases((data.cases ?? []) as PhysioCase[]);
        setAlunos((data.patients ?? []) as Patient[]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) loadData();
  }, [authLoading]);

  const handleCreate = async () => {
    if (!form.user_id || !form.chief_complaint) {
      setError('Paciente e queixa principal são obrigatórios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/pilates/fisioterapia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_case',
          user_id: form.user_id,
          therapist_id: user?.id ?? null,
          chief_complaint: form.chief_complaint,
          diagnosis: form.diagnosis || null,
          treatment_plan: form.treatment_plan || null,
          start_date: form.start_date,
        }),
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Erro'); }
      setShowModal(false);
      setForm(EMPTY_FORM);
      await loadData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao criar caso.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePatient = async () => {
    if (!patientForm.full_name) { setPatientError('Nome é obrigatório.'); return; }
    if (patientForm.criar_login && (!patientForm.email || !patientForm.password)) {
      setPatientError('Para criar login, informe email e senha.'); return;
    }
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
          password: patientForm.password || null,
          create_login: patientForm.criar_login,
          is_physio_patient: true,
          is_pilates_student: patientForm.tambem_pilates,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Erro ao cadastrar paciente');
      setShowPatient(false);
      setPatientForm({ full_name: '', phone: '', email: '', tambem_pilates: false, criar_login: false, password: '' });
      await loadData();
      // Já seleciona o paciente recém-criado no formulário de caso
      if (j.patient?.id) { setForm((f) => ({ ...f, user_id: j.patient.id })); setShowModal(true); }
    } catch (e: unknown) {
      setPatientError(e instanceof Error ? e.message : 'Erro');
    } finally {
      setSavingPatient(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filtered = filterStatus === 'all' ? cases : cases.filter((c) => c.status === filterStatus);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Prontuários / Pacientes</h1>
        <div className="flex gap-2">
          <button
            onClick={() => { setPatientError(''); setShowPatient(true); }}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm font-medium"
          >
            + Novo Paciente
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
          >
            + Novo Caso
          </button>
        </div>
      </div>

      {/* Filtro */}
      <div className="flex gap-2">
        {([['all', 'Todos'], ['active', 'Ativos'], ['paused', 'Pausados'], ['discharged', 'Alta']] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilterStatus(val)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              filterStatus === val
                ? 'bg-green-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista de casos */}
      {filtered.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-10 border border-slate-700 text-center">
          <p className="text-slate-500">Nenhum caso encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const cfg = STATUS_CONFIG[c.status];
            const alunoName = (c.aluno as any)?.full_name || (c.aluno as any)?.email || 'Aluno';
            return (
              <Link
                key={c.id}
                href={`/fisioterapeuta/paciente/${c.id}`}
                className="block bg-slate-800 rounded-xl border border-slate-700 p-5 hover:border-green-500/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">{alunoName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <p className="text-sm text-slate-300">{c.chief_complaint || '—'}</p>
                    {c.diagnosis && <p className="text-xs text-slate-500 mt-1">Diagnóstico: {c.diagnosis}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-500">
                      {new Date(c.start_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{c._evo_count ?? 0} evolução(ões)</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Modal Novo Caso */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Novo Caso de Tratamento</h2>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Aluno *</label>
              <select
                value={form.user_id}
                onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="">Selecione o paciente...</option>
                {alunos.map((a) => (
                  <option key={a.id} value={a.id}>
                    {(a.full_name || a.email)}{a.tipo === 'fisio' ? ' (só fisio)' : a.tipo === 'ambos' ? ' (pilates+fisio)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Data de Início</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Queixa Principal *</label>
              <textarea
                rows={2}
                value={form.chief_complaint}
                onChange={(e) => setForm({ ...form, chief_complaint: e.target.value })}
                placeholder="Descreva a queixa principal do paciente..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Diagnóstico / Hipótese</label>
              <textarea
                rows={2}
                value={form.diagnosis}
                onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                placeholder="CID, hipótese diagnóstica..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Plano de Tratamento</label>
              <textarea
                rows={2}
                value={form.treatment_plan}
                onChange={(e) => setForm({ ...form, treatment_plan: e.target.value })}
                placeholder="Abordagem terapêutica, sessões previstas..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm resize-none"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowModal(false); setError(''); setForm(EMPTY_FORM); }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium"
              >
                {saving ? 'Criando...' : 'Criar Caso'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Paciente (só-fisio ou pilates+fisio) */}
      {showPatient && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Novo Paciente de Fisioterapia</h2>
            <p className="text-xs text-slate-400">
              Para quem ainda não é aluno de pilates. Se a pessoa já é aluno, use o &ldquo;Novo Caso&rdquo; e selecione-a direto.
            </p>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Nome completo *</label>
              <input
                value={patientForm.full_name}
                onChange={(e) => setPatientForm({ ...patientForm, full_name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="Nome do paciente"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Telefone</label>
                <input
                  value={patientForm.phone}
                  onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  placeholder="(21) 99999-9999"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Email {patientForm.criar_login && '*'}</label>
                <input
                  type="email"
                  value={patientForm.email}
                  onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
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
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={patientForm.criar_login}
                onChange={(e) => setPatientForm({ ...patientForm, criar_login: e.target.checked })}
                className="w-4 h-4 accent-green-500" />
              Criar login para o paciente acessar o app
            </label>
            {patientForm.criar_login && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Senha *</label>
                <input
                  type="text"
                  value={patientForm.password}
                  onChange={(e) => setPatientForm({ ...patientForm, password: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            )}

            {patientError && <p className="text-red-400 text-sm">{patientError}</p>}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowPatient(false); setPatientError(''); }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePatient}
                disabled={savingPatient}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium"
              >
                {savingPatient ? 'Cadastrando...' : 'Cadastrar Paciente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
