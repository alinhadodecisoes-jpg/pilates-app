import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Daimach.Movement - Pilates & Fisioterapia',
  description: 'Gerenciamento completo de Pilates e Fisioterapia',
  appleWebApp: {
    title: 'Daimach.Movement',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport = {
  themeColor: '#06b6d4',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}

