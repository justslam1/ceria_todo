'use client';

import React, { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { Info, LogIn, X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export const GuestModeBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    // Cek apakah user pernah menutup banner di sesi ini
    const isDismissed = sessionStorage.getItem('ceria_guest_banner_dismissed');
    if (!isDismissed) {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('ceria_guest_banner_dismissed', 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="w-full bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800/60 px-3 sm:px-6 py-2.5 transition-all text-xs text-amber-900 dark:text-amber-100 flex items-center justify-between gap-3 shadow-2xs">
      <div className="flex items-center gap-2.5 max-w-4xl">
        <div className="p-1 rounded-lg bg-amber-200/80 dark:bg-amber-800/80 text-amber-800 dark:text-amber-200 shrink-0">
          <Info className="w-4 h-4" />
        </div>
        <p className="font-medium leading-relaxed">
          <strong className="font-bold">Mode Tamu:</strong> Data Anda tersimpan di peramban ini. Masuk dengan akun Google untuk menyimpan permanen ke cloud dan membuka dari perangkat lain.
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => signIn('google', { callbackUrl: '/' })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shadow-2xs active:scale-95 cursor-pointer"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Masuk dengan Google</span>
          <span className="xs:hidden">Masuk</span>
        </button>

        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg hover:bg-amber-200/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 transition-colors cursor-pointer"
          title="Tutup pemberitahuan"
          aria-label="Tutup pemberitahuan"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
