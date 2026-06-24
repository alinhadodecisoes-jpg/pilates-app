'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { getAlunos, updateAluno, deleteAluno } from '@/lib/pilates/pilates-db';
import { apiFetch } from '@/lib/pilates/api-client';
import { Modal } from '@/components/pilates/Modal';
import { Button } from '@/components/pilates/Button';
import { ConfirmDialog } from '@/components/pilates/ConfirmDialog';
import type { PilatesUser, PilatesPlan } from '@/types/pilates';
import { TurmaPicker, type TurmaLite } from '@/components/pilates/TurmaPicker';

// Gera senha forte aleatória
function generateStrongPassword(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

interface NewStudentForm {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  plan_id: number | '';
  monthly_value: string;
  due_day: string;
  status: string;
}

interface CreatedCredentials {
  email: string;
  password: string;
  full_name: string;
}

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

  // Novo aluno
  const [showNewAluno, setShowNewAluno] = useState(false);
  const [newForm, setNewForm] = useState<NewStudentForm>({ full_name: '', email: '', phone: '', password: generateStrongPassword(), plan_id: '', monthly_value: '', due_day: '10', status: 'ativo' });
  const [newError, setNewError] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<CreatedCredentials | null>(null);
  const [plans, setPlans] = useState<PilatesPlan[]>([]);

  // Turmas (para matrícula direta no modal)
  const [turmas, setTurmas] = useState<TurmaLite[]>([]);
  const [newTurmaIds, setNewTurmaIds] = useState<Set<number>>(new Set());
  const [editTurmaIds, setEditTurmaIds] = useState<Set<number>>(new Set());
  const [editTurmaInitial, setEditTurmaInitial] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!authLoading) {
      getAlunos()
        .then(setAlunos)
        .catch(console.error)
        .finally(() => setLoading(false));
      fetch('/api/pilates/planos')
        .then((r) => r.json())
        .then((d) => setPlans(Array.isArray(d) ? d : []))
        .catch(console.error);
      apiFetch('/api/pilates/turmas')
        .then((r) => r.json())
        .then((d) => setTurmas(Array.isArray(d) ? d : []))
        .catch(console.error);
    }
  }, [authLoading]);

  // Abre o modal de edição já carregando as turmas em que o aluno está matriculado
  const openEdit = async (aluno: PilatesUser) => {
    setEditAluno(aluno);
    setEditTurmaIds(new Set());
    setEditTurmaInitial(new Set());
    try {
      const res = await apiFetch(`/api/pilates/alunos/${aluno.id}`);
      const data = await res.json();
      const ids: number[] = (data.turmas ?? [])
        .filter((t: { is_active?: boolean }) => t.is_active !== false)
        .map((t: { class_id: number }) => t.class_id);
      setEditTurmaIds(new Set(ids));
      setEditTurmaInitial(new Set(ids));
    } catch { /* sem matrículas carregadas */ }
  };

  const toggleNewTurma = (id: number) => setNewTurmaIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleEditTurma = (id: number) => setEditTurmaIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

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
      // Sincroniza matrículas: adiciona as novas, remove as desmarcadas
      const toAdd = [...editTurmaIds].filter((id) => !editTurmaInitial.has(id));
      const toRemove = [...editTurmaInitial].filter((id) => !editTurmaIds.has(id));
      await Promise.all([
        ...toAdd.map((classId) => apiFetch(`/api/pilates/turmas/${classId}/alunos`, { method: 'POST', body: JSON.stringify({ userId: editAluno.id }) })),
        ...toRemove.map((classId) => apiFetch(`/api/pilates/turmas/${classId}/alunos`, { method: 'DELETE', body: JSON.stringify({ userId: editAluno.id }) })),
      ]);
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

  const handleCreateAluno = async () => {
    if (!newForm.email || !newForm.password) {
      setNewError('Email e senha são obrigatórios.');
      return;
    }
    setSaving(true);
    setNewError(null);
    try {
      const res = await apiFetch('/api/admin/create-user', {
        method: 'POST',
        body: JSON.stringify({
          email: newForm.email,
          password: newForm.password,
          full_name: newForm.full_name || null,
          phone: newForm.phone || null,
          role: 'aluno',
          plan_id: newForm.plan_id || null,
          monthly_value: newForm.monthly_value ? Number(newForm.monthly_value) : null,
          due_day: newForm.due_day ? Number(newForm.due_day) : 10,
          status: newForm.status || 'ativo',
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setNewError(json.error ?? 'Erro ao criar aluno.');
      } else {
        // Matricula o novo aluno nas turmas selecionadas
        if (json.userId && newTurmaIds.size > 0) {
          await Promise.all(
            [...newTurmaIds].map((classId) =>
              apiFetch(`/api/pilates/turmas/${classId}/alunos`, { method: 'POST', body: JSON.stringify({ userId: json.userId }) })
            )
          );
        }
        setShowNewAluno(false);
        setCreatedCredentials({ email: newForm.email, password: newForm.password, full_name: newForm.full_name });
        getAlunos().then(setAlunos).catch(console.error);
        setNewForm({ full_name: '', email: '', phone: '', password: generateStrongPassword(), plan_id: '', monthly_value: '', due_day: '10', status: 'ativo' });
        setNewTurmaIds(new Set());
      }
    } catch {
      setNewError('Erro de conexão.');
    } finally {
      setSaving(false);
    }
  };

  const copyCredentials = () => {
    if (!createdCredentials) return;
    const text = `Login: ${createdCredentials.email}\nSenha: ${createdCredentials.password}`;
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const sendWhatsApp = () => {
    if (!createdCredentials) return;
    const text = encodeURIComponent(
      `Olá ${createdCredentials.full_name || ''}! Seu acesso ao Daimach.Movement foi criado.\n\nLogin: ${createdCredentials.email}\nSenha: ${createdCredentials.password}\n\nAcesse: https://daimach.com.br`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const sendEmail = async () => {
    if (!createdCredentials) return;
    // Chama /api/notify para enviar email de boas-vindas
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'welcome',
          email: createdCredentials.email,
          title: 'Bem-vindo ao Daimach.Movement!',
          body: `Olá ${createdCredentials.full_name || ''}! Seu acesso foi criado.\n\nEmail: ${createdCredentials.email}\nSenha: ${createdCredentials.password}`,
        }),
      });
      alert('Email enviado via Resend!');
    } catch {
      alert('Erro ao enviar email. Verifique RESEND_API_KEY no .env.local');
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
        <h1 className="text-2xl font-bold text-ink">Gestão de Alunos</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">{filteredAlunos.length} aluno(s)</span>
          <Button variant="primary" size="md" onClick={() => { setNewForm({ full_name: '', email: '', phone: '', password: generateStrongPassword(), plan_id: '', monthly_value: '', due_day: '10', status: 'ativo' }); setNewTurmaIds(new Set()); setNewError(null); setShowNewAluno(true); }}>
            + Novo Aluno
          </Button>
        </div>
      </div>

      {/* Credenciais criadas */}
      {createdCredentials && (
        <div className="bg-green-600/10 border border-green-500/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-green-400 font-semibold">✅ Aluno criado! Guarde as credenciais:</h3>
            <button onClick={() => setCreatedCredentials(null)} className="text-slate-400 hover:text-ink text-sm">✕</button>
          </div>
          <div className="bg-slate-900 rounded-lg p-3 font-mono text-sm space-y-1">
            <p className="text-ink">Login: <span className="text-green-400">{createdCredentials.email}</span></p>
            <p className="text-ink">Senha: <span className="text-green-400">{createdCredentials.password}</span></p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={sendWhatsApp} className="text-xs bg-green-600 hover:bg-green-700 text-ink px-3 py-2 rounded-lg transition-colors">
              📱 Enviar por WhatsApp
            </button>
            <button onClick={sendEmail} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors">
              📧 Enviar por Email
            </button>
            <button onClick={copyCredentials} className="text-xs bg-slate-600 hover:bg-slate-500 text-ink px-3 py-2 rounded-lg transition-colors">
              📋 Copiar Credenciais
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
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
                    <td className="px-5 py-4 text-ink font-medium">
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
                          onClick={() => openEdit(aluno)}
                        >
                          Editar
                        </Button>
                        <Link href={`/admin/alunos/${aluno.id}`}>
                          <Button variant="secondary" size="sm">Ver Perfil</Button>
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
          size="lg"
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
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Nome do aluno"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Telefone</label>
              <input
                type="text"
                value={editAluno.phone ?? ''}
                onChange={(e) => setEditAluno({ ...editAluno, phone: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="inadimplente">Inadimplente</option>
              </select>
            </div>
            <TurmaPicker turmas={turmas} selected={editTurmaIds} onToggle={toggleEditTurma} />
          </div>
        </Modal>
      )}

      {/* Modal Novo Aluno */}
      {showNewAluno && (
        <Modal
          title="Novo Aluno"
          size="lg"
          onClose={() => setShowNewAluno(false)}
          onConfirm={handleCreateAluno}
          confirmText="Criar Aluno"
          loading={saving}
        >
          <div className="space-y-4">
            {newError && (
              <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-4 py-2">{newError}</p>
            )}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nome Completo</label>
              <input
                value={newForm.full_name}
                onChange={(e) => setNewForm({ ...newForm, full_name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Nome do aluno"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">E-mail *</label>
              <input
                type="email"
                value={newForm.email}
                onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Telefone (WhatsApp)</label>
              <input
                value={newForm.phone}
                onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="11999999999"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Senha gerada automaticamente</label>
              <div className="flex gap-2">
                <input
                  value={newForm.password}
                  onChange={(e) => setNewForm({ ...newForm, password: e.target.value })}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-green-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="button"
                  onClick={() => setNewForm({ ...newForm, password: generateStrongPassword() })}
                  className="text-xs text-slate-400 hover:text-ink bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg transition-colors"
                >
                  🔄 Nova
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">O aluno usará esse email + senha para fazer login.</p>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Plano</label>
              <select
                value={newForm.plan_id}
                onChange={(e) => {
                  const plan = plans.find((p) => p.id === Number(e.target.value));
                  setNewForm({ ...newForm, plan_id: e.target.value ? Number(e.target.value) : '', monthly_value: plan ? String(plan.price) : newForm.monthly_value });
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Sem plano definido</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — R$ {Number(p.price).toFixed(2)}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Valor mensal (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newForm.monthly_value}
                  onChange={(e) => setNewForm({ ...newForm, monthly_value: e.target.value })}
                  placeholder="0.00"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Dia de vencimento</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={newForm.due_day}
                  onChange={(e) => setNewForm({ ...newForm, due_day: e.target.value })}
                  placeholder="10"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Status inicial</label>
              <select
                value={newForm.status}
                onChange={(e) => setNewForm({ ...newForm, status: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="inadimplente">Inadimplente</option>
              </select>
            </div>
            <TurmaPicker turmas={turmas} selected={newTurmaIds} onToggle={toggleNewTurma} />
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
