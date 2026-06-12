import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/pilates/api-auth';

// Usa service role key para criar usuários sem afetar a sessão do admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    // 🔒 Só admin pode criar contas
    const auth = await requireRole(request, ['admin']);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { email, password, full_name, phone, role, plan_id, monthly_value, due_day, status } = await request.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Email, senha e função são obrigatórios.' }, { status: 400 });
    }

    // Cria o usuário no Supabase Auth (confirmado automaticamente)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // Cria/atualiza o perfil em users_pilates
    const { error: profileError } = await supabaseAdmin
      .from('users_pilates')
      .upsert({
        id: userId,
        full_name: full_name ?? null,
        email,
        phone: phone ?? null,
        role,
        status: status ?? 'ativo',
        plan_id: plan_id ?? null,
        monthly_value: monthly_value ?? null,
        due_day: due_day ?? 10,
      });

    if (profileError) {
      // Reverter: deletar o usuário auth se o perfil falhou
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, userId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
