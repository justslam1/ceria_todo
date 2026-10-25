'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Edit2, Trash2, Check, Columns3, StickyNote } from 'lucide-react';
import { Board } from '@/types/board';
import { ThemeConfig } from '@/types/preferences';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface BoardSelectorProps {
  boards: Board[];
  activeBoard: Board | null;
  onSelectBoard: (board: Board) => void;
  onOpenCreateBoard: () => void;
  onEditBoard: (board: Board) => void;
  onDeleteBoard: (board: Board) => void;
  themeConfig: ThemeConfig;
}

export const BoardSelector: React.FC<BoardSelectorProps> = ({
  boards,
  activeBoard,
  onSelectBoard,
  onOpenCreateBoard,
  onEditBoard,
  onDeleteBoard,
  themeConfig,
}) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const taskBoards = boards.filter((b) => b.type === 'TASK');
  const noteBoards = boards.filter((b) => b.type === 'NOTE');

  const currentIcon = activeBoard?.icon || (activeBoard?.type === 'NOTE' ? '📖' : '📋');
  const currentTitle = activeBoard?.title || t.boards.selectBoard;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button Pill */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs sm:text-sm font-black transition-all cursor-pointer active:scale-95 shadow-2xs group ${
          themeConfig.isDark
            ? 'bg-slate-800/90 border-slate-700/80 text-white hover:bg-slate-800 hover:border-amber-500/50'
            : 'bg-white/95 border-amber-200/90 text-amber-950 hover:bg-amber-50/60 hover:border-amber-400/80 shadow-[0_2px_8px_rgba(180,83,9,0.06)]'
        }`}
        title={t.boards.selectBoard}
      >
        <span className="text-base select-none shrink-0 group-hover:scale-110 transition-transform">
          {currentIcon}
        </span>
        <span className="max-w-[100px] sm:max-w-[125px] md:max-w-[145px] lg:max-w-[180px] xl:max-w-[210px] truncate text-left">
          {currentTitle}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-amber-500 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 sm:w-80 rounded-3xl border shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md ${
            themeConfig.isDark
              ? 'bg-slate-900/95 border-slate-700 text-white'
              : 'bg-white/95 border-slate-200 text-slate-800'
          }`}
        >
          <div className="max-h-[70vh] overflow-y-auto space-y-3 p-1">
            {/* Task Boards Group */}
            <div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <Columns3 className="w-3.5 h-3.5 text-amber-500" />
                <span>{t.boards.taskBoardsHeader}</span>
              </div>
              <div className="space-y-0.5 mt-1">
                {taskBoards.map((board) => {
                  const isSelected = activeBoard?.id === board.id;
                  return (
                    <div
                      key={board.id}
                      onClick={() => {
                        onSelectBoard(board);
                        setIsOpen(false);
                      }}
                      className={`group flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                        isSelected
                          ? themeConfig.isDark
                            ? 'bg-slate-800 text-amber-400 font-bold'
                            : 'bg-amber-100/70 text-amber-950 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                        <span className="text-base select-none shrink-0">{board.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-xs truncate">{board.title}</span>
                            {board.isDefault && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 shrink-0">
                                {t.boards.defaultBadge}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            {board.tasksCount ?? 0} {t.boards.tasksSuffix}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isSelected && <Check className="w-4 h-4 text-amber-500 font-bold mr-1" />}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditBoard(board);
                            setIsOpen(false);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-60 group-hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
                          title={t.common.edit}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        {!board.isDefault && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteBoard(board);
                              setIsOpen(false);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 opacity-60 group-hover:opacity-100 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                            title={t.common.delete}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Note Boards Group */}
            <div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                <StickyNote className="w-3.5 h-3.5 text-purple-500" />
                <span>{t.boards.noteBoardsHeader}</span>
              </div>
              <div className="space-y-0.5 mt-1">
                {noteBoards.map((board) => {
                  const isSelected = activeBoard?.id === board.id;
                  return (
                    <div
                      key={board.id}
                      onClick={() => {
                        onSelectBoard(board);
                        setIsOpen(false);
                      }}
                      className={`group flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                        isSelected
                          ? themeConfig.isDark
                            ? 'bg-slate-800 text-purple-400 font-bold'
                            : 'bg-purple-100/70 text-purple-950 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                        <span className="text-base select-none shrink-0">{board.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-xs truncate">{board.title}</span>
                            {board.isDefault && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 shrink-0">
                                {t.boards.defaultBadge}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            {board.notesCount ?? 0} {t.boards.notesSuffix}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isSelected && <Check className="w-4 h-4 text-purple-500 font-bold mr-1" />}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditBoard(board);
                            setIsOpen(false);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-60 group-hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
                          title={t.common.edit}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        {!board.isDefault && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteBoard(board);
                              setIsOpen(false);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 opacity-60 group-hover:opacity-100 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                            title={t.common.delete}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Add Board Button */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                onOpenCreateBoard();
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>{t.boards.addNewBoard}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
