'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';

type Tipo = 'alunos' | 'financeiro' | 'turmas' | 'presenca';

const TABS: { id: Tipo; label: string }[] = [
  { id: 'alunos', label: 'Alunos Ativos' },
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'presenca', label: 'Presença' },
  { id: 'turmas', label: 'Turmas' },
];

export default function RelatoriosAdmin() {
  const { loading: authLoading } = usePilatesAuth();
  const [tipo, setTipo] = useState<Tipo>('alunos');
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [resumo, setResumo] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (t: Tipo) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pilates/relatorios?tipo=${t}`);
      const data = await res.json();
      setRows(data.rows ?? []);
      setResumo(data.resumo ?? null);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) load(tipo);
  }, [authLoading, tipo, load]);

  const exportCSV = () => {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const lines = rows.map((r) => headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(';'));
    const csv = '﻿' + [headers.join(';'), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${tipo}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Relatórios</h1>
        <button
          onClick={exportCSV}
          disabled={rows.length === 0}
          className="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm font-medium"
        >
          ⬇️ Exportar CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTipo(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tipo === t.id ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {resumo && (
        <div className="flex flex-wrap gap-3">
          {Object.entries(resumo).map(([k, v]) => (
            <div key={k} className="bg-slate-800 border border-slate-700 rounded-xl px-5 py-3">
              <p className="text-xs text-slate-400 capitalize">{k.replace(/_/g, ' ')}</p>
              <p className="text-xl font-bold text-white">
                {typeof v === 'number' && /receb|pendente|valor/i.test(k) ? `R$ ${Number(v).toFixed(2)}` : String(v)}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center text-slate-400">Carregando...</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-slate-500">Sem dados para este relatório.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                {headers.map((h) => (
                  <th key={h} className="px-5 py-3 text-slate-400 font-medium capitalize">{h.replace(/_/g, ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-700/30">
                  {headers.map((h) => (
                    <td key={h} className="px-5 py-3 text-slate-200">{String(r[h] ?? '—')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
