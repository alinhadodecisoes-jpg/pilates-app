'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-slate-50">
      <div className="max-w-md w-full text-center space-y-8">
        
        {/* Logo/Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-600/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-bold tracking-tight text-ink mb-2">Pilates Studio</h1>
          <p className="text-slate-400">Gerencie suas aulas, pagamentos e evolução física num só lugar.</p>
        </div>

        <div className="flex flex-col gap-4 mt-8">
          <Link href="/login" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center shadow-md">
            Fazer Login
          </Link>
          <Link href="/register" className="w-full bg-slate-800 hover:bg-slate-700 text-cyan-400 font-medium py-3 px-6 rounded-lg border border-slate-700 transition-colors flex items-center justify-center shadow-md">
            Criar Conta
          </Link>
        </div>
        
      </div>
    </div>
  );
}
