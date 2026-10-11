'use client';

import React from 'react';
import { X, Sparkles, StickyNote, CheckSquare } from 'lucide-react';
import { playPopSound } from '@/lib/soundEffects';
import { SoundProfile } from '@/types/preferences';

interface ImagePasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  onAttachAsSticker: (imageUrl: string, style: 'washi' | 'polaroid' | 'plain') => void;
  onAttachAsNote: (imageUrl: string) => void;
  onAttachAsTask: (imageUrl: string) => void;
  soundProfile?: SoundProfile;
  isDark?: boolean;
}

export const ImagePasteModal: React.FC<ImagePasteModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  onAttachAsSticker,
  onAttachAsNote,
  onAttachAsTask,
  soundProfile = 'pop',
  isDark = false,
}) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-3xl border shadow-2xl p-5 flex flex-col gap-4 animate-in zoom-in-95 duration-200 relative ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white border-amber-300 text-slate-800'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <div>
              <h3 className="font-black text-base">Gambar Ditemukan di Clipboard!</h3>
              <p className="text-[11px] text-slate-400">
                Pilih bagaimana kamu ingin menempelkan gambar ini:
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Batal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Preview Thumbnail */}
        <div className="relative max-h-56 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-2 shadow-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Clipboard Preview"
            className="max-h-52 w-auto object-contain rounded-xl shadow-md pointer-events-none"
          />
        </div>

        {/* Action Choice Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          {/* Option 1: Floating Desktop Sticker */}
          <button
            type="button"
            onClick={() => {
              playPopSound(soundProfile);
              onAttachAsSticker(imageUrl, 'washi');
              onClose();
            }}
            className="p-3 rounded-2xl border border-amber-300/80 hover:border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 text-left cursor-pointer group shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center text-lg shadow-sm group-hover:scale-110 transition-transform shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                <span>Stiker Dekorasi Meja</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-black">
                  Bisa Digeser 📌
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Tempel langsung melayang di papan tugas dengan selotip washi
              </p>
            </div>
          </button>

          {/* Option 2: Sticky Memo in Notes Board */}
          <button
            type="button"
            onClick={() => {
              playPopSound(soundProfile);
              onAttachAsNote(imageUrl);
              onClose();
            }}
            className="p-3 rounded-2xl border border-purple-200 dark:border-purple-800/60 hover:border-purple-400 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 text-left cursor-pointer group shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center text-lg shadow-sm group-hover:scale-110 transition-transform shrink-0">
              <StickyNote className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                <span>Kartu Memo di Papan Catatan</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 font-black">
                  📝 Catatan
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Simpan sebagai kartu memo catatan yang bisa diberi tulisan
              </p>
            </div>
          </button>

          {/* Option 3: Task with Image Attachment */}
          <button
            type="button"
            onClick={() => {
              playPopSound(soundProfile);
              onAttachAsTask(imageUrl);
              onClose();
            }}
            className="p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 text-left cursor-pointer group shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-lg shadow-sm group-hover:scale-110 transition-transform shrink-0">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                <span>Tugas Baru dengan Lampiran</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-black">
                  To Do 💡
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Jadikan tugas baru di kolom rencana kerja
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
