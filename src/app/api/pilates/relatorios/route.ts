import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/pilates/relatorios?tipo=alunos|financeiro|turmas|presenca
export async function GET(req: NextRequest) {
  try {
    const tipo = req.nextUrl.searchParams.get('tipo') ?? 'alunos';
    const db = getSupabaseServerClient();

    if (tipo === 'alunos') {
      const { data } = await db
        .from('users_pilates')
        .select('full_name, email, phone, status, payment_status, monthly_value, plan_id')
        .eq('role', 'aluno')
        .neq('is_pilates_student', false)
        .order('full_name');
      const rows = data ?? [];
      const resumo = {
        total: rows.length,
        ativos: rows.filter((r) => r.status === 'ativo').length,
        inadimplentes: rows.filter((r) => r.status === 'inadimplente' || r.payment_status === 'atrasado').length,
      };
      return NextResponse.json({ tipo, resumo, rows });
    }

    if (tipo === 'turmas') {
      const [classesRes, enrollRes, profsRes] = await Promise.all([
        db.from('classes_pilates').select('id, name, day_of_week, time_start, capacity, professor_id, is_active').eq('is_active', true).order('day_of_week'),
        db.from('enrollments_pilates').select('class_id').eq('is_active', true),
        db.from('users_pilates').select('id, full_name'),
      ]);
      const count: Record<number, number> = {};
      for (const e of enrollRes.data ?? []) count[e.class_id] = (count[e.class_id] ?? 0) + 1;
      const profName: Record<string, string> = {};
      for (const p of profsRes.data ?? []) profName[p.id] = p.full_name ?? '';
      const DAYS = ['', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
      const rows = (classesRes.data ?? []).map((c) => ({
        turma: c.name,
        dia: DAYS[c.day_of_week] ?? '—',
        horario: c.time_start?.slice(0, 5) ?? '',
        professor: c.professor_id ? (profName[c.professor_id] || '—') : '—',
        ocupacao: `${count[c.id] ?? 0}/${c.capacity}`,
        vagas: Math.max(0, c.capacity - (count[c.id] ?? 0)),
      }));
      return NextResponse.json({ tipo, resumo: { total: rows.length, comVaga: rows.filter((r) => r.vagas > 0).length }, rows });
    }

    if (tipo === 'financeiro') {
      const since = new Date(); since.setDate(since.getDate() - 30);
      const [paidRes, pendRes, alunosRes] = await Promise.all([
        db.from('payment_history').select('amount, payment_date, user_id, status').eq('status', 'paid').gte('payment_date', since.toISOString().split('T')[0]),
        db.from('payment_history').select('amount').eq('status', 'pending'),
        db.from('users_pilates').select('full_name, status, payment_status, monthly_value').eq('role', 'aluno').neq('is_pilates_student', false).order('full_name'),
      ]);
      const recebido = (paidRes.data ?? []).reduce((s, p) => s + (p.amount || 0), 0);
      const pendente = (pendRes.data ?? []).reduce((s, p) => s + (p.amount || 0), 0);
      const rows = (alunosRes.data ?? []).map((a) => ({
        aluno: a.full_name ?? '—',
        status: a.status ?? '—',
        pagamento: a.payment_status ?? '—',
        mensalidade: a.monthly_value != null ? `R$ ${Number(a.monthly_value).toFixed(2)}` : '—',
      }));
      return NextResponse.json({ tipo, resumo: { recebido30d: recebido, pendente }, rows });
    }

    if (tipo === 'presenca') {
      const [attRes, enrollRes, usersRes] = await Promise.all([
        db.from('attendances_pilates').select('user_id, status'),
        db.from('enrollments_pilates').select('user_id').eq('is_active', true),
        db.from('users_pilates').select('id, full_name').eq('role', 'aluno'),
      ]);
      const name: Record<string, string> = {};
      for (const u of usersRes.data ?? []) name[u.id] = u.full_name ?? '';
      const present: Record<string, number> = {};
      const total: Record<string, number> = {};
      for (const a of attRes.data ?? []) {
        total[a.user_id] = (total[a.user_id] ?? 0) + 1;
        if (a.status === 'present' || a.status === 'attended' || a.status === 'replacement') present[a.user_id] = (present[a.user_id] ?? 0) + 1;
      }
      const ids = [...new Set((enrollRes.data ?? []).map((e) => e.user_id))];
      const rows = ids.map((id) => ({
        aluno: name[id] || '—',
        presencas: present[id] ?? 0,
        registros: total[id] ?? 0,
        frequencia: total[id] ? `${Math.round(((present[id] ?? 0) / total[id]) * 100)}%` : '—',
      }));
      return NextResponse.json({ tipo, resumo: { alunos: rows.length }, rows });
    }

    return NextResponse.json({ error: 'tipo inválido' }, { status: 400 });
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
