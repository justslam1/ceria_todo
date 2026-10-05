import React from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4">
      {/* Sticky Note 404 Card */}
      <div className="relative max-w-md w-full bg-gradient-to-b from-yellow-50 via-amber-50 to-orange-50 border border-amber-300 rounded-3xl p-6 sm:p-8 shadow-2xl rotate-1 transition-transform hover:rotate-0">
        {/* Washi tape decoration */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-6 bg-pink-200/80 border border-pink-300/70 rounded-xs shadow-xs -rotate-2" />

        {/* Pin decoration */}
        <div className="absolute -top-2 left-6 text-xl select-none">
          📌
        </div>

        <div className="flex flex-col items-center text-center space-y-4 pt-2">
          <div className="inline-block px-3 py-1 rounded-full bg-amber-200/60 border border-amber-300 text-amber-900 font-extrabold text-xs tracking-wider">
            KODE 404
          </div>

          <div className="text-6xl font-black text-amber-500 tracking-tight">
            🍃 404
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Halaman Tidak Ditemukan!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Catatan atau tautan yang Anda tuju sepertinya telah dipindahkan, terhapus, atau belum pernah dibuat.
            </p>
          </div>

          <div className="pt-2 w-full">
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
            >
              <Home className="w-4 h-4" />
              Kembali ke Papan Catatan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
