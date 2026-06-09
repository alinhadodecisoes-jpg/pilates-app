'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { printDocument } from '@/lib/pilates/pdf-export';

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
  aluno?: { full_name: string | null; email: string | null; phone: string | null } | null;
}

interface PhysioEvolution {
  id: number;
  case_id: number;
  session_id: number | null;
  evolution_date: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  pain_scale: number | null;
  techniques_used: string | null;
  therapist_id: string | null;
  created_at: string;
}

interface HealthRecordSummary {
  physical_restrictions: string | null;
  chronic_conditions: string[] | null;
  doctor_clearance: boolean;
  allergies: string | null;
  medications: Array<{ nome: string; dose: string }> | null;
}

interface EvoForm {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  pain_scale: string;
  techniques_used: string;
}

const EMPTY_EVO: EvoForm = {
  subjective: '', objective: '', assessment: '', plan: '',
  pain_scale: '', techniques_used: '',
};

const PAIN_COLORS = ['#22c55e','#4ade80','#86efac','#bef264','#fde68a','#fbbf24','#fb923c','#f97316','#ef4444','#b91c1c','#7f1d1d'];

export default function ProntuarioPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = usePilatesAuth();
  const [physioCase, setPhysioCase] = useState<PhysioCase | null>(null);
  const [evolutions, setEvolutions] = useState<PhysioEvolution[]>([]);
  const [healthRecord, setHealthRecord] = useState<HealthRecordSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEvoForm, setShowEvoForm] = useState(false);
  const [showDischarge, setShowDischarge] = useState(false);
  const [evoForm, setEvoForm] = useState<EvoForm>(EMPTY_EVO);
  const [dischargeNotes, setDischargeNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const supabase = getSupabaseBrowserClient();

  const loadData = async () => {
    const id = Number(caseId);
    const [caseRes, evosRes] = await Promise.all([
      supabase
        .from('physio_cases')
        .select('*, aluno:users_pilates!user_id(full_name, email, phone)')
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('physio_evolutions')
        .select('*')
        .eq('case_id', id)
        .order('evolution_date', { ascending: false }),
    ]);

    if (caseRes.data) {
      const c = caseRes.data as PhysioCase;
      setPhysioCase(c);
      // Load health record for the patient
      const hrRes = await supabase
        .from('health_records')
        .select('physical_restrictions, chronic_conditions, doctor_clearance, allergies, medications')
        .eq('user_id', c.user_id)
        .maybeSingle();
      if (hrRes.data) setHealthRecord(hrRes.data as HealthRecordSummary);
    }
    if (evosRes.data) setEvolutions(evosRes.data as PhysioEvolution[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && caseId) loadData();
  }, [authLoading, caseId]);

  const handleAddEvolution = async () => {
    if (!physioCase) return;
    setSaving(true);
    try {
      const payload = {
        case_id: physioCase.id,
        evolution_date: new Date().toISOString(),
        subjective: evoForm.subjective || null,
        objective: evoForm.objective || null,
        assessment: evoForm.assessment || null,
        plan: evoForm.plan || null,
        pain_scale: evoForm.pain_scale ? Number(evoForm.pain_scale) : null,
        techniques_used: evoForm.techniques_used || null,
        therapist_id: user?.id ?? null,
      };
      const { error } = await supabase.from('physio_evolutions').insert(payload);
      if (error) throw error;
      setEvoForm(EMPTY_EVO);
      setShowEvoForm(false);
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDischarge = async () => {
    if (!physioCase) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('physio_cases')
        .update({ status: 'discharged', discharge_notes: dischargeNotes || null })
        .eq('id', physioCase.id);
      if (error) throw error;
      setShowDischarge(false);
      await loadData();
    } catch (e) {
      console.error(e);
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

  if (!physioCase) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Caso não encontrado.</p>
        <Link href="/fisioterapeuta/pacientes" className="text-green-400 text-sm mt-2 inline-block">← Voltar</Link>
      </div>
    );
  }

  const alunoName = (physioCase.aluno as any)?.full_name || (physioCase.aluno as any)?.email || 'Paciente';
  const statusConfig = {
    active: { label: 'Ativo', color: 'bg-green-600/20 text-green-400' },
    discharged: { label: 'Alta', color: 'bg-slate-600/20 text-slate-400' },
    paused: { label: 'Pausado', color: 'bg-yellow-600/20 text-yellow-400' },
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/fisioterapeuta/pacientes" className="text-slate-400 hover:text-white text-sm flex items-center gap-1 mb-2">
            ← Pacientes
          </Link>
          <h1 className="text-2xl font-bold text-white">{alunoName}</h1>
          <p className="text-slate-400 text-sm">{(physioCase.aluno as any)?.email}</p>
        </div>
        <div className="flex gap-2">
          <span className={`text-xs px-3 py-1 rounded-full ${statusConfig[physioCase.status].color}`}>
            {statusConfig[physioCase.status].label}
          </span>
          {physioCase.status === 'active' && (
            <button
              onClick={() => setShowDischarge(true)}
              className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded-full"
            >
              Dar Alta
            </button>
          )}
          <button
            onClick={() => {
              printDocument({
                title: 'Prontuário de Fisioterapia',
                subtitle: alunoName,
                sections: [
                  {
                    title: 'Dados do Caso',
                    rows: [
                      { label: 'Paciente', value: alunoName },
                      { label: 'Queixa principal', value: physioCase.chief_complaint },
                      { label: 'Diagnóstico', value: physioCase.diagnosis },
                      { label: 'Plano de tratamento', value: physioCase.treatment_plan },
                      { label: 'Data de início', value: physioCase.start_date ? new Date(physioCase.start_date + 'T12:00:00').toLocaleDateString('pt-BR') : null },
                      { label: 'Status', value: statusConfig[physioCase.status].label },
                      { label: 'Notas de alta', value: physioCase.discharge_notes },
                    ],
                  },
                  ...(healthRecord ? [{
                    title: 'Alertas da Ficha de Saúde',
                    rows: [
                      { label: 'Restrições físicas', value: healthRecord.physical_restrictions },
                      { label: 'Condições crônicas', value: healthRecord.chronic_conditions?.join(', ') },
                      { label: 'Liberação médica', value: healthRecord.doctor_clearance ? 'Sim' : 'NÃO' },
                      { label: 'Alergias', value: healthRecord.allergies },
                      { label: 'Medicamentos', value: healthRecord.medications?.map((m: any) => `${m.nome} ${m.dose}`).join('; ') },
                    ],
                  }] : []),
                  ...evolutions.map((evo, i) => ({
                    title: `Evolução ${evolutions.length - i} — ${new Date(evo.evolution_date).toLocaleDateString('pt-BR')}`,
                    rows: [
                      { label: 'S (Subjetivo)', value: evo.subjective },
                      { label: 'O (Objetivo)', value: evo.objective },
                      { label: 'A (Avaliação)', value: evo.assessment },
                      { label: 'P (Plano)', value: evo.plan },
                      { label: 'Escala de dor', value: evo.pain_scale != null ? `${evo.pain_scale}/10` : null },
                      { label: 'Técnicas', value: evo.techniques_used },
                    ],
                  })),
                ],
                footer: `Prontuário confidencial — Daimach.Movement | ${(physioCase.aluno as any)?.email || ''} | Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
              });
            }}
            className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded-full"
          >
            🖨️ PDF
          </button>
        </div>
      </div>

      {/* Ficha de saúde resumida */}
      {healthRecord && (healthRecord.physical_restrictions || (healthRecord.chronic_conditions?.length ?? 0) > 0 || !healthRecord.doctor_clearance) && (
        <div className="bg-red-600/10 border border-red-500/30 rounded-xl p-4 space-y-1">
          <p className="text-red-400 font-semibold text-sm">⚠️ Ficha de Saúde — Alertas</p>
          {healthRecord.physical_restrictions && (
            <p className="text-red-300 text-xs">🦴 Restrições: {healthRecord.physical_restrictions}</p>
          )}
          {!healthRecord.doctor_clearance && (
            <p className="text-yellow-400 text-xs">🏥 Sem liberação médica documentada</p>
          )}
          {(healthRecord.chronic_conditions?.length ?? 0) > 0 && (
            <p className="text-orange-300 text-xs">💊 Condições: {healthRecord.chronic_conditions!.join(', ')}</p>
          )}
          {healthRecord.allergies && (
            <p className="text-orange-300 text-xs">⚠️ Alergias: {healthRecord.allergies}</p>
          )}
          {healthRecord.medications && healthRecord.medications.length > 0 && (
            <p className="text-slate-300 text-xs">
              💉 Medicamentos: {healthRecord.medications.map((m) => `${m.nome} (${m.dose})`).join(', ')}
            </p>
          )}
          <Link href={`/admin/ficha-saude/${physioCase.user_id}`} className="text-green-400 text-xs hover:underline">
            Ver ficha completa →
          </Link>
        </div>
      )}

      {/* Resumo do caso */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-3">
        <h2 className="text-green-400 font-semibold">📋 Caso Clínico</h2>
        <div className="space-y-2 text-sm">
          <div><span className="text-slate-400">Início: </span><span className="text-white">{new Date(physioCase.start_date + 'T00:00:00').toLocaleDateString('pt-BR')}</span></div>
          {physioCase.chief_complaint && (
            <div><span className="text-slate-400">Queixa: </span><span className="text-white">{physioCase.chief_complaint}</span></div>
          )}
          {physioCase.diagnosis && (
            <div><span className="text-slate-400">Diagnóstico: </span><span className="text-white">{physioCase.diagnosis}</span></div>
          )}
          {physioCase.treatment_plan && (
            <div><span className="text-slate-400">Plano: </span><span className="text-white">{physioCase.treatment_plan}</span></div>
          )}
          {physioCase.discharge_notes && (
            <div className="bg-slate-700/50 rounded-lg p-3">
              <span className="text-slate-400 text-xs">Alta: </span>
              <span className="text-slate-300 text-xs">{physioCase.discharge_notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Botão nova evolução */}
      {physioCase.status === 'active' && (
        <button
          onClick={() => setShowEvoForm(true)}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl transition-colors"
        >
          + Nova Evolução SOAP
        </button>
      )}

      {/* Linha do tempo de evoluções */}
      <div className="space-y-3">
        <h2 className="text-white font-semibold">Evoluções ({evolutions.length})</h2>
        {evolutions.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 text-center">
            <p className="text-slate-500 text-sm">Nenhuma evolução registrada ainda.</p>
          </div>
        ) : (
          evolutions.map((evo) => (
            <div key={evo.id} className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white text-sm">
                  {new Date(evo.evolution_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                {evo.pain_scale != null && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Dor:</span>
                    <span
                      className="font-bold text-sm px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${PAIN_COLORS[evo.pain_scale]}20`,
                        color: PAIN_COLORS[evo.pain_scale],
                      }}
                    >
                      {evo.pain_scale}/10
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {evo.subjective && (
                  <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
                    <p className="text-xs text-blue-400 font-medium mb-1">S — Subjetivo</p>
                    <p className="text-sm text-slate-300">{evo.subjective}</p>
                  </div>
                )}
                {evo.objective && (
                  <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3">
                    <p className="text-xs text-green-400 font-medium mb-1">O — Objetivo</p>
                    <p className="text-sm text-slate-300">{evo.objective}</p>
                  </div>
                )}
                {evo.assessment && (
                  <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3">
                    <p className="text-xs text-yellow-400 font-medium mb-1">A — Avaliação</p>
                    <p className="text-sm text-slate-300">{evo.assessment}</p>
                  </div>
                )}
                {evo.plan && (
                  <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-3">
                    <p className="text-xs text-purple-400 font-medium mb-1">P — Plano</p>
                    <p className="text-sm text-slate-300">{evo.plan}</p>
                  </div>
                )}
              </div>

              {evo.techniques_used && (
                <p className="text-xs text-slate-400">🛠️ Técnicas: {evo.techniques_used}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Nova Evolução SOAP */}
      {showEvoForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl p-6 space-y-4 my-4">
            <h2 className="text-xl font-bold text-white">Nova Evolução SOAP</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs text-blue-400 mb-1 font-medium">S — Subjetivo (relato do paciente)</label>
                <textarea
                  rows={2}
                  value={evoForm.subjective}
                  onChange={(e) => setEvoForm({ ...evoForm, subjective: e.target.value })}
                  placeholder="O que o paciente relata..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm resize-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-green-400 mb-1 font-medium">O — Objetivo (achados/medidas)</label>
                <textarea
                  rows={2}
                  value={evoForm.objective}
                  onChange={(e) => setEvoForm({ ...evoForm, objective: e.target.value })}
                  placeholder="Exame físico, testes, goniometria..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-yellow-400 mb-1 font-medium">A — Avaliação</label>
                <textarea
                  rows={2}
                  value={evoForm.assessment}
                  onChange={(e) => setEvoForm({ ...evoForm, assessment: e.target.value })}
                  placeholder="Interpretação clínica..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-purple-400 mb-1 font-medium">P — Plano / Conduta</label>
                <textarea
                  rows={2}
                  value={evoForm.plan}
                  onChange={(e) => setEvoForm({ ...evoForm, plan: e.target.value })}
                  placeholder="Próximos passos, exercícios, conduta..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Escala de Dor (0-10)</label>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={evoForm.pain_scale}
                  onChange={(e) => setEvoForm({ ...evoForm, pain_scale: e.target.value })}
                  className="w-full accent-green-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-0.5">
                  <span>0 (Sem dor)</span>
                  <span className="font-bold text-white text-sm">{evoForm.pain_scale || '—'}</span>
                  <span>10 (Máximo)</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Técnicas Utilizadas</label>
                <input
                  value={evoForm.techniques_used}
                  onChange={(e) => setEvoForm({ ...evoForm, techniques_used: e.target.value })}
                  placeholder="Ex: TENS, ultrassom, crochetagem..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowEvoForm(false); setEvoForm(EMPTY_EVO); }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddEvolution}
                disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium"
              >
                {saving ? 'Salvando...' : 'Registrar Evolução'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dar Alta */}
      {showDischarge && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Dar Alta ao Paciente</h2>
            <p className="text-slate-400 text-sm">Esta ação muda o status do caso para &ldquo;Alta&rdquo;.</p>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Notas de Alta</label>
              <textarea
                rows={3}
                value={dischargeNotes}
                onChange={(e) => setDischargeNotes(e.target.value)}
                placeholder="Evolução final, orientações para o paciente..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDischarge(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleDischarge}
                disabled={saving}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium"
              >
                {saving ? 'Salvando...' : 'Confirmar Alta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
