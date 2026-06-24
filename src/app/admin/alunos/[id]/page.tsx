'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

type Tab = 'dados' | 'saude' | 'avaliacoes' | 'turmas' | 'historico';

interface ProfileData {
  user: Record<string, any> | null;
  ficha: Record<string, any> | null;
  avaliacoes: Record<string, any>[];
  presencas: Record<string, any>[];
  turmas: Record<string, any>[];
  pagamentos: Record<string, any>[];
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-slate-700/50 last:border-0">
      <span className="text-sm text-slate-400 shrink-0">{label}</span>
      <span className="text-sm text-slate-200 text-right">{value || '—'}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ativo: 'bg-green-600/20 text-green-400',
    inadimplente: 'bg-red-600/20 text-red-400',
    inativo: 'bg-slate-600/20 text-slate-400',
    pago: 'bg-green-600/20 text-green-400',
    pendente: 'bg-yellow-600/20 text-yellow-400',
    atrasado: 'bg-red-600/20 text-red-400',
    confirmed: 'bg-green-600/20 text-green-400',
    cancelled: 'bg-red-600/20 text-red-400',
    present: 'bg-green-600/20 text-green-400',
    absent: 'bg-red-600/20 text-red-400',
  };
  const labels: Record<string, string> = {
    ativo: 'Ativo', inadimplente: 'Inadimplente', inativo: 'Inativo',
    pago: 'Pago', pendente: 'Pendente', atrasado: 'Atrasado',
    confirmed: 'Confirmado', cancelled: 'Cancelado', present: 'Presente', absent: 'Faltou',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${map[status] ?? 'bg-slate-600/20 text-slate-400'}`}>
      {labels[status] ?? status}
    </span>
  );
}

export default function AlunoProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { loading: authLoading } = usePilatesAuth();
  const alunoId = params.id as string;

  const [tab, setTab] = useState<Tab>('dados');
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    fetch(`/api/pilates/alunos/${alunoId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError('Erro ao carregar perfil.'))
      .finally(() => setLoading(false));
  }, [alunoId, authLoading]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'dados', label: 'Dados' },
    { key: 'saude', label: 'Saúde' },
    { key: 'avaliacoes', label: 'Avaliações' },
    { key: 'turmas', label: 'Turmas' },
    { key: 'historico', label: 'Histórico' },
  ];

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Link href="/admin/alunos" className="text-sm text-slate-400 hover:text-ink">← Voltar</Link>
        <p className="text-red-400 bg-red-900/20 border border-red-800 rounded-xl px-4 py-3">{error}</p>
      </div>
    );
  }

  const user = data?.user;
  const nome = String(user?.full_name ?? '—');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/alunos" className="text-slate-400 hover:text-ink text-sm">← Voltar</Link>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        {/* Perfil topo */}
        <div className="px-6 py-5 border-b border-slate-700 flex items-center gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-full bg-green-600/20 flex items-center justify-center text-green-400 text-2xl font-bold shrink-0">
            {nome.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-ink truncate">{nome}</h1>
            <p className="text-sm text-slate-400">{String(user?.email ?? '—')}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <StatusBadge status={String(user?.status ?? '')} />
            {user?.phone && (
              <a
                href={`https://wa.me/55${String(user.phone).replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-400 hover:text-green-300 bg-green-600/10 px-3 py-1 rounded-lg border border-green-600/20"
              >
                WhatsApp
              </a>
            )}
            <Link
              href={`/admin/ficha-saude/${alunoId}`}
              className="text-xs text-slate-300 hover:text-ink bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-lg"
            >
              Editar Ficha
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.key
                  ? 'text-green-400 border-b-2 border-green-400'
                  : 'text-slate-400 hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* DADOS */}
          {tab === 'dados' && (
            <div className="space-y-1">
              <Row label="Nome completo" value={String(user?.full_name ?? '')} />
              <Row label="E-mail" value={String(user?.email ?? '')} />
              <Row label="Telefone" value={String(user?.phone ?? '')} />
              <Row label="Status" value={String(user?.status ?? '')} />
              <Row label="Valor mensal" value={user?.monthly_value != null ? `R$ ${Number(user.monthly_value).toFixed(2)}` : ''} />
              <Row label="Dia de vencimento" value={user?.due_day != null ? `Dia ${user.due_day}` : ''} />
              <Row label="Cadastro" value={user?.created_at ? new Date(String(user.created_at)).toLocaleDateString('pt-BR') : ''} />
            </div>
          )}

          {/* SAÚDE */}
          {tab === 'saude' && (
            <div>
              {!data?.ficha ? (
                <div className="text-center py-10">
                  <p className="text-slate-400 mb-4">Ficha de saúde não preenchida.</p>
                  <Link href={`/admin/ficha-saude/${alunoId}`} className="text-sm text-green-400 hover:text-green-300 bg-green-600/10 px-4 py-2 rounded-lg border border-green-600/20">
                    Preencher Ficha
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {data.ficha.blood_type && <Row label="Tipo Sanguíneo" value={String(data.ficha.blood_type)} />}
                    {data.ficha.height_cm != null && <Row label="Altura" value={`${data.ficha.height_cm} cm`} />}
                    {data.ficha.weight_kg != null && <Row label="Peso" value={`${data.ficha.weight_kg} kg`} />}
                    {data.ficha.main_goal && <Row label="Objetivo" value={String(data.ficha.main_goal)} />}
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Condições Crônicas</h3>
                    {Array.isArray(data.ficha.chronic_conditions) && data.ficha.chronic_conditions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {data.ficha.chronic_conditions.map((c: string, i: number) => (
                          <span key={i} className="text-xs bg-red-600/15 text-red-300 px-2.5 py-1 rounded-full border border-red-600/20">{c}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Nenhuma condição crônica informada.</p>
                    )}
                  </div>

                  {Array.isArray(data.ficha.injuries) && data.ficha.injuries.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Lesões</h3>
                      {data.ficha.injuries.map((inj: Record<string, string>, i: number) => (
                        <p key={i} className="text-sm text-slate-200">{[inj.local, inj.descricao, inj.data].filter(Boolean).join(' — ')}</p>
                      ))}
                    </div>
                  )}

                  {Array.isArray(data.ficha.surgeries) && data.ficha.surgeries.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cirurgias</h3>
                      {data.ficha.surgeries.map((s: Record<string, string>, i: number) => (
                        <p key={i} className="text-sm text-slate-200">{[s.tipo, s.data].filter(Boolean).join(' — ')}</p>
                      ))}
                    </div>
                  )}

                  {Array.isArray(data.ficha.medications) && data.ficha.medications.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Medicamentos</h3>
                      {data.ficha.medications.map((m: Record<string, string>, i: number) => (
                        <p key={i} className="text-sm text-slate-200">{[m.nome, m.dose].filter(Boolean).join(' — ')}</p>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    {data.ficha.allergies && <Row label="Alergias" value={String(data.ficha.allergies)} />}
                    {data.ficha.physical_restrictions && <Row label="Restrições Físicas" value={String(data.ficha.physical_restrictions)} />}
                    <Row label="Liberação Médica" value={data.ficha.doctor_clearance ? 'Sim' : 'Não'} />
                    {data.ficha.emergency_contact_name && <Row label="Contato Emergência" value={String(data.ficha.emergency_contact_name)} />}
                    {data.ficha.emergency_contact_phone && <Row label="Telefone Emergência" value={String(data.ficha.emergency_contact_phone)} />}
                  </div>

                  <div className="pt-2">
                    <Link href={`/admin/ficha-saude/${alunoId}`} className="text-sm text-green-400 hover:text-green-300">
                      Editar ficha de saúde →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AVALIAÇÕES */}
          {tab === 'avaliacoes' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">{data?.avaliacoes.length ?? 0} avaliação(ões)</span>
                <Link href="/admin/avaliacoes/nova" className="text-xs text-green-400 hover:text-green-300 bg-green-600/10 px-3 py-1.5 rounded-lg border border-green-600/20">
                  + Nova Avaliação
                </Link>
              </div>
              {(data?.avaliacoes ?? []).length === 0 ? (
                <p className="text-center py-8 text-slate-500">Nenhuma avaliação registrada.</p>
              ) : (
                (data?.avaliacoes ?? []).map((av, i) => (
                  <div key={i} className="bg-slate-900 rounded-xl p-4 space-y-3">
                    <p className="text-green-400 font-medium text-sm">
                      {av.evaluation_date ? new Date(String(av.evaluation_date) + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {av.weight && <div className="text-center bg-slate-800 rounded-lg p-2"><p className="text-xs text-slate-500">Peso</p><p className="text-ink font-medium">{av.weight} kg</p></div>}
                      {av.height && <div className="text-center bg-slate-800 rounded-lg p-2"><p className="text-xs text-slate-500">Altura</p><p className="text-ink font-medium">{av.height} cm</p></div>}
                      {av.body_fat && <div className="text-center bg-slate-800 rounded-lg p-2"><p className="text-xs text-slate-500">Gordura</p><p className="text-ink font-medium">{av.body_fat}%</p></div>}
                      {av.muscle_mass && <div className="text-center bg-slate-800 rounded-lg p-2"><p className="text-xs text-slate-500">Músculo</p><p className="text-ink font-medium">{av.muscle_mass} kg</p></div>}
                    </div>
                    {av.posture_assessment && <Row label="Postura" value={String(av.posture_assessment)} />}
                    {av.goals && <Row label="Objetivos" value={String(av.goals)} />}
                    {av.notes && <Row label="Notas" value={String(av.notes)} />}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TURMAS */}
          {tab === 'turmas' && (
            <div className="space-y-3">
              {(data?.turmas ?? []).length === 0 ? (
                <p className="text-center py-8 text-slate-500">Nenhuma matrícula encontrada.</p>
              ) : (
                (data?.turmas ?? []).map((t, i) => {
                  const cls = t.classes_pilates as any;
                  return (
                    <div key={i} className={`bg-slate-900 rounded-xl p-4 flex items-center justify-between gap-3 ${!t.is_active ? 'opacity-50' : ''}`}>
                      <div>
                        <p className="text-ink font-medium">{cls?.name ?? '—'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {cls ? `${DAYS[cls.day_of_week]} · ${String(cls.time_start).slice(0, 5)} — ${String(cls.time_end).slice(0, 5)}` : ''}
                        </p>
                        {t.enrollment_date && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Desde {new Date(String(t.enrollment_date).slice(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={t.is_active ? 'ativo' : 'inativo'} />
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* HISTÓRICO */}
          {tab === 'historico' && (
            <div className="space-y-6">
              {/* Pagamentos */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Pagamentos</h3>
                {(data?.pagamentos ?? []).length === 0 ? (
                  <p className="text-slate-500 text-sm">Nenhum registro de pagamento.</p>
                ) : (
                  <div className="space-y-2">
                    {(data?.pagamentos ?? []).map((p, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-900 rounded-lg px-4 py-2.5 gap-3">
                        <div>
                          <p className="text-sm text-ink">
                            {p.due_date ? new Date(String(p.due_date) + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                          </p>
                          {p.amount_paid && (
                            <p className="text-xs text-slate-400">R$ {Number(p.amount_paid).toFixed(2)}</p>
                          )}
                        </div>
                        <StatusBadge status={String(p.status ?? '')} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Presenças */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Últimas Presenças</h3>
                {(data?.presencas ?? []).length === 0 ? (
                  <p className="text-slate-500 text-sm">Nenhum registro de presença.</p>
                ) : (
                  <div className="space-y-2">
                    {(data?.presencas ?? []).map((p, i) => {
                      const session = p.class_sessions as any;
                      const date = session?.session_date
                        ? new Date(String(session.session_date) + 'T00:00:00').toLocaleDateString('pt-BR')
                        : '—';
                      return (
                        <div key={i} className="flex items-center justify-between bg-slate-900 rounded-lg px-4 py-2.5 gap-3">
                          <div>
                            <p className="text-sm text-ink">{session?.classes_pilates?.name ?? '—'}</p>
                            <p className="text-xs text-slate-400">{date}</p>
                          </div>
                          <StatusBadge status={String(p.status ?? '')} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
