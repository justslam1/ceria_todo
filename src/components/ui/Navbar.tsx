import React, { useState } from 'react';
import { Sparkles, Plus, Volume2, VolumeX, Palette, Timer, Archive, Check, X } from 'lucide-react';
import { UserPreferences, ThemeConfig } from '@/types/preferences';
import { UserAuthButton } from '@/components/ui/UserAuthButton';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Board } from '@/types/board';
import { BoardSelector } from '@/components/boards/BoardSelector';

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
  boards?: Board[];
  activeBoard?: Board | null;
  onSelectBoard?: (board: Board) => void;
  onOpenCreateBoard?: () => void;
  onEditBoard?: (board: Board) => void;
  onDeleteBoard?: (board: Board) => void;
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
  boards = [],
  activeBoard = null,
  onSelectBoard,
  onOpenCreateBoard,
  onEditBoard,
  onDeleteBoard,
}) => {
  const [isEditingMotto, setIsEditingMotto] = useState(false);
  const [draftMotto, setDraftMotto] = useState('');
  const { t } = useLanguage();

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
  const isPlayful = preferences.navbarStyle === 'playful';

  return (
    <header
      className={`sticky top-0 z-40 w-full backdrop-blur-md transition-all duration-300 ${
        themeConfig.isDark
          ? 'bg-[#181a20]/95 border-b border-slate-800'
          : isPlayful
          ? 'bg-[#fcf9f4]/95 border-b-2 border-dashed border-amber-900/15 shadow-[0_3px_12px_rgba(180,83,9,0.06)]'
          : 'bg-[#faf7f2]/95 border-b border-amber-900/10 shadow-[0_2px_10px_rgba(180,83,9,0.03)]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3 lg:gap-4">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
            <div className="relative">
              {/* Optional Washi Tape on top of App Logo for Playful Mode */}
              {isPlayful && !themeConfig.isDark && (
                <div
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-2.5 bg-amber-200/85 backdrop-blur-xs rounded-2xs border-y border-dashed border-amber-400/60 shadow-2xs -rotate-3 z-20 pointer-events-none"
                />
              )}
              <div
                onClick={onOpenPersonalization}
                className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md overflow-hidden transition-transform hover:scale-105 active:scale-95 cursor-pointer shrink-0 ${
                  isPlayful ? '-rotate-1 hover:rotate-0' : ''
                } ${
                  preferences.customLogoUrl
                    ? 'bg-white p-0.5 border border-amber-200 shadow-orange-100'
                    : `bg-gradient-to-tr ${themeConfig.accentGradient} text-white text-base`
                }`}
              >
                {preferences.customLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preferences.customLogoUrl}
                    alt={preferences.appName || 'Logo'}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : preferences.appIconPreset ? (
                  <span className="text-xl leading-none select-none">{preferences.appIconPreset}</span>
                ) : (
                  <Sparkles className="w-5 h-5 animate-pulse" />
                )}
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1
                  onClick={onOpenPersonalization}
                  className={`text-lg sm:text-xl font-black bg-gradient-to-r ${themeConfig.accentTextGradient} bg-clip-text text-transparent cursor-pointer hover:opacity-90 transition-opacity whitespace-nowrap`}
                >
                  {preferences.appName === 'Papan Catatan' ? t.common.appName : (preferences.appName || t.common.appName)}
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
                    placeholder={t.navbar.editMottoPlaceholder}
                  />
                  <button
                    type="submit"
                    className="p-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer shrink-0"
                    title={t.common.save}
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelMotto}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
                    title={t.common.cancel}
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
                >
                  {preferences.dailyMotto || 'Kelola tugas lebih ringan & menyenangkan! ✨'}
                </p>
              )}
            </div>
          </div>

          {/* Board Selector & View Mode Switcher */}
          <div className="flex items-center gap-2 self-center shrink-0 flex-wrap sm:flex-nowrap justify-center">
            {boards.length > 0 && onSelectBoard && onOpenCreateBoard && (
              <BoardSelector
                boards={boards}
                activeBoard={activeBoard}
                onSelectBoard={onSelectBoard}
                onOpenCreateBoard={onOpenCreateBoard}
                onEditBoard={onEditBoard || (() => {})}
                onDeleteBoard={onDeleteBoard || (() => {})}
                themeConfig={themeConfig}
              />
            )}

            {/* View Mode Switcher: Papan Tugas ↔ Papan Catatan */}
            {onTabChange && (
              <div
                className={`flex items-center p-1 rounded-2xl transition-all self-center shrink-0 ${
                  themeConfig.isDark
                    ? 'bg-slate-800/80 border border-slate-700/80 shadow-2xs'
                    : 'bg-amber-100/50 border border-amber-200/70 shadow-2xs'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onTabChange('tasks')}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'tasks'
                      ? themeConfig.isDark
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'bg-[#fffdfa] text-amber-950 shadow-[0_2px_6px_rgba(180,83,9,0.12)] border border-amber-200/70'
                      : themeConfig.isDark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-amber-800/70 hover:text-amber-950'
                  }`}
                >
                  <span>📋</span>
                  <span>{t.navbar.tasksTab}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold">
                    {counts.total}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onTabChange('notes')}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'notes'
                      ? themeConfig.isDark
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'bg-[#fffdfa] text-amber-950 shadow-[0_2px_6px_rgba(180,83,9,0.12)] border border-amber-200/70'
                      : themeConfig.isDark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-amber-800/70 hover:text-amber-950'
                  }`}
                >
                  <span>📝</span>
                  <span>{t.navbar.notesTab}</span>
                  {notesCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold">
                      {notesCount}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Counters & Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">

            {/* Pomodoro Timer Toggle */}
            {onOpenPomodoro && (
              <button
                type="button"
                onClick={onOpenPomodoro}
                className={`relative inline-flex items-center justify-center p-2 rounded-xl border transition-all duration-150 cursor-pointer active:scale-95 shrink-0 ${
                  isPlayful ? '-rotate-1 hover:rotate-0 hover:-translate-y-0.5 shadow-xs' : 'hover:-translate-y-0.5 shadow-2xs'
                } ${
                  themeConfig.isDark
                    ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-amber-300'
                    : isPlayful
                    ? 'bg-amber-100/85 hover:bg-amber-100 border-amber-300 text-amber-950'
                    : 'bg-amber-100/60 hover:bg-amber-100 border-amber-200/80 text-amber-900'
                }`}
                title={t.navbar.focusBtn}
              >
                {isPlayful && !themeConfig.isDark && (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-amber-200/90 border-y border-dashed border-amber-400/60 rounded-2xs pointer-events-none" />
                )}
                <Timer className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              </button>
            )}

            {/* Archive Modal Toggle */}
            {onOpenArchive && (
              <button
                type="button"
                onClick={onOpenArchive}
                className={`relative inline-flex items-center justify-center p-2 rounded-xl border transition-all duration-150 cursor-pointer active:scale-95 shrink-0 ${
                  isPlayful ? 'rotate-1 hover:rotate-0 hover:-translate-y-0.5 shadow-xs' : 'hover:-translate-y-0.5 shadow-2xs'
                } ${
                  themeConfig.isDark
                    ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-emerald-300'
                    : isPlayful
                    ? 'bg-emerald-100/85 hover:bg-emerald-100 border-emerald-300 text-emerald-950'
                    : 'bg-emerald-100/60 hover:bg-emerald-100 border-emerald-200/80 text-emerald-900'
                }`}
                title={`${t.navbar.archiveBtn} (${archivedCount})`}
              >
                {isPlayful && !themeConfig.isDark && (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-emerald-200/90 border-y border-dashed border-emerald-400/60 rounded-2xs pointer-events-none" />
                )}
                <Archive className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                {archivedCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-4 text-[9px] font-black rounded-full bg-emerald-500 text-white shadow-xs flex items-center justify-center">
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
                className={`relative inline-flex items-center justify-center p-2 rounded-xl border transition-all duration-150 cursor-pointer active:scale-95 shrink-0 ${
                  isPlayful ? '-rotate-1.5 hover:rotate-0 hover:-translate-y-0.5 shadow-xs' : 'hover:-translate-y-0.5 shadow-2xs'
                } ${
                  themeConfig.isDark
                    ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-rose-300'
                    : isPlayful
                    ? 'bg-rose-100/85 hover:bg-rose-100 border-rose-300 text-rose-950'
                    : 'bg-rose-100/60 hover:bg-rose-100 border-rose-200/80 text-rose-900'
                }`}
                title={t.navbar.galleryBtn}
              >
                {isPlayful && !themeConfig.isDark && (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-rose-200/90 border-y border-dashed border-rose-400/60 rounded-2xs pointer-events-none" />
                )}
                <Sparkles className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
              </button>
            )}

            {/* Language Switcher */}
            <LanguageSwitcher variant="compact" className="hidden sm:inline-flex" />

            {/* Personalization / Settings Button */}
            <button
              onClick={onOpenPersonalization}
              className={`relative inline-flex items-center justify-center p-2 rounded-xl border transition-all duration-150 cursor-pointer active:scale-95 shrink-0 ${
                isPlayful ? 'rotate-1 hover:rotate-0 hover:-translate-y-0.5 shadow-xs' : 'hover:-translate-y-0.5 shadow-2xs'
              } ${
                themeConfig.isDark
                  ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                  : isPlayful
                  ? 'bg-orange-100/80 hover:bg-orange-100 border-orange-300 text-orange-950'
                  : 'bg-orange-50 hover:bg-orange-100/70 border-orange-200/80 text-orange-950'
              }`}
              title={t.navbar.settingsBtn}
            >
              {isPlayful && !themeConfig.isDark && (
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-amber-200/90 border-y border-dashed border-amber-400/60 rounded-2xs pointer-events-none" />
              )}
              <Palette className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
            </button>

            {/* Sound Effects Toggle Button */}
            <button
              onClick={onToggleSound}
              className={`p-1.5 rounded-xl border transition-all duration-150 cursor-pointer shrink-0 ${
                isPlayful ? '-rotate-1 hover:rotate-0 hover:-translate-y-0.5 shadow-xs' : 'hover:-translate-y-0.5 shadow-2xs'
              } ${
                isSoundMuted
                  ? themeConfig.isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-600'
                    : 'bg-stone-100 border-stone-200 text-stone-400 hover:text-stone-600'
                  : themeConfig.isDark
                  ? 'bg-slate-800 border-slate-700 text-amber-400'
                  : 'bg-amber-100/60 border-amber-200/80 text-amber-900 hover:bg-amber-100'
              }`}
              title={
                isSoundMuted
                  ? t.navbar.soundMutedTitle
                  : t.navbar.soundActiveTitle
              }
            >
              {isSoundMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            {/* Google Authentication Button / Avatar */}
            <div className="shrink-0 relative z-50">
              <UserAuthButton />
            </div>

            {/* Add Task / Note Button */}
            <button
              onClick={activeTab === 'notes' ? (onOpenNewNote || onOpenNewTask) : onOpenNewTask}
              className={`relative inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl active:scale-95 text-xs sm:text-sm font-bold shadow-md transition-all duration-150 cursor-pointer shrink-0 whitespace-nowrap ${
                isPlayful
                  ? '-rotate-0.5 hover:rotate-0 hover:-translate-y-0.5 shadow-lg border-b-2 border-emerald-800'
                  : 'hover:-translate-y-0.5 shadow-md border-b-2 border-emerald-700'
              } ${themeConfig.primaryButton}`}
            >
              {isPlayful && !themeConfig.isDark && (
                <span className="absolute -top-1 left-2.5 w-4 h-1.5 bg-amber-200/90 border-y border-dashed border-amber-400/60 rounded-2xs pointer-events-none -rotate-6" />
              )}
              <Plus className="w-4 h-4 shrink-0 stroke-[2.5]" />
              <span className="hidden sm:inline">{activeTab === 'notes' ? t.navbar.addNoteBtn : t.navbar.addTaskBtn}</span>
              <span className="sm:hidden">{activeTab === 'notes' ? t.navbar.notesTab : t.navbar.tasksTab}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
