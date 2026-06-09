// Google API tools — adaptado do companion-os para o pilates-app
// Escopo: Calendar (aulas) + Drive (backup) + Token management

import { refreshGoogleAccessToken } from '@/lib/google-auth'
import { getSupabaseServerClient } from '@/lib/supabase-server'

// ============================================================
// Token Management
// ============================================================

/**
 * Retorna um access_token válido para o usuário.
 * Renova automaticamente se expirado (via refresh_token).
 */
export async function getValidGoogleToken(userId: string): Promise<string | null> {
  const supabase = getSupabaseServerClient()

  const { data: tokenRow } = await supabase
    .from('google_tokens')
    .select('access_token, refresh_token, expiry, is_valid')
    .eq('user_id', userId)
    .maybeSingle()

  if (!tokenRow) return null
  if (tokenRow.is_valid === false) return null

  // Verificar se expirou (margem de 5 minutos)
  const expiresAt = tokenRow.expiry ? new Date(tokenRow.expiry).getTime() : 0
  const now = Date.now()

  if (expiresAt > now + 5 * 60 * 1000) {
    return tokenRow.access_token
  }

  // Token expirado — renovar
  if (!tokenRow.refresh_token) {
    console.warn('Google token expirado sem refresh_token para user:', userId)
    return null
  }

  try {
    const refreshed = await refreshGoogleAccessToken(tokenRow.refresh_token)
    const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()

    await supabase
      .from('google_tokens')
      .update({ access_token: refreshed.access_token, expiry: newExpiry, is_valid: true })
      .eq('user_id', userId)

    return refreshed.access_token
  } catch (err: any) {
    console.error('Failed to refresh Google token:', err.message)
    await supabase
      .from('google_tokens')
      .update({ is_valid: false })
      .eq('user_id', userId)
    return null
  }
}

// ============================================================
// Google Calendar
// ============================================================

export interface CalendarEventInput {
  summary: string
  description?: string
  start: string  // ISO datetime
  end: string    // ISO datetime
  location?: string
}

export async function createCalendarEvent(
  accessToken: string,
  event: CalendarEventInput
): Promise<{ success: boolean; eventId?: string; htmlLink?: string; error?: string }> {
  const body = {
    summary: event.summary,
    description: event.description || '',
    start: { dateTime: event.start, timeZone: 'America/Sao_Paulo' },
    end: { dateTime: event.end, timeZone: 'America/Sao_Paulo' },
    location: event.location,
  }

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('Calendar create error:', errText)
    return { success: false, error: errText }
  }

  const data = await res.json()
  return { success: true, eventId: data.id, htmlLink: data.htmlLink }
}

export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  if (!res.ok && res.status !== 204) {
    const errText = await res.text()
    return { success: false, error: errText }
  }
  return { success: true }
}

// ============================================================
// Google Drive
// ============================================================

/**
 * Cria ou encontra uma pasta no Google Drive com o nome informado.
 * Retorna o folderId.
 */
export async function getOrCreateDriveFolder(
  accessToken: string,
  folderName: string
): Promise<string | null> {
  // Buscar pasta existente
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
    )}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (searchRes.ok) {
    const searchData = await searchRes.json()
    if (searchData.files?.length > 0) {
      return searchData.files[0].id
    }
  }

  // Criar pasta
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  })

  if (!createRes.ok) {
    console.error('Drive create folder error:', await createRes.text())
    return null
  }

  const createData = await createRes.json()
  return createData.id
}

/**
 * Faz upload de um arquivo JSON/texto para o Google Drive.
 * Retorna { fileId, webViewLink }.
 */
export async function uploadFileToDrive(
  accessToken: string,
  fileName: string,
  content: string,
  mimeType: string,
  folderId?: string
): Promise<{ success: boolean; fileId?: string; webViewLink?: string; error?: string }> {
  const metadata: any = { name: fileName }
  if (folderId) metadata.parents = [folderId]

  const boundary = 'boundary_pilates_backup'
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    `Content-Type: ${mimeType}`,
    '',
    content,
    `--${boundary}--`,
  ].join('\r\n')

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
  )

  if (!uploadRes.ok) {
    const errText = await uploadRes.text()
    console.error('Drive upload error:', errText)
    return { success: false, error: errText }
  }

  const data = await uploadRes.json()
  return { success: true, fileId: data.id, webViewLink: data.webViewLink }
}
