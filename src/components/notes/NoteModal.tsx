'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Pin, Sparkles, CheckSquare, List, Palette, Check } from 'lucide-react';
import { NoteItem, NoteColor, NOTE_COLOR_STYLES } from '@/types/note';
import { ThemeConfig } from '@/types/preferences';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteData: { title: string; content: string; color: NoteColor; isPinned: boolean }) => void;
  initialNote?: NoteItem | null;
  onConvertToTask?: (note: NoteItem) => void;
  themeConfig: ThemeConfig;
}

const COLOR_OPTIONS: { key: NoteColor; name: string }[] = [
  { key: 'yellow', name: 'Kuning Lemon' },
  { key: 'pink', name: 'Pink Pastel' },
  { key: 'blue', name: 'Biru Langit' },
  { key: 'green', name: 'Hijau Mint' },
  { key: 'purple', name: 'Ungu Lilac' },
  { key: 'cream', name: 'Krem Vintage' },
];

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialNote,
  onConvertToTask,
  themeConfig,
}) => {
  const [title, setTitle] = useState(initialNote?.title || '');
  const [content, setContent] = useState(initialNote?.content || '');
  const [color, setColor] = useState<NoteColor>(initialNote?.color || 'yellow');
  const [isPinned, setIsPinned] = useState(Boolean(initialNote?.isPinned));
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;
    onSave({
      title: title.trim(),
      content: content.trim(),
      color,
      isPinned,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const insertPrefixAtCursor = (prefix: string) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = content.substring(0, start);
    const after = content.substring(end);

    const needsNewline = before.length > 0 && !before.endsWith('\n');
    const newText = before + (needsNewline ? '\n' : '') + prefix + after;

    setContent(newText);
    setTimeout(() => {
      el.focus();
      const newPos = start + (needsNewline ? 1 : 0) + prefix.length;
      el.setSelectionRange(newPos, newPos);
    }, 50);
  };

  const style = NOTE_COLOR_STYLES[color] || NOTE_COLOR_STYLES.yellow;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onKeyDown={handleKeyDown}
    >
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all duration-200 ${
          themeConfig.isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Top Decorative Header with active note color */}
        <div className={`p-4 border-b flex items-center justify-between ${style.headerBg} ${style.border}`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {initialNote ? 'Ubah Catatan' : 'Tulis Catatan Baru'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Note Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Judul Catatan
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Ide Fitur Baru, Daftar Belanja..."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-all outline-hidden ${
                themeConfig.isDark
                  ? 'bg-slate-800 border-slate-700 text-white focus:border-amber-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50'
              }`}
            />
          </div>

          {/* Quick Toolbar for content */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Isi Catatan
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => insertPrefixAtCursor('- [ ] ')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Sisipkan kotak centang"
              >
                <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
                <span>+ Checklist</span>
              </button>
              <button
                type="button"
                onClick={() => insertPrefixAtCursor('• ')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Sisipkan poin bulat"
              >
                <List className="w-3.5 h-3.5 text-blue-500" />
                <span>• Poin</span>
              </button>
            </div>
          </div>

          {/* Note Content Textarea */}
          <div>
            <textarea
              ref={textareaRef}
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tulis ide bebas, catatan harian, draft pesan, rangkuman, atau coretan apa saja di sini..."
              className={`w-full px-3.5 py-3 rounded-2xl border text-sm transition-all outline-hidden resize-y leading-relaxed font-normal ${
                themeConfig.isDark
                  ? 'bg-slate-800 border-slate-700 text-white focus:border-amber-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50'
              }`}
            />
            <p className="text-[11px] text-slate-400 mt-1 flex justify-between">
              <span>Tips: Tekan Ctrl+Enter untuk simpan cepat</span>
              <span>{content.length} karakter</span>
            </p>
          </div>

          {/* Color & Pin Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Color Palette */}
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1.5">
                <Palette className="w-3.5 h-3.5" />
                <span>Warna Memo:</span>
              </span>
              <div className="flex items-center gap-2">
                {COLOR_OPTIONS.map((c) => {
                  const s = NOTE_COLOR_STYLES[c.key];
                  const isSelected = color === c.key;
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setColor(c.key)}
                      className={`w-7 h-7 rounded-full border border-black/10 flex items-center justify-center transition-all cursor-pointer ${s.bg} ${
                        isSelected ? 'ring-2 ring-amber-500 ring-offset-2 scale-110 shadow-xs' : 'hover:scale-105'
                      }`}
                      title={c.name}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pin Toggle */}
            <label className="flex items-center gap-2 cursor-pointer self-start sm:self-center select-none">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Pin className="w-3.5 h-3.5 text-amber-500" />
                <span>Sematkan di Atas</span>
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              {initialNote && onConvertToTask && (
                <button
                  type="button"
                  onClick={() => {
                    onConvertToTask(initialNote);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500 text-amber-800 hover:text-white dark:text-amber-300 dark:hover:text-white transition-all cursor-pointer active:scale-95"
                  title="Jadikan tugas baru di Papan Kanban"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Jadikan Tugas</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!title.trim() && !content.trim()}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${themeConfig.primaryButton}`}
              >
                Simpan Catatan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
