'use client';

import { useState, useEffect } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

interface InjuryItem { local: string; descricao: string; data: string }
interface SurgeryItem { tipo: string; data: string }
interface MedicationItem { nome: string; dose: string }

interface HealthRecord {
  birth_date: string;
  blood_type: string;
  height_cm: string;
  weight_kg: string;
  main_goal: string;
  injuries: InjuryItem[];
  surgeries: SurgeryItem[];
  chronic_conditions: string[];
  medications: MedicationItem[];
  allergies: string;
  physical_restrictions: string;
  doctor_clearance: boolean;
  doctor_notes: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  consent_signed: boolean;
}

const EMPTY_RECORD: HealthRecord = {
  birth_date: '',
  blood_type: '',
  height_cm: '',
  weight_kg: '',
  main_goal: '',
  injuries: [],
  surgeries: [],
  chronic_conditions: [],
  medications: [],
  allergies: '',
  physical_restrictions: '',
  doctor_clearance: false,
  doctor_notes: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  consent_signed: false,
};

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CHRONIC_OPTIONS = [
  'Diabetes', 'Hipertensão', 'Hipotensão', 'Cardiopatia', 'Osteoporose',
  'Artrite/Artrose', 'Hérnia de disco', 'Escoliose', 'Fibromialgia',
  'Obesidade', 'Asma', 'Depressão/Ansiedade', 'Outro',
];

function SectionTitle({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 mt-6">
      <span className="text-xl">{icon}</span>
      <h2 className="text-lg font-semibold text-green-400">{title}</h2>
    </div>
  );
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-1">{label}</label>
      <input
        {...props}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
  );
}

function TextArea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-1">{label}</label>
      <textarea
        {...props}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
      />
    </div>
  );
}

