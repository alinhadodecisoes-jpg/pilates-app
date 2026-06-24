'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const redirecting = useRef(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('registered') === 'true') {
      setRegistered(true);
    }
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (redirecting.current) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        const msg = signInError.message;
        if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
          setError('E-mail ou senha inválidos.');
        } else if (msg.includes('Email not confirmed')) {
          setError('Confirme seu e-mail antes de fazer login.');
        } else {
          setError(msg);
        }
        setLoading(false);
        return;
      }

      if (!data.session) {
        setError('Erro ao criar sessão. Tente novamente.');
        setLoading(false);
        return;
      }

      redirecting.current = true;
      router.push('/aluno/dashboard');
    } catch {
      setError('Erro ao fazer login. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cream text-ink">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-sand">
        <div className="flex flex-col items-center mb-7">
          <img src="/images/logo-simbolo.png" alt="Daimach Movement" width={88} height={88} className="mb-3 object-contain" />
          <h2 className="text-2xl font-bold text-ink">Acesso ao Estúdio</h2>
          <p className="text-slate-500 text-sm mt-1">Entre com sua conta para continuar</p>
        </div>

        {registered && (
          <div className="bg-green-500/10 border border-green-500/40 text-green-700 p-3 rounded-lg mb-5 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Cadastro realizado! Faça login com suas credenciais.
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-600 p-3 rounded-lg mb-5 text-sm flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-cream border border-sand rounded-xl px-4 py-3 text-ink placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold transition-colors"
              placeholder="seu@email.com"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-cream border border-sand rounded-xl px-4 py-3 text-ink placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold transition-colors"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forest hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed text-cream font-bold py-3.5 rounded-xl text-base shadow-lg transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin" />Entrando...</>
            ) : 'Entrar com E-mail'}
          </button>
        </form>

        <div className="mt-7 text-center text-sm text-slate-500">
          Não tem conta?{' '}
          <Link href="/register" className="text-gold hover:brightness-110 font-semibold">
            Solicitar cadastro
          </Link>
        </div>
      </div>
    </div>
  );
}
