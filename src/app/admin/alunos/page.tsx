'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { getAlunos, updateAluno, deleteAluno } from '@/lib/pilates/pilates-db';
import { Modal } from '@/components/pilates/Modal';
import { Button } from '@/components/pilates/Button';
import { ConfirmDialog } from '@/components/pilates/ConfirmDialog';
import type { PilatesUser } from '@/types/pilates';

export default function AlunosPage() {
  const { loading: authLoading } = usePilatesAuth();
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
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      (a.full_name ?? '').toLowerCase().includes(q) ||
      (a.email ?? '').toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleSave = async () => {
    if (!editAluno) return;
    setSaving(true);
    try {
      const updated = await updateAluno(editAluno.id, {
        full_name: editAluno.full_name ?? undefined,
        phone: editAluno.phone ?? undefined,
        monthly_value: editAluno.monthly_value ?? undefined,
        status: editAluno.status,
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
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Gestão de Alunos</h1>
        <span className="text-sm text-slate-400">{filteredAlunos.length} aluno(s)</span>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
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
                <th className="px-5 py-3 text-slate-400 font-medium">Nome</th>
                <th className="px-5 py-3 text-slate-400 font-medium">E-mail</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Telefone</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Valor/mês</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Status</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredAlunos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    Nenhum aluno encontrado.
                  </td>
                </tr>
              ) : (
                filteredAlunos.map((aluno) => (
                  <tr key={aluno.id} className="hover:bg-slate-750 transition-colors">
                    <td className="px-5 py-4 text-white font-medium">
                      {aluno.full_name || '—'}
                    </td>
                    <td className="px-5 py-4 text-slate-300 text-xs">
                      {aluno.email || '—'}
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {aluno.phone ?? '—'}
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {aluno.monthly_value != null
                        ? `R$ ${Number(aluno.monthly_value).toFixed(2)}`
                        : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          aluno.status === 'ativo'
                            ? 'bg-green-600/20 text-green-400'
                            : aluno.status === 'inadimplente'
                            ? 'bg-red-600/20 text-red-400'
                            : 'bg-slate-600/20 text-slate-400'
                        }`}
                      >
                        {aluno.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditAluno(aluno)}
                        >
                          Editar
                        </Button>
                        <Link href={`/admin/ficha-saude/${aluno.id}`}>
                          <Button variant="secondary" size="sm">Ficha</Button>
                        </Link>
                        {aluno.phone && (
                          <a
                            href={`https://wa.me/55${aluno.phone.replace(/\D/g, '')}?text=Olá ${encodeURIComponent(aluno.full_name || 'aluno')}, tudo bem?`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="secondary" size="sm">WhatsApp</Button>
                          </a>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleteTarget(aluno.id)}
                        >
                          Deletar
                        </Button>
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
              <label className="block text-sm text-slate-400 mb-1">Nome Completo</label>
              <input
                type="text"
                value={editAluno.full_name ?? ''}
                onChange={(e) => setEditAluno({ ...editAluno, full_name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Nome do aluno"
              />
            </div>
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
              <label className="block text-sm text-slate-400 mb-1">Valor Mensal (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editAluno.monthly_value ?? ''}
                onChange={(e) =>
                  setEditAluno({
                    ...editAluno,
                    monthly_value: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Status</label>
              <select
                value={editAluno.status}
                onChange={(e) =>
                  setEditAluno({
                    ...editAluno,
                    status: e.target.value as PilatesUser['status'],
                  })
                }
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
