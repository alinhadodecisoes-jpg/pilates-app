'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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
      console.log('[DEBUG] Iniciando login com:', email);

      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        console.error('[ERROR] Erro ao fazer login:', signInError);
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
        console.error('[ERROR] Nenhuma sessão retornada');
        setError('Erro ao criar sessão. Tente novamente.');
        setLoading(false);
        return;
      }

      console.log('[DEBUG] Login bem-sucedido, redirecionando...');
      redirecting.current = true;
      router.push('/aluno/dashboard');

    } catch (err) {
      console.error('[ERROR] Exception no login:', err);
      setError('Erro ao fazer login. Tente novamente.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${siteUrl}/api/auth/callback` },
    });
    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-daimach-dark text-daimach-light">
      <div className="w-full max-w-md bg-daimach-dark rounded-2xl shadow-xl p-6 sm:p-8 border border-daimach-primary/30">
        <div className="flex flex-col items-center mb-6">
          <img src="/logo.svg" alt="Logo" width={48} height={48} className="mb-3" />
          <h2 className="text-2xl font-bold text-daimach-light">Daimach.Movement</h2>
          <p className="text-daimach-light/60 text-sm mt-1">Pilates & Fisioterapia</p>
        </div>

        {registered && (
          <div className="bg-green-500/10 border border-green-500/40 text-green-400 p-3 rounded-lg mb-5 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Cadastro realizado! Faça login com suas credenciais.
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-400 p-3 rounded-lg mb-5 text-sm flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4 mb-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              placeholder="seu@email.com"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-daimach-primary hover:bg-daimach-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-daimach-dark font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Entrando...</>
            ) : 'Entrar com E-mail'}
          </button>
        </form>

        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-slate-800 text-slate-400">ou</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          className="w-full bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-3 shadow-sm"
        >
          {googleLoading ? (
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          Entrar com Google
        </button>

        <div className="mt-6 text-center text-sm text-slate-400">
          Não tem conta?{' '}
          <Link href="/register" className="text-green-400 hover:text-green-300 font-medium">
            Cadastre-se aqui
          </Link>
        </div>
      </div>
    </div>
  );
}
