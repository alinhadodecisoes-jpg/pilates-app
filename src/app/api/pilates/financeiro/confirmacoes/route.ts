import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

function errMsg(e: unknown) { return (e as { message?: string })?.message ?? String(e); }

// GET → confirmações pendentes (para o admin), com nome do aluno
export async function GET() {
  try {
    const db = getSupabaseServerClient();
    const { data, error } = await db
      .from('payment_confirmations')
      .select('*, users_pilates!user_id(full_name, email)')
      .eq('status', 'pending')
      .order('informed_at', { ascending: true });
    if (error) return NextResponse.json({ pendentes: [], ready: false });
    return NextResponse.json({ pendentes: data ?? [], ready: true });
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 });
  }
}

// POST { action, ... }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getSupabaseServerClient();

    // Aluno informa que pagou
    if (body.action === 'inform') {
      const { user_id, amount } = body;
      const refMonth = new Date().toISOString().slice(0, 7);
      const { error } = await db.from('payment_confirmations').insert({
        user_id, amount: amount ?? null, reference_month: refMonth, status: 'pending',
      });
      if (error) return NextResponse.json({ error: 'Rode o SQL de payment_confirmations. (' + error.message + ')' }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // Admin confirma o pagamento
    if (body.action === 'confirm') {
      const { id, reviewer_id } = body;
      const { data: conf } = await db.from('payment_confirmations').select('*').eq('id', id).single();
      await db.from('payment_confirmations').update({ status: 'confirmed', reviewed_by: reviewer_id ?? null, reviewed_at: new Date().toISOString() }).eq('id', id);
      if (conf) {
        await db.from('payment_history').insert({
          user_id: conf.user_id, amount: conf.amount ?? 0, status: 'paid',
          payment_date: new Date().toISOString().split('T')[0],
          reference_month: conf.reference_month, payment_method: 'pix',
        });
        await db.from('users_pilates').update({ status: 'ativo', payment_status: 'em_dia' }).eq('id', conf.user_id);
      }
      return NextResponse.json({ success: true });
    }

    if (body.action === 'reject') {
      const { id, reviewer_id } = body;
      await db.from('payment_confirmations').update({ status: 'rejected', reviewed_by: reviewer_id ?? null, reviewed_at: new Date().toISOString() }).eq('id', id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'ação desconhecida' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 });
  }
}
