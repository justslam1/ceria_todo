'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home, AlertCircle } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4">
      {/* Sticky Note Error Card */}
      <div className="relative max-w-md w-full bg-gradient-to-b from-amber-50 to-orange-50 border border-amber-300 rounded-3xl p-6 sm:p-8 shadow-2xl rotate-[-1deg] transition-transform hover:rotate-0">
        {/* Washi tape on top */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-amber-200/80 border border-amber-300/70 rounded-xs shadow-xs rotate-1" />

        {/* Pin on top-right */}
        <div className="absolute -top-2 right-6 text-xl select-none">
          📌
        </div>

        <div className="flex flex-col items-center text-center space-y-4 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-500 shadow-inner">
            <AlertCircle className="w-9 h-9" />
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Aduh, Catatan Terjatuh! 🍂
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Terjadi kendala tak terduga saat memuat aplikasi. Jangan cemas, data Anda tetap aman di sistem.
            </p>
          </div>

          {error?.message && (
            <div className="w-full bg-rose-50/80 border border-rose-200/80 rounded-2xl p-3 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block mb-1">
                Keterangan Sistem
              </span>
              <p className="text-xs font-mono text-rose-700 break-words line-clamp-3">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
            <button
              onClick={() => reset()}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <RefreshCw className="w-4 h-4" />
              Coba Lagi
            </button>
            <Link
              href="/"
              className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
