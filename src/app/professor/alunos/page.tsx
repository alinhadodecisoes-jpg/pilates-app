'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { updateAluno } from '@/lib/pilates/pilates-db';
import { Modal } from '@/components/pilates/Modal';

interface Student {
  user_id: string;
  class_name: string;
  class_id: number;
  users_pilates?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    status: string;
    monthly_value: number | null;
  } | null;
}

interface EditForm {
  full_name: string;
  phone: string;
}

interface FichaData {
  user: Record<string, unknown> | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ficha: Record<string, any> | null;
  avaliacoes: Record<string, unknown>[];
  presencas: Record<string, unknown>[];
  turmas: Record<string, unknown>[];
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function FichaModal({ student, professorId, onClose }: {
  student: Student;
  professorId: string;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'dados' | 'saude' | 'avaliacoes' | 'presencas'>('dados');
  const [data, setData] = useState<FichaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/pilates/professor/alunos/${student.user_id}/ficha?professorId=${professorId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError('Erro ao carregar ficha.'))
      .finally(() => setLoading(false));
  }, [student.user_id, professorId]);

  const tabs = [
    { key: 'dados', label: 'Dados' },
    { key: 'saude', label: 'Saúde' },
    { key: 'avaliacoes', label: 'Avaliações' },
    { key: 'presencas', label: 'Presenças' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-ink">{student.users_pilates?.full_name || '—'}</h2>
            <p className="text-xs text-slate-400">{student.class_name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-ink text-xl leading-none">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 px-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
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
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {!loading && !error && data && (
            <>
              {tab === 'dados' && (
                <div className="space-y-4">
                  <Row label="Nome" value={String(data.user?.full_name ?? '—')} />
                  <Row label="E-mail" value={String(data.user?.email ?? '—')} />
                  <Row label="Telefone" value={String(data.user?.phone ?? '—')} />
                  <Row label="Status" value={String(data.user?.status ?? '—')} highlight />
                  <Row label="Plano mensal" value={data.user?.monthly_value != null ? `R$ ${Number(data.user.monthly_value).toFixed(2)}` : '—'} />
                  <div className="pt-2">
                    <p className="text-xs text-slate-500 font-medium mb-2">Turmas matriculadas</p>
                    {data.turmas.length === 0 ? (
                      <p className="text-slate-400 text-sm">—</p>
                    ) : (
                      <div className="space-y-1">
                        {data.turmas.map((t: any, i) => (
                          <p key={i} className="text-sm text-slate-300">
                            {t.classes_pilates?.name} — {DAYS[t.classes_pilates?.day_of_week ?? 0]} {String(t.classes_pilates?.time_start ?? '').slice(0, 5)}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tab === 'saude' && (
                <div className="space-y-4">
                  {!data.ficha ? (
                    <p className="text-slate-400 text-sm">Ficha de saúde não preenchida.</p>
                  ) : (
                    <>
                      <SaudeSection title="Dados Gerais">
                        {data.ficha.blood_type && <Row label="Tipo Sanguíneo" value={String(data.ficha.blood_type)} />}
                        {data.ficha.height_cm != null && <Row label="Altura" value={`${data.ficha.height_cm} cm`} />}
                        {data.ficha.weight_kg != null && <Row label="Peso" value={`${data.ficha.weight_kg} kg`} />}
                        {data.ficha.main_goal && <Row label="Objetivo" value={String(data.ficha.main_goal)} />}
                      </SaudeSection>

                      <SaudeSection title="Condições Crônicas">
                        {Array.isArray(data.ficha.chronic_conditions) && data.ficha.chronic_conditions.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {data.ficha.chronic_conditions.map((c: string, i: number) => (
                              <span key={i} className="text-xs bg-red-600/20 text-red-300 px-2 py-1 rounded-full">{c}</span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400">Nenhuma condição crônica informada.</p>
                        )}
                      </SaudeSection>

                      {Array.isArray(data.ficha.injuries) && data.ficha.injuries.length > 0 && (
                        <SaudeSection title="Lesões">
                          {data.ficha.injuries.map((inj: any, i: number) => (
                            <p key={i} className="text-sm text-slate-200">
                              {[inj.local, inj.descricao, inj.data].filter(Boolean).join(' — ')}
                            </p>
                          ))}
                        </SaudeSection>
                      )}

                      {Array.isArray(data.ficha.surgeries) && data.ficha.surgeries.length > 0 && (
                        <SaudeSection title="Cirurgias">
                          {data.ficha.surgeries.map((s: any, i: number) => (
                            <p key={i} className="text-sm text-slate-200">
                              {[s.tipo, s.data].filter(Boolean).join(' — ')}
                            </p>
                          ))}
                        </SaudeSection>
                      )}

                      {Array.isArray(data.ficha.medications) && data.ficha.medications.length > 0 && (
                        <SaudeSection title="Medicamentos">
                          {data.ficha.medications.map((m: any, i: number) => (
                            <p key={i} className="text-sm text-slate-200">
                              {[m.nome, m.dose].filter(Boolean).join(' — ')}
                            </p>
                          ))}
                        </SaudeSection>
                      )}

                      <SaudeSection title="Restrições e Alergias">
                        {data.ficha.allergies && <Row label="Alergias" value={String(data.ficha.allergies)} />}
                        {data.ficha.physical_restrictions && <Row label="Restrições Físicas" value={String(data.ficha.physical_restrictions)} highlight />}
                        <Row label="Liberação Médica" value={data.ficha.doctor_clearance ? 'Sim' : 'Não'} />
                        {data.ficha.doctor_notes && <Row label="Obs. Médico" value={String(data.ficha.doctor_notes)} />}
                      </SaudeSection>

                      {(data.ficha.emergency_contact_name || data.ficha.emergency_contact_phone) && (
                        <SaudeSection title="Contato de Emergência">
                          {data.ficha.emergency_contact_name && <Row label="Nome" value={String(data.ficha.emergency_contact_name)} />}
                          {data.ficha.emergency_contact_phone && <Row label="Telefone" value={String(data.ficha.emergency_contact_phone)} />}
                        </SaudeSection>
                      )}
                    </>
                  )}
                </div>
              )}

              {tab === 'avaliacoes' && (
                <div className="space-y-4">
                  {data.avaliacoes.length === 0 ? (
                    <p className="text-slate-400 text-sm">Nenhuma avaliação registrada.</p>
                  ) : (
                    data.avaliacoes.map((av: any, i) => (
                      <div key={i} className="bg-slate-900 rounded-xl p-4 space-y-3">
                        <p className="text-green-400 font-medium text-sm">
                          {av.evaluation_date ? new Date(av.evaluation_date + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {av.weight && <Row label="Peso" value={`${av.weight} kg`} />}
                          {av.height && <Row label="Altura" value={`${av.height} cm`} />}
                          {av.body_fat && <Row label="% Gordura" value={`${av.body_fat}%`} />}
                          {av.muscle_mass && <Row label="Massa Muscular" value={`${av.muscle_mass} kg`} />}
                        </div>
                        {av.posture_assessment && <Row label="Postura" value={String(av.posture_assessment)} />}
                        {av.goals && <Row label="Objetivos" value={String(av.goals)} />}
                        {av.notes && <Row label="Observações" value={String(av.notes)} />}
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === 'presencas' && (
                <div className="space-y-2">
                  {data.presencas.length === 0 ? (
                    <p className="text-slate-400 text-sm">Nenhum registro de presença.</p>
                  ) : (
                    data.presencas.map((p: any, i) => {
                      const session = p.class_sessions;
                      const date = session?.session_date
                        ? new Date(session.session_date + 'T00:00:00').toLocaleDateString('pt-BR')
                        : '—';
                      const turma = session?.classes_pilates?.name ?? '—';
                      return (
                        <div key={i} className="flex items-center justify-between bg-slate-900 rounded-lg px-4 py-2.5">
                          <div>
                            <p className="text-sm text-ink">{turma}</p>
                            <p className="text-xs text-slate-400">{date}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            p.status === 'confirmed' || p.status === 'present'
                              ? 'bg-green-600/20 text-green-400'
                              : p.status === 'absent'
                              ? 'bg-red-600/20 text-red-400'
                              : 'bg-slate-600/20 text-slate-400'
                          }`}>
                            {p.status === 'confirmed' ? 'Confirmado'
                              : p.status === 'present' ? 'Presente'
                              : p.status === 'absent' ? 'Faltou'
                              : p.status ?? '—'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className={`text-sm text-right ${highlight ? 'text-green-400 font-medium' : 'text-slate-200'}`}>{value}</span>
    </div>
  );
}

function SaudeSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-500 font-medium mb-2">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export default function ProfessorAlunosPage() {
  const { user, loading: authLoading } = usePilatesAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ full_name: '', phone: '' });
  const [fichaStudent, setFichaStudent] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pilates/professor?professorId=${user.id}`);
      if (!res.ok) throw new Error('Falha ao carregar');
      const data = await res.json();
      const mapped = (data.students ?? []).map((e: any) => ({
        user_id: e.user_id,
        class_id: e.class_id,
        class_name: e.class_name ?? '—',
        users_pilates: {
          full_name: e.full_name,
          email: e.email,
          phone: e.phone,
          status: e.status,
          monthly_value: e.monthly_value,
        },
      }));
      setStudents(mapped as Student[]);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar alunos.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) loadStudents();
  }, [authLoading, loadStudents]);

  const openEdit = (s: Student) => {
    setEditStudent(s);
    setEditForm({
      full_name: s.users_pilates?.full_name ?? '',
      phone: s.users_pilates?.phone ?? '',
    });
    setError(null);
  };

  const handleSaveEdit = async () => {
    if (!editStudent) return;
    setSaving(true);
    try {
      await updateAluno(editStudent.user_id, {
        full_name: editForm.full_name || undefined,
        phone: editForm.phone || undefined,
      });
      setEditStudent(null);
      loadStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (s.users_pilates?.full_name ?? '').toLowerCase().includes(q) ||
      (s.users_pilates?.email ?? '').toLowerCase().includes(q) ||
      s.class_name.toLowerCase().includes(q)
    );
  });

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Meus Alunos</h1>
        <span className="text-sm text-slate-400">{filtered.length} aluno(s)</span>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-xl px-4 py-3">⚠️ {error}</p>
      )}

      <input
        type="text"
        placeholder="Buscar por nome, email ou turma..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
      />

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="px-5 py-3 text-slate-400 font-medium">Nome</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Turma</th>
                <th className="px-5 py-3 text-slate-400 font-medium hidden md:table-cell">Telefone</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Status</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                    {students.length === 0
                      ? 'Nenhum aluno matriculado nas suas turmas.'
                      : 'Nenhum resultado para a busca.'}
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={`${s.user_id}-${s.class_id}`} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-ink font-medium">{s.users_pilates?.full_name || '—'}</p>
                      <p className="text-slate-400 text-xs">{s.users_pilates?.email || ''}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-300 text-xs">{s.class_name}</td>
                    <td className="px-5 py-4 text-slate-300 hidden md:table-cell">
                      {s.users_pilates?.phone ? (
                        <a
                          href={`https://wa.me/55${s.users_pilates.phone.replace(/\D/g, '')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-green-400 hover:text-green-300 text-xs"
                        >
                          {s.users_pilates.phone}
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        s.users_pilates?.status === 'ativo' ? 'bg-green-600/20 text-green-400'
                          : s.users_pilates?.status === 'inadimplente' ? 'bg-red-600/20 text-red-400'
                          : 'bg-slate-600/20 text-slate-400'
                      }`}>
                        {s.users_pilates?.status || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setFichaStudent(s)}
                          className="text-xs text-green-400 hover:text-green-300 bg-green-600/10 hover:bg-green-600/20 px-3 py-1.5 rounded-lg transition-colors border border-green-600/20"
                        >
                          Ver Ficha
                        </button>
                        <button
                          onClick={() => openEdit(s)}
                          className="text-xs text-slate-300 hover:text-ink bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ver Ficha */}
      {fichaStudent && user && (
        <FichaModal
          student={fichaStudent}
          professorId={user.id}
          onClose={() => setFichaStudent(null)}
        />
      )}

      {/* Modal Editar */}
      {editStudent && (
        <Modal
          title="Editar Dados do Aluno"
          onClose={() => setEditStudent(null)}
          onConfirm={handleSaveEdit}
          confirmText="Salvar"
          loading={saving}
        >
          <div className="space-y-4">
            {error && (
              <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">{error}</p>
            )}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nome Completo</label>
              <input
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Telefone</label>
              <input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="(11) 99999-9999"
              />
            </div>
            <p className="text-xs text-slate-500">
              Professor pode editar nome e telefone. Dados financeiros são gerenciados pelo admin.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
