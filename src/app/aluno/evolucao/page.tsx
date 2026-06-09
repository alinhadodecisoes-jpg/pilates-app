'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Button } from '@/components/pilates/Button';

export default function EvolucaoPage() {
  const [loading, setLoading] = useState(true);
  const [requested, setRequested] = useState(false);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login');
      else setLoading(false);
    });
  }, [router, supabase]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Minha Evolução</h1>

      {/* Última Avaliação */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-700 flex items-center space-x-3">
          <span className="text-2xl">📏</span>
          <h2 className="font-bold text-white">Última Avaliação</h2>
        </div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Data',   value: '15/05/2026' },
            { label: 'Peso',   value: '62 kg' },
            { label: 'Altura', value: '165 cm' },
            { label: 'IMC',    value: '22.8' },
          ].map((item) => (
            <div key={item.label} className="bg-slate-700/50 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-400 mb-1">{item.label}</p>
              <p className="text-lg font-bold text-white">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="px-5 pb-5">
          <p className="text-sm text-slate-300">
            <span className="font-medium text-slate-400">Notas do professor:</span>{' '}
            Boa evolução na postura! Continuar focando na região lombar.
          </p>
        </div>
      </div>

      {/* Gráfico (Em Breve) */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-700 flex items-center space-x-3">
          <span className="text-2xl">📊</span>
          <h2 className="font-bold text-white">Gráfico de Progresso</h2>
        </div>
        <div className="p-8 text-center">
          <p className="text-slate-500 text-sm">
            Disponível em breve. Registre mais avaliações para visualizar sua evolução!
          </p>
        </div>
      </div>

      {/* Solicitar Avaliação */}
      <div className="bg-gradient-to-r from-green-900/40 to-cyan-900/30 rounded-xl p-6 border border-green-700/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-white">Solicitar Nova Avaliação</h3>
          <p className="text-sm text-slate-300 mt-1">Solicite ao seu professor para agendar uma avaliação física.</p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setRequested(true)}
          disabled={requested}
        >
          {requested ? 'Solicitação Enviada ✅' : 'Solicitar Avaliação'}
        </Button>
      </div>
    </div>
  );
}
