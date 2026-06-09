'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';

export default function ProfessorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const { user, loading } = usePilatesAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-daimach-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-daimach-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-daimach-light">Carregando...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard', path: '/professor/dashboard', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { name: 'Aulas', path: '/professor/aulas', icon: 'M12 6.253v13m0-13C6.038 6.253 2 10.289 2 15.5c0 5.211 4.038 9.247 10 9.247s10-4.036 10-9.247c0-5.211-4.038-9.247-10-9.247z' },
  ];

  return (
    <div className="min-h-screen bg-daimach-dark text-daimach-light flex">
      <aside className="flex flex-col w-64 bg-daimach-dark border-r border-daimach-primary/20 shrink-0">
        <div className="h-16 flex items-center px-5 border-b border-daimach-primary/20 space-x-3">
          <img src="/images/logo-daimach-oficial.jpeg" alt="Logo" width={36} height={36} className="rounded-lg object-contain" />
          <div>
            <p className="font-bold text-daimach-light text-sm">Daimach.Movement</p>
            <p className="text-xs text-daimach-accent">Professor</p>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                pathname === item.path
                  ? 'bg-daimach-primary text-daimach-dark'
                  : 'text-daimach-light hover:bg-daimach-primary/20'
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-daimach-primary/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-daimach-secondary hover:bg-daimach-primary/20 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 bg-daimach-dark/50 border-b border-daimach-primary/20 flex items-center justify-end px-6 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-daimach-accent rounded-full flex items-center justify-center text-sm font-bold text-daimach-dark">P</div>
            <span className="text-sm text-daimach-light">Professor</span>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
