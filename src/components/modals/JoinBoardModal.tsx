'use client';

import React, { useState } from 'react';
import { X, Users, ArrowRight } from 'lucide-react';
import { Board } from '@/types/board';
import { ThemeConfig } from '@/types/preferences';
import { triggerCelebration } from '@/lib/confetti';
import { playVictoryChime } from '@/lib/soundEffects';

interface JoinBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeConfig: ThemeConfig;
  onJoined: (board: Board) => void;
  initialCode?: string;
}

export const JoinBoardModal: React.FC<JoinBoardModalProps> = ({
  isOpen,
  onClose,
  themeConfig,
  onJoined,
  initialCode = '',
}) => {
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (!cleanCode) {
      setErrorMsg('Silakan masukkan kode atau link undangan');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/boards/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        triggerCelebration();
        playVictoryChime();
        onJoined(data.data);
        onClose();
      } else {
        setErrorMsg(data.error || 'Gagal bergabung ke papan');
      }
    } catch (err) {
      console.error('Error joining board:', err);
      setErrorMsg('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden p-6 transition-all duration-200 ${
          themeConfig.isDark
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-white border-amber-100 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-amber-500/10 text-amber-500">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-black">Gabung ke Papan Bersama</h3>
              <p className="text-xs text-slate-400">Kerjakan tugas atau catatan bersama teman</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleJoin} className="space-y-4 pt-4">
          {errorMsg && (
            <div className="p-3 text-xs rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Kode Undangan atau Link Papan
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Contoh: CERIA-A1B2C3 atau tempel link..."
              autoFocus
              className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium focus:outline-hidden transition-all ${
                themeConfig.isDark
                  ? 'bg-slate-800/80 border-slate-700 text-white focus:border-amber-500'
                  : 'bg-amber-50/40 border-amber-200 text-slate-800 focus:border-amber-400 shadow-inner'
              }`}
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Masukkan kode 6 digit dari pemilik papan atau tempel seluruh tautan undangan.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md active:scale-98 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <span>Gabung Papan</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
