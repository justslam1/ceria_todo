'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'pill' | 'minimal' | 'badge' | 'compact';
}

function FlagID({ className = 'w-4 h-3' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 16"
      className={` rounded-[3px] shadow-2xs border border-black/15 shrink-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <rect width="24" height="8" y="0" fill="#E70011" />
      <rect width="24" height="8" y="8" fill="#FFFFFF" />
    </svg>
  );
}

function FlagGB({ className = 'w-4 h-3' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 30"
      className={`rounded-[3px] shadow-2xs border border-black/15 shrink-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <clipPath id="gb-clip">
        <path d="M0,0 v30 h60 v-30 z" />
      </clipPath>
      <clipPath id="gb-diag">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <g clipPath="url(#gb-clip)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#gb-diag)" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

export function LanguageSwitcher({ className = '', variant = 'pill' }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  if (variant === 'compact') {
    const isID = language === 'id';
    return (
      <button
        type="button"
        onClick={() => setLanguage(isID ? 'en' : 'id')}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none active:scale-95 shadow-2xs hover:-translate-y-0.5 ${
          language === 'id'
            ? 'bg-amber-100/70 hover:bg-amber-100 border-amber-300/80 text-amber-950 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-200'
            : 'bg-sky-100/70 hover:bg-sky-100 border-sky-300/80 text-sky-950 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-200'
        } ${className}`}
        title={isID ? 'Ganti ke English (EN)' : 'Switch to Bahasa Indonesia (ID)'}
      >
        {isID ? <FlagID className="w-4 h-3 shrink-0" /> : <FlagGB className="w-4 h-3 shrink-0" />}
        <span>{isID ? 'ID' : 'EN'}</span>
      </button>
    );
  }

  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-1 p-1 bg-white/85 dark:bg-slate-800/85 backdrop-blur-xs rounded-full border border-amber-200/80 dark:border-slate-700 shadow-xs ${className}`}
      >
        <div className="flex items-center gap-0.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setLanguage('id')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all cursor-pointer ${
              language === 'id'
                ? 'bg-amber-500 text-white shadow-2xs font-extrabold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Bahasa Indonesia"
          >
            <FlagID className="w-4 h-3" />
            <span>ID</span>
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all cursor-pointer ${
              language === 'en'
                ? 'bg-amber-500 text-white shadow-2xs font-extrabold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="English"
          >
            <FlagGB className="w-4 h-3" />
            <span>EN</span>
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
        <FlagID className="w-4 h-3" />
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
        <FlagGB className="w-4 h-3" />
        <span>EN</span>
      </button>
    </div>
  );
}
