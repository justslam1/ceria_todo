'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, Loader2, Shield } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export const UserAuthButton: React.FC = () => {
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-100 text-slate-400 text-xs font-medium animate-pulse">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
        <span>{t.navbar.checkingAccount}</span>
      </div>
    );
  }

  if (status === 'authenticated' && session?.user) {
    const { name, email, image, isAdmin } = session.user;
    const firstName = name ? name.split(' ')[0] : 'User';

    return (
      <div className="relative z-50" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
          title={`${t.navbar.loggedInAs} ${name || email}`}
        >
          {image ? (
            <Image
              src={image}
              alt={name || 'Avatar'}
              width={26}
              height={26}
              unoptimized
              className="rounded-full border border-slate-200 dark:border-slate-600 shadow-2xs"
            />
          ) : (
            <div className="w-6.5 h-6.5 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 flex items-center justify-center font-bold text-xs shadow-2xs">
              {firstName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[70px] sm:max-w-[90px] truncate hidden xs:inline">
            {firstName}
          </span>
          {isAdmin && (
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
              Admin
            </span>
          )}
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{name}</p>
                {isAdmin && (
                  <span className="text-[10px] font-extrabold uppercase tracking-wide bg-amber-500/15 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate">{email}</p>
            </div>

            {isAdmin && (
              <div className="py-1 border-b border-slate-100 dark:border-slate-700/60">
                <Link
                  href="/admin"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Dasbor Admin</span>
                </Link>
              </div>
            )}

            <div className="pt-1.5">
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.navbar.logoutBtn}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};
