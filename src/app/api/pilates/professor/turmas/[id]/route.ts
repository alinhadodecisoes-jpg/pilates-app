import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// PUT /api/pilates/professor/turmas/[id]
// Atualiza notas da turma — valida que o professor é dono
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const classId = Number(id);
    const { professorId, notes } = await req.json();
    if (!professorId) return NextResponse.json({ error: 'professorId obrigatório' }, { status: 400 });

    const db = getSupabaseServerClient();

    // Verifica ownership
    const { data: cls } = await db
      .from('classes_pilates')
      .select('id, professor_id')
      .eq('id', classId)
      .single();

    if (!cls || cls.professor_id !== professorId) {
      return NextResponse.json({ error: 'Sem permissão para editar esta turma' }, { status: 403 });
    }

    const { data, error } = await db
      .from('classes_pilates')
      .update({ notes, updated_at: new Date().toISOString() })
      .eq('id', classId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
