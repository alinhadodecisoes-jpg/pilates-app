'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { printDocument } from '@/lib/pilates/pdf-export';

interface InjuryItem { local: string; descricao: string; data: string }
interface SurgeryItem { tipo: string; data: string }
interface MedicationItem { nome: string; dose: string }

interface HealthRecord {
  id: number;
  user_id: string;
  birth_date: string | null;
  blood_type: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  main_goal: string | null;
  injuries: InjuryItem[] | null;
  surgeries: SurgeryItem[] | null;
  chronic_conditions: string[] | null;
  medications: MedicationItem[] | null;
  allergies: string | null;
  physical_restrictions: string | null;
  doctor_clearance: boolean;
  doctor_notes: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  consent_signed: boolean;
  consent_date: string | null;
  updated_at: string | null;
}

interface AlunoInfo {
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

function InfoRow({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`flex gap-2 py-2 border-b border-slate-700/50 last:border-0 ${highlight ? 'bg-red-900/10 rounded-lg px-2' : ''}`}>
      <span className="text-slate-400 text-sm w-40 flex-shrink-0">{label}</span>
      <span className={`text-sm flex-1 ${highlight ? 'text-red-300 font-medium' : 'text-white'}`}>{value || '—'}</span>
    </div>
  );
}

export default function AdminFichaSaudePage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const { user: adminUser, loading: authLoading } = usePilatesAuth();
  const [record, setRecord] = useState<HealthRecord | null>(null);
  const [aluno, setAluno] = useState<AlunoInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (!authLoading && adminUser && userId) {
      Promise.all([
        supabase
          .from('health_records')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('users_pilates')
          .select('full_name, email, phone')
          .eq('id', userId)
          .maybeSingle(),
      ]).then(([recordRes, alunoRes]) => {
        if (recordRes.data) setRecord(recordRes.data as HealthRecord);
        if (alunoRes.data) setAluno(alunoRes.data as AlunoInfo);
        setLoading(false);
      });
    } else if (!authLoading && !adminUser) {
      setLoading(false);
    }
  }, [authLoading, adminUser, userId]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasRestrictions = !!(record?.physical_restrictions || (record?.chronic_conditions && record.chronic_conditions.length > 0) || !record?.doctor_clearance);

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="text-slate-400 hover:text-white text-sm flex items-center gap-1 mb-2"
          >
            ← Voltar
          </button>
          <h1 className="text-2xl font-bold text-white">
            Ficha de Saúde — {aluno?.full_name || aluno?.email || 'Aluno'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {aluno?.email} {aluno?.phone ? `• ${aluno.phone}` : ''}
          </p>
        </div>
        {record && (
          <button
            onClick={() => {
              const imc = record.height_cm && record.weight_kg
                ? (record.weight_kg / Math.pow(record.height_cm / 100, 2)).toFixed(1)
                : null;
              printDocument({
                title: 'Ficha de Saúde',
                subtitle: aluno?.full_name || aluno?.email || '',
                sections: [
                  {
                    title: 'Dados Gerais',
                    rows: [
                      { label: 'Data de Nascimento', value: record.birth_date ? new Date(record.birth_date + 'T12:00:00').toLocaleDateString('pt-BR') : null },
                      { label: 'Tipo Sanguíneo', value: record.blood_type },
                      { label: 'Altura', value: record.height_cm ? `${record.height_cm} cm` : null },
                      { label: 'Peso', value: record.weight_kg ? `${record.weight_kg} kg` : null },
                      { label: 'IMC', value: imc },
                    ],
                  },
                  {
                    title: 'Objetivo',
                    rows: [{ label: 'Objetivo principal', value: record.main_goal }],
                  },
                  {
                    title: 'Histórico Clínico',
                    rows: [
                      { label: 'Lesões', value: record.injuries?.length ? record.injuries.map((i) => `${i.local}: ${i.descricao}`).join('; ') : null },
                      { label: 'Cirurgias', value: record.surgeries?.length ? record.surgeries.map((s) => `${s.tipo} (${s.data})`).join('; ') : null },
                      { label: 'Condições crônicas', value: record.chronic_conditions?.join(', ') },
                      { label: 'Medicamentos', value: record.medications?.length ? record.medications.map((m) => `${m.nome} ${m.dose}`).join('; ') : null },
                      { label: 'Alergias', value: record.allergies },
                    ],
                  },
                  {
                    title: 'Restrições e Liberação',
                    rows: [
                      { label: 'Restrições físicas', value: record.physical_restrictions },
                      { label: 'Liberação médica', value: record.doctor_clearance ? 'Sim' : 'NÃO — verificar antes de iniciar' },
                      { label: 'Obs. médico', value: record.doctor_notes },
                    ],
                  },
                  {
                    title: 'Contato de Emergência',
                    rows: [
                      { label: 'Nome', value: record.emergency_contact_name },
                      { label: 'Telefone', value: record.emergency_contact_phone },
                    ],
                  },
                  {
                    title: 'Consentimento LGPD',
                    rows: [
                      { label: 'Termo assinado', value: record.consent_signed ? 'Sim' : 'Não' },
                      { label: 'Data', value: record.consent_date ? new Date(record.consent_date).toLocaleDateString('pt-BR') : null },
                    ],
                  },
                ],
                footer: `Documento confidencial — uso exclusivo Daimach.Movement | ${aluno?.email || ''} | Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
              });
            }}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm font-medium"
          >
            🖨️ Exportar PDF
          </button>
        )}
      </div>

      {/* Alerta de restrições */}
      {hasRestrictions && (
        <div className="bg-red-600/10 border border-red-500/40 rounded-xl p-4 space-y-1">
          <p className="text-red-400 font-semibold flex items-center gap-2">
            <span>⚠️</span> Atenção — Este aluno possui restrições
          </p>
          {record?.physical_restrictions && (
            <p className="text-red-300 text-sm">🦴 {record.physical_restrictions}</p>
          )}
          {!record?.doctor_clearance && (
            <p className="text-yellow-400 text-sm">🏥 Sem liberação médica documentada</p>
          )}
          {record?.chronic_conditions && record.chronic_conditions.length > 0 && (
            <p className="text-orange-300 text-sm">💊 {record.chronic_conditions.join(', ')}</p>
          )}
        </div>
      )}

      {!record ? (
        <div className="bg-slate-800 rounded-xl p-10 border border-slate-700 text-center space-y-3">
          <p className="text-4xl">📋</p>
          <p className="text-slate-300 font-medium">Ficha de saúde não preenchida ainda.</p>
          <p className="text-slate-500 text-sm">O aluno ainda não completou a anamnese.</p>
        </div>
      ) : (
        <>
          {/* Dados gerais */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h2 className="text-green-400 font-semibold mb-3">👤 Dados Gerais</h2>
            <InfoRow label="Data de Nascimento" value={record.birth_date ? new Date(record.birth_date + 'T00:00:00').toLocaleDateString('pt-BR') : null} />
            <InfoRow label="Tipo Sanguíneo" value={record.blood_type} />
            <InfoRow label="Altura" value={record.height_cm ? `${record.height_cm} cm` : null} />
            <InfoRow label="Peso" value={record.weight_kg ? `${record.weight_kg} kg` : null} />
            {record.height_cm && record.weight_kg && (
              <InfoRow
                label="IMC"
                value={`${(record.weight_kg / Math.pow(record.height_cm / 100, 2)).toFixed(1)}`}
              />
            )}
          </div>

          {/* Objetivo */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h2 className="text-green-400 font-semibold mb-3">🎯 Objetivo Principal</h2>
            <p className="text-white text-sm">{record.main_goal || 'Não informado'}</p>
          </div>

          {/* Lesões */}
          {record.injuries && record.injuries.length > 0 && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <h2 className="text-green-400 font-semibold mb-3">🦴 Lesões</h2>
              <div className="space-y-2">
                {record.injuries.map((inj, i) => (
                  <div key={i} className="text-sm text-white">
                    <span className="font-medium">{inj.local}</span>: {inj.descricao}
                    {inj.data && <span className="text-slate-400"> ({new Date(inj.data + 'T00:00:00').toLocaleDateString('pt-BR')})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cirurgias */}
          {record.surgeries && record.surgeries.length > 0 && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <h2 className="text-green-400 font-semibold mb-3">🏥 Cirurgias</h2>
              <div className="space-y-2">
                {record.surgeries.map((surg, i) => (
                  <div key={i} className="text-sm text-white">
                    {surg.tipo}
                    {surg.data && <span className="text-slate-400"> ({new Date(surg.data + 'T00:00:00').toLocaleDateString('pt-BR')})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Condições e Medicamentos */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h2 className="text-green-400 font-semibold mb-3">💊 Saúde</h2>
            {record.chronic_conditions && record.chronic_conditions.length > 0 && (
              <div className="mb-3">
                <p className="text-slate-400 text-xs mb-1">Condições crônicas</p>
                <div className="flex flex-wrap gap-1">
                  {record.chronic_conditions.map((c, i) => (
                    <span key={i} className="bg-orange-600/20 text-orange-300 text-xs px-2 py-0.5 rounded-full">{c}</span>
                  ))}
                </div>
              </div>
            )}
            {record.medications && record.medications.length > 0 && (
              <div className="mb-3">
                <p className="text-slate-400 text-xs mb-1">Medicamentos em uso</p>
                <div className="space-y-1">
                  {record.medications.map((med, i) => (
                    <p key={i} className="text-sm text-white">{med.nome} — {med.dose}</p>
                  ))}
                </div>
              </div>
            )}
            {record.allergies && (
              <div>
                <p className="text-slate-400 text-xs mb-1">Alergias</p>
                <p className="text-sm text-white">{record.allergies}</p>
              </div>
            )}
          </div>

          {/* Restrições */}
          <div className={`bg-slate-800 rounded-xl border p-5 ${record.physical_restrictions ? 'border-red-500/40' : 'border-slate-700'}`}>
            <h2 className="text-green-400 font-semibold mb-3">⚠️ Restrições e Liberação Médica</h2>
            <InfoRow
              label="Restrições físicas"
              value={record.physical_restrictions}
              highlight={!!record.physical_restrictions}
            />
            <InfoRow
              label="Liberação médica"
              value={record.doctor_clearance ? '✅ Sim' : '❌ Não documentada'}
              highlight={!record.doctor_clearance}
            />
            {record.doctor_notes && (
              <InfoRow label="Obs. médico" value={record.doctor_notes} />
            )}
          </div>

          {/* Contato de emergência */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h2 className="text-green-400 font-semibold mb-3">🆘 Contato de Emergência</h2>
            <InfoRow label="Nome" value={record.emergency_contact_name} />
            <InfoRow label="Telefone" value={record.emergency_contact_phone} />
          </div>

          {/* Consentimento */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h2 className="text-green-400 font-semibold mb-3">📋 Consentimento</h2>
            <InfoRow
              label="LGPD assinado"
              value={record.consent_signed ? `✅ Sim (${record.consent_date ? new Date(record.consent_date).toLocaleDateString('pt-BR') : ''})` : '❌ Não assinado'}
              highlight={!record.consent_signed}
            />
            {record.updated_at && (
              <InfoRow
                label="Última atualização"
                value={new Date(record.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
