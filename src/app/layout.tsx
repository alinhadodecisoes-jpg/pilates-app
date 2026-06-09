import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pilates Studio',
  description: 'Sistema de Gestão para Estúdio de Pilates',
  appleWebApp: {
    title: 'Pilates Studio',
    statusBarStyle: 'default',
  },
};

export const viewport = {
  themeColor: '#7c3aed',
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
