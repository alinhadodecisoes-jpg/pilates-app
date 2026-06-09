'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';

export default function AlunoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const { user, loading } = usePilatesAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null; // usePilatesAuth já redireciona para /login
  }

  const menuItems = [
    { name: 'Dashboard', path: '/aluno/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Minhas Aulas', path: '/aluno/minhas-aulas', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { name: 'Reposições', path: '/aluno/reposicoes', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
    { name: 'Evolução', path: '/aluno/evolucao', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-800 border-r border-slate-700">
        <div className="h-16 flex items-center px-5 border-b border-slate-700 space-x-3">
          <img src="/images/logo-oficial.jpeg" alt="Logo" width={36} height={36} className="rounded-lg object-contain" />
          <span className="font-bold text-white text-lg">Daimach.Movement</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                pathname === item.path
                  ? 'bg-green-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-slate-700 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <header className="md:hidden h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <img src="/images/logo-oficial.jpeg" alt="Logo" width={32} height={32} className="rounded-lg object-contain" />
            <span className="font-bold text-white">Daimach.Movement</span>
          </div>
          <button onClick={handleLogout} className="text-red-400 p-2 rounded-lg hover:bg-slate-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">{children}</main>
      </div>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-800 border-t border-slate-700 flex items-center justify-around z-20">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 ${
              pathname === item.path ? 'text-green-400' : 'text-slate-400'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            <span className="text-[9px] font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
