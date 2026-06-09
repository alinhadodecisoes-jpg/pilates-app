'use client';

import { useState, useEffect } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { getAlunos, updateAluno, deleteAluno } from '@/lib/pilates/pilates-db';
import { Modal } from '@/components/pilates/Modal';
import { Button } from '@/components/pilates/Button';
import { ConfirmDialog } from '@/components/pilates/ConfirmDialog';
import type { PilatesUser } from '@/types/pilates';

export default function AlunosPage() {
  const { loading: authLoading } = usePilatesAuth('professor');
  const [alunos, setAlunos] = useState<PilatesUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editAluno, setEditAluno] = useState<PilatesUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      getAlunos()
        .then(setAlunos)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [authLoading]);

  const filteredAlunos = alunos.filter((a) => {
    const matchSearch = a.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleSave = async () => {
    if (!editAluno) return;
    setSaving(true);
    try {
      const updated = await updateAluno(editAluno.id, {
        status: editAluno.status,
        phone: editAluno.phone ?? undefined,
      });
      setAlunos((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setEditAluno(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAluno(deleteTarget);
      setAlunos((prev) => prev.filter((a) => a.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Gestão de Alunos</h1>
        <Button variant="primary" size="md">+ Novo Aluno</Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
        >
          <option value="all">Todos os Status</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
          <option value="inadimplente">Inadimplente</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="px-5 py-3 text-slate-400 font-medium">ID</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Plano</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Telefone</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Status</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredAlunos.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">Nenhum aluno encontrado.</td></tr>
              ) : (
                filteredAlunos.map((aluno) => (
                  <tr key={aluno.id} className="hover:bg-slate-750 transition-colors">
                    <td className="px-5 py-4 text-white font-mono text-xs">{aluno.id.slice(0, 8)}...</td>
                    <td className="px-5 py-4 text-slate-300">{aluno.plan_id ?? '—'}</td>
                    <td className="px-5 py-4 text-slate-300">{aluno.phone ?? '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        aluno.status === 'ativo' ? 'bg-green-600/20 text-green-400' :
                        aluno.status === 'inadimplente' ? 'bg-red-600/20 text-red-400' :
                        'bg-slate-600/20 text-slate-400'
                      }`}>{aluno.status}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setEditAluno(aluno)}>Editar</Button>
                        <Button variant="danger" size="sm" onClick={() => setDeleteTarget(aluno.id)}>Deletar</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edição */}
      {editAluno && (
        <Modal
          title="Editar Aluno"
          onClose={() => setEditAluno(null)}
          onConfirm={handleSave}
          confirmText="Salvar"
          loading={saving}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Telefone</label>
              <input
                type="text"
                value={editAluno.phone ?? ''}
                onChange={(e) => setEditAluno({ ...editAluno, phone: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Status</label>
              <select
                value={editAluno.status}
                onChange={(e) => setEditAluno({ ...editAluno, status: e.target.value as PilatesUser['status'] })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="inadimplente">Inadimplente</option>
              </select>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Delete */}
      {deleteTarget && (
        <ConfirmDialog
          title="Deletar Aluno"
          message="Esta ação é irreversível. Deseja realmente deletar este aluno e todos os dados relacionados?"
          confirmText="Deletar Permanentemente"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
