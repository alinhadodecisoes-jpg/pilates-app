import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole, ADMIN_ROLES } from '@/lib/api-auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const auth = await requireRole(req, ADMIN_ROLES);
    if (auth.error) return auth.error;
    const { classId } = await params;
    const updates = await req.json();
    const db = getSupabaseServerClient();
    const { data, error } = await db
      .from('classes_pilates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', Number(classId))
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const auth = await requireRole(req, ADMIN_ROLES);
    if (auth.error) return auth.error;
    const { classId } = await params;
    const db = getSupabaseServerClient();
    const { error } = await db
      .from('classes_pilates')
      .delete()
      .eq('id', Number(classId));
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
