import { NextRequest, NextResponse } from 'next/server';
import { syncClassToGoogleCalendar, syncAllClassesToGoogleCalendar } from '@/lib/google-calendar';

/**
 * POST /api/calendar/sync
 * Sincroniza aula com Google Calendar
 *
 * Body:
 *   userId: UUID do usuário
 *   classId?: number (opcional, para uma aula específica)
 *   action?: 'create' | 'update' | 'delete' (padrão: 'create')
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, classId, action = 'create' } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    // Se classId não for especificado, sincronizar todas as classes
    if (!classId) {
      const results = await syncAllClassesToGoogleCalendar(userId);
      return NextResponse.json({
        success: true,
        message: `${results.length} aulas sincronizadas`,
        results,
      });
    }

    // Sincronizar aula específica
    const result = await syncClassToGoogleCalendar(userId, classId, action);

    return NextResponse.json({
      message: `Aula ${action === 'create' ? 'adicionada' : action === 'update' ? 'atualizada' : 'removida'} do Google Calendar`,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';

    // Se o erro menciona API não habilitada
    if (message.includes('Calendar API')) {
      return NextResponse.json(
        {
          error: 'Google Calendar API não está habilitada. Ative em console.cloud.google.com',
          details: message,
        },
        { status: 503 }
      );
    }

    // Se o erro menciona token não encontrado
    if (message.includes('Token Google não encontrado')) {
      return NextResponse.json(
        {
          error: 'Usuário não autenticado com Google. Faça login novamente.',
          details: message,
        },
        { status: 401 }
      );
    }

    console.error('[Calendar Sync Error]:', error);

    return NextResponse.json(
      {
        error: 'Erro ao sincronizar com Google Calendar',
        details: message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/calendar/sync?userId=...&classId=...
 * Status da sincronização
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const classId = searchParams.get('classId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Endpoint de sincronização do Google Calendar',
      endpoints: {
        POST: {
          description: 'Sincronizar aula com Google Calendar',
          body: { userId: 'UUID', classId: 'number (opcional)', action: '"create" | "update" | "delete"' },
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}
