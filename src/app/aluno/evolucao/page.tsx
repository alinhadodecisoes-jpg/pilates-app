'use client';

import { useState, useEffect } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { printDocument } from '@/lib/pilates/pdf-export';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface Evaluation {
  id: number;
  user_id: string;
  evaluation_date: string;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  body_fat: number | null;
  muscle_mass: number | null;
  measurements: Record<string, number | null> | null;
  photos: Record<string, string> | null;
  posture_assessment: string | null;
  flexibility_notes: string | null;
  strength_notes: string | null;
  goals: string | null;
  notes: string | null;
  evaluator_id: string | null;
}

const CHART_COLORS = {
  weight: '#22c55e',
  bmi: '#3b82f6',
  body_fat: '#f59e0b',
  waist: '#a78bfa',
};

function StatCard({ label, value, unit }: { label: string; value: string | number | null; unit?: string }) {
  return (
    <div className="bg-slate-700/50 rounded-lg p-3 text-center">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-lg font-bold text-white">
        {value != null ? `${value}${unit ? ' ' + unit : ''}` : '—'}
      </p>
    </div>
  );
}

export default function EvolucaoPage() {
  const { user, loading: authLoading } = usePilatesAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'graficos' | 'historico' | 'fotos'>('graficos');
  const [compareIdx, setCompareIdx] = useState<[number, number]>([0, -1]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (!authLoading && user) {
      supabase
        .from('physical_evaluations_pilates')
        .select('*')
        .eq('user_id', user.id)
        .order('evaluation_date', { ascending: true })
        .then(async ({ data }) => {
          if (data && data.length > 0) {
            // A tabela não armazena bmi — calculamos a partir de weight/height.
            const withBmi = (data as Evaluation[]).map((ev) => ({
              ...ev,
              bmi: ev.bmi ?? (ev.weight && ev.height ? Number((Number(ev.weight) / Math.pow(Number(ev.height) / 100, 2)).toFixed(1)) : null),
            }));
            setEvaluations(withBmi);
            // Set compare: first vs last
            setCompareIdx([0, data.length - 1]);
            // Generate signed URLs for photos
            const urls: Record<string, string> = {};
            for (const ev of data as Evaluation[]) {
              if (ev.photos) {
                for (const [angle, path] of Object.entries(ev.photos)) {
                  const { data: urlData } = await supabase.storage
                    .from('evaluations')
                    .createSignedUrl(path as string, 3600);
                  if (urlData?.signedUrl) {
                    urls[`${ev.id}_${angle}`] = urlData.signedUrl;
                  }
                }
              }
            }
            setPhotoUrls(urls);
          }
          setLoading(false);
        });
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const latest = evaluations[evaluations.length - 1] ?? null;

  const chartData = evaluations.map((ev) => ({
    date: new Date(ev.evaluation_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    Peso: ev.weight != null ? Number(ev.weight) : null,
    IMC: ev.bmi != null ? Number(ev.bmi) : null,
    'Gordura%': ev.body_fat != null ? Number(ev.body_fat) : null,
    Cintura: ev.measurements?.waist != null ? Number(ev.measurements.waist) : null,
  }));

  const evalA = evaluations[compareIdx[0]] ?? null;
  const evalB = compareIdx[1] >= 0 ? evaluations[compareIdx[1]] : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Minha Evolução</h1>
        {latest && (
          <button
            onClick={() => {
              printDocument({
                title: 'Evolução Física',
                subtitle: `Última avaliação: ${new Date(latest.evaluation_date + 'T00:00:00').toLocaleDateString('pt-BR')}`,
                sections: evaluations.map((ev, i) => ({
                  title: `Avaliação ${i + 1} — ${new Date(ev.evaluation_date + 'T00:00:00').toLocaleDateString('pt-BR')}`,
                  rows: [
                    { label: 'Peso', value: ev.weight ? `${ev.weight} kg` : null },
                    { label: 'Altura', value: ev.height ? `${ev.height} cm` : null },
                    { label: 'IMC', value: ev.bmi ? String(ev.bmi) : null },
                    { label: '% Gordura', value: ev.body_fat ? `${ev.body_fat}%` : null },
                    { label: 'Massa muscular', value: ev.muscle_mass ? `${ev.muscle_mass} kg` : null },
                    { label: 'Cintura', value: ev.measurements?.waist ? `${ev.measurements.waist} cm` : null },
                    { label: 'Quadril', value: ev.measurements?.hip ? `${ev.measurements.hip} cm` : null },
                    { label: 'Busto', value: ev.measurements?.bust ? `${ev.measurements.bust} cm` : null },
                    { label: 'Avaliação postural', value: ev.posture_assessment },
                    { label: 'Flexibilidade', value: ev.flexibility_notes },
                    { label: 'Força', value: ev.strength_notes },
                    { label: 'Objetivos', value: ev.goals },
                    { label: 'Observações', value: ev.notes },
                  ],
                })),
                footer: `Documento confidencial — Daimach.Movement | ${new Date().toLocaleDateString('pt-BR')}`,
              });
            }}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm"
          >
            🖨️ Exportar PDF
          </button>
        )}
      </div>

      {evaluations.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-10 border border-slate-700 text-center space-y-3">
          <p className="text-4xl">📊</p>
          <p className="text-slate-300 font-medium">Nenhuma avaliação encontrada.</p>
          <p className="text-slate-500 text-sm">Solicite ao seu professor para realizar uma avaliação física.</p>
        </div>
      ) : (
        <>
          {/* Última avaliação */}
          {latest && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-slate-700 flex items-center gap-3">
                <span className="text-2xl">📏</span>
                <div>
                  <h2 className="font-bold text-white">Última Avaliação</h2>
                  <p className="text-xs text-slate-400">
                    {new Date(latest.evaluation_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Peso" value={latest.weight != null ? Number(latest.weight).toFixed(1) : null} unit="kg" />
                <StatCard label="Altura" value={latest.height != null ? Number(latest.height).toFixed(0) : null} unit="cm" />
                <StatCard label="IMC" value={latest.bmi != null ? Number(latest.bmi).toFixed(1) : null} />
                <StatCard label="Gordura" value={latest.body_fat != null ? `${Number(latest.body_fat).toFixed(1)}%` : null} />
                {latest.muscle_mass != null && (
                  <StatCard label="Massa Muscular" value={`${Number(latest.muscle_mass).toFixed(1)} kg`} />
                )}
                {latest.measurements?.waist != null && (
                  <StatCard label="Cintura" value={`${latest.measurements.waist} cm`} />
                )}
                {latest.measurements?.hip != null && (
                  <StatCard label="Quadril" value={`${latest.measurements.hip} cm`} />
                )}
              </div>
              {(latest.goals || latest.notes) && (
                <div className="px-4 pb-4 space-y-2 border-t border-slate-700 pt-3">
                  {latest.goals && (
                    <p className="text-sm text-slate-300">
                      <span className="font-medium text-slate-400">Objetivo: </span>{latest.goals}
                    </p>
                  )}
                  {latest.notes && (
                    <p className="text-sm text-slate-300">
                      <span className="font-medium text-slate-400">Notas: </span>{latest.notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-800 rounded-xl p-1 border border-slate-700">
            {([['graficos', '📊 Gráficos'], ['historico', '📋 Histórico'], ['fotos', '📷 Fotos']] as const).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectedTab === tab ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Gráficos */}
          {selectedTab === 'graficos' && (
            <div className="space-y-4">
              {evaluations.length < 2 && (
                <p className="text-slate-500 text-sm text-center">Registre mais avaliações para ver os gráficos de evolução.</p>
              )}
              {evaluations.length >= 2 && (
                <>
                  <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                    <h3 className="text-white font-semibold mb-4">Peso ao longo do tempo (kg)</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                        <Line type="monotone" dataKey="Peso" stroke={CHART_COLORS.weight} strokeWidth={2} dot={{ r: 4 }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                      <h3 className="text-white font-semibold mb-3 text-sm">IMC</h3>
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                          <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                          <Line type="monotone" dataKey="IMC" stroke={CHART_COLORS.bmi} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                      <h3 className="text-white font-semibold mb-3 text-sm">% Gordura</h3>
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                          <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                          <Line type="monotone" dataKey="Gordura%" stroke={CHART_COLORS.body_fat} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 sm:col-span-2">
                      <h3 className="text-white font-semibold mb-3 text-sm">Cintura (cm)</h3>
                      <ResponsiveContainer width="100%" height={140}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                          <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                          <Line type="monotone" dataKey="Cintura" stroke={CHART_COLORS.waist} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Histórico */}
          {selectedTab === 'historico' && (
            <div className="space-y-3">
              {[...evaluations].reverse().map((ev) => (
                <div key={ev.id} className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-white">
                      {new Date(ev.evaluation_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                    {ev.bmi && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-600/20 text-green-400">
                        IMC {Number(ev.bmi).toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs">
                    {ev.weight && <div><span className="text-slate-400">Peso:</span> <span className="text-white">{ev.weight}kg</span></div>}
                    {ev.body_fat && <div><span className="text-slate-400">Gordura:</span> <span className="text-white">{ev.body_fat}%</span></div>}
                    {ev.muscle_mass && <div><span className="text-slate-400">Músculo:</span> <span className="text-white">{ev.muscle_mass}kg</span></div>}
                    {ev.measurements?.waist && <div><span className="text-slate-400">Cintura:</span> <span className="text-white">{ev.measurements.waist}cm</span></div>}
                    {ev.measurements?.hip && <div><span className="text-slate-400">Quadril:</span> <span className="text-white">{ev.measurements.hip}cm</span></div>}
                  </div>
                  {ev.goals && <p className="text-xs text-slate-400 mt-2">🎯 {ev.goals}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Fotos - Comparativo */}
          {selectedTab === 'fotos' && (
            <div className="space-y-4">
              {evaluations.filter((ev) => ev.photos && Object.keys(ev.photos).length > 0).length < 1 ? (
                <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
                  <p className="text-slate-500 text-sm">Nenhuma foto de postura registrada ainda.</p>
                </div>
              ) : (
                <>
                  {/* Seletor de comparação */}
                  {evaluations.length >= 2 && (
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs text-slate-400 mb-1">Avaliação A</label>
                        <select
                          value={compareIdx[0]}
                          onChange={(e) => setCompareIdx([Number(e.target.value), compareIdx[1]])}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                        >
                          {evaluations.map((ev, i) => (
                            <option key={ev.id} value={i}>
                              {new Date(ev.evaluation_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-slate-400 mb-1">Avaliação B</label>
                        <select
                          value={compareIdx[1]}
                          onChange={(e) => setCompareIdx([compareIdx[0], Number(e.target.value)])}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                        >
                          {evaluations.map((ev, i) => (
                            <option key={ev.id} value={i}>
                              {new Date(ev.evaluation_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Comparativo de fotos */}
                  {(['frente', 'lado', 'costas'] as const).map((angle) => {
                    const urlA = evalA?.photos?.[angle] ? photoUrls[`${evalA.id}_${angle}`] : null;
                    const urlB = evalB?.photos?.[angle] ? photoUrls[`${evalB.id}_${angle}`] : null;
                    if (!urlA && !urlB) return null;
                    return (
                      <div key={angle} className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                        <h3 className="text-white font-semibold mb-3 capitalize">{angle}</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center">
                            <p className="text-xs text-slate-400 mb-2">
                              {evalA ? new Date(evalA.evaluation_date + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                            </p>
                            {urlA ? (
                              <img src={urlA} alt={`${angle} A`} className="w-full rounded-lg object-cover max-h-60" />
                            ) : (
                              <div className="w-full h-40 bg-slate-700 rounded-lg flex items-center justify-center text-slate-500 text-xs">Sem foto</div>
                            )}
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-400 mb-2">
                              {evalB ? new Date(evalB.evaluation_date + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                            </p>
                            {urlB ? (
                              <img src={urlB} alt={`${angle} B`} className="w-full rounded-lg object-cover max-h-60" />
                            ) : (
                              <div className="w-full h-40 bg-slate-700 rounded-lg flex items-center justify-center text-slate-500 text-xs">Sem foto</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
