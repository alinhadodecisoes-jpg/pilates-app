'use client';

import { useState, useEffect } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

interface BackupLog {
  id: number;
  backup_date: string;
  scope: string;
  drive_file_id: string | null;
  drive_url: string | null;
  rows_count: number | null;
  status: string;
  notes: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  success: { label: '✅ Enviado ao Drive', color: 'text-green-400' },
  partial: { label: '⚠️ Parcial', color: 'text-yellow-400' },
  local_only: { label: '📁 Local apenas', color: 'text-slate-400' },
  error: { label: '❌ Erro', color: 'text-red-400' },
};

const DRIVE_FOLDER_URL = 'https://drive.google.com/drive/search?q=Daimach+Backups';

export default function AdminBackupsPage() {
  const { user, loading: authLoading } = usePilatesAuth();
  const [logs, setLogs] = useState<BackupLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [backing, setBacking] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; rows?: number; url?: string | null; note?: string; error?: string } | null>(null);
  const supabase = getSupabaseBrowserClient();

  const loadLogs = async () => {
    const { data } = await supabase
      .from('backup_log')
      .select('*')
      .order('backup_date', { ascending: false })
      .limit(20);
    if (data) setLogs(data as BackupLog[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading) loadLogs();
  }, [authLoading]);

  const handleBackup = async () => {
    if (!user) return;
    setBacking(true);
    setResult(null);
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'full', admin_user_id: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ success: true, rows: data.rows_count, url: data.drive_url, note: data.note });
      } else {
        setResult({ error: data.error || 'Erro desconhecido' });
      }
      await loadLogs();
    } catch (e) {
      setResult({ error: 'Erro ao conectar com a API de backup.' });
    } finally {
      setBacking(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Backups do Sistema</h1>
        <div className="flex gap-2">
          <a
            href={DRIVE_FOLDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm font-medium"
          >
            📂 Abrir pasta no Drive
          </a>
          <button
            onClick={handleBackup}
            disabled={backing}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium"
          >
            {backing ? '⏳ Gerando backup...' : '💾 Fazer Backup Agora'}
          </button>
        </div>
      </div>

      {/* Resultado do último backup */}
      {result && (
        <div className={`rounded-xl p-4 border ${
          result.success
            ? 'bg-green-600/10 border-green-500/30'
            : 'bg-red-600/10 border-red-500/30'
        }`}>
          {result.success ? (
            <div className="space-y-1">
              <p className="text-green-400 font-medium">✅ Backup gerado com sucesso!</p>
              <p className="text-slate-300 text-sm">{result.rows?.toLocaleString()} registros exportados.</p>
              {result.url ? (
                <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-green-400 text-sm hover:underline">
                  🔗 Abrir no Google Drive →
                </a>
              ) : (
                <p className="text-slate-400 text-sm">📁 Backup salvo localmente no banco.</p>
              )}
              {result.note && <p className="text-yellow-400 text-xs">{result.note}</p>}
            </div>
          ) : (
            <p className="text-red-400">❌ {result.error}</p>
          )}
        </div>
      )}

      {/* Info sobre Google Drive */}
      {!result && (
        <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4">
          <p className="text-blue-300 text-sm font-medium">📋 Como funciona o backup</p>
          <ul className="text-blue-300/70 text-xs mt-2 space-y-1 list-disc list-inside">
            <li>Exporta todas as tabelas principais (pagamentos, presenças, avaliações, prontuários)</li>
            <li>Envia para a pasta <strong>Daimach Backups</strong> no Google Drive (quando Google conectado)</li>
            <li>Registra cada backup no histórico abaixo</li>
            <li>Cron semanal automático configurado (ver PENDENCIAS_WILLIAN.md para chaves Google)</li>
          </ul>
        </div>
      )}

      {/* Política de retenção */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h2 className="text-green-400 font-semibold mb-3">🛡️ Política de Retenção de Dados (24 meses)</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-400 text-xs mb-1">✅ NUNCA excluídos (soft-delete)</p>
            <ul className="text-slate-300 text-xs space-y-0.5">
              <li>• Histórico de pagamentos</li>
              <li>• Registros de presença</li>
              <li>• Avaliações físicas</li>
              <li>• Prontuários de fisioterapia</li>
              <li>• Evoluções SOAP</li>
            </ul>
          </div>
          <div>
            <p className="text-slate-400 text-xs mb-1">⚠️ Alunos &ldquo;excluídos&rdquo;</p>
            <ul className="text-slate-300 text-xs space-y-0.5">
              <li>• Status = &apos;inativo&apos; (não deletar)</li>
              <li>• Histórico preservado</li>
              <li>• LGPD: dados sensíveis retidos 24 meses</li>
              <li>• Reativação possível</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Histórico de backups */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-white font-semibold">Histórico de Backups</h2>
        </div>
        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Nenhum backup registrado ainda. Faça o primeiro backup acima.
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {logs.map((log) => {
              const cfg = STATUS_CONFIG[log.status] ?? STATUS_CONFIG.error;
              return (
                <div key={log.id} className="flex items-center justify-between px-5 py-3 gap-4">
                  <div>
                    <p className="text-white text-sm">
                      {new Date(log.backup_date).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                    <p className="text-slate-400 text-xs">{log.scope || 'full'}</p>
                    {log.notes && <p className="text-slate-500 text-xs">{log.notes}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</p>
                    {log.rows_count != null && (
                      <p className="text-slate-400 text-xs">{log.rows_count.toLocaleString()} registros</p>
                    )}
                    {log.drive_url && (
                      <a
                        href={log.drive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 text-xs hover:underline"
                      >
                        Ver no Drive →
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
