'use client';
import { useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';

export default function UsuariosAdmin() {
  const { loading: authLoading } = usePilatesAuth();
  const [formData, setFormData] = useState({ email: '', password: '', phone: '', address: '', role: 'aluno', plan_id: 1 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const supabase = getSupabaseBrowserClient();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        setMessage(`Erro: ${authError.message}`);
        setLoading(false);
        return;
      }

      const { error: dbError } = await supabase
        .from('users_pilates')
        .insert([{ id: authData.user?.id, role: formData.role, plan_id: formData.plan_id, phone: formData.phone, address: formData.address, status: 'ativo' }]);

      if (dbError) {
        setMessage(`Erro: ${dbError.message}`);
      } else {
        setMessage(`✅ Usuário ${formData.email} criado!`);
        setFormData({ email: '', password: '', phone: '', address: '', role: 'aluno', plan_id: 1 });
      }
    } catch (err) {
      setMessage(`Erro: ${err}`);
    }

    setLoading(false);
  };

  if (authLoading) return <div>Loading...</div>;

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-50">
      <h1 className="text-2xl font-bold mb-4">👥 Cadastrar Novo Usuário</h1>
      {message && <div className="bg-blue-600 p-3 rounded mb-4">{message}</div>}
      <form onSubmit={handleCreate} className="max-w-md space-y-3">
        <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full p-2 rounded bg-gray-800 text-ink" required />
        <input type="password" placeholder="Senha" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full p-2 rounded bg-gray-800 text-ink" required />
        <input type="text" placeholder="Telefone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full p-2 rounded bg-gray-800 text-ink" />
        <input type="text" placeholder="Endereço" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full p-2 rounded bg-gray-800 text-ink" />
        <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full p-2 rounded bg-gray-800 text-ink">
          <option value="aluno">Aluno</option>
          <option value="professor">Professor</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" disabled={loading} className="w-full bg-green-600 p-2 rounded text-ink">
          {loading ? 'Criando...' : 'Criar Usuário'}
        </button>
      </form>
    </div>
  );
}
