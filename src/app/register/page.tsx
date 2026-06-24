'use client';

import { useState } from 'react';
import Link from 'next/link';

// WhatsApp do estúdio (mesmo do site). Ajuste aqui se o número mudar.
const WHATS = '552176300055';

const INTERESSES = ['Aluno(a) de Pilates', 'Fisioterapia', 'Professor(a)', 'Franquia', 'Outro'];

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [interesse, setInteresse] = useState(INTERESSES[0]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const buildWhatsAppUrl = () => {
    const text =
      `Olá! Gostaria de me cadastrar na Daimach Movement.\n\n` +
      `*Nome:* ${name}\n` +
      `*Telefone:* ${phone}\n` +
      `*E-mail:* ${email || '—'}\n` +
      `*Interesse:* ${interesse}\n` +
      `*Mensagem:* ${message || '—'}`;
    return `https://wa.me/${WHATS}?text=${encodeURIComponent(text)}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !phone.trim()) {
      setError('Preencha pelo menos nome e telefone.');
      return;
    }
    window.open(buildWhatsAppUrl(), '_blank', 'noopener,noreferrer');
    setSent(true);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-cream text-ink">
        <div className="w-full max-w-md bg-white rounded-2xl p-8 border border-sand text-center shadow-xl">
          <div className="w-16 h-16 bg-green-500/15 text-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-ink mb-2">Solicitação enviada!</h2>
          <p className="text-slate-500 text-sm">
            Abrimos o WhatsApp com seus dados. Nossa equipe faz o cadastro e libera o seu acesso.
          </p>
          <a href={buildWhatsAppUrl()} target="_blank" rel="noreferrer" className="inline-block mt-5 text-gold hover:brightness-110 font-semibold text-sm">
            Não abriu? Clique aqui para falar no WhatsApp
          </a>
          <div className="mt-6">
            <Link href="/login" className="text-slate-500 hover:text-ink text-sm">← Voltar para o login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cream text-ink">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-sand">
        <div className="flex flex-col items-center mb-5">
          <img src="/images/logo-simbolo.png" alt="Daimach Movement" width={80} height={80} className="mb-3 object-contain" />
          <h2 className="text-2xl font-bold text-ink">Solicitar Cadastro</h2>
          <p className="text-slate-500 text-sm mt-1 text-center">
            O cadastro é feito pela nossa equipe. Deixe seus dados que entramos em contato para liberar seu acesso.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-600 p-3 rounded-lg mb-5 text-sm flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Nome completo *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-cream border border-sand rounded-xl px-4 py-3 text-ink placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold transition-colors"
              placeholder="Seu nome"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Telefone / WhatsApp *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-cream border border-sand rounded-xl px-4 py-3 text-ink placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold transition-colors"
              placeholder="(21) 99999-9999"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">E-mail (opcional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-cream border border-sand rounded-xl px-4 py-3 text-ink placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold transition-colors"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Tenho interesse em</label>
            <select
              value={interesse}
              onChange={(e) => setInteresse(e.target.value)}
              className="w-full bg-cream border border-sand rounded-xl px-4 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-gold transition-colors"
            >
              {INTERESSES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Mensagem (opcional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full bg-cream border border-sand rounded-xl px-4 py-3 text-ink placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold transition-colors"
              placeholder="Ex.: horários de preferência, objetivo, etc."
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#25d366] hover:brightness-105 text-white font-bold py-3.5 rounded-xl text-base shadow-lg transition flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 32 32" width="22" height="22" fill="currentColor" aria-hidden="true">
              <path d="M16.04 4C9.93 4 4.98 8.95 4.98 15.06c0 1.95.51 3.86 1.48 5.54L4 28l7.6-2.4a11 11 0 0 0 4.44.93h.01c6.11 0 11.06-4.95 11.06-11.06C27.11 8.95 22.15 4 16.04 4zm5.02 13.35c-.27-.14-1.63-.8-1.88-.9-.25-.09-.43-.14-.61.14-.18.27-.7.9-.86 1.08-.16.18-.32.2-.59.07-.27-.14-1.16-.43-2.21-1.36-.82-.73-1.37-1.63-1.53-1.9-.16-.27-.02-.42.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.83-2.01-.22-.53-.44-.46-.61-.46l-.52-.01c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29s.98 2.66 1.12 2.84c.14.18 1.93 2.95 4.68 4.13.65.28 1.17.45 1.56.58.66.21 1.26.18 1.73.11.53-.08 1.63-.67 1.86-1.31.23-.64.23-1.19.16-1.31-.07-.12-.25-.18-.52-.32z" />
            </svg>
            Enviar solicitação no WhatsApp
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Já tem conta?{' '}
          <Link href="/login" className="text-gold hover:brightness-110 font-semibold">
            Faça login aqui
          </Link>
        </div>
      </div>
    </div>
  );
}
