'use client';

import { useState, useEffect } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { updateAluno, deleteAluno } from '@/lib/pilates/pilates-db';
import { Modal } from '@/components/pilates/Modal';
import { Button } from '@/components/pilates/Button';
import { ConfirmDialog } from '@/components/pilates/ConfirmDialog';
import type { PilatesUser } from '@/types/pilates';

type StaffRole = 'professor' | 'fisioterapeuta';

interface StaffForm {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  role: StaffRole;
}

export default function ProfessoresPage() {
  const { loading: authLoading } = usePilatesAuth();
  const [staff, setStaff] = useState<PilatesUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<PilatesUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [createMode, setCreateMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<StaffForm>({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    role: 'professor',
  });

  const supabase = getSupabaseBrowserClient();

  const loadStaff = async () => {
    const { data, error } = await supabase
      .from('users_pilates')
      .select('*')
      .in('role', ['professor', 'fisioterapeuta'])
      .order('full_name', { ascending: true });
    if (!error && data) setStaff(data as PilatesUser[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading) loadStaff();
  }, [authLoading]);

  const handleCreate = async () => {
    if (!form.email || !form.password) {
      setError('Email e senha são obrigatórios.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          full_name: form.full_name || null,
          phone: form.phone || null,
          role: form.role,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Erro ao criar usuário.');
      } else {
        setCreateMode(false);
        await loadStaff();
      }
    } catch (err) {
      setError('Erro de conexão.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      const updated = await updateAluno(editItem.id, {
        full_name: editItem.full_name ?? undefined,
        phone: editItem.phone ?? undefined,
        role: editItem.role,
      });
      setStaff((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setEditItem(null);
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
      setStaff((prev) => prev.filter((s) => s.id !== deleteTarget));
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Professores & Fisioterapeutas</h1>
        <Button variant="primary" size="md" onClick={() => { setForm({ full_name: '', email: '', password: '', phone: '', role: 'professor' }); setError(null); setCreateMode(true); }}>
          + Novo
        </Button>
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
                <th className="px-5 py-3 text-slate-400 font-medium">Função</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                    Nenhum professor ou fisioterapeuta cadastrado.
                  </td>
                </tr>
              ) : (
                staff.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-750 transition-colors">
                    <td className="px-5 py-4 text-white font-medium">{s.full_name || '—'}</td>
                    <td className="px-5 py-4 text-slate-300 text-xs">{s.email || '—'}</td>
                    <td className="px-5 py-4 text-slate-300">{s.phone ?? '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        s.role === 'professor'
                          ? 'bg-blue-600/20 text-blue-400'
                          : 'bg-purple-600/20 text-purple-400'
                      }`}>
                        {s.role === 'professor' ? 'Professor(a)' : 'Fisioterapeuta'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setEditItem(s)}>Editar</Button>
                        <Button variant="danger" size="sm" onClick={() => setDeleteTarget(s.id)}>Deletar</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar */}
      {createMode && (
        <Modal
          title="Novo Professor / Fisioterapeuta"
          onClose={() => setCreateMode(false)}
          onConfirm={handleCreate}
          confirmText="Criar Conta"
          loading={saving}
        >
          <div className="space-y-4">
            {error && (
              <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-4 py-2">
                {error}
              </p>
            )}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nome Completo</label>
              <input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Nome do profissional"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">E-mail *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Senha *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Telefone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Função</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="professor">Professor(a)</option>
                  <option value="fisioterapeuta">Fisioterapeuta</option>
                </select>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Editar */}
      {editItem && (
        <Modal
          title="Editar Profissional"
          onClose={() => setEditItem(null)}
          onConfirm={handleEdit}
          confirmText="Salvar"
          loading={saving}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nome Completo</label>
              <input
                value={editItem.full_name ?? ''}
                onChange={(e) => setEditItem({ ...editItem, full_name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Telefone</label>
              <input
                value={editItem.phone ?? ''}
                onChange={(e) => setEditItem({ ...editItem, phone: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Função</label>
              <select
                value={editItem.role}
                onChange={(e) => setEditItem({ ...editItem, role: e.target.value as PilatesUser['role'] })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="professor">Professor(a)</option>
                <option value="fisioterapeuta">Fisioterapeuta</option>
              </select>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Deletar Profissional"
          message="Esta ação irá remover o profissional do sistema. Deseja continuar?"
          confirmText="Deletar"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
