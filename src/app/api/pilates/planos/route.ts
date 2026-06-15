import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/pilates/planos
export async function GET() {
  try {
    const db = getSupabaseServerClient();
    const { data, error } = await db
      .from('plans_pilates')
      .select('*')
      .order('price', { ascending: true });
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    return NextResponse.json({ error: (e as any)?.message ?? String(e) }, { status: 500 });
  }
}

// POST /api/pilates/planos  { action: 'create' | 'update' | 'delete', ... }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const db = getSupabaseServerClient();

    if (action === 'create') {
      const { name, price, classes_per_week, description, stripe_price_id } = body;
      const { data, error } = await db
        .from('plans_pilates')
        .insert({ name, price: Number(price), classes_per_week: Number(classes_per_week), description: description || null, stripe_price_id: stripe_price_id || null, is_active: true })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    if (action === 'update') {
      const { id, name, price, classes_per_week, description, stripe_price_id, is_active } = body;
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (name !== undefined) updates.name = name;
      if (price !== undefined) updates.price = Number(price);
      if (classes_per_week !== undefined) updates.classes_per_week = Number(classes_per_week);
      if (description !== undefined) updates.description = description || null;
      if (stripe_price_id !== undefined) updates.stripe_price_id = stripe_price_id || null;
      if (is_active !== undefined) updates.is_active = is_active;
      const { data, error } = await db
        .from('plans_pilates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    if (action === 'delete') {
      const { id } = body;
      const { error } = await db.from('plans_pilates').delete().eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'ação desconhecida' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as any)?.message ?? String(e) }, { status: 500 });
  }
}
