import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params;
    const db = getSupabaseServerClient();
    const [alunosRes, enrolledRes] = await Promise.all([
      db
        .from('users_pilates')
        .select('id, full_name, email, role, status, phone, monthly_value, emergency_contact, emergency_phone, plan_id, created_at')
        .eq('role', 'aluno')
        .eq('status', 'ativo')
        .order('full_name'),
      db
        .from('enrollments_pilates')
        .select('user_id, users_pilates!inner(full_name, email)')
        .eq('class_id', Number(classId)),
    ]);
    return NextResponse.json({
      alunos: alunosRes.data ?? [],
      enrolled: enrolledRes.data ?? [],
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params;
    const { userId } = await req.json();
    const db = getSupabaseServerClient();
    const { error } = await db
      .from('enrollments_pilates')
      .insert({ class_id: Number(classId), user_id: userId });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params;
    const { userId } = await req.json();
    const db = getSupabaseServerClient();
    const { error } = await db
      .from('enrollments_pilates')
      .delete()
      .eq('class_id', Number(classId))
      .eq('user_id', userId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
