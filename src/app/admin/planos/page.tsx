'use client';

import { useState, useEffect } from 'react';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import { getPlans, createPlan, updatePlan, deletePlan } from '@/lib/pilates/pilates-db';
import { Modal } from '@/components/pilates/Modal';
import { Button } from '@/components/pilates/Button';
import { ConfirmDialog } from '@/components/pilates/ConfirmDialog';
import type { PilatesPlan } from '@/types/pilates';

export default function PlanosPage() {
  const { loading: authLoading } = usePilatesAuth();
  const [plans, setPlans] = useState<PilatesPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPlan, setEditPlan] = useState<PilatesPlan | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({ name: '', price: 0, classes_per_week: 2, description: '' });

  useEffect(() => {
    if (!authLoading) {
      getPlans()
        .then(setPlans)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [authLoading]);

  const openCreate = () => {
    setForm({ name: '', price: 0, classes_per_week: 2, description: '' });
    setShowCreate(true);
  };

  const openEdit = (p: PilatesPlan) => {
    setEditPlan(p);
    setForm({ name: p.name, price: p.price, classes_per_week: p.classes_per_week, description: p.description ?? '' });
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const novo = await createPlan(form.name, form.price, form.classes_per_week, form.description);
      setPlans((prev) => [...prev, novo]);
      setShowCreate(false);
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!editPlan) return;
    setSaving(true);
    try {
      const updated = await updatePlan(editPlan.id, { name: form.name, price: form.price, classes_per_week: form.classes_per_week, description: form.description });
      setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditPlan(null);
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePlan(deleteTarget);
      setPlans((prev) => prev.filter((p) => p.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) { console.error(err); } finally { setDeleting(false); }
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const PlanForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-slate-400 mb-1">Nome do Plano</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Ex: Pilates 2x/Semana"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Preço (R$)</label>
          <input type="number" min={0} step={0.01} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Aulas/Semana</label>
          <input type="number" min={1} max={7} value={form.classes_per_week} onChange={(e) => setForm({ ...form, classes_per_week: Number(e.target.value) })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm text-slate-400 mb-1">Descrição</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          placeholder="Breve descrição do plano..."
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Gestão de Planos</h1>
        <Button variant="primary" size="md" onClick={openCreate}>+ Novo Plano</Button>
      </div>

      {plans.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-10 border border-slate-700 text-center">
          <p className="text-slate-400">Nenhum plano cadastrado. Clique em &quot;+ Novo Plano&quot; para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-green-600/50 transition-colors">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-white text-lg">{plan.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${plan.is_active ? 'bg-green-600/20 text-green-400' : 'bg-slate-600/20 text-slate-400'}`}>
                    {plan.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <p className="text-3xl font-bold text-green-400">R$ {plan.price.toFixed(2).replace('.', ',')}</p>
                <p className="text-sm text-slate-400 mt-1">{plan.classes_per_week}x por semana</p>
                {plan.description && <p className="text-sm text-slate-300 mt-2">{plan.description}</p>}
              </div>
              <div className="px-5 py-3 border-t border-slate-700 flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => openEdit(plan)}>Editar</Button>
                <Button variant="danger" size="sm" onClick={() => setDeleteTarget(plan.id)}>Deletar</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="Novo Plano" onClose={() => setShowCreate(false)} onConfirm={handleCreate} confirmText="Criar Plano" loading={saving}>
          <PlanForm />
        </Modal>
      )}

      {editPlan && (
        <Modal title="Editar Plano" onClose={() => setEditPlan(null)} onConfirm={handleUpdate} confirmText="Salvar" loading={saving}>
          <PlanForm />
        </Modal>
      )}

      {deleteTarget !== null && (
        <ConfirmDialog
          title="Deletar Plano"
          message="Deseja deletar este plano? Alunos vinculados a ele precisarão ser atualizados manualmente."
          confirmText="Deletar"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
