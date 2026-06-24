'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { getAlunoAulas } from '@/lib/pilates/pilates-db';
import type { PilatesEnrollment } from '@/types/pilates';

// day_of_week no banco: 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb, 7=Dom
const DAY_NAMES = ['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const DAY_SHORT = ['', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];

export default function MinhasAulasPage() {
  const { user, loading: authLoading } = usePilatesAuth();
  const [enrollments, setEnrollments] = useState<PilatesEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      getAlunoAulas(user.id)
        .then((data) => setEnrollments(data as PilatesEnrollment[]))
        .catch(console.error)
        .finally(() => setLoading(false));
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-ink">Minhas Aulas</h1>

      {enrollments.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-10 border border-slate-700 text-center space-y-4">
          <p className="text-4xl">📋</p>
          <p className="text-slate-300 font-medium">Você ainda não está matriculado em nenhuma turma.</p>
          <p className="text-slate-500 text-sm">Fale com o seu instrutor para realizar a matrícula.</p>
          <Link
            href="/aluno/dashboard"
            className="inline-block mt-2 text-sm text-green-400 hover:text-green-300 border border-green-700 hover:border-green-500 px-4 py-2 rounded-lg transition-colors"
          >
            Voltar ao Dashboard
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {enrollments.map((enrollment) => {
            const cls = enrollment.class;
            if (!cls) return null;
            const dayNum = cls.day_of_week ?? 0;

            return (
              <div
                key={enrollment.id}
                className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center gap-4"
              >
                {/* Dia da semana */}
                <div className="bg-slate-700 rounded-lg p-3 text-center min-w-[60px]">
                  <p className="text-[10px] text-slate-400 font-medium">
                    {DAY_SHORT[dayNum] ?? '—'}
                  </p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {cls.time_start?.slice(0, 5)}
                  </p>
                </div>

                {/* Info da turma */}
                <div className="flex-1">
                  <p className="font-semibold text-ink">{cls.name}</p>
                  <p className="text-sm text-slate-400">
                    {DAY_NAMES[dayNum] ?? '—'} · {cls.time_start?.slice(0, 5)}–{cls.time_end?.slice(0, 5)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Capacidade: {cls.capacity} alunos
                  </p>
                </div>

                {/* Badge ativa */}
                <span
                  className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                    enrollment.is_active
                      ? 'bg-green-600/20 text-green-400'
                      : 'bg-slate-600/20 text-slate-400'
                  }`}
                >
                  {enrollment.is_active ? 'Ativa' : 'Inativa'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
