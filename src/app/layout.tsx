import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  themeColor: '#faf8f5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'Papan Catatan - Studio Papan Buletin Kerja',
  description: 'Kelola tugas harian dengan menyenangkan bersama Papan Catatan!',
  applicationName: 'Ceria Todo',
  authors: [{ name: 'Slam Area' }],
  keywords: ['todo', 'kanban', 'productivity', 'sticky note', 'ceria todo'],
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'Papan Catatan - Studio Papan Buletin Kerja',
    description: 'Kelola tugas harian dengan menyenangkan bersama Papan Catatan!',
    type: 'website',
    locale: 'id_ID',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
