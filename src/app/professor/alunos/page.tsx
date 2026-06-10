'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { updateAluno } from '@/lib/pilates/pilates-db';
import { Modal } from '@/components/pilates/Modal';

interface Student {
  user_id: string;
  class_name: string;
  class_id: number;
  users_pilates?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    status: string;
    monthly_value: number | null;
  } | null;
}

interface EditForm {
  full_name: string;
  phone: string;
}

export default function ProfessorAlunosPage() {
  const { user, loading: authLoading } = usePilatesAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ full_name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pilates/professor?professorId=${user.id}`);
      if (!res.ok) throw new Error('Falha ao carregar');
      const data = await res.json();
      const mapped = (data.students ?? []).map((e: any) => ({
        user_id: e.user_id,
        class_id: e.class_id,
        class_name: e.class_name ?? '—',
        users_pilates: {
          full_name: e.full_name,
          email: e.email,
          phone: e.phone,
          status: e.status,
          monthly_value: e.monthly_value,
        },
      }));
      setStudents(mapped as Student[]);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar alunos.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) loadStudents();
  }, [authLoading, loadStudents]);

  const openEdit = (s: Student) => {
    setEditStudent(s);
    setEditForm({
      full_name: s.users_pilates?.full_name ?? '',
      phone: s.users_pilates?.phone ?? '',
    });
    setError(null);
  };

  const handleSaveEdit = async () => {
    if (!editStudent) return;
    setSaving(true);
    try {
      await updateAluno(editStudent.user_id, {
        full_name: editForm.full_name || undefined,
        phone: editForm.phone || undefined,
      });
      setEditStudent(null);
      loadStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (s.users_pilates?.full_name ?? '').toLowerCase().includes(q) ||
      (s.users_pilates?.email ?? '').toLowerCase().includes(q) ||
      s.class_name.toLowerCase().includes(q)
    );
  });

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Meus Alunos</h1>
        <span className="text-sm text-slate-400">{filtered.length} aluno(s)</span>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-xl px-4 py-3">⚠️ {error}</p>
      )}

      <input
        type="text"
        placeholder="Buscar por nome, email ou turma..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
      />

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="px-5 py-3 text-slate-400 font-medium">Nome</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Turma</th>
                <th className="px-5 py-3 text-slate-400 font-medium hidden md:table-cell">Telefone</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Status</th>
                <th className="px-5 py-3 text-slate-400 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                    {students.length === 0
                      ? 'Nenhum aluno matriculado nas suas turmas.'
                      : 'Nenhum resultado para a busca.'}
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={`${s.user_id}-${s.class_id}`} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-white font-medium">{s.users_pilates?.full_name || '—'}</p>
                      <p className="text-slate-400 text-xs">{s.users_pilates?.email || ''}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-300 text-xs">{s.class_name}</td>
                    <td className="px-5 py-4 text-slate-300 hidden md:table-cell">
                      {s.users_pilates?.phone ? (
                        <a
                          href={`https://wa.me/55${s.users_pilates.phone.replace(/\D/g, '')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-green-400 hover:text-green-300 text-xs"
                        >
                          📱 {s.users_pilates.phone}
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        s.users_pilates?.status === 'ativo' ? 'bg-green-600/20 text-green-400'
                          : s.users_pilates?.status === 'inadimplente' ? 'bg-red-600/20 text-red-400'
                          : 'bg-slate-600/20 text-slate-400'
                      }`}>
                        {s.users_pilates?.status || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => openEdit(s)}
                        className="text-xs text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editStudent && (
        <Modal
          title="Editar Dados do Aluno"
          onClose={() => setEditStudent(null)}
          onConfirm={handleSaveEdit}
          confirmText="Salvar"
          loading={saving}
        >
          <div className="space-y-4">
            {error && (
              <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">{error}</p>
            )}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nome Completo</label>
              <input
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Telefone</label>
              <input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="(11) 99999-9999"
              />
            </div>
            <p className="text-xs text-slate-500">
              ⚠️ Professor pode editar nome e telefone. Dados financeiros e status são gerenciados pelo admin.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
