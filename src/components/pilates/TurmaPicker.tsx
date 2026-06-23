'use client';

import { useState } from 'react';

const DAYS_FULL = ['', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export interface TurmaLite {
  id: number;
  name: string;
  day_of_week: number;
  time_start: string;
  time_end?: string;
  capacity?: number;
  enrolled_count?: number;
  professor_id?: string | null;
}

/**
 * Seletor de turmas em 2 passos: primeiro o DIA (Seg–Sáb, lado a lado),
 * depois o HORÁRIO numa caixa que rola; ao reclicar o dia a caixa recolhe.
 * Mostra um resumo das selecionadas com botão de remover.
 * Reutilizado nos modais de aluno, professor e reposição.
 */
export function TurmaPicker({
  turmas,
  selected,
  onToggle,
  label = 'Turmas (matrícula)',
  showCapacity = false,
  warnOccupied = false,
}: {
  turmas: TurmaLite[];
  selected: Set<number>;
  onToggle: (id: number) => void;
  label?: string;
  showCapacity?: boolean;
  warnOccupied?: boolean;
}) {
  const [openDay, setOpenDay] = useState<number | null>(null);

  // Agrupa turmas por dia da semana, ordenadas por horário
  const byDay: Record<number, TurmaLite[]> = {};
  for (const t of turmas) {
    if (t.day_of_week < 1 || t.day_of_week > 6) continue;
    (byDay[t.day_of_week] = byDay[t.day_of_week] || []).push(t);
  }
  for (const d of Object.keys(byDay)) {
    byDay[+d].sort((a, b) => (a.time_start || '').localeCompare(b.time_start || ''));
  }

  const countForDay = (d: number) => (byDay[d] || []).filter((t) => selected.has(t.id)).length;

  return (
    <div>
      <label className="block text-sm text-slate-400 mb-2">
        {label} — {selected.size} selecionada(s)
      </label>

      {/* Passo 1: dias da semana, lado a lado */}
      <div className="grid grid-cols-6 gap-1.5">
        {[1, 2, 3, 4, 5, 6].map((d) => {
          const n = countForDay(d);
          const isOpen = openDay === d;
          const has = (byDay[d] || []).length > 0;
          return (
            <button
              key={d}
              type="button"
              disabled={!has}
              onClick={() => setOpenDay(isOpen ? null : d)}
              className={`relative py-2 rounded-lg text-sm font-medium transition-colors ${
                isOpen
                  ? 'bg-green-600 text-white'
                  : n > 0
                  ? 'bg-green-900/30 text-green-300 border border-green-700'
                  : 'bg-slate-900 text-slate-300 border border-slate-700 hover:border-slate-600'
              } ${!has ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {DAYS_FULL[d]}
              {n > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-green-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {n}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Passo 2: horários do dia aberto (rola e recolhe) */}
      {openDay != null && (
        <div className="mt-2 border border-slate-700 rounded-lg p-2 bg-slate-900/50 max-h-44 overflow-y-auto">
          <p className="text-xs text-slate-500 mb-1.5 px-1">
            Horários de {DAYS_FULL[openDay]} — toque para marcar/desmarcar
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {(byDay[openDay] || []).map((t) => {
              const checked = selected.has(t.id);
              const cheia = showCapacity && (t.enrolled_count ?? 0) >= (t.capacity ?? 0);
              const ocupada = warnOccupied && !!t.professor_id && !checked;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onToggle(t.id)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors text-center ${
                    checked ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {t.time_start?.slice(0, 5)}
                  {showCapacity && (
                    <span className={`block text-[10px] ${cheia ? 'text-red-300' : 'opacity-70'}`}>
                      {t.enrolled_count ?? 0}/{t.capacity ?? 0}
                    </span>
                  )}
                  {ocupada && <span className="block text-[10px] text-amber-400/80">tem prof.</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Resumo das turmas selecionadas */}
      {selected.size > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {turmas
            .filter((t) => selected.has(t.id))
            .sort((a, b) => a.day_of_week - b.day_of_week || (a.time_start || '').localeCompare(b.time_start || ''))
            .map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 bg-green-900/30 border border-green-700 text-green-200 text-xs px-2 py-1 rounded-full"
              >
                {DAYS_FULL[t.day_of_week]} {t.time_start?.slice(0, 5)}
                <button type="button" onClick={() => onToggle(t.id)} className="text-green-300 hover:text-white">
                  ✕
                </button>
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
