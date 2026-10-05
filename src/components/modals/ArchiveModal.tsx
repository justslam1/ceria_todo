'use client';

import React from 'react';
import { Task } from '@/types/task';
import { X, Archive, RotateCcw, Trash2, CheckCircle2 } from 'lucide-react';
import { playPopSound } from '@/lib/soundEffects';
import { SoundProfile } from '@/types/preferences';

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  archivedTasks: Task[];
  onUnarchiveTask: (id: string) => void;
  onDeleteArchivedTask: (id: string) => void;
  onClearAllArchived: () => void;
  soundProfile?: SoundProfile;
}

export const ArchiveModal: React.FC<ArchiveModalProps> = ({
  isOpen,
  onClose,
  archivedTasks,
  onUnarchiveTask,
  onDeleteArchivedTask,
  onClearAllArchived,
  soundProfile = 'pop',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Arsip Tugas Tuntas
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold border border-emerald-300">
                  {archivedTasks.length} Tugas
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Koleksi misi yang telah berhasil kamu selesaikan dengan gemilang
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Card */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg">
              🏆
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">
                Pencapaian Hebat!
              </div>
              <div className="text-[11px] text-slate-500">
                Tugas diarsipkan agar papan tetap rapi tanpa kehilangan riwayat kerja.
              </div>
            </div>
          </div>

          {archivedTasks.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Hapus permanen semua tugas di arsip?')) {
                  onClearAllArchived();
                }
              }}
              className="text-xs text-rose-500 hover:text-rose-700 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
            >
              Kosongkan Arsip
            </button>
          )}
        </div>

        {/* Task List */}
        <div className="flex-1 p-5 overflow-y-auto space-y-2.5">
          {archivedTasks.length === 0 ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Archive className="w-10 h-10 stroke-[1.5] text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Belum ada tugas diarsipkan</p>
              <p className="text-xs max-w-xs text-slate-400">
                Selesaikan tugas di kolom &quot;Done&quot;, lalu tekan tombol &quot;Arsipkan&quot; untuk menyimpannya di sini.
              </p>
            </div>
          ) : (
            archivedTasks.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-2xs flex items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate line-through opacity-85">
                      {t.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-600 font-medium">
                        {t.category}
                      </span>
                      <span>•</span>
                      <span>Selesai: {new Date(t.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      playPopSound(soundProfile);
                      onUnarchiveTask(t.id);
                    }}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                    title="Kembalikan ke papan (Done)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playPopSound(soundProfile);
                      onDeleteArchivedTask(t.id);
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Hapus permanen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
