'use client';

import React, { useState } from 'react';
import {
  X,
  Heart,
  Palette,
  Sparkles,
  Maximize2,
} from 'lucide-react';
import { ShowcaseItem } from '@/types/showcase';
import { UserPreferences, BoardSticker } from '@/types/preferences';
import { getThemeConfig } from '@/lib/userPreferences';

interface ShowcaseDetailModalProps {
  showcase: ShowcaseItem | null;
  onClose: () => void;
  onApply: (item: ShowcaseItem) => void;
  onToggleLike: (id: string, e: React.MouseEvent) => void;
}

export const ShowcaseDetailModal: React.FC<ShowcaseDetailModalProps> = ({
  showcase,
  onClose,
  onApply,
  onToggleLike,
}) => {
  const [activeDetailTab, setActiveDetailTab] = useState<'screenshot' | 'preview' | 'stickers' | 'specs'>(
    showcase?.thumbnail ? 'screenshot' : 'preview'
  );
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!showcase) return null;

  let parsed: Partial<UserPreferences> = {};
  try {
    parsed = JSON.parse(showcase.configJson);
  } catch (err) {
    console.error('Failed to parse configJson:', err);
  }

  const themeConfig = getThemeConfig(parsed.theme || 'sunset', parsed.customTheme);
  const stickers: BoardSticker[] = parsed.stickers || [];
  const mascot = parsed.deskBuddy || 'none';
  const columns = parsed.columns || {
    TODO: { title: 'To Do', subtitle: 'Tugas yang akan datang', emoji: '📝' },
    IN_PROGRESS: { title: 'In Progress', subtitle: 'Tugas yang sedang berjalan', emoji: '⏳' },
    DONE: { title: 'Done', subtitle: 'Tugas yang telah selesai', emoji: '✅' },
  };
  const categories = parsed.customCategories || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[94vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-slate-800 transition-all text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {showcase.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={showcase.user.image}
                alt={showcase.user.name || 'Author'}
                className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-amber-400 text-white font-bold flex items-center justify-center text-sm shrink-0">
                {(showcase.user.name || 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black truncate max-w-xs sm:max-w-md">
                  {showcase.title}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  🏷️ {showcase.category}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Oleh <strong>{showcase.user.name || 'Kreator Ceria'}</strong> •{' '}
                {new Date(showcase.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={(e) => onToggleLike(showcase.id, e)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                showcase.isLiked
                  ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/50 dark:border-rose-900'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-500'
              }`}
              title="Sukai karya ini"
            >
              <Heart className={`w-4 h-4 ${showcase.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{showcase.likesCount}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 px-6 py-2 border-b border-slate-100 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 shrink-0 text-xs font-bold flex-wrap">
          {showcase.thumbnail && (
            <button
              onClick={() => setActiveDetailTab('screenshot')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeDetailTab === 'screenshot'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Foto Screenshot Penuh</span>
            </button>
          )}

          <button
            onClick={() => setActiveDetailTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeDetailTab === 'preview'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Simulasi Papan Interaktif</span>
          </button>
          <button
            onClick={() => setActiveDetailTab('stickers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeDetailTab === 'stickers'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Koleksi Stiker ({stickers.length})</span>
          </button>
          <button
            onClick={() => setActiveDetailTab('specs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeDetailTab === 'specs'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Spesifikasi Tema</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-6">
          {/* TAB 0: TANGKAPAN LAYAR HD */}
          {activeDetailTab === 'screenshot' && showcase.thumbnail && (
            <div className="space-y-4">
              {showcase.description && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-slate-800/60 border border-amber-200/60 dark:border-slate-700/60 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <span className="font-bold text-amber-900 dark:text-amber-400 mr-1.5">Catatan Kreator:</span>
                  {showcase.description}
                </div>
              )}

              <div
                onClick={() => setIsLightboxOpen(true)}
                className="relative group rounded-3xl overflow-hidden border-2 border-slate-300/80 dark:border-slate-700 shadow-2xl cursor-zoom-in"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={showcase.thumbnail}
                  alt={showcase.title}
                  className="w-full h-auto aspect-video object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 rounded-2xl bg-black/75 text-white text-xs font-bold backdrop-blur-md flex items-center gap-2 shadow-xl">
                    <Maximize2 className="w-4 h-4" />
                    <span>Klik untuk Perbesar Layar Penuh</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: PREVIEW KANBAN SIMULATOR */}
          {activeDetailTab === 'preview' && (
            <div className="space-y-4">
              {showcase.description && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-slate-800/60 border border-amber-200/60 dark:border-slate-700/60 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <span className="font-bold text-amber-900 dark:text-amber-400 mr-1.5">Catatan Kreator:</span>
                  {showcase.description}
                </div>
              )}

              {/* Live Board Simulator Container */}
              <div
                className="relative w-full rounded-2xl overflow-hidden border-2 border-slate-300/80 dark:border-slate-700 shadow-xl transition-all"
                style={{
                  backgroundColor: parsed.customTheme?.bgHex || themeConfig.bgHex || '#faf8f5',
                  backgroundImage: parsed.customBgUrl ? `url(${parsed.customBgUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  minHeight: '440px',
                }}
              >
                {/* Background Dim & Blur overlay if configured */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundColor: `rgba(0,0,0,${(parsed.bgDim || 0) / 100})`,
                    backdropFilter: parsed.bgBlur ? `blur(${parsed.bgBlur}px)` : undefined,
                  }}
                />

                {/* Simulated Board Columns Background */}
                <div className="relative z-10 p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 pointer-events-none opacity-85">
                  {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((colKey) => {
                    const col = columns[colKey];
                    return (
                      <div
                        key={colKey}
                        className="rounded-2xl p-3.5 border border-slate-300/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm flex flex-col gap-2.5 min-h-[360px]"
                      >
                        <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2">
                          <span className="text-xl">{col.emoji}</span>
                          <div>
                            <h4 className="font-bold text-xs sm:text-sm">{col.title}</h4>
                            <p className="text-[10px] text-slate-500">{col.subtitle}</p>
                          </div>
                        </div>

                        {/* Sample Dummy Task Cards */}
                        <div className="p-3 rounded-xl bg-amber-50/90 dark:bg-slate-800/90 border border-amber-200/70 dark:border-slate-700 shadow-xs text-xs">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                            Contoh Kartu Tugas #1
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Format gaya selotip: <strong>{parsed.washiTapeStyle || 'soft'}</strong>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-sky-50/90 dark:bg-slate-800/90 border border-sky-200/70 dark:border-slate-700 shadow-xs text-xs">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                            Contoh Kartu Tugas #2
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Stempel selesai: <strong>{parsed.completionStamp || 'SELESAI!'}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Live Placed Stickers in Simulator */}
                <div className="absolute inset-0 pointer-events-none z-20">
                  {stickers.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        position: 'absolute',
                        left: `${s.x}%`,
                        top: `${s.y}%`,
                        transform: `rotate(${s.rotation}deg) scale(${s.scale || 1})`,
                        maxWidth: s.imageUrl ? '180px' : undefined,
                      }}
                      className="select-none pointer-events-auto transition-transform hover:scale-110 hover:z-30 cursor-pointer"
                      title={s.text || s.emoji || 'Stiker Dekoratif'}
                    >
                      {s.imageUrl ? (
                        <div className="rounded-xl overflow-hidden shadow-2xl border-2 border-white/90 bg-white/90">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={s.imageUrl}
                            alt={s.text || 'Stiker Quote'}
                            className="w-full h-auto object-contain"
                          />
                        </div>
                      ) : (
                        <span className="text-3xl sm:text-4xl drop-shadow-md">{s.emoji}</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desk Buddy Mascot Mascot */}
                {mascot !== 'none' && (
                  <div
                    className={`absolute z-30 pointer-events-none p-2 ${
                      parsed.deskBuddyPosition === 'top-left'
                        ? 'top-4 left-4'
                        : parsed.deskBuddyPosition === 'top-right'
                        ? 'top-4 right-4'
                        : parsed.deskBuddyPosition === 'bottom-right'
                        ? 'bottom-4 right-4'
                        : 'bottom-4 left-4'
                    }`}
                  >
                    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg border border-amber-200 dark:border-slate-700 flex items-center gap-2">
                      <span className="text-2xl animate-bounce">
                        {mascot === 'cat'
                          ? '🐱'
                          : mascot === 'dog'
                          ? '🐶'
                          : mascot === 'plant'
                          ? '🌱'
                          : mascot === 'coffee'
                          ? '☕'
                          : mascot === 'owl'
                          ? '🦉'
                          : mascot === 'robot'
                          ? '🤖'
                          : mascot === 'toast'
                          ? '🍞'
                          : '🐾'}
                      </span>
                      <div className="text-[11px] font-bold">
                        <span>{parsed.deskBuddyCustomName || 'Teman Meja'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: KOLEKSI STIKER */}
          {activeDetailTab === 'stickers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Total {stickers.length} Stiker Ditempel pada Meja Ini
                </h4>
                <span className="text-xs text-slate-500">
                  Stiker akan otomatis ikut ditempel ke mejamu saat template diterapkan.
                </span>
              </div>

              {stickers.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  Tidak ada stiker dekorasi pada setup ini.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {stickers.map((s, idx) => (
                    <div
                      key={s.id || idx}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-xs flex flex-col items-center justify-center text-center gap-2 hover:shadow-md transition-shadow"
                    >
                      {s.imageUrl ? (
                        <div className="w-full max-h-40 overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={s.imageUrl}
                            alt={s.text || 'Stiker Quote'}
                            className="w-full h-auto object-contain"
                          />
                        </div>
                      ) : (
                        <span className="text-4xl my-2">{s.emoji}</span>
                      )}

                      <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        {s.text ? (
                          <span className="italic line-clamp-2">&quot;{s.text}&quot;</span>
                        ) : (
                          <span>Stiker #{idx + 1}</span>
                        )}
                        {s.author && (
                          <span className="block text-[10px] text-slate-400 font-bold mt-0.5">
                            — {s.author}
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>Posisi: ({s.x}%, {s.y}%)</span>
                        <span>Rotasi: {s.rotation}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SPESIFIKASI TEMA */}
          {activeDetailTab === 'specs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Visual & Estetika Papan
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Tema Aktif</span>
                    <span className="font-bold capitalize">{parsed.theme || 'sunset'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Font Mood</span>
                    <span className="font-bold capitalize">{parsed.fontMood || 'rounded'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Gaya Selotip</span>
                    <span className="font-bold capitalize">{parsed.washiTapeStyle || 'soft'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Gaya Pin</span>
                    <span className="font-bold capitalize">{parsed.pinStyle || 'pin'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Stempel Selesai</span>
                    <span className="font-bold">{parsed.completionStamp || 'SELESAI!'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Profil Suara</span>
                    <span className="font-bold capitalize">{parsed.soundProfile || 'pop'}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Maskot & Kategori Khusus
                </h4>
                <div className="text-xs space-y-2">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Maskot Meja</span>
                      <span className="font-bold capitalize">{mascot}</span>
                    </div>
                    {mascot !== 'none' && (
                      <span className="text-2xl">
                        {mascot === 'cat'
                          ? '🐱'
                          : mascot === 'dog'
                          ? '🐶'
                          : mascot === 'plant'
                          ? '🌱'
                          : mascot === 'coffee'
                          ? '☕'
                          : mascot === 'owl'
                          ? '🦉'
                          : mascot === 'robot'
                          ? '🤖'
                          : mascot === 'toast'
                          ? '🍞'
                          : '🐾'}
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1">
                      Kategori Kustom ({categories.length})
                    </span>
                    {categories.length === 0 ? (
                      <span className="text-slate-400 italic">Menggunakan kategori standar</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {categories.map((c) => (
                          <span
                            key={c.id || c.name}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            {c.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>📥 Dipakai sebanyak <strong>{showcase.clonesCount} kali</strong> oleh komunitas</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Kembali
            </button>

            <button
              onClick={() => {
                onApply(showcase);
                onClose();
              }}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Palette className="w-4 h-4" />
              <span>Terapkan Setup Ini ke Papanku</span>
            </button>
          </div>
        </div>
      </div>

      {/* Full-Screen High-Resolution Lightbox Modal */}
      {isLightboxOpen && showcase.thumbnail && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="absolute top-4 right-4 z-70 flex items-center gap-3">
            <span className="text-white/80 text-xs font-semibold">
              {showcase.title}
            </span>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="max-w-6xl max-h-[90vh] overflow-auto rounded-2xl shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={showcase.thumbnail}
              alt={showcase.title}
              className="w-full h-auto max-h-[88vh] object-contain rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
