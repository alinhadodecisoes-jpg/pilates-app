import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole, ADMIN_ROLES } from '@/lib/api-auth';

const DEFAULTS: Record<string, string> = {
  pix_key: '',
  pix_name: 'Daiana Alves da Silva',
  payment_deadline_days: '5',
  studio_name: 'Daimach Movement',
  studio_whatsapp: '5521763000055',
  studio_instagram: '@daimach.movement',
  studio_email: 'Daimach.movement@gmail.com',
};

// GET → mapa key->value das configs (defaults se a tabela ainda não existir)
export async function GET() {
  try {
    const db = getSupabaseServerClient();
    const { data, error } = await db.from('studio_config').select('key, value');
    if (error) {
      // tabela ainda não criada — retorna defaults
      return NextResponse.json({ config: DEFAULTS, ready: false });
    }
    const config = { ...DEFAULTS };
    for (const row of data ?? []) config[row.key] = row.value ?? '';
    return NextResponse.json({ config, ready: true });
  } catch {
    return NextResponse.json({ config: DEFAULTS, ready: false });
  }
}

// POST { updates: {key: value} } → upsert
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, ADMIN_ROLES);
    if (auth.error) return auth.error;
    const { updates } = await req.json();
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'updates obrigatório' }, { status: 400 });
    }
    const db = getSupabaseServerClient();
    const rows = Object.entries(updates).map(([key, value]) => ({ key, value: String(value ?? ''), updated_at: new Date().toISOString() }));
    const { error } = await db.from('studio_config').upsert(rows, { onConflict: 'key' });
    if (error) {
      return NextResponse.json({ error: 'Rode o SQL de studio_config no Supabase. (' + error.message + ')' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
