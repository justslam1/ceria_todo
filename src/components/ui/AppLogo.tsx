import React from 'react';
import { ClipboardList, Sparkles } from 'lucide-react';

export default function AppLogo() {
  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Background Kotak Gradien Lembut */}
      <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-400 p-[2px] shadow-lg shadow-orange-500/20 flex items-center justify-center">
        {/* Lapisan dalam untuk kedalaman warna */}
        <div className="w-full h-full bg-gradient-to-tr from-amber-500 via-orange-400 to-rose-400 rounded-2xl flex items-center justify-center">
          {/* Ikon Utama: Papan Catatan */}
          <ClipboardList className="w-8 h-8 text-white drop-shadow-sm transition-transform duration-300 hover:scale-105" />
        </div>
      </div>

      {/* Kilauan Utama yang Berkelip Lembut */}
      <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-70"></span>
        <span className="relative inline-flex items-center justify-center rounded-full bg-amber-400 p-0.5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
        </span>
      </span>

      {/* Partikel Kilau Kecil Tambahan (Kelip Selang-Seling) */}
      <span className="absolute -bottom-1 -left-1 flex h-3.5 w-3.5 animate-bounce [animation-duration:2.5s]">
        <Sparkles className="w-3.5 h-3.5 text-amber-500 drop-shadow" />
      </span>
    </div>
  );
}
