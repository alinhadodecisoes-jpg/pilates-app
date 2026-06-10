import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// Campos que podem ser atualizados via painel (admin/professor)
// Apenas colunas que existem hoje em users_pilates.
// (payment_status/next_due_date dependem da migração SQL — ver SQL_MIGRACOES_PENDENTES.sql)
const ALLOWED = new Set([
  'full_name', 'phone', 'role', 'status', 'monthly_value', 'plan_id',
  'emergency_contact', 'emergency_phone',
]);

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updates: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
      if (ALLOWED.has(k)) updates[k] = v;
    }
    updates.updated_at = new Date().toISOString();

    const db = getSupabaseServerClient();
    const { data, error } = await db
      .from('users_pilates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getSupabaseServerClient();
    const { error } = await db.from('users_pilates').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
