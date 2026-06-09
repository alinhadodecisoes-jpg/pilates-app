'use client';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';
import Link from 'next/link';

export function Sidebar() {
  const { role } = usePilatesAuth();

  return (
    <div className="w-64 bg-daimach-dark text-daimach-light p-4 min-h-screen border-r border-daimach-primary/20">
      <div className="flex items-center gap-2 mb-6">
        <img src="/logo.svg" alt="Daimach" className="h-8" />
        <h2 className="text-xl font-bold">Daimach</h2>
      </div>

      {role === 'admin' && (
        <nav className="space-y-2">
          <Link href="/admin/dashboard" className="block p-2 hover:bg-daimach-primary/20 rounded transition">📊 Dashboard</Link>
          <Link href="/admin/usuarios" className="block p-2 hover:bg-daimach-primary/20 rounded transition">👥 Usuários</Link>
          <Link href="/admin/financeiro" className="block p-2 hover:bg-daimach-primary/20 rounded transition">💰 Financeiro</Link>
          <Link href="/admin/relatorios" className="block p-2 hover:bg-daimach-primary/20 rounded transition">📄 Relatórios</Link>
        </nav>
      )}

      {role === 'professor' && (
        <nav className="space-y-2">
          <Link href="/professor/dashboard" className="block p-2 hover:bg-daimach-primary/20 rounded transition">📊 Dashboard</Link>
          <Link href="/professor/aulas" className="block p-2 hover:bg-daimach-primary/20 rounded transition">📚 Aulas</Link>
        </nav>
      )}

      {role === 'aluno' && (
        <nav className="space-y-2">
          <Link href="/aluno/dashboard" className="block p-2 hover:bg-daimach-primary/20 rounded transition">📊 Dashboard</Link>
          <Link href="/aluno/minhas-aulas" className="block p-2 hover:bg-daimach-primary/20 rounded transition">📚 Aulas</Link>
          <Link href="/aluno/fisioterapia" className="block p-2 hover:bg-daimach-primary/20 rounded transition">🏥 Fisioterapia</Link>
        </nav>
      )}

      <div className="mt-8 pt-4 border-t border-daimach-primary/20">
        <Link href="/login" className="block p-2 text-daimach-secondary hover:bg-daimach-primary/20 rounded transition">🚪 Sair</Link>
      </div>
    </div>
  );
}
