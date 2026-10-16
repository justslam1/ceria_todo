'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Pin, Trash2, Edit3, Sparkles, MoreHorizontal, X, ZoomIn, Sticker, BringToFront, SendToBack, Copy } from 'lucide-react';
import { NoteItem, NoteColor, NOTE_COLOR_STYLES } from '@/types/note';
import { ThemeConfig } from '@/types/preferences';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface NoteCardProps {
  note: NoteItem;
  themeConfig: ThemeConfig;
  onEdit: (note: NoteItem) => void;
  onDuplicate?: (note: NoteItem) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, currentPinned: boolean) => void;
  onChangeColor: (id: string, color: NoteColor) => void;
  onConvertToTask: (note: NoteItem) => void;
  onUpdateContent?: (id: string, newContent: string) => void;
  onToggleSticker?: (id: string, isSticker: boolean) => void;
  onUpdateOrder?: (id: string, direction: 'front' | 'back') => void;
  isCanvasMode?: boolean;
  onDragStart?: (e: React.PointerEvent) => void;
  isDragging?: boolean;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onDuplicate,
  onDelete,
  onTogglePin,
  onChangeColor,
  onConvertToTask,
  onUpdateContent,
  onToggleSticker,
  onUpdateOrder,
  isCanvasMode = false,
  onDragStart,
  isDragging = false,
}) => {
  const { language, t } = useLanguage();
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const style = NOTE_COLOR_STYLES[note.color] || NOTE_COLOR_STYLES.yellow;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  // Toggle checklist inside note content
  const handleToggleCheck = (lineIndex: number) => {
    if (!onUpdateContent) return;
    const lines = note.content.split('\n');
    if (lines[lineIndex] !== undefined) {
      const line = lines[lineIndex];
      if (line.startsWith('- [ ] ')) {
        lines[lineIndex] = line.replace('- [ ] ', '- [x] ');
      } else if (line.startsWith('- [x] ')) {
        lines[lineIndex] = line.replace('- [x] ', '- [ ] ');
      } else if (line.startsWith('[ ] ')) {
        lines[lineIndex] = line.replace('[ ] ', '[x] ');
      } else if (line.startsWith('[x] ')) {
        lines[lineIndex] = line.replace('[x] ', '[ ] ');
      }
      onUpdateContent(note.id, lines.join('\n'));
    }
  };

  const handleCardPointerDown = (e: React.PointerEvent) => {
    if (!isCanvasMode || !onDragStart) return;
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('a') ||
      target.closest('.group\\/chk') ||
      target.closest('.group\\/img')
    ) {
      return;
    }
    onDragStart(e);
  };

  const lines = note.content.split('\n');

  return (
    <div
      onPointerDown={handleCardPointerDown}
      className={`group relative rounded-2xl border p-4 sm:p-4.5 transition-all duration-150 flex flex-col justify-between ${
        isCanvasMode
          ? isDragging
            ? 'shadow-2xl scale-[1.03] cursor-grabbing ring-2 ring-amber-400/50'
            : 'shadow-md hover:shadow-xl cursor-grab'
          : 'shadow-sm hover:shadow-md'
      } ${style.bg} ${style.border}`}
      style={{
        minHeight: '180px',
        touchAction: isCanvasMode ? 'none' : 'auto',
      }}
    >
      {/* Decorative Washi Tape on top */}
      <div
        className={`absolute -top-2.5 left-1/2 -translate-x-1/2 w-20 h-4 rounded-xs border opacity-85 shadow-2xs rotate-[-1.5deg] pointer-events-none ${style.tapeColor}`}
      />

      {/* Header: Pin & Color Switcher */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex-1 min-w-0 pr-1">
          {note.title && (
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base leading-snug break-words">
              {note.title}
            </h3>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Bring to Front / Send to Back (Canvas mode only) */}
          {isCanvasMode && onUpdateOrder && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateOrder(note.id, 'front');
                }}
                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-colors cursor-pointer"
                title="Bawa ke Paling Depan (Layer Teratas) 🔼"
              >
                <BringToFront className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateOrder(note.id, 'back');
                }}
                className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-xl transition-colors cursor-pointer"
                title="Kirim ke Paling Belakang (Layer Terbawah) 🔽"
              >
                <SendToBack className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* Pin Button */}
          <button
            type="button"
            onClick={() => onTogglePin(note.id, note.isPinned)}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              note.isPinned
                ? 'bg-amber-400 text-amber-950 shadow-xs scale-105'
                : 'text-slate-400 hover:text-slate-600 hover:bg-black/5 dark:hover:bg-white/10'
            }`}
            title={note.isPinned ? 'Lepas sematan' : 'Sematkan ke paling atas'}
          >
            <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
          </button>

          {/* Color Menu Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColorMenu((prev) => !prev)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Ganti warna memo"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {showColorMenu && (
              <div
                className="absolute right-0 top-full mt-1 z-30 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
                onMouseLeave={() => setShowColorMenu(false)}
              >
                {(['yellow', 'pink', 'blue', 'green', 'purple', 'cream'] as NoteColor[]).map((c) => {
                  const s = NOTE_COLOR_STYLES[c];
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        onChangeColor(note.id, c);
                        setShowColorMenu(false);
                      }}
                      className={`w-5 h-5 rounded-full border border-black/10 transition-transform hover:scale-125 cursor-pointer ${s.bg} ${
                        note.color === c ? 'ring-2 ring-amber-500 scale-110' : ''
                      }`}
                      title={`Warna ${c}`}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attached Image Thumbnail */}
      {note.imageUrl && (
        <div
          className="mb-3 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 relative group/img cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setShowLightbox(true);
          }}
          title="Klik untuk memperbesar gambar"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={note.imageUrl}
            alt={note.title || 'Gambar Catatan'}
            className="w-full max-h-48 object-cover group-hover:scale-[1.02] transition-transform duration-200"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="text-[11px] font-semibold text-white bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-xs shadow-xs flex items-center gap-1">
              <ZoomIn className="w-3 h-3" />
              Perbesar
            </span>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 text-xs sm:text-sm text-slate-700 dark:text-slate-200 space-y-1 mb-3.5 whitespace-pre-wrap break-words leading-relaxed select-text">
        {lines.map((line, idx) => {
          const isCheckUnchecked = line.startsWith('- [ ] ') || line.startsWith('[ ] ');
          const isCheckChecked = line.startsWith('- [x] ') || line.startsWith('[x] ');

          if (isCheckUnchecked || isCheckChecked) {
            const cleanText = line.replace(/^(- \[([ x])\]|\[([ x])\])\s*/, '');
            return (
              <div
                key={idx}
                onClick={() => handleToggleCheck(idx)}
                className="flex items-start gap-2 cursor-pointer group/chk hover:opacity-85 select-none"
              >
                <input
                  type="checkbox"
                  checked={isCheckChecked}
                  onChange={() => {}}
                  className="mt-0.5 w-3.5 h-3.5 rounded accent-amber-500 cursor-pointer shrink-0"
                />
                <span
                  className={`text-xs ${
                    isCheckChecked
                      ? 'line-through text-slate-400 dark:text-slate-500 opacity-75'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {cleanText}
                </span>
              </div>
            );
          }

          if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
            const cleanText = line.replace(/^[•\-\*]\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                <span>{cleanText}</span>
              </div>
            );
          }

          return (
            <p key={idx} className="min-h-[1rem]">
              {line}
            </p>
          );
        })}
      </div>

      {/* Footer: Date & Actions */}
      <div className="pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-1 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="truncate">{formatDate(note.updatedAt || note.createdAt)}</span>

        <div className="flex items-center gap-1 shrink-0">
          {/* Convert to Kanban Task */}
          <button
            type="button"
            onClick={() => onConvertToTask(note)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500 hover:text-white text-amber-800 dark:text-amber-200 dark:hover:text-white font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs text-[10px]"
          >
            <Sparkles className="w-3 h-3 text-amber-500 group-hover:text-white" />
            <span className="hidden sm:inline">{t.notesBoard.convertToTaskBtn}</span>
          </button>

          {/* Convert to Sticker (Lepas Kotak) */}
          {note.imageUrl && onToggleSticker && (
            <button
              type="button"
              onClick={() => onToggleSticker(note.id, true)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 hover:text-purple-600 dark:text-slate-300 dark:hover:text-purple-400 transition-colors cursor-pointer"
            >
              <Sticker className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Duplicate Note */}
          {onDuplicate && (
            <button
              type="button"
              onClick={() => onDuplicate(note)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              title={t.notesBoard.duplicateNoteBtn}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Edit Note */}
          <button
            type="button"
            onClick={() => onEdit(note)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-300 transition-colors cursor-pointer"
            title={t.common.edit}
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          {/* Delete Note */}
          <button
            type="button"
            onClick={() => onDelete(note.id)}
            className="p-1 rounded-lg hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-slate-400 dark:text-slate-400 transition-colors cursor-pointer"
            title={t.common.delete}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Lightbox / Preview Fullscreen Modal */}
      {showLightbox && note.imageUrl && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            e.stopPropagation();
            setShowLightbox(false);
          }}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowLightbox(false)}
              className="absolute -top-11 right-0 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer shadow-md"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={note.imageUrl}
              alt={note.title || 'Preview Gambar'}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/20 select-none"
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
