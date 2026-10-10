import React from 'react';
import { Sparkles, Plus, Volume2, VolumeX, Palette, Timer, Archive } from 'lucide-react';
import { UserPreferences, ThemeConfig } from '@/types/preferences';
import { UserAuthButton } from '@/components/ui/UserAuthButton';

interface NavbarProps {
  onOpenQuickPaste?: () => void;
  onOpenNewTask: () => void;
  onOpenPersonalization: () => void;
  onOpenPomodoro?: () => void;
  onOpenArchive?: () => void;
  isSoundMuted: boolean;
  onToggleSound: () => void;
  preferences: UserPreferences;
  themeConfig: ThemeConfig;
  counts: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
  };
  archivedCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewTask,
  onOpenPersonalization,
  onOpenPomodoro,
  onOpenArchive,
  isSoundMuted,
  onToggleSound,
  preferences,
  themeConfig,
  counts,
  archivedCount = 0,
}) => {
  return (
    <header className={`sticky top-0 z-30 ${themeConfig.isDark ? 'bg-[#181a20]/90 border-slate-800' : 'bg-white/85 border-slate-200/60'} backdrop-blur-md border-b shadow-xs transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-4">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div
              onClick={onOpenPersonalization}
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md overflow-hidden transition-transform hover:scale-105 active:scale-95 cursor-pointer ${
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
            <div>
              <div className="flex items-center gap-2">
                <h1
                  onClick={onOpenPersonalization}
                  className={`text-xl font-black bg-gradient-to-r ${themeConfig.accentTextGradient} bg-clip-text text-transparent cursor-pointer hover:opacity-90 transition-opacity`}
                  title="Klik untuk ubah nama aplikasi"
                >
                  {preferences.appName || 'Ceria Todo'}
                </h1>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${themeConfig.badgeBg} ${themeConfig.badgeText} ${themeConfig.badgeBorder}`}
                >
                  {preferences.appBadgeText || 'v1.0'}
                </span>
              </div>
              <p className={`text-xs font-medium truncate max-w-xs sm:max-w-md ${themeConfig.isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {preferences.dailyMotto || 'Kelola tugas lebih ringan & menyenangkan! ✨'}
              </p>
            </div>
          </div>

          {/* Counters & Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Summary Pill */}
            <div className={`hidden xl:flex items-center gap-2 ${themeConfig.isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200/80 text-slate-600'} border px-2.5 py-1 rounded-2xl text-xs shrink-0`}>
              <span className={`font-semibold ${themeConfig.isDark ? 'text-slate-200' : 'text-slate-700'}`}>Total: {counts.total}</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-amber-500 font-medium">
                {preferences.columns?.TODO?.emoji || '💡'} {preferences.columns?.TODO?.title || 'Rencana'}: {counts.todo}
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-blue-500 font-medium">
                {preferences.columns?.IN_PROGRESS?.emoji || '⚡'} {preferences.columns?.IN_PROGRESS?.title || 'Aksi'}: {counts.inProgress}
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-emerald-500 font-medium">
                {preferences.columns?.DONE?.emoji || '🏆'} {preferences.columns?.DONE?.title || 'Sukses'}: {counts.done}
              </span>
            </div>

            {/* Pomodoro Timer Toggle */}
            {onOpenPomodoro && (
              <button
                type="button"
                onClick={onOpenPomodoro}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border transition-all duration-150 cursor-pointer active:scale-95 shadow-2xs shrink-0 ${
                  themeConfig.isDark
                    ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-amber-300'
                    : 'bg-amber-50 hover:bg-amber-100/70 border-amber-200/80 text-amber-900'
                }`}
                title="Buka Timer Pomodoro & Suara Santai Ambient ⏱️"
              >
                <Timer className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline text-xs font-bold">Fokus</span>
              </button>
            )}

            {/* Archive Modal Toggle */}
            {onOpenArchive && (
              <button
                type="button"
                onClick={onOpenArchive}
                className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border transition-all duration-150 cursor-pointer active:scale-95 shadow-2xs shrink-0 ${
                  themeConfig.isDark
                    ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-emerald-300'
                    : 'bg-emerald-50 hover:bg-emerald-100/70 border-emerald-200/80 text-emerald-900'
                }`}
                title="Buka Riwayat Arsip Tugas Selesai 🗂️"
              >
                <Archive className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline text-xs font-bold">Arsip</span>
                {archivedCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-500 text-white">
                    {archivedCount}
                  </span>
                )}
              </button>
            )}

            {/* Personalization / Settings Button */}
            <button
              onClick={onOpenPersonalization}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border transition-all duration-150 cursor-pointer active:scale-95 shadow-2xs shrink-0 ${
                themeConfig.isDark
                  ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
              title="Pengaturan Nama, Papan, Tema & Efek"
            >
              <Palette className="w-4 h-4 text-orange-500" />
              <span className="hidden sm:inline text-xs font-bold">
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

            {/* Add Task Button */}
            <button
              onClick={onOpenNewTask}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl active:scale-95 text-xs sm:text-sm font-bold shadow-md transition-all duration-150 cursor-pointer shrink-0 whitespace-nowrap ${themeConfig.primaryButton}`}
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Tugas</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