export default function FichaSaudePage() {
  const { user, loading: authLoading } = usePilatesAuth();
  const [form, setForm] = useState<HealthRecord>(EMPTY_RECORD);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const supabase = getSupabaseBrowserClient();

  // Injuries CRUD
  const [newInjury, setNewInjury] = useState<InjuryItem>({ local: '', descricao: '', data: '' });
  // Surgeries CRUD
  const [newSurgery, setNewSurgery] = useState<SurgeryItem>({ tipo: '', data: '' });
  // Medications CRUD
  const [newMedication, setNewMedication] = useState<MedicationItem>({ nome: '', dose: '' });

  useEffect(() => {
    if (!authLoading && user) {
      supabase
        .from('health_records')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setForm({
              birth_date: data.birth_date ?? '',
              blood_type: data.blood_type ?? '',
              height_cm: data.height_cm != null ? String(data.height_cm) : '',
              weight_kg: data.weight_kg != null ? String(data.weight_kg) : '',
              main_goal: data.main_goal ?? '',
              injuries: (data.injuries as InjuryItem[]) ?? [],
              surgeries: (data.surgeries as SurgeryItem[]) ?? [],
              chronic_conditions: (data.chronic_conditions as string[]) ?? [],
              medications: (data.medications as MedicationItem[]) ?? [],
              allergies: data.allergies ?? '',
              physical_restrictions: data.physical_restrictions ?? '',
              doctor_clearance: data.doctor_clearance ?? false,
              doctor_notes: data.doctor_notes ?? '',
              emergency_contact_name: data.emergency_contact_name ?? '',
              emergency_contact_phone: data.emergency_contact_phone ?? '',
              consent_signed: data.consent_signed ?? false,
            });
          }
          setLoading(false);
        });
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user]);

  const handleSave = async () => {
    if (!user) return;
    if (!form.consent_signed) {
      setError('É necessário aceitar o termo de consentimento para salvar.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        user_id: user.id,
        birth_date: form.birth_date || null,
        blood_type: form.blood_type || null,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        main_goal: form.main_goal || null,
        injuries: form.injuries.length > 0 ? form.injuries : null,
        surgeries: form.surgeries.length > 0 ? form.surgeries : null,
        chronic_conditions: form.chronic_conditions.length > 0 ? form.chronic_conditions : null,
        medications: form.medications.length > 0 ? form.medications : null,
        allergies: form.allergies || null,
        physical_restrictions: form.physical_restrictions || null,
        doctor_clearance: form.doctor_clearance,
        doctor_notes: form.doctor_notes || null,
        emergency_contact_name: form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
        consent_signed: form.consent_signed,
        consent_date: form.consent_signed ? new Date().toISOString() : null,
        filled_by: user.id,
        updated_at: new Date().toISOString(),
      };
      const { error: err } = await supabase
        .from('health_records')
        .upsert(payload, { onConflict: 'user_id' });
      if (err) throw err;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar ficha.');
    } finally {
      setSaving(false);
    }
  };

  const toggleChronic = (condition: string) => {
    setForm((prev) => ({
      ...prev,
      chronic_conditions: prev.chronic_conditions.includes(condition)
        ? prev.chronic_conditions.filter((c) => c !== condition)
        : [...prev.chronic_conditions, condition],
    }));
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-2 pb-10">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-white">Ficha de Saúde</h1>
        {saved && (
          <span className="text-green-400 text-sm font-medium">✅ Salvo com sucesso!</span>
        )}
      </div>
      <p className="text-slate-400 text-sm mb-4">
        Preencha sua ficha de saúde para que os professores e fisioterapeutas possam te atender com segurança.
      </p>

      {/* Aviso onboarding */}
      {!form.consent_signed && (
        <div className="bg-yellow-600/10 border border-yellow-500/30 rounded-xl p-4 flex gap-3">
          <span className="text-yellow-400 text-xl">⚠️</span>
          <div>
            <p className="text-yellow-300 font-medium text-sm">Ficha de saúde incompleta</p>
            <p className="text-yellow-400/80 text-xs mt-1">
              Preencha e assine o consentimento antes de reservar aulas. Isso é essencial para sua segurança.
            </p>
          </div>
        </div>
      )}

      {/* DADOS GERAIS */}
      <SectionTitle title="Dados Gerais" icon="👤" />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Data de Nascimento"
          type="date"
          value={form.birth_date}
          onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
        />
        <div>
          <label className="block text-sm text-slate-400 mb-1">Tipo Sanguíneo</label>
          <select
            value={form.blood_type}
            onChange={(e) => setForm({ ...form, blood_type: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Não sei</option>
            {BLOOD_TYPES.map((bt) => <option key={bt} value={bt}>{bt}</option>)}
          </select>
        </div>
        <Input
          label="Altura (cm)"
          type="number"
          placeholder="170"
          value={form.height_cm}
          onChange={(e) => setForm({ ...form, height_cm: e.target.value })}
        />
        <Input
          label="Peso (kg)"
          type="number"
          placeholder="65"
          value={form.weight_kg}
          onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
        />
      </div>

      {/* OBJETIVO */}
      <SectionTitle title="Objetivo Principal" icon="🎯" />
      <TextArea
        label="Qual seu objetivo com o Pilates?"
        placeholder="Ex: reabilitação de lombar, condicionamento físico, emagrecimento, pós-parto..."
        rows={2}
        value={form.main_goal}
        onChange={(e) => setForm({ ...form, main_goal: e.target.value })}
      />

      {/* LESÕES */}
      <SectionTitle title="Histórico de Lesões" icon="🦴" />
      <div className="space-y-2">
        {form.injuries.map((inj, i) => (
          <div key={i} className="flex items-center gap-2 bg-slate-800/60 rounded-lg px-3 py-2 text-sm">
            <span className="text-white flex-1">{inj.local} — {inj.descricao} {inj.data && `(${inj.data})`}</span>
            <button
              onClick={() => setForm({ ...form, injuries: form.injuries.filter((_, j) => j !== i) })}
              className="text-red-400 hover:text-red-300 text-xs"
            >Remover</button>
          </div>
        ))}
        <div className="grid grid-cols-3 gap-2">
          <input
            placeholder="Local (ex: joelho)"
            value={newInjury.local}
            onChange={(e) => setNewInjury({ ...newInjury, local: e.target.value })}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            placeholder="Descrição"
            value={newInjury.descricao}
            onChange={(e) => setNewInjury({ ...newInjury, descricao: e.target.value })}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <div className="flex gap-1">
            <input
              type="date"
              value={newInjury.data}
              onChange={(e) => setNewInjury({ ...newInjury, data: e.target.value })}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={() => {
                if (newInjury.local && newInjury.descricao) {
                  setForm({ ...form, injuries: [...form.injuries, newInjury] });
                  setNewInjury({ local: '', descricao: '', data: '' });
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
            >+</button>
          </div>
        </div>
      </div>

      {/* CIRURGIAS */}
      <SectionTitle title="Cirurgias" icon="🏥" />
      <div className="space-y-2">
        {form.surgeries.map((surg, i) => (
          <div key={i} className="flex items-center gap-2 bg-slate-800/60 rounded-lg px-3 py-2 text-sm">
            <span className="text-white flex-1">{surg.tipo} {surg.data && `(${surg.data})`}</span>
            <button
              onClick={() => setForm({ ...form, surgeries: form.surgeries.filter((_, j) => j !== i) })}
              className="text-red-400 hover:text-red-300 text-xs"
            >Remover</button>
          </div>
        ))}
        <div className="grid grid-cols-3 gap-2">
          <input
            placeholder="Tipo de cirurgia"
            value={newSurgery.tipo}
            onChange={(e) => setNewSurgery({ ...newSurgery, tipo: e.target.value })}
            className="col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <div className="flex gap-1">
            <input
              type="date"
              value={newSurgery.data}
              onChange={(e) => setNewSurgery({ ...newSurgery, data: e.target.value })}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={() => {
                if (newSurgery.tipo) {
                  setForm({ ...form, surgeries: [...form.surgeries, newSurgery] });
                  setNewSurgery({ tipo: '', data: '' });
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
            >+</button>
          </div>
        </div>
      </div>

      {/* CONDIÇÕES CRÔNICAS */}
      <SectionTitle title="Condições Crônicas" icon="💊" />
      <div className="flex flex-wrap gap-2">
        {CHRONIC_OPTIONS.map((cond) => (
          <button
            key={cond}
            onClick={() => toggleChronic(cond)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              form.chronic_conditions.includes(cond)
                ? 'bg-green-600 border-green-600 text-white'
                : 'border-slate-600 text-slate-400 hover:border-slate-400'
            }`}
          >
            {cond}
          </button>
        ))}
      </div>

      {/* MEDICAMENTOS */}
      <SectionTitle title="Medicamentos em Uso" icon="💉" />
      <div className="space-y-2">
        {form.medications.map((med, i) => (
          <div key={i} className="flex items-center gap-2 bg-slate-800/60 rounded-lg px-3 py-2 text-sm">
            <span className="text-white flex-1">{med.nome} — {med.dose}</span>
            <button
              onClick={() => setForm({ ...form, medications: form.medications.filter((_, j) => j !== i) })}
              className="text-red-400 hover:text-red-300 text-xs"
            >Remover</button>
          </div>
        ))}
        <div className="grid grid-cols-3 gap-2">
          <input
            placeholder="Nome do medicamento"
            value={newMedication.nome}
            onChange={(e) => setNewMedication({ ...newMedication, nome: e.target.value })}
            className="col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <div className="flex gap-1">
            <input
              placeholder="Dose"
              value={newMedication.dose}
              onChange={(e) => setNewMedication({ ...newMedication, dose: e.target.value })}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={() => {
                if (newMedication.nome) {
                  setForm({ ...form, medications: [...form.medications, newMedication] });
                  setNewMedication({ nome: '', dose: '' });
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
            >+</button>
          </div>
        </div>
      </div>

      {/* ALERGIAS E RESTRIÇÕES */}
      <SectionTitle title="Alergias e Restrições" icon="⚠️" />
      <div className="space-y-3">
        <TextArea
          label="Alergias"
          placeholder="Ex: látex, dipirona, antibióticos..."
          rows={2}
          value={form.allergies}
          onChange={(e) => setForm({ ...form, allergies: e.target.value })}
        />
        <TextArea
          label="Restrições Físicas"
          placeholder="Ex: não pode fazer exercícios de alto impacto, restrição em flexão lombar..."
          rows={2}
          value={form.physical_restrictions}
          onChange={(e) => setForm({ ...form, physical_restrictions: e.target.value })}
        />
        <div className="flex items-start gap-3 p-3 bg-slate-800/60 rounded-lg">
          <input
            type="checkbox"
            id="doctor_clearance"
            checked={form.doctor_clearance}
            onChange={(e) => setForm({ ...form, doctor_clearance: e.target.checked })}
            className="mt-0.5 accent-green-500"
          />
          <div>
            <label htmlFor="doctor_clearance" className="text-sm text-white font-medium cursor-pointer">
              Tenho liberação médica para atividade física
            </label>
            {form.doctor_clearance && (
              <TextArea
                label=""
                placeholder="Observações do médico (opcional)"
                rows={1}
                value={form.doctor_notes}
                onChange={(e) => setForm({ ...form, doctor_notes: e.target.value })}
              />
            )}
          </div>
        </div>
      </div>

      {/* CONTATO DE EMERGÊNCIA */}
      <SectionTitle title="Contato de Emergência" icon="🆘" />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Nome"
          placeholder="Nome do contato"
          value={form.emergency_contact_name}
          onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })}
        />
        <Input
          label="Telefone"
          placeholder="(11) 99999-9999"
          value={form.emergency_contact_phone}
          onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })}
        />
      </div>

      {/* CONSENTIMENTO */}
      <SectionTitle title="Termo de Consentimento" icon="📋" />
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
        <p className="text-slate-300 text-sm">
          Declaro que as informações fornecidas são verdadeiras e autorizo o uso dos meus dados
          de saúde exclusivamente para fins de orientação profissional no estúdio Daimach.Movement,
          em conformidade com a LGPD (Lei nº 13.709/2018). Estes dados são confidenciais e acessados
          apenas por professores e fisioterapeutas habilitados.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="consent"
            checked={form.consent_signed}
            onChange={(e) => setForm({ ...form, consent_signed: e.target.checked })}
            className="w-5 h-5 accent-green-500"
          />
          <label htmlFor="consent" className="text-white font-medium cursor-pointer">
            Li e aceito o termo de consentimento (LGPD)
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-red-600/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors mt-4"
      >
        {saving ? 'Salvando...' : 'Salvar Ficha de Saúde'}
      </button>
    </div>
  );
}
