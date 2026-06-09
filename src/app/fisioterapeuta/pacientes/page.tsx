'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { PilatesUser } from '@/types/pilates';

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
  const [alunos, setAlunos] = useState<PilatesUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CaseForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const supabase = getSupabaseBrowserClient();

  const loadData = async () => {
    const [casesRes, alunosRes, evosRes] = await Promise.all([
      supabase
        .from('physio_cases')
        .select('*, aluno:users_pilates!user_id(full_name, email)')
        .order('created_at', { ascending: false }),
      supabase
        .from('users_pilates')
        .select('id, full_name, email')
        .eq('role', 'aluno')
        .order('full_name'),
      supabase
        .from('physio_evolutions')
        .select('case_id'),
    ]);

    if (!casesRes.error && casesRes.data) {
      // Count evolutions per case
      const countByCaseId: Record<number, number> = {};
      for (const evo of evosRes.data ?? []) {
        countByCaseId[evo.case_id] = (countByCaseId[evo.case_id] ?? 0) + 1;
      }
      const casesMapped = casesRes.data.map((c) => ({
        ...c,
        _evo_count: countByCaseId[c.id] ?? 0,
      }));
      setCases(casesMapped as PhysioCase[]);
    }
    if (!alunosRes.error && alunosRes.data) {
      setAlunos(alunosRes.data as PilatesUser[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading) loadData();
  }, [authLoading]);

  const handleCreate = async () => {
    if (!form.user_id || !form.chief_complaint) {
      setError('Aluno e queixa principal são obrigatórios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        user_id: form.user_id,
        therapist_id: user?.id ?? null,
        chief_complaint: form.chief_complaint,
        diagnosis: form.diagnosis || null,
        treatment_plan: form.treatment_plan || null,
        start_date: form.start_date,
        status: 'active',
      };
      const { error: err } = await supabase.from('physio_cases').insert(payload);
      if (err) throw err;
      setShowModal(false);
      setForm(EMPTY_FORM);
      await loadData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao criar caso.');
    } finally {
      setSaving(false);
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
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
        >
          + Novo Caso
        </button>
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
                <option value="">Selecione o aluno...</option>
                {alunos.map((a) => (
                  <option key={a.id} value={a.id}>{a.full_name || a.email}</option>
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
    </div>
  );
}
