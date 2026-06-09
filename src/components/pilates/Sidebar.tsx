'use client';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import Link from 'next/link';

export function Sidebar() {
  const { role } = usePilatesAuth();

  return (
    <div className="w-64 bg-gray-900 text-white p-4 min-h-screen">
      <h2 className="text-2xl font-bold mb-6">🏋️ Pilates</h2>

      {role === 'admin' && (
        <nav className="space-y-2">
          <Link href="/admin/dashboard" className="block p-2 hover:bg-gray-700 rounded">📊 Dashboard</Link>
          <Link href="/admin/usuarios" className="block p-2 hover:bg-gray-700 rounded">👥 Usuários</Link>
          <Link href="/admin/financeiro" className="block p-2 hover:bg-gray-700 rounded">💰 Financeiro</Link>
          <Link href="/admin/relatorios" className="block p-2 hover:bg-gray-700 rounded">📄 Relatórios</Link>
        </nav>
      )}

      {role === 'professor' && (
        <nav className="space-y-2">
          <Link href="/professor/dashboard" className="block p-2 hover:bg-gray-700 rounded">📊 Dashboard</Link>
          <Link href="/professor/aulas" className="block p-2 hover:bg-gray-700 rounded">📚 Aulas</Link>
        </nav>
      )}

      {role === 'aluno' && (
        <nav className="space-y-2">
          <Link href="/aluno/dashboard" className="block p-2 hover:bg-gray-700 rounded">📊 Dashboard</Link>
          <Link href="/aluno/minhas-aulas" className="block p-2 hover:bg-gray-700 rounded">📚 Aulas</Link>
          <Link href="/aluno/fisioterapia" className="block p-2 hover:bg-gray-700 rounded">🏥 Fisioterapia</Link>
        </nav>
      )}

      <div className="mt-8 pt-4 border-t">
        <Link href="/login" className="block p-2 text-red-400 hover:bg-gray-700 rounded">🚪 Sair</Link>
      </div>
    </div>
  );
}
