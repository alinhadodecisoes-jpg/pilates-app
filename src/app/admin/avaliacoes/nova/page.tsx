'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { PilatesUser } from '@/types/pilates';

interface Measurements {
  bust: string;
  waist: string;
  hip: string;
  thigh_r: string;
  thigh_l: string;
  arm_r: string;
  arm_l: string;
}

interface EvalForm {
  user_id: string;
  evaluation_date: string;
  weight: string;
  height: string;
  body_fat: string;
  muscle_mass: string;
  measurements: Measurements;
  posture_assessment: string;
  flexibility_notes: string;
  strength_notes: string;
  goals: string;
  notes: string;
}

const EMPTY_FORM: EvalForm = {
  user_id: '',
  evaluation_date: new Date().toISOString().slice(0, 10),
  weight: '',
  height: '',
  body_fat: '',
  muscle_mass: '',
  measurements: { bust: '', waist: '', hip: '', thigh_r: '', thigh_l: '', arm_r: '', arm_l: '' },
  posture_assessment: '',
  flexibility_notes: '',
  strength_notes: '',
  goals: '',
  notes: '',
};

function calcIMC(weight: string, height: string): string {
  const w = parseFloat(weight);
  const h = parseFloat(height);
  if (!w || !h || h <= 0) return '';
  return (w / Math.pow(h / 100, 2)).toFixed(1);
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <input
        {...props}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
  );
}

function TextArea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <textarea
        {...props}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
      />
    </div>
  );
}

