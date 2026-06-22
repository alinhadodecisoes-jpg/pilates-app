'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';

export default function FisioterapeutaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const { user, loading, role } = usePilatesAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const menuItems = [
    {
      name: 'Pacientes',
      path: '/fisioterapeuta/pacientes',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    },
    {
      name: 'Fisioterapia',
      path: '/fisioterapeuta/dashboard',
      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    },
  ];

  return (
    <div className="h-screen overflow-hidden bg-slate-900 text-slate-50 flex">
      {menuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMenuOpen(false)} />
      )}
      <aside className={`flex flex-col w-64 h-screen bg-slate-800 border-r border-slate-700 shrink-0 fixed inset-y-0 left-0 z-50 transition-transform md:static md:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center px-5 border-b border-slate-700 space-x-3">
          <img src="/images/logo-oficial.jpeg" alt="Logo" width={36} height={36} className="rounded-lg object-contain" />
          <div>
            <p className="font-bold text-white text-sm">Daimach.Movement</p>
            <p className="text-xs text-slate-400">Fisioterapeuta</p>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                pathname.startsWith(item.path)
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
        <div className="p-4 border-t border-slate-700 space-y-1 shrink-0">
          {role === 'prof_fisio' && (
            <Link
              href="/professor/dashboard"
              className="w-full flex items-center space-x-3 px-4 py-3 text-blue-300 hover:bg-slate-700 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="font-medium">Área de Professor</span>
            </Link>
          )}
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

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="md:hidden h-16 bg-slate-800/50 border-b border-slate-700 flex items-center px-4 shrink-0">
          <button
            className="p-2 -ml-1 text-slate-200 hover:bg-slate-700 rounded-lg"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="ml-2 font-semibold text-white">Fisioterapia</span>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
