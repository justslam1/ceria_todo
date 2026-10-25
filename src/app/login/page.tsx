'use client';

import React, { useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, MessageSquareShare, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();

  const isSuspended = !!session?.user?.isSuspended;

  // Jika sudah login dan tidak ditangguhkan, otomatis alihkan ke Dashboard
  useEffect(() => {
    if (status === 'authenticated' && !isSuspended) {
      router.replace('/');
    }
  }, [status, isSuspended, router]);

  return (
    <div className="min-h-screen bg-[#faf8f5] bg-[radial-gradient(#e2e8f0_1.2px,transparent_1.2px)] [background-size:20px_20px] flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Decorative Floating Background Shapes */}
      <div className="absolute top-1/4 left-10 w-48 h-48 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-64 h-64 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Main Sticky Note Login Card */}
      <div className="relative w-full max-w-md bg-gradient-to-b from-amber-50 via-yellow-100/70 to-amber-100/80 rounded-3xl p-6 sm:p-8 border border-amber-300/80 shadow-[0_15px_35px_rgba(180,83,9,0.15)] -rotate-1 hover:rotate-0 transition-all duration-300">
        {/* Washi Tape Strip on Top */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-6 bg-amber-200/80 border border-amber-300/60 rounded-xs shadow-2xs rotate-[-1deg] backdrop-blur-xs opacity-80 pointer-events-none" />

        {/* Pilihan Bahasa di bagian atas kartu sticky note */}
        <div className="flex justify-end mb-2">
          <LanguageSwitcher />
        </div>

        {/* Header App Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3">
            <AppLogo />
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-amber-700 via-orange-600 to-rose-600 bg-clip-text text-transparent">
            {t.login.title}
          </h1>
          <p className="text-xs font-semibold text-amber-900/80 mt-1">
            {t.login.subtitle}
          </p>
        </div>

        {/* Suspended Account Banner */}
        {isSuspended && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs shadow-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Akun Anda Ditangguhkan</p>
              <p className="text-rose-700 leading-relaxed">
                Akses ke akun ini telah dinonaktifkan oleh administrator. Silakan hubungi admin untuk informasi lebih lanjut.
              </p>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="mt-1 text-xs font-semibold text-rose-700 underline hover:text-rose-900 cursor-pointer"
              >
                Keluar dari akun ini
              </button>
            </div>
          </div>
        )}

        {/* Feature Highlights Pills */}
        <div className="bg-white/70 backdrop-blur-xs rounded-2xl p-4 border border-amber-200/80 mb-6 space-y-2.5 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{t.login.feature1} <strong>{t.login.feature1Highlight}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquareShare className="w-4 h-4 text-sky-600 shrink-0" />
            <span>{t.login.feature2}</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{t.login.feature3}</span>
          </div>
        </div>

        {/* Google Sign In Button */}
        <div className="space-y-3">
          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            disabled={status === 'loading'}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-slate-50 active:scale-98 text-slate-800 font-bold text-sm rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            {/* Google SVG Logo */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.25 21.37 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.59H1.26C.46 8.19 0 9.99 0 12s.46 3.81 1.26 5.41l4.02-3.13z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.63 1.26 6.59l4.02 3.13c.95-2.83 3.6-4.97 6.72-4.97z"
              />
            </svg>
            <span>{t.login.googleButton}</span>
            <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
          </button>

          <div className="pt-1 text-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-900/80 hover:text-amber-950 hover:underline py-1"
            >
              <span>Coba aplikasi tanpa login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-[11px] text-center text-amber-900/60 mt-5 font-medium">
          {t.login.footerNote}
        </p>
      </div>

      {/* Footer Branding */}
      <footer className="mt-6 sm:mt-8 text-center z-10">
        <p className="text-xs font-medium tracking-wide text-slate-400 select-none">
          {t.login.footerCopyright}
        </p>
      </footer>
    </div>
  );
}