export default function NovaAvaliacaoPage() {
  const { user: adminUser, loading: authLoading } = usePilatesAuth();
  const router = useRouter();
  const [alunos, setAlunos] = useState<PilatesUser[]>([]);
  const [form, setForm] = useState<EvalForm>(EMPTY_FORM);
  const [photos, setPhotos] = useState<{ frente: File | null; lado: File | null; costas: File | null }>({
    frente: null, lado: null, costas: null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (!authLoading) {
      fetch('/api/pilates/alunos')
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setAlunos(data as PilatesUser[]))
        .catch(console.error);
    }
  }, [authLoading]);

  const uploadPhoto = async (file: File, userId: string, angle: string): Promise<string | null> => {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${userId}/${Date.now()}_${angle}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('evaluations')
      .upload(path, file, { upsert: true });
    if (upErr) {
      console.error('Upload error:', upErr);
      return null;
    }
    return path;
  };

  const handleSave = async () => {
    if (!form.user_id) { setError('Selecione o aluno.'); return; }
    if (!form.weight || !form.height) { setError('Peso e altura são obrigatórios.'); return; }
    setSaving(true);
    setError('');
    try {
      // Upload photos
      const photosPaths: Record<string, string> = {};
      for (const [angle, file] of Object.entries(photos)) {
        if (file) {
          const path = await uploadPhoto(file, form.user_id, angle);
          if (path) photosPaths[angle] = path;
        }
      }

      const measurements: Record<string, number | null> = {};
      for (const [key, val] of Object.entries(form.measurements)) {
        measurements[key] = val ? Number(val) : null;
      }

      // Observação: a tabela não tem colunas bmi/notes. O IMC é calculado on-the-fly
      // a partir de weight/height na exibição; as notas gerais vão para goals.
      const payload = {
        user_id: form.user_id,
        evaluator_id: adminUser?.id ?? null,
        evaluation_date: form.evaluation_date,
        weight: Number(form.weight),
        height: Number(form.height),
        body_fat: form.body_fat ? Number(form.body_fat) : null,
        muscle_mass: form.muscle_mass ? Number(form.muscle_mass) : null,
        measurements,
        photos: Object.keys(photosPaths).length > 0 ? photosPaths : null,
        posture_assessment: form.posture_assessment || null,
        flexibility_notes: form.flexibility_notes || null,
        strength_notes: form.strength_notes || null,
        goals: [form.goals, form.notes].filter(Boolean).join(' | ') || null,
      };

      const { error: dbErr } = await supabase
        .from('physical_evaluations_pilates')
        .insert(payload);
      if (dbErr) throw dbErr;

      router.push('/admin/alunos');
    } catch (e: unknown) {
      // Exibir erro detalhado do Supabase (PostgrestError tem message + details + hint)
      const dbErr = e as { message?: string; details?: string; hint?: string; code?: string };
      const msg = dbErr?.message || 'Erro desconhecido';
      const details = dbErr?.details ? ` — ${dbErr.details}` : '';
      const hint = dbErr?.hint ? ` (${dbErr.hint})` : '';
      const sqlNote = msg.includes('column') || msg.includes('relation') || msg.includes('constraint')
        ? ' ⚠️ Verifique se o SQL foi executado no Supabase (ver PENDENCIAS_WILLIAN.md).'
        : '';
      setError(`${msg}${details}${hint}${sqlNote}`);
    } finally {
      setSaving(false);
    }
  };

  const imc = calcIMC(form.weight, form.height);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white text-sm">← Voltar</button>
        <h1 className="text-2xl font-bold text-white">Nova Avaliação Física</h1>
      </div>

      {/* Aluno + Data */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
        <h2 className="text-green-400 font-semibold">👤 Aluno e Data</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Aluno *</label>
            <select
              value={form.user_id}
              onChange={(e) => setForm({ ...form, user_id: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Selecione...</option>
              {alunos.map((a) => (
                <option key={a.id} value={a.id}>{a.full_name || a.email}</option>
              ))}
            </select>
          </div>
          <Input
            label="Data da Avaliação"
            type="date"
            value={form.evaluation_date}
            onChange={(e) => setForm({ ...form, evaluation_date: e.target.value })}
          />
        </div>
      </div>

      {/* Dados Biométricos */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
        <h2 className="text-green-400 font-semibold">📏 Dados Biométricos</h2>
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Peso (kg) *"
            type="number"
            step="0.1"
            placeholder="65.0"
            value={form.weight}
            onChange={(e) => setForm({ ...form, weight: e.target.value })}
          />
          <Input
            label="Altura (cm) *"
            type="number"
            step="0.1"
            placeholder="170"
            value={form.height}
            onChange={(e) => setForm({ ...form, height: e.target.value })}
          />
          <div>
            <label className="block text-xs text-slate-400 mb-1">IMC (calculado)</label>
            <div className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-green-400 text-sm font-bold">
              {imc || '—'}
            </div>
          </div>
          <Input
            label="% Gordura"
            type="number"
            step="0.1"
            placeholder="22.5"
            value={form.body_fat}
            onChange={(e) => setForm({ ...form, body_fat: e.target.value })}
          />
          <Input
            label="Massa Muscular (kg)"
            type="number"
            step="0.1"
            placeholder="30.0"
            value={form.muscle_mass}
            onChange={(e) => setForm({ ...form, muscle_mass: e.target.value })}
          />
        </div>
      </div>

      {/* Medidas */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
        <h2 className="text-green-400 font-semibold">📐 Medidas (cm)</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'bust', label: 'Busto' },
            { key: 'waist', label: 'Cintura' },
            { key: 'hip', label: 'Quadril' },
            { key: 'thigh_r', label: 'Coxa Direita' },
            { key: 'thigh_l', label: 'Coxa Esquerda' },
            { key: 'arm_r', label: 'Braço Direito' },
            { key: 'arm_l', label: 'Braço Esquerdo' },
          ].map(({ key, label }) => (
            <Input
              key={key}
              label={label}
              type="number"
              step="0.1"
              placeholder="0.0"
              value={form.measurements[key as keyof Measurements]}
              onChange={(e) =>
                setForm({
                  ...form,
                  measurements: { ...form.measurements, [key]: e.target.value },
                })
              }
            />
          ))}
        </div>
      </div>

      {/* Fotos de postura */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
        <h2 className="text-green-400 font-semibold">📷 Fotos de Postura</h2>
        <p className="text-xs text-slate-500">
          Bucket &apos;evaluations&apos; deve estar criado no Supabase Storage (ver PENDENCIAS_WILLIAN.md).
        </p>
        <div className="grid grid-cols-3 gap-3">
          {(['frente', 'lado', 'costas'] as const).map((angle) => (
            <div key={angle}>
              <label className="block text-xs text-slate-400 mb-1 capitalize">{angle}</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setPhotos({ ...photos, [angle]: e.target.files?.[0] ?? null })
                }
                className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-slate-700 file:text-white hover:file:bg-slate-600"
              />
              {photos[angle] && (
                <p className="text-green-400 text-xs mt-1">✅ {photos[angle]!.name}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Notas do profissional */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
        <h2 className="text-green-400 font-semibold">📝 Avaliação do Profissional</h2>
        <TextArea
          label="Avaliação Postural"
          rows={2}
          placeholder="Observações sobre postura, desvios, compensações..."
          value={form.posture_assessment}
          onChange={(e) => setForm({ ...form, posture_assessment: e.target.value })}
        />
        <TextArea
          label="Flexibilidade"
          rows={2}
          placeholder="Avaliação da amplitude de movimento, rigidez muscular..."
          value={form.flexibility_notes}
          onChange={(e) => setForm({ ...form, flexibility_notes: e.target.value })}
        />
        <TextArea
          label="Força"
          rows={2}
          placeholder="Grupos musculares trabalhados, pontos de atenção..."
          value={form.strength_notes}
          onChange={(e) => setForm({ ...form, strength_notes: e.target.value })}
        />
        <TextArea
          label="Objetivos do Aluno"
          rows={2}
          placeholder="Metas estabelecidas para o próximo período..."
          value={form.goals}
          onChange={(e) => setForm({ ...form, goals: e.target.value })}
        />
        <TextArea
          label="Notas Gerais"
          rows={2}
          placeholder="Observações adicionais..."
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>

      {error && (
        <div className="bg-red-600/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {saving ? 'Salvando...' : 'Salvar Avaliação'}
      </button>
    </div>
  );
}
