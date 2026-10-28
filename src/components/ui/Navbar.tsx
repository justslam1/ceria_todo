import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Images, Plus, Volume2, VolumeX, Palette, Timer, Archive, Check, X, HelpCircle, Share2, MoreHorizontal } from 'lucide-react';
import { UserPreferences, ThemeConfig } from '@/types/preferences';
import { UserAuthButton } from '@/components/ui/UserAuthButton';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Board } from '@/types/board';
import { BoardSelector } from '@/components/boards/BoardSelector';
import { SystemAnnouncementBanner } from '@/components/ui/SystemAnnouncementBanner';
import { NotificationBell } from '@/components/notifications/NotificationBell';

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
  onOpenJoinBoard?: () => void;
  onOpenShareBoard?: (board: Board) => void;
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
  onOpenJoinBoard,
  onOpenShareBoard,
  onEditBoard,
  onDeleteBoard,
}) => {
  const [isEditingMotto, setIsEditingMotto] = useState(false);
  const [draftMotto, setDraftMotto] = useState('');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreMenuOpen]);

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
      <SystemAnnouncementBanner />
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5">
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
                  className={`text-xs font-medium truncate max-w-[180px] sm:max-w-xs md:max-w-[200px] lg:max-w-xs xl:max-w-md block cursor-pointer hover:text-amber-500 dark:hover:text-amber-400 transition-colors ${
                    themeConfig.isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {preferences.dailyMotto || 'Kelola tugas lebih ringan & menyenangkan! ✨'}
                </p>
              )}
            </div>
          </div>

          {/* Board Selector & View Mode Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2 self-center shrink-0 flex-wrap sm:flex-nowrap justify-center">
            {boards.length > 0 && onSelectBoard && onOpenCreateBoard && (
              <BoardSelector
                boards={boards}
                activeBoard={activeBoard}
                onSelectBoard={onSelectBoard}
                onOpenCreateBoard={onOpenCreateBoard}
                onOpenJoinBoard={onOpenJoinBoard}
                onOpenShareBoard={onOpenShareBoard}
                onEditBoard={onEditBoard || (() => {})}
                onDeleteBoard={onDeleteBoard || (() => {})}
                themeConfig={themeConfig}
              />
            )}

            {/* Quick Share Pill */}
            {activeBoard && onOpenShareBoard && (
              <button
                type="button"
                onClick={() => onOpenShareBoard(activeBoard)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs ${
                  themeConfig.isDark
                    ? 'bg-slate-800/90 border-slate-700/80 text-slate-200 hover:text-amber-400 hover:border-amber-500/50'
                    : 'bg-white/95 border-amber-200/90 text-amber-950 hover:bg-amber-50/60 hover:border-amber-400/80'
                }`}
                title="Bagikan papan ini"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden 2xl:inline">Bagikan</span>
              </button>
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
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">

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

            {/* In-App Notification Bell */}
            <NotificationBell themeConfig={themeConfig} isPlayful={isPlayful} />

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

            {/* More Utilities Dropdown (Showcase, Guide, Sound, Language) */}
            <div className="relative shrink-0" ref={moreMenuRef}>
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                className={`relative inline-flex items-center justify-center p-2 rounded-xl border transition-all duration-150 cursor-pointer active:scale-95 shrink-0 ${
                  isMoreMenuOpen
                    ? themeConfig.isDark
                      ? 'bg-slate-700 border-amber-400/70 text-amber-300'
                      : 'bg-amber-200/80 border-amber-400 text-amber-950'
                    : isPlayful
                    ? '-rotate-1 hover:rotate-0 hover:-translate-y-0.5 shadow-xs'
                    : 'hover:-translate-y-0.5 shadow-2xs'
                } ${
                  themeConfig.isDark
                    ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                    : isPlayful
                    ? 'bg-amber-100/70 hover:bg-amber-100 border-amber-300/80 text-amber-950'
                    : 'bg-stone-100/80 hover:bg-stone-200/70 border-stone-200/80 text-stone-700'
                }`}
                title={t.common.all || 'Menu Lainnya'}
                aria-expanded={isMoreMenuOpen}
              >
                <MoreHorizontal className="w-4 h-4 shrink-0" />
              </button>

              {isMoreMenuOpen && (
                <div
                  className={`absolute right-0 top-full mt-2 w-56 p-1.5 rounded-2xl border shadow-xl z-50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 ${
                    themeConfig.isDark
                      ? 'bg-slate-900/95 border-slate-700 text-slate-200 shadow-black/40'
                      : 'bg-white/95 border-amber-200/90 text-amber-950 shadow-amber-900/10'
                  }`}
                >
                  {/* Quick Guide */}
                  <Link
                    href="/guide"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      themeConfig.isDark
                        ? 'hover:bg-slate-800 text-slate-200 hover:text-white'
                        : 'hover:bg-amber-50 text-slate-700 hover:text-amber-950'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>{t.navbar.guideBtn || 'Quick Guide'}</span>
                  </Link>

                  {/* Community Board Showcase */}
                  {onOpenShowcase && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        onOpenShowcase();
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
                        themeConfig.isDark
                          ? 'hover:bg-slate-800 text-slate-200 hover:text-white'
                          : 'hover:bg-amber-50 text-slate-700 hover:text-amber-950'
                      }`}
                    >
                      <Images className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{t.navbar.galleryBtn || 'Galeri Showcase'}</span>
                    </button>
                  )}

                  {/* Sound Effects Toggle */}
                  <button
                    type="button"
                    onClick={onToggleSound}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
                      themeConfig.isDark
                        ? 'hover:bg-slate-800 text-slate-200 hover:text-white'
                        : 'hover:bg-amber-50 text-slate-700 hover:text-amber-950'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isSoundMuted ? (
                        <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <span>Efek Suara</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSoundMuted
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {isSoundMuted ? 'Muted' : 'ON'}
                    </span>
                  </button>

                  <div className="my-1 border-t border-amber-100 dark:border-slate-800" />

                  {/* Language Switcher */}
                  <div className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className="text-sm">🌐</span>
                      <span>{t.common.language || 'Bahasa'}</span>
                    </span>
                    <LanguageSwitcher variant="badge" />
                  </div>
                </div>
              )}
            </div>

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
