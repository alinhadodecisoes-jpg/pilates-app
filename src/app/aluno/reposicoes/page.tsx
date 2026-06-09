'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Modal } from '@/components/pilates/Modal';
import { Button } from '@/components/pilates/Button';

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const MOCK_VAGAS = [
  { id: 1, dia: 1, horario: '09:00–10:00', professor: 'Ana Clara', vagas: 2, capacidade: 4 },
  { id: 2, dia: 1, horario: '18:00–19:00', professor: 'Daiana',    vagas: 0, capacidade: 4 },
  { id: 3, dia: 3, horario: '08:00–09:00', professor: 'Ana Clara', vagas: 1, capacidade: 4 },
  { id: 4, dia: 4, horario: '19:00–20:00', professor: 'Daiana',    vagas: 3, capacidade: 4 },
  { id: 5, dia: 5, horario: '07:00–08:00', professor: 'Ana Clara', vagas: 4, capacidade: 4 },
];

export default function ReposicoesPage() {
  const [loading, setLoading] = useState(true);
  const [selectedVaga, setSelectedVaga] = useState<typeof MOCK_VAGAS[0] | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login');
      else setLoading(false);
    });
  }, [router, supabase]);

  const handleConfirm = async () => {
    setConfirming(true);
    // TODO: Chamar marcarReposicao() da pilates-db
    await new Promise(r => setTimeout(r, 800));
    setConfirming(false);
    setSuccess(`Aula de ${selectedVaga?.horario} com ${selectedVaga?.professor} marcada com sucesso!`);
    setSelectedVaga(null);
    setTimeout(() => setSuccess(null), 4000);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Reposições Disponíveis</h1>

      {success && (
        <div className="bg-green-600/20 border border-green-600/50 text-green-400 p-4 rounded-xl text-sm">
          ✅ {success}
        </div>
      )}

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="px-4 py-3 text-slate-400 font-medium">Dia</th>
                <th className="px-4 py-3 text-slate-400 font-medium">Horário</th>
                <th className="px-4 py-3 text-slate-400 font-medium hidden sm:table-cell">Professor</th>
                <th className="px-4 py-3 text-slate-400 font-medium">Vagas</th>
                <th className="px-4 py-3 text-slate-400 font-medium">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {MOCK_VAGAS.map((vaga) => (
                <tr key={vaga.id} className="hover:bg-slate-750 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{DAYS[vaga.dia - 1]}</td>
                  <td className="px-4 py-3 text-slate-300">{vaga.horario}</td>
                  <td className="px-4 py-3 text-slate-300 hidden sm:table-cell">{vaga.professor}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        vaga.vagas > 0
                          ? 'bg-green-600/20 text-green-400'
                          : 'bg-slate-600/20 text-slate-500'
                      }`}
                    >
                      {vaga.vagas}/{vaga.capacidade}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant={vaga.vagas > 0 ? 'primary' : 'ghost'}
                      size="sm"
                      disabled={vaga.vagas === 0}
                      onClick={() => vaga.vagas > 0 && setSelectedVaga(vaga)}
                    >
                      {vaga.vagas > 0 ? 'Marcar' : 'Lotado'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedVaga && (
        <Modal
          title="Confirmar Reposição"
          onClose={() => setSelectedVaga(null)}
          onConfirm={handleConfirm}
          confirmText="Marcar Reposição"
          loading={confirming}
        >
          <p className="text-slate-300">
            Deseja marcar uma reposição na aula de{' '}
            <strong className="text-white">{selectedVaga.horario}</strong> com{' '}
            <strong className="text-white">{selectedVaga.professor}</strong>?
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Vagas disponíveis: {selectedVaga.vagas}/{selectedVaga.capacidade}
          </p>
        </Modal>
      )}
    </div>
  );
}
