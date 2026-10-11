import React, { useState } from 'react';
import { Sparkles, Plus, Volume2, VolumeX, Palette, Timer, Archive, Check, X } from 'lucide-react';
import { UserPreferences, ThemeConfig } from '@/types/preferences';
import { UserAuthButton } from '@/components/ui/UserAuthButton';

interface NavbarProps {
  onOpenQuickPaste?: () => void;
  onOpenNewTask: () => void;
  onOpenPersonalization: () => void;
  onOpenPomodoro?: () => void;
  onOpenArchive?: () => void;
  onOpenShowcase?: () => void;
  isSoundMuted: boolean;
  onToggleSound: () => void;
  preferences: UserPreferences;
  onSavePreferences?: (prefs: UserPreferences) => void;
  themeConfig: ThemeConfig;
  counts: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
  };
  archivedCount?: number;
  activeTab?: 'tasks' | 'notes';
  onTabChange?: (tab: 'tasks' | 'notes') => void;
  notesCount?: number;
  onOpenNewNote?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewTask,
  onOpenPersonalization,
  onOpenPomodoro,
  onOpenArchive,
  onOpenShowcase,
  isSoundMuted,
  onToggleSound,
  preferences,
  onSavePreferences,
  themeConfig,
  counts,
  archivedCount = 0,
  activeTab = 'tasks',
  onTabChange,
  notesCount = 0,
  onOpenNewNote,
}) => {
  const [isEditingMotto, setIsEditingMotto] = useState(false);
  const [draftMotto, setDraftMotto] = useState('');

  const handleStartEditMotto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraftMotto(preferences.dailyMotto || 'Kelola tugas lebih ringan & menyenangkan! ✨');
    setIsEditingMotto(true);
  };

  const handleSaveMotto = () => {
    const clean = draftMotto.trim() || 'Kelola tugas lebih ringan & menyenangkan! ✨';
    setIsEditingMotto(false);
    if (onSavePreferences) {
      onSavePreferences({
        ...preferences,
        dailyMotto: clean,
      });
    }
  };

  const handleCancelMotto = () => {
    setIsEditingMotto(false);
  };
  return (
    <header className={`sticky top-0 z-30 w-full ${themeConfig.isDark ? 'bg-[#181a20]/90 border-slate-800' : 'bg-white/85 border-slate-200/60'} backdrop-blur-md border-b shadow-xs transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3 lg:gap-4">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
            <div
              onClick={onOpenPersonalization}
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md overflow-hidden transition-transform hover:scale-105 active:scale-95 cursor-pointer shrink-0 ${
                preferences.customLogoUrl
                  ? 'bg-white p-0.5 border border-slate-200 shadow-orange-100'
                  : `bg-gradient-to-tr ${themeConfig.accentGradient} text-white text-base`
              }`}
              title="Klik untuk ubah logo & nama aplikasi"
            >
              {preferences.customLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preferences.customLogoUrl}
                  alt={preferences.appName || 'Logo Aplikasi'}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : preferences.appIconPreset ? (
                <span className="text-xl leading-none select-none">{preferences.appIconPreset}</span>
              ) : (
                <Sparkles className="w-5 h-5 animate-pulse" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1
                  onClick={onOpenPersonalization}
                  className={`text-lg sm:text-xl font-black bg-gradient-to-r ${themeConfig.accentTextGradient} bg-clip-text text-transparent cursor-pointer hover:opacity-90 transition-opacity whitespace-nowrap`}
                  title="Klik untuk ubah nama aplikasi"
                >
                  {preferences.appName || 'Ceria Todo'}
                </h1>
                <span
                  className={`text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full font-semibold border shrink-0 ${themeConfig.badgeBg} ${themeConfig.badgeText} ${themeConfig.badgeBorder}`}
                >
                  {preferences.appBadgeText || 'v1.0'}
                </span>
              </div>
              {isEditingMotto ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveMotto();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 mt-0.5"
                >
                  <input
                    type="text"
                    value={draftMotto}
                    onChange={(e) => setDraftMotto(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') handleCancelMotto();
                    }}
                    autoFocus
                    maxLength={100}
                    className="px-2 py-0.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-amber-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-slate-100 shadow-inner w-52 sm:w-72"
                    placeholder="Tulis tagline..."
                  />
                  <button
                    type="submit"
                    className="p-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer shrink-0"
                    title="Simpan tagline"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelMotto}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
                    title="Batal"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </form>
              ) : (
                <p
                  onClick={handleStartEditMotto}
                  className={`text-xs font-medium truncate max-w-[150px] sm:max-w-xs md:max-w-[160px] lg:max-w-xs xl:max-w-sm hidden sm:block cursor-pointer hover:text-amber-500 dark:hover:text-amber-400 transition-colors ${
                    themeConfig.isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                  title="Klik untuk mengubah tagline"
                >
                  {preferences.dailyMotto || 'Kelola tugas lebih ringan & menyenangkan! ✨'}
                </p>
              )}
            </div>
          </div>

          {/* View Mode Switcher: Papan Tugas ↔ Papan Catatan */}
          {onTabChange && (
            <div className="flex items-center p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs self-center shrink-0">
              <button
                type="button"
                onClick={() => onTabChange('tasks')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'tasks'
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Buka Papan Tugas (Kanban)"
              >
                <span>📋</span>
                <span>Tugas</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold">
                  {counts.total}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('notes')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'notes'
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Buka Papan Catatan Bebas"
              >
                <span>📝</span>
                <span>Catatan</span>
                {notesCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold">
                    {notesCount}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Counters & Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">

            {/* Pomodoro Timer Toggle */}
            {onOpenPomodoro && (
              <button
                type="button"
                onClick={onOpenPomodoro}
                className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 xl:px-3 py-1.5 rounded-xl border transition-all duration-150 cursor-pointer active:scale-95 shadow-2xs shrink-0 ${
                  themeConfig.isDark
                    ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-amber-300'
                    : 'bg-amber-50 hover:bg-amber-100/70 border-amber-200/80 text-amber-900'
                }`}
                title="Buka Timer Pomodoro & Suara Santai Ambient ⏱️"
              >
                <Timer className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="hidden xl:inline text-xs font-bold">Fokus</span>
              </button>
            )}

            {/* Archive Modal Toggle */}
            {onOpenArchive && (
              <button
                type="button"
                onClick={onOpenArchive}
                className={`inline-flex items-center gap-1.5 px-2 sm:px-2 xl:px-2.5 py-1.5 rounded-xl border transition-all duration-150 cursor-pointer active:scale-95 shadow-2xs shrink-0 ${
                  themeConfig.isDark
                    ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-emerald-300'
                    : 'bg-emerald-50 hover:bg-emerald-100/70 border-emerald-200/80 text-emerald-900'
                }`}
                title="Buka Riwayat Arsip Tugas Selesai 🗂️"
              >
                <Archive className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="hidden xl:inline text-xs font-bold">Arsip</span>
                {archivedCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-500 text-white shrink-0">
                    {archivedCount}
                  </span>
                )}
              </button>
            )}

            {/* Community Board Showcase Button */}
            {onOpenShowcase && (
              <button
                type="button"
                onClick={onOpenShowcase}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-2.5 xl:px-3 py-1.5 rounded-xl border transition-all duration-150 cursor-pointer active:scale-95 shadow-2xs shrink-0 ${
                  themeConfig.isDark
                    ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-rose-300'
                    : 'bg-rose-50 hover:bg-rose-100/70 border-rose-200/80 text-rose-900'
                }`}
                title="Buka Galeri Komunitas & Pamerkan Mejamu 🏛️"
              >
                <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="hidden xl:inline text-xs font-bold">Galeri</span>
              </button>
            )}

            {/* Personalization / Settings Button */}
            <button
              onClick={onOpenPersonalization}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-2.5 xl:px-3 py-1.5 rounded-xl border transition-all duration-150 cursor-pointer active:scale-95 shadow-2xs shrink-0 ${
                themeConfig.isDark
                  ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
              title="Pengaturan Nama, Papan, Tema & Efek"
            >
              <Palette className="w-4 h-4 text-orange-500 shrink-0" />
              <span className="hidden xl:inline text-xs font-bold">
                Pengaturan
              </span>
            </button>

            {/* Sound Effects Toggle Button */}
            <button
              onClick={onToggleSound}
              className={`p-1.5 rounded-xl border transition-all duration-150 cursor-pointer shrink-0 ${
                isSoundMuted
                  ? themeConfig.isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-600'
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                  : themeConfig.isDark
                  ? 'bg-slate-800 border-slate-700 text-amber-400'
                  : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
              }`}
              title={
                isSoundMuted
                  ? 'Efek Suara: Bisu (Klik untuk aktifkan)'
                  : 'Efek Suara: Aktif (Klik untuk bisukan)'
              }
            >
              {isSoundMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            {/* Google Authentication Button / Avatar */}
            <div className="shrink-0">
              <UserAuthButton />
            </div>

            {/* Add Task / Note Button */}
            <button
              onClick={activeTab === 'notes' ? (onOpenNewNote || onOpenNewTask) : onOpenNewTask}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl active:scale-95 text-xs sm:text-sm font-bold shadow-md transition-all duration-150 cursor-pointer shrink-0 whitespace-nowrap ${themeConfig.primaryButton}`}
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{activeTab === 'notes' ? 'Tambah Catatan' : 'Tambah Tugas'}</span>
              <span className="sm:hidden">{activeTab === 'notes' ? 'Catatan' : 'Tugas'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
