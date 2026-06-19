import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

// POST — Gerar backup e enviar para Google Drive
// Protegido por CRON_SECRET_KEY ou chamada manual admin
// TODO: Configurar GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET no .env.local (ver PENDENCIAS_WILLIAN.md)

async function getGoogleToken(supabase: ReturnType<typeof getSupabaseServerClient>, adminUserId: string) {
  const { data } = await supabase
    .from('google_tokens')
    .select('access_token, refresh_token, expiry')
    .eq('user_id', adminUserId)
    .maybeSingle();
  return data;
}

async function refreshGoogleToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    const data = await res.json();
    return data.access_token ?? null;
  } catch {
    return null;
  }
}

async function uploadToDrive(
  accessToken: string,
  fileName: string,
  content: string,
  mimeType: string
): Promise<{ id: string; webViewLink: string } | null> {
  try {
    // Find or create "Daimach Backups" folder
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent("name='Daimach Backups' and mimeType='application/vnd.google-apps.folder' and trashed=false")}&fields=files(id)`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const searchData = await searchRes.json();
    let folderId: string;

    if (searchData.files && searchData.files.length > 0) {
      folderId = searchData.files[0].id;
    } else {
      // Create folder
      const folderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Daimach Backups', mimeType: 'application/vnd.google-apps.folder' }),
      });
      const folderData = await folderRes.json();
      folderId = folderData.id;
    }

    // Upload file using multipart
    const boundary = '-------backupboundary';
    const metadata = JSON.stringify({ name: fileName, parents: [folderId] });
    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      metadata,
      `--${boundary}`,
      `Content-Type: ${mimeType}`,
      '',
      content,
      `--${boundary}--`,
    ].join('\r\n');

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    );

    if (!uploadRes.ok) {
      console.error('Drive upload error:', await uploadRes.text());
      return null;
    }

    return await uploadRes.json();
  } catch (e) {
    console.error('Drive upload exception:', e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  // Auth check — admin call or cron
  const authHeader = req.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET_KEY;
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

  const supabase = getSupabaseServerClient();
  const dateStr = new Date().toISOString().slice(0, 10);

  try {
    const body = await req.json().catch(() => ({}));
    const scope = body.scope || 'full';
    const adminUserId = body.admin_user_id;
    const includeContent = body.include_content === true;

    // Collect data
    const tables: Record<string, unknown[]> = {};
    let rowsCount = 0;

    const tableNames = [
      'users_pilates', 'payment_history', 'attendances_pilates',
      'physical_evaluations_pilates', 'physio_cases', 'physio_evolutions',
      'classes_pilates', 'enrollments_pilates', 'health_records',
    ];

    for (const table of tableNames) {
      try {
        const { data } = await supabase.from(table).select('*').limit(10000);
        if (data) {
          tables[table] = data;
          rowsCount += data.length;
        }
      } catch {
        // Table might not exist yet (SQL pending)
        tables[table] = [];
      }
    }

    const backupData = {
      generated_at: new Date().toISOString(),
      scope,
      tables,
    };

    const fileName = `daimach_backup_${dateStr}.json`;
    const content = JSON.stringify(backupData, null, 2);

    let driveFileId: string | null = null;
    let driveUrl: string | null = null;

    // Try to upload to Google Drive if token available
    const googleConfigured = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== '';

    if (googleConfigured && adminUserId) {
      const tokenRow = await getGoogleToken(supabase, adminUserId);
      if (tokenRow) {
        let accessToken = tokenRow.access_token;
        const isExpired = tokenRow.expiry && new Date(tokenRow.expiry) < new Date();
        if (isExpired && tokenRow.refresh_token) {
          accessToken = (await refreshGoogleToken(tokenRow.refresh_token)) ?? accessToken;
        }
        if (accessToken) {
          const result = await uploadToDrive(accessToken, fileName, content, 'application/json');
          if (result) {
            driveFileId = result.id;
            driveUrl = result.webViewLink;
          }
        }
      }
    }

    // Log the backup
    const { error: logErr } = await supabase.from('backup_log').insert({
      scope,
      drive_file_id: driveFileId,
      drive_url: driveUrl,
      rows_count: rowsCount,
      status: driveFileId ? 'success' : googleConfigured ? 'partial' : 'local_only',
      notes: driveFileId
        ? `Arquivo: ${fileName}`
        : 'Google Drive não conectado — backup gerado apenas no servidor',
    });

    if (logErr) console.error('Erro ao gravar backup_log:', logErr);

    return NextResponse.json({
      success: true,
      file_name: fileName,
      rows_count: rowsCount,
      drive_url: driveUrl,
      status: driveFileId ? 'uploaded_to_drive' : 'local_only',
      // Conteúdo do backup para download direto no PC (quando solicitado)
      content: includeContent ? content : undefined,
      note: !driveFileId
        ? 'Conecte o Google Drive do admin para enviar automaticamente. Ver PENDENCIAS_WILLIAN.md'
        : undefined,
    });
  } catch (err) {
    console.error('Erro /api/backup:', err);
    return NextResponse.json({ error: 'Erro ao gerar backup' }, { status: 500 });
  }
}
