'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, Loader2 } from 'lucide-react';
import Image from 'next/image';

export const UserAuthButton: React.FC = () => {
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        <span>Memeriksa akun...</span>
      </div>
    );
  }

  if (status === 'authenticated' && session?.user) {
    const { name, email, image } = session.user;
    const firstName = name ? name.split(' ')[0] : 'Akun';

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
          title={`Masuk sebagai ${name || email}`}
        >
          {image ? (
            <Image
              src={image}
              alt={name || 'Avatar'}
              width={26}
              height={26}
              unoptimized
              className="rounded-full border border-slate-200 shadow-2xs"
            />
          ) : (
            <div className="w-6.5 h-6.5 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-xs shadow-2xs">
              {firstName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xs font-semibold text-slate-800 max-w-[100px] truncate">
            {firstName}
          </span>
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200/90 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-800 truncate">{name}</p>
              <p className="text-[11px] text-slate-400 truncate">{email}</p>
            </div>

            <div className="pt-1.5">
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar (Logout)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Jika belum login, tidak menampilkan tombol di navbar karena diarahkan ke /login
  return null;
};
