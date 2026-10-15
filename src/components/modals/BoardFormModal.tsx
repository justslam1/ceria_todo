'use client';

import React, { useState } from 'react';
import { X, Check, Columns3, StickyNote } from 'lucide-react';
import { Board, BoardType, CreateBoardInput, UpdateBoardInput } from '@/types/board';
import { ThemeConfig } from '@/types/preferences';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface BoardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateBoardInput | UpdateBoardInput, boardId?: string) => Promise<void>;
  boardToEdit?: Board | null;
  themeConfig?: ThemeConfig;
  initialType?: BoardType;
}

const ICON_PRESETS = ['📋', '🚀', '💼', '🎓', '🏠', '🎯', '💡', '📖', '🎨', '🧠', '☕', '⭐'];

const COLOR_PRESETS = [
  { id: 'amber', name: 'Amber / Oranye', bg: 'bg-amber-500', ring: 'ring-amber-500' },
  { id: 'emerald', name: 'Emerald / Hijau', bg: 'bg-emerald-500', ring: 'ring-emerald-500' },
  { id: 'sky', name: 'Sky / Biru', bg: 'bg-sky-500', ring: 'ring-sky-500' },
  { id: 'purple', name: 'Purple / Ungu', bg: 'bg-purple-500', ring: 'ring-purple-500' },
  { id: 'rose', name: 'Rose / Merah Muda', bg: 'bg-rose-500', ring: 'ring-rose-500' },
  { id: 'indigo', name: 'Indigo / Biru Gelap', bg: 'bg-indigo-500', ring: 'ring-indigo-500' },
];

export const BoardFormModal: React.FC<BoardFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  boardToEdit,
  themeConfig = { isDark: false } as ThemeConfig,
  initialType = 'TASK',
}) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<BoardType>(initialType);
  const [icon, setIcon] = useState('📋');
  const [color, setColor] = useState('amber');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [prevBoardToEdit, setPrevBoardToEdit] = useState<Board | null | undefined>(boardToEdit);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (boardToEdit !== prevBoardToEdit || isOpen !== prevIsOpen) {
    setPrevBoardToEdit(boardToEdit);
    setPrevIsOpen(isOpen);

    if (boardToEdit) {
      setTitle(boardToEdit.title);
      setType(boardToEdit.type);
      setIcon(boardToEdit.icon || (boardToEdit.type === 'TASK' ? '📋' : '📖'));
      setColor(boardToEdit.color || 'amber');
    } else {
      setTitle('');
      setType(initialType);
      setIcon(initialType === 'TASK' ? '📋' : '📖');
      setColor('amber');
    }
    setErrorMsg(null);
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMsg(t.boards.boardTitlePlaceholder);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      if (boardToEdit) {
        await onSave({ title: cleanTitle, icon, color }, boardToEdit.id);
      } else {
        await onSave({ title: cleanTitle, type, icon, color });
      }
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden transition-all duration-200 flex flex-col ${
          themeConfig.isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-50/50 to-orange-50/30 dark:from-slate-800 dark:to-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {boardToEdit ? t.boards.editBoardModalTitle : t.boards.newBoardModalTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Board Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
              {t.boards.boardTitleLabel} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.boards.boardTitlePlaceholder}
              autoFocus
              maxLength={80}
              className={`w-full px-3.5 py-2.5 rounded-2xl border text-sm font-semibold transition-all outline-hidden ${
                themeConfig.isDark
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50'
              }`}
            />
          </div>

          {/* Board Type Selection (disabled when editing existing board) */}
          {!boardToEdit && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                {t.boards.boardTypeLabel}
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {/* Task Board Card */}
                <div
                  onClick={() => {
                    setType('TASK');
                    if (icon === '📖') setIcon('📋');
                  }}
                  className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-1 ${
                    type === 'TASK'
                      ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800/50 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Columns3 className="w-5 h-5 text-amber-500" />
                    {type === 'TASK' && <Check className="w-4 h-4 text-amber-600 font-bold" />}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                    {t.boards.taskBoardTypeTitle}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {t.boards.taskBoardTypeDesc}
                  </p>
                </div>

                {/* Note Board Card */}
                <div
                  onClick={() => {
                    setType('NOTE');
                    if (icon === '📋') setIcon('📖');
                  }}
                  className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-1 ${
                    type === 'NOTE'
                      ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800/50 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <StickyNote className="w-5 h-5 text-amber-500" />
                    {type === 'NOTE' && <Check className="w-4 h-4 text-amber-600 font-bold" />}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                    {t.boards.noteBoardTypeTitle}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {t.boards.noteBoardTypeDesc}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Icon Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
              {t.boards.iconLabel}
            </label>
            <div className="grid grid-cols-6 gap-1.5 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
              {ICON_PRESETS.map((ic) => (
                <button
                  type="button"
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-transform cursor-pointer ${
                    icon === ic
                      ? 'bg-amber-100 dark:bg-amber-900/60 ring-2 ring-amber-500 scale-110 shadow-xs'
                      : 'hover:bg-slate-200 dark:hover:bg-slate-700/60 hover:scale-105'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
              {t.boards.colorLabel}
            </label>
            <div className="flex items-center gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setColor(c.id)}
                  className={`w-7 h-7 rounded-full ${c.bg} transition-all cursor-pointer flex items-center justify-center ${
                    color === c.id
                      ? `ring-2 ${c.ring} ring-offset-2 dark:ring-offset-slate-900 scale-115 shadow-sm`
                      : 'hover:scale-105 opacity-85 hover:opacity-100'
                  }`}
                  title={c.name}
                >
                  {color === c.id && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                themeConfig.isDark
                  ? 'text-slate-200 hover:text-white hover:bg-slate-800'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${themeConfig.primaryButton}`}
            >
              {isSubmitting
                ? t.taskModal.savingBtn
                : boardToEdit
                ? t.boards.updateBtn
                : t.boards.createBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
