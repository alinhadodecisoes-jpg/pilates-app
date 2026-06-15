import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { PilatesUser, PilatesPlan, PilatesClass, PilatesAttendance, PilatesPhysicalEvaluation } from '@/types/pilates';

const getDb = () => getSupabaseBrowserClient();

// ====================== ALUNOS ======================

export async function getAlunos() {
  if (typeof window !== 'undefined') {
    const res = await fetch('/api/pilates/alunos');
    if (!res.ok) throw new Error('Erro ao buscar alunos');
    return (await res.json()) as PilatesUser[];
  }
  const db = getDb();
  const { data, error } = await db
    .from('users_pilates')
    .select('*')
    .eq('role', 'aluno')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as PilatesUser[];
}

export async function getAlunoById(id: string) {
  const db = getDb();
  const { data, error } = await db
    .from('users_pilates')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as PilatesUser;
}

export async function updateAluno(id: string, updates: Partial<PilatesUser>) {
  if (typeof window !== 'undefined') {
    const res = await fetch(`/api/pilates/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || 'Erro ao atualizar usuário');
    }
    return (await res.json()) as PilatesUser;
  }
  const db = getDb();
  const { data, error } = await db
    .from('users_pilates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as PilatesUser;
}

export async function deleteAluno(id: string) {
  if (typeof window !== 'undefined') {
    const res = await fetch(`/api/pilates/users/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao remover usuário');
    return;
  }
  const db = getDb();
  const { error } = await db
    .from('users_pilates')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ====================== TURMAS ======================

export async function getClasses() {
  const db = getDb();
  const { data, error } = await db
    .from('classes_pilates')
    .select('*')
    .order('day_of_week', { ascending: true })
    .order('time_start', { ascending: true });
  if (error) throw error;
  return data as PilatesClass[];
}

export async function getClassById(id: number) {
  const db = getDb();
  const { data, error } = await db
    .from('classes_pilates')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as PilatesClass;
}

export async function createClass(
  professorId: string,
  nome: string,
  dayOfWeek: number,
  timeStart: string,
  timeEnd: string,
  capacity: number
) {
  if (typeof window !== 'undefined') {
    const res = await fetch('/api/pilates/turmas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ professor_id: professorId, name: nome, day_of_week: dayOfWeek, time_start: timeStart, time_end: timeEnd, capacity }),
    });
    if (!res.ok) throw new Error('Erro ao criar turma');
    return (await res.json()) as PilatesClass;
  }
  const db = getDb();
  const { data, error } = await db
    .from('classes_pilates')
    .insert({
      professor_id: professorId,
      name: nome,
      day_of_week: dayOfWeek,
      time_start: timeStart,
      time_end: timeEnd,
      capacity,
      is_active: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data as PilatesClass;
}

export async function updateClass(id: number, updates: Partial<PilatesClass>) {
  if (typeof window !== 'undefined') {
    const res = await fetch(`/api/pilates/turmas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Erro ao atualizar turma');
    return (await res.json()) as PilatesClass;
  }
  const db = getDb();
  const { data, error } = await db
    .from('classes_pilates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as PilatesClass;
}

export async function deleteClass(id: number) {
  if (typeof window !== 'undefined') {
    const res = await fetch(`/api/pilates/turmas/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao deletar turma');
    return;
  }
  const db = getDb();
  const { error } = await db.from('classes_pilates').delete().eq('id', id);
  if (error) throw error;
}

export async function getClassesWithEnrollments() {
  const db = getDb();
  const { data, error } = await db
    .from('classes_pilates')
    .select('*, enrollments_pilates(count)')
    .order('day_of_week', { ascending: true })
    .order('time_start', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getClassesWithEnrolledCount(): Promise<PilatesClass[]> {
  if (typeof window !== 'undefined') {
    const res = await fetch('/api/pilates/turmas');
    if (!res.ok) throw new Error('Erro ao buscar turmas');
    return (await res.json()) as PilatesClass[];
  }
  const db = getDb();
  const [classesResult, enrollmentsResult] = await Promise.all([
    db.from('classes_pilates').select('*').order('day_of_week', { ascending: true }).order('time_start', { ascending: true }),
    db.from('enrollments_pilates').select('class_id').eq('is_active', true),
  ]);
  if (classesResult.error) throw classesResult.error;

  const countByClass: Record<number, number> = {};
  for (const e of enrollmentsResult.data ?? []) {
    countByClass[e.class_id] = (countByClass[e.class_id] ?? 0) + 1;
  }

  return (classesResult.data ?? []).map((c) => ({
    ...c,
    enrolled_count: countByClass[c.id] ?? 0,
  })) as PilatesClass[];
}

// ====================== PLANOS ======================

export async function getPlans() {
  const db = getDb();
  const { data, error } = await db
    .from('plans_pilates')
    .select('*')
    .order('price', { ascending: true });
  if (error) throw error;
  return data as PilatesPlan[];
}

export async function createPlan(name: string, price: number, classesPerWeek: number, description?: string) {
  const db = getDb();
  const { data, error } = await db
    .from('plans_pilates')
    .insert({ name, price, classes_per_week: classesPerWeek, description, is_active: true })
    .select()
    .single();
  if (error) throw error;
  return data as PilatesPlan;
}

export async function updatePlan(id: number, updates: Partial<PilatesPlan>) {
  const db = getDb();
  const { data, error } = await db
    .from('plans_pilates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as PilatesPlan;
}

export async function deletePlan(id: number) {
  const db = getDb();
  const { error } = await db.from('plans_pilates').delete().eq('id', id);
  if (error) throw error;
}

// ====================== AULAS DO ALUNO ======================

export async function getAlunoAulas(alunoId: string) {
  if (typeof window !== 'undefined') {
    const res = await fetch(`/api/pilates/aluno/aulas?userId=${alunoId}`);
    if (!res.ok) throw new Error('Erro ao buscar aulas do aluno');
    return await res.json();
  }
  const db = getDb();
  const { data, error } = await db
    .from('enrollments_pilates')
    .select('*, class:classes_pilates(*)')
    .eq('user_id', alunoId)
    .eq('is_active', true);
  if (error) throw error;
  return data;
}

export async function marcarReposicao(alunoId: string, classId: number, date: string) {
  const db = getDb();
  const { data, error } = await db
    .from('attendances_pilates')
    .insert({
      user_id: alunoId,
      class_id: classId,
      attendance_date: date,
      status: 'replacement',
    })
    .select()
    .single();
  if (error) throw error;
  return data as PilatesAttendance;
}

export async function cancelarAula(alunoId: string, classId: number, date: string) {
  const db = getDb();
  const { data, error } = await db
    .from('attendances_pilates')
    .upsert({
      user_id: alunoId,
      class_id: classId,
      attendance_date: date,
      status: 'canceled_in_advance',
    })
    .select()
    .single();
  if (error) throw error;
  return data as PilatesAttendance;
}

// ====================== AVALIAÇÕES ======================

export async function getAvaliacoes(alunoId: string) {
  const db = getDb();
  const { data, error } = await db
    .from('physical_evaluations_pilates')
    .select('*')
    .eq('user_id', alunoId)
    .order('evaluation_date', { ascending: false });
  if (error) throw error;
  return data as PilatesPhysicalEvaluation[];
}

export async function getUltimaAvaliacao(alunoId: string) {
  const db = getDb();
  const { data, error } = await db
    .from('physical_evaluations_pilates')
    .select('*')
    .eq('user_id', alunoId)
    .order('evaluation_date', { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data as PilatesPhysicalEvaluation | null;
}

// ====================== DASHBOARD ======================

export async function getDashboardStats() {
  if (typeof window !== 'undefined') {
    const res = await fetch('/api/pilates/stats');
    if (!res.ok) throw new Error('Erro ao buscar stats');
    return await res.json();
  }
  const db = getDb();
  const [alunos, inadimplentes, turmas] = await Promise.all([
    db.from('users_pilates').select('id', { count: 'exact' }).eq('role', 'aluno'),
    db.from('users_pilates').select('id', { count: 'exact' }).eq('status', 'inadimplente'),
    db.from('classes_pilates').select('id', { count: 'exact' }).eq('is_active', true),
  ]);
  return {
    total_alunos: alunos.count ?? 0,
    inadimplentes: inadimplentes.count ?? 0,
    turmas_ativas: turmas.count ?? 0,
    faturamento_mes: 12500,
  };
}
