'use client';

import React, { useState } from 'react';
import { Pin, Trash2, Edit3, Sparkles, MoreHorizontal } from 'lucide-react';
import { NoteItem, NoteColor, NOTE_COLOR_STYLES } from '@/types/note';
import { ThemeConfig } from '@/types/preferences';

interface NoteCardProps {
  note: NoteItem;
  themeConfig: ThemeConfig;
  onEdit: (note: NoteItem) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, currentPinned: boolean) => void;
  onChangeColor: (id: string, color: NoteColor) => void;
  onConvertToTask: (note: NoteItem) => void;
  onUpdateContent?: (id: string, newContent: string) => void;
  isCanvasMode?: boolean;
  onDragStart?: (e: React.PointerEvent) => void;
  isDragging?: boolean;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  onChangeColor,
  onConvertToTask,
  onUpdateContent,
  isCanvasMode = false,
  onDragStart,
  isDragging = false,
}) => {
  const [showColorMenu, setShowColorMenu] = useState(false);
  const style = NOTE_COLOR_STYLES[note.color] || NOTE_COLOR_STYLES.yellow;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
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
      target.closest('.group\\/chk')
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
            title="Ubah memo ini menjadi tugas di Papan Kanban 🚀"
          >
            <Sparkles className="w-3 h-3 text-amber-500 group-hover:text-white" />
            <span className="hidden sm:inline">Jadikan Tugas</span>
          </button>

          {/* Edit Note */}
          <button
            type="button"
            onClick={() => onEdit(note)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-300 transition-colors cursor-pointer"
            title="Edit Catatan"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          {/* Delete Note */}
          <button
            type="button"
            onClick={() => onDelete(note.id)}
            className="p-1 rounded-lg hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-slate-400 dark:text-slate-400 transition-colors cursor-pointer"
            title="Hapus Catatan"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
