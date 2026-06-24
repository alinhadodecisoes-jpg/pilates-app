'use client';

import { useState, useEffect } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { updateAluno, deleteAluno } from '@/lib/pilates/pilates-db';
import { apiFetch } from '@/lib/pilates/api-client';
import { Modal } from '@/components/pilates/Modal';
import { Button } from '@/components/pilates/Button';
import { ConfirmDialog } from '@/components/pilates/ConfirmDialog';
import type { PilatesUser } from '@/types/pilates';
import { TurmaPicker, type TurmaLite } from '@/components/pilates/TurmaPicker';

type StaffRole = 'professor' | 'fisioterapeuta' | 'prof_fisio' | 'prof_edfisica';

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

  // Turmas (para atribuir o professor a turmas pelo próprio modal)
  const [turmas, setTurmas] = useState<TurmaLite[]>([]);
  const [createTurmaIds, setCreateTurmaIds] = useState<Set<number>>(new Set());
  const [editTurmaIds, setEditTurmaIds] = useState<Set<number>>(new Set());
  const [editTurmaInitial, setEditTurmaInitial] = useState<Set<number>>(new Set());

  const loadStaff = async () => {
    try {
      const res = await fetch('/api/pilates/professores');
      if (res.ok) {
        const data = await res.json();
        setStaff(data as PilatesUser[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTurmas = async () => {
    try {
      const res = await apiFetch('/api/pilates/turmas');
      const data = await res.json();
      setTurmas(Array.isArray(data) ? data : []);
    } catch { /* sem turmas */ }
  };

  useEffect(() => {
    if (!authLoading) { loadStaff(); loadTurmas(); }
  }, [authLoading]);

  const toggleCreateTurma = (id: number) => setCreateTurmaIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleEditTurma = (id: number) => setEditTurmaIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Abre edição já marcando as turmas atuais do professor
  const openEdit = (item: PilatesUser) => {
    setEditItem(item);
    const atuais = new Set(turmas.filter((t) => t.professor_id === item.id).map((t) => t.id));
    setEditTurmaIds(new Set(atuais));
    setEditTurmaInitial(new Set(atuais));
  };

  const handleCreate = async () => {
    if (!form.email || !form.password) {
      setError('Email e senha são obrigatórios.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch('/api/admin/create-user', {
        method: 'POST',
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
        // Atribui o novo professor às turmas selecionadas
        if (json.userId && createTurmaIds.size > 0) {
          await Promise.all(
            [...createTurmaIds].map((classId) =>
              apiFetch(`/api/pilates/turmas/${classId}`, { method: 'PUT', body: JSON.stringify({ professor_id: json.userId }) })
            )
          );
        }
        setCreateMode(false);
        setCreateTurmaIds(new Set());
        await loadStaff();
        await loadTurmas();
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
        pay_mode: editItem.pay_mode ?? null,
        pay_rate: editItem.pay_rate ?? null,
      });
      // Sincroniza as turmas do professor: atribui as novas, libera as desmarcadas
      const toAssign = [...editTurmaIds].filter((id) => !editTurmaInitial.has(id));
      const toUnassign = [...editTurmaInitial].filter((id) => !editTurmaIds.has(id));
      await Promise.all([
        ...toAssign.map((classId) => apiFetch(`/api/pilates/turmas/${classId}`, { method: 'PUT', body: JSON.stringify({ professor_id: editItem.id }) })),
        ...toUnassign.map((classId) => apiFetch(`/api/pilates/turmas/${classId}`, { method: 'PUT', body: JSON.stringify({ professor_id: null }) })),
      ]);
      setStaff((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setEditItem(null);
      await loadTurmas();
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
        <h1 className="text-2xl font-bold text-ink">Professores & Fisioterapeutas</h1>
        <Button variant="primary" size="md" onClick={() => { setForm({ full_name: '', email: '', password: '', phone: '', role: 'professor' }); setCreateTurmaIds(new Set()); setError(null); setCreateMode(true); }}>
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
                    <td className="px-5 py-4 text-ink font-medium">{s.full_name || '—'}</td>
                    <td className="px-5 py-4 text-slate-300 text-xs">{s.email || '—'}</td>
                    <td className="px-5 py-4 text-slate-300">{s.phone ?? '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        s.role === 'professor'
                          ? 'bg-blue-600/20 text-blue-400'
                          : s.role === 'fisioterapeuta'
                          ? 'bg-purple-600/20 text-purple-400'
                          : s.role === 'prof_fisio'
                          ? 'bg-teal-600/20 text-teal-400'
                          : 'bg-orange-600/20 text-orange-400'
                      }`}>
                        {s.role === 'professor' ? 'Professor(a)'
                          : s.role === 'fisioterapeuta' ? 'Fisioterapeuta'
                          : s.role === 'prof_fisio' ? 'Prof+Fisio'
                          : 'Prof. Ed. Física'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => openEdit(s)}>Editar</Button>
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
          size="lg"
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
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Senha *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Função</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="professor">Professor(a)</option>
                  <option value="fisioterapeuta">Fisioterapeuta</option>
                  <option value="prof_fisio">Professor + Fisioterapeuta</option>
                  <option value="prof_edfisica">Prof. Ed. Física</option>
                </select>
              </div>
            </div>
            <TurmaPicker turmas={turmas} selected={createTurmaIds} onToggle={toggleCreateTurma} label="Turmas que dá aula" warnOccupied />
          </div>
        </Modal>
      )}

      {/* Modal Editar */}
      {editItem && (
        <Modal
          title="Editar Profissional"
          size="lg"
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
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Telefone</label>
              <input
                value={editItem.phone ?? ''}
                onChange={(e) => setEditItem({ ...editItem, phone: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Função</label>
              <select
                value={editItem.role}
                onChange={(e) => setEditItem({ ...editItem, role: e.target.value as PilatesUser['role'] })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="professor">Professor(a)</option>
                <option value="fisioterapeuta">Fisioterapeuta</option>
                <option value="prof_fisio">Professor + Fisioterapeuta</option>
                <option value="prof_edfisica">Prof. Ed. Física</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Forma de pagamento</label>
                <select
                  value={editItem.pay_mode ?? ''}
                  onChange={(e) => setEditItem({ ...editItem, pay_mode: e.target.value || null })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Não definida</option>
                  <option value="per_class">Por aula</option>
                  <option value="per_day">Por dia</option>
                  <option value="percent">% da mensalidade do aluno</option>
                  <option value="fixed">Fixo mensal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  {editItem.pay_mode === 'percent' ? 'Percentual (%)' : 'Valor (R$)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editItem.pay_rate ?? ''}
                  onChange={(e) => setEditItem({ ...editItem, pay_rate: e.target.value ? Number(e.target.value) : null })}
                  placeholder={editItem.pay_mode === 'percent' ? 'Ex: 50' : 'Ex: 30.00'}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <TurmaPicker turmas={turmas} selected={editTurmaIds} onToggle={toggleEditTurma} label="Turmas que dá aula" warnOccupied />
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
