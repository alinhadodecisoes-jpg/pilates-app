'use client';
import { useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';

export default function RelatoriosAdmin() {
  const { loading: authLoading } = usePilatesAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const supabase = getSupabaseBrowserClient();

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('users_pilates').select('id, phone, address, role').eq('role', 'aluno').limit(100);
    setUsers(data || []);
    setLoading(false);
  };

  const generateReport = async (format: 'pdf' | 'excel') => {
    if (!selectedUser) {
      alert('Selecione um usuário');
      return;
    }
    alert(`Relatório em ${format.toUpperCase()} será gerado para ${selectedUser}`);
  };

  if (authLoading) return <div>Loading...</div>;

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-50">
      <h1 className="text-2xl font-bold mb-4">📊 Gerar Relatórios</h1>
      <button onClick={fetchUsers} className="bg-blue-600 text-white px-4 py-2 rounded mb-4">
        {loading ? 'Carregando...' : 'Carregar Usuários'}
      </button>
      {users.length > 0 && (
        <div className="mb-4">
          <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="w-full p-2 rounded bg-gray-800 text-white mb-4">
            <option value="">Selecione um aluno</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.phone || u.id.substring(0, 8)}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={() => generateReport('pdf')} className="flex-1 bg-red-600 text-white p-2 rounded">📄 PDF</button>
            <button onClick={() => generateReport('excel')} className="flex-1 bg-green-600 text-white p-2 rounded">📊 Excel</button>
          </div>
        </div>
      )}
    </div>
  );
}
