'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'pill' | 'minimal' | 'badge';
}

export function LanguageSwitcher({ className = '', variant = 'pill' }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-1.5 p-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs rounded-full border border-amber-200/80 dark:border-slate-700 shadow-xs ${className}`}>
        <Globe className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 ml-1.5 shrink-0" />
        <div className="flex items-center text-xs font-bold">
          <button
            type="button"
            onClick={() => setLanguage('id')}
            className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
              language === 'id'
                ? 'bg-amber-500 text-white shadow-2xs font-extrabold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            🇮🇩 ID
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
              language === 'en'
                ? 'bg-amber-500 text-white shadow-2xs font-extrabold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            🇬🇧 EN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1 p-1 bg-amber-100/70 hover:bg-amber-100/90 border border-amber-300/80 rounded-2xl shadow-2xs transition-all ${className}`}
    >
      <button
        type="button"
        onClick={() => setLanguage('id')}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          language === 'id'
            ? 'bg-white text-amber-900 shadow-xs border border-amber-200/60 scale-[1.02]'
            : 'text-amber-800/70 hover:text-amber-900 hover:bg-white/40'
        }`}
        title="Bahasa Indonesia"
      >
        <span>🇮🇩</span>
        <span>ID</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          language === 'en'
            ? 'bg-white text-amber-900 shadow-xs border border-amber-200/60 scale-[1.02]'
            : 'text-amber-800/70 hover:text-amber-900 hover:bg-white/40'
        }`}
        title="English"
      >
        <span>🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
}
