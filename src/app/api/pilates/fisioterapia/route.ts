import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { requireRole, STAFF_ROLES } from '@/lib/api-auth';

// Pacientes = alunos de pilates ativos + pacientes só-fisio (is_physio_patient)
async function getPatients(db: ReturnType<typeof getSupabaseServerClient>) {
  const { data } = await db
    .from('users_pilates')
    .select('id, full_name, email, phone, role, is_physio_patient, is_pilates_student, status')
    .or('role.eq.aluno,is_physio_patient.eq.true')
    .neq('status', 'inativo')
    .order('full_name');
  return (data ?? []).map((u: any) => ({
    ...u,
    tipo: u.is_physio_patient && u.is_pilates_student !== false
      ? 'ambos'
      : u.is_physio_patient
      ? 'fisio'
      : 'pilates',
  }));
}

// GET /api/pilates/fisioterapia  → casos, sessões, pacientes, terapeutas
export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, STAFF_ROLES);
    if (auth.error) return auth.error;
    const db = getSupabaseServerClient();
    const [casesRes, evosRes, sessionsRes, therapistsRes, patients] = await Promise.all([
      db.from('physio_cases').select('*, aluno:users_pilates!user_id(full_name, email)').order('created_at', { ascending: false }),
      db.from('physio_evolutions').select('case_id'),
      db.from('physical_therapy_sessions').select('*, aluno:users_pilates!user_id(full_name, email), therapist:users_pilates!therapist_id(full_name, email)').order('session_date', { ascending: false }),
      db.from('users_pilates').select('id, full_name, email').in('role', ['fisioterapeuta', 'prof_fisio']).order('full_name'),
      getPatients(db),
    ]);

    const countByCase: Record<number, number> = {};
    for (const e of evosRes.data ?? []) countByCase[e.case_id] = (countByCase[e.case_id] ?? 0) + 1;
    const cases = (casesRes.data ?? []).map((c: any) => ({ ...c, _evo_count: countByCase[c.id] ?? 0 }));

    return NextResponse.json({
      cases,
      sessions: sessionsRes.data ?? [],
      patients,
      therapists: therapistsRes.data ?? [],
    });
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, STAFF_ROLES);
    if (auth.error) return auth.error;
    const body = await req.json();
    const { action } = body;
    const db = getSupabaseServerClient();

    // --- Cadastrar paciente (só-fisio / ambos / vincular aluno existente) ---
    if (action === 'create_patient') {
      const {
        existing_user_id, full_name, email, phone, password,
        is_physio_patient = true, is_pilates_student = false, create_login = false,
      } = body;

      // Vincular paciente a um usuário existente (ex.: aluno que passa a fazer fisio)
      if (existing_user_id) {
        const updates: Record<string, unknown> = { is_physio_patient: true, updated_at: new Date().toISOString() };
        if (is_pilates_student === true) updates.is_pilates_student = true;
        const { data, error } = await db.from('users_pilates').update(updates).eq('id', existing_user_id).select().single();
        if (error) throw error;
        return NextResponse.json({ patient: data });
      }

      // Novo paciente COM login (cria conta no Auth)
      if (create_login && email && password) {
        const { data: authData, error: authErr } = await db.auth.admin.createUser({
          email, password, email_confirm: true, user_metadata: { full_name },
        });
        if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 });
        const { data, error } = await db.from('users_pilates').upsert({
          id: authData.user.id, full_name: full_name ?? null, email, phone: phone ?? null,
          role: 'aluno', status: 'ativo', is_physio_patient, is_pilates_student,
        }).select().single();
        if (error) { await db.auth.admin.deleteUser(authData.user.id); throw error; }
        return NextResponse.json({ patient: data });
      }

      // Novo paciente SEM login (só prontuário — não acessa o app)
      const { data, error } = await db.from('users_pilates').insert({
        id: randomUUID(), full_name: full_name ?? null, email: email ?? null, phone: phone ?? null,
        role: 'aluno', status: 'ativo', is_physio_patient, is_pilates_student,
      }).select().single();
      if (error) throw error;
      return NextResponse.json({ patient: data });
    }

    // --- Casos (prontuários) ---
    if (action === 'create_case') {
      const { user_id, therapist_id, chief_complaint, diagnosis, treatment_plan, start_date } = body;
      const { error } = await db.from('physio_cases').insert({
        user_id, therapist_id: therapist_id ?? null, chief_complaint,
        diagnosis: diagnosis ?? null, treatment_plan: treatment_plan ?? null,
        start_date, status: 'active',
      });
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // --- Sessões (criar/editar/várias) ---
    const buildPayload = (b: Record<string, unknown>) => ({
      user_id: b.user_id,
      therapist_id: b.therapist_id || null,
      session_date: b.session_date,
      session_time: b.session_time || null,
      therapy_type: b.therapy_type || null,
      duration_minutes: b.duration_minutes ? Number(b.duration_minutes) : null,
      cost: b.cost ? Number(b.cost) : null,
      discount: b.discount ? Number(b.discount) : 0,
      paid: !!b.paid,
      payment_method: b.payment_method || null,
      status: b.status || 'scheduled',
      notes: b.notes || null,
    });
    // Campos base (existem mesmo antes de rodar o SQL das colunas novas)
    const baseOnly = (p: Record<string, unknown>) => ({
      user_id: p.user_id, therapist_id: p.therapist_id, session_date: p.session_date,
      therapy_type: p.therapy_type, cost: p.cost, status: p.status,
    });
    const missingCol = (e: { message?: string } | null) =>
      !!e && /column .* does not exist|could not find|schema cache/i.test(e.message ?? '');

    if (action === 'create_session') {
      const payload = buildPayload(body);
      let { error } = await db.from('physical_therapy_sessions').insert(payload);
      if (missingCol(error)) ({ error } = await db.from('physical_therapy_sessions').insert(baseOnly(payload)));
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'update_session') {
      const payload = buildPayload(body);
      let { error } = await db.from('physical_therapy_sessions').update(payload).eq('id', body.id);
      if (missingCol(error)) ({ error } = await db.from('physical_therapy_sessions').update(baseOnly(payload)).eq('id', body.id));
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Várias sessões de uma vez (ex.: 10 sessões, semanal, sempre seg às 10h)
    if (action === 'create_sessions_bulk') {
      const n = Math.max(1, Math.min(60, Number(body.count) || 1));
      const stepDays = body.frequency === 'daily' ? 1 : body.frequency === 'biweekly' ? 14 : 7;
      const start = new Date(String(body.session_date) + 'T12:00:00');
      const base = buildPayload(body);
      const rows = Array.from({ length: n }, (_, i) => {
        const d = new Date(start); d.setDate(d.getDate() + i * stepDays);
        return { ...base, session_date: d.toISOString().slice(0, 10) };
      });
      let { error } = await db.from('physical_therapy_sessions').insert(rows);
      if (missingCol(error)) ({ error } = await db.from('physical_therapy_sessions').insert(rows.map(baseOnly)));
      if (error) throw error;
      return NextResponse.json({ success: true, count: rows.length });
    }

    return NextResponse.json({ error: 'ação desconhecida' }, { status: 400 });
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/pilates/fisioterapia?sessionId=xx
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireRole(req, STAFF_ROLES);
    if (auth.error) return auth.error;
    const sessionId = req.nextUrl.searchParams.get('sessionId');
    if (!sessionId) return NextResponse.json({ error: 'sessionId obrigatório' }, { status: 400 });
    const db = getSupabaseServerClient();
    const { error } = await db.from('physical_therapy_sessions').delete().eq('id', Number(sessionId));
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
