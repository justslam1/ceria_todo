'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Search, Plus, Pin, RefreshCw, BookOpen, Filter, X, LayoutGrid, Wand2, Move } from 'lucide-react';
import { NoteItem, NoteColor, NOTE_COLOR_STYLES } from '@/types/note';
import { ThemeConfig, UserPreferences } from '@/types/preferences';
import { NoteCard } from '@/components/notes/NoteCard';
import { NoteModal } from '@/components/notes/NoteModal';
import { playPopSound } from '@/lib/soundEffects';

interface NotesBoardProps {
  notes: NoteItem[];
  isLoading: boolean;
  themeConfig: ThemeConfig;
  preferences?: UserPreferences;
  onCreateNote: (data: { title: string; content: string; color: NoteColor; isPinned: boolean; posX?: number; posY?: number }) => Promise<void>;
  onUpdateNote: (id: string, data: Partial<NoteItem>) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
  onConvertToTask: (note: NoteItem) => void;
  onRefreshNotes: () => void;
  isModalOpen?: boolean;
  onOpenCreateModal?: () => void;
  onCloseModal?: () => void;
  editingNote?: NoteItem | null;
  onSelectEditingNote?: (note: NoteItem | null) => void;
}

export const NotesBoard: React.FC<NotesBoardProps> = ({
  notes,
  isLoading,
  themeConfig,
  preferences,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onConvertToTask,
  onRefreshNotes,
  isModalOpen,
  onOpenCreateModal,
  onCloseModal,
  editingNote,
  onSelectEditingNote,
}) => {
  const [layoutMode, setLayoutMode] = useState<'canvas' | 'grid'>('canvas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<'all' | NoteColor>('all');
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const [internalEditingNote, setInternalEditingNote] = useState<NoteItem | null>(null);

  // Free-form Dragging State
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [livePositions, setLivePositions] = useState<Record<string, { x: number; y: number }>>({});
  const canvasRef = useRef<HTMLDivElement>(null);


  const activeModalOpen = isModalOpen !== undefined ? isModalOpen : internalModalOpen;
  const activeEditingNote = editingNote !== undefined ? editingNote : internalEditingNote;

  // Filter notes
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchSearch =
        !searchQuery ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchColor = selectedColor === 'all' || n.color === selectedColor;
      return matchSearch && matchColor;
    });
  }, [notes, searchQuery, selectedColor]);

  // Separate pinned and unpinned notes for Grid view
  const { pinnedNotes, otherNotes } = useMemo(() => {
    const pinned: NoteItem[] = [];
    const other: NoteItem[] = [];
    filteredNotes.forEach((n) => {
      if (n.isPinned) {
        pinned.push(n);
      } else {
        other.push(n);
      }
    });
    return { pinnedNotes: pinned, otherNotes: other };
  }, [filteredNotes]);

  // Compute position for canvas mode
  const getNotePosition = useCallback(
    (note: NoteItem, index: number) => {
      if (livePositions[note.id]) {
        return livePositions[note.id];
      }
      if (typeof note.posX === 'number' && typeof note.posY === 'number') {
        return { x: note.posX, y: note.posY };
      }
      // Default staggered grid layout on canvas
      const colWidth = 320;
      const rowHeight = 280;
      const cols = 3;
      const col = index % cols;
      const row = Math.floor(index / cols);
      return {
        x: 24 + col * (colWidth + 24),
        y: 24 + row * rowHeight,
      };
    },
    [livePositions]
  );

  // Dynamic canvas height to fit all moved notes
  const canvasHeight = useMemo(() => {
    if (filteredNotes.length === 0) return 480;
    let maxY = 450;
    filteredNotes.forEach((n, idx) => {
      const pos = getNotePosition(n, idx);
      if (pos.y + 360 > maxY) {
        maxY = pos.y + 360;
      }
    });
    return Math.max(650, maxY + 40);
  }, [filteredNotes, getNotePosition]);

  // Robust window-level drag handler
  const handleStartDrag = useCallback(
    (e: React.PointerEvent, note: NoteItem, currentX: number, currentY: number) => {
      if (layoutMode !== 'canvas' || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      const noteId = note.id;
      const startClientX = e.clientX;
      const startClientY = e.clientY;
      let lastX = currentX;
      let lastY = currentY;
      let hasMoved = false;

      setDraggingId(noteId);

      const onPointerMove = (moveEvent: PointerEvent) => {
        const dx = moveEvent.clientX - startClientX;
        const dy = moveEvent.clientY - startClientY;

        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          hasMoved = true;
        }

        const canvasWidth = canvasRef.current?.clientWidth || 1100;
        const newX = Math.max(12, Math.min(canvasWidth - 324, currentX + dx));
        const newY = Math.max(12, currentY + dy);

        lastX = newX;
        lastY = newY;

        setLivePositions((prev) => ({
          ...prev,
          [noteId]: { x: newX, y: newY },
        }));
      };

      const onPointerUp = () => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);

        setDraggingId(null);

        if (hasMoved) {
          playPopSound(preferences?.soundProfile || 'pop');
          onUpdateNote(noteId, { posX: Math.round(lastX), posY: Math.round(lastY) });
        }
      };

      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    },
    [layoutMode, preferences?.soundProfile, onUpdateNote]
  );

  // Auto-arrange all notes in canvas mode into neat rows
  const handleAutoArrange = () => {
    playPopSound(preferences?.soundProfile || 'pop');
    const canvasWidth = canvasRef.current?.clientWidth || 1100;
    const colWidth = 320;
    const cols = Math.max(1, Math.min(4, Math.floor((canvasWidth - 24) / (colWidth + 24))));
    const newPosMap: Record<string, { x: number; y: number }> = {};

    filteredNotes.forEach((n, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = 24 + col * (colWidth + 24);
      const y = 24 + row * 290;
      newPosMap[n.id] = { x, y };
      onUpdateNote(n.id, { posX: x, posY: y });
    });

    setLivePositions((prev) => ({ ...prev, ...newPosMap }));
  };

  const handleOpenCreateModal = () => {
    if (onOpenCreateModal) {
      onOpenCreateModal();
    } else {
      setInternalEditingNote(null);
      setInternalModalOpen(true);
    }
  };

  const handleOpenEditModal = (note: NoteItem) => {
    if (onSelectEditingNote) {
      onSelectEditingNote(note);
    } else {
      setInternalEditingNote(note);
      setInternalModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    if (onCloseModal) {
      onCloseModal();
    } else {
      setInternalModalOpen(false);
      setInternalEditingNote(null);
    }
  };

  const handleSaveModal = async (data: { title: string; content: string; color: NoteColor; isPinned: boolean }) => {
    if (activeEditingNote) {
      await onUpdateNote(activeEditingNote.id, data);
    } else {
      // Determine initial placement for new note on canvas
      const canvasWidth = canvasRef.current?.clientWidth || 1100;
      const colWidth = 320;
      const cols = Math.max(1, Math.min(3, Math.floor((canvasWidth - 48) / colWidth)));
      const idx = filteredNotes.length;
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const posX = 24 + col * (colWidth + 24);
      const posY = 24 + row * 290;

      await onCreateNote({ ...data, posX, posY });
    }
    handleCloseModal();
  };

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    await onUpdateNote(id, { isPinned: !currentPinned });
  };

  const handleChangeColor = async (id: string, color: NoteColor) => {
    await onUpdateNote(id, { color });
  };

  const handleUpdateContent = async (id: string, newContent: string) => {
    await onUpdateNote(id, { content: newContent });
  };

  const handleDeleteWithConfirm = async (id: string) => {
    if (window.confirm('Hapus catatan ini? Catatan yang dihapus tidak dapat dikembalikan.')) {
      await onDeleteNote(id);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
      {/* Top Banner & Action Controls */}
      <div
        className={`rounded-3xl border p-4 sm:p-5 shadow-xs backdrop-blur-md transition-colors ${
          themeConfig.isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200/80'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          {/* Title & Stats */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
                  Papan Catatan Bebas
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-700/60">
                  {notes.length} Catatan
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {layoutMode === 'canvas'
                  ? 'Tahan dan geser memo ke mana saja secara bebas di atas meja! 📌✨'
                  : 'Tulis ide bebas, daftar belanja, draft, atau rangkuman. Bisa diubah jadi tugas kapan saja! ✨'}
              </p>
            </div>
          </div>

          {/* Action Tools: Layout Switcher, Auto-arrange, Search, Add */}
          <div className="flex items-center flex-wrap gap-2">
            {/* View Mode Toggle: Kanvas Bebas ↔ Grid Rapi */}
            <div
              className={`flex items-center p-0.5 rounded-xl border text-xs ${
                themeConfig.isDark
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                  : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  playPopSound(preferences?.soundProfile || 'pop');
                  setLayoutMode('canvas');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  layoutMode === 'canvas'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Mode Kanvas Bebas (Bisa digeser ke mana saja)"
              >
                <Move className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kanvas Bebas</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playPopSound(preferences?.soundProfile || 'pop');
                  setLayoutMode('grid');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  layoutMode === 'grid'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Mode Grid Rapi"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid Rapi</span>
              </button>
            </div>

            {/* Auto-arrange button (visible on canvas mode) */}
            {layoutMode === 'canvas' && filteredNotes.length > 0 && (
              <button
                type="button"
                onClick={handleAutoArrange}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs ${
                  themeConfig.isDark
                    ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
                    : 'bg-white border-slate-200 text-amber-700 hover:bg-amber-50'
                }`}
                title="Tata ulang semua memo secara rapi & berbaris"
              >
                <Wand2 className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden md:inline">Rapikan Posisi</span>
              </button>
            )}

            {/* Search Input */}
            <div className="relative flex-1 sm:w-48 min-w-[130px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari catatan..."
                style={{ color: themeConfig.isDark ? '#ffffff' : '#0f172a' }}
                className={`w-full pl-9 pr-7 py-1.5 rounded-xl border text-xs transition-all outline-hidden ${
                  themeConfig.isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-amber-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-amber-500'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={onRefreshNotes}
              disabled={isLoading}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                themeConfig.isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              } ${isLoading ? 'opacity-50 animate-spin' : ''}`}
              title="Muat ulang catatan"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Add Note Button */}
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer whitespace-nowrap ${themeConfig.primaryButton}`}
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Catatan</span>
            </button>
          </div>
        </div>

        {/* Color Palette Filter Bar */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" />
            <span>Warna:</span>
          </span>

          <button
            type="button"
            onClick={() => setSelectedColor('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              selectedColor === 'all'
                ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Semua ({notes.length})
          </button>

          {(['yellow', 'pink', 'blue', 'green', 'purple', 'cream'] as NoteColor[]).map((c) => {
            const count = notes.filter((n) => n.color === c).length;
            if (count === 0 && selectedColor !== c) return null;
            const style = NOTE_COLOR_STYLES[c];
            return (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedColor(selectedColor === c ? 'all' : c)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                  style.bg
                } ${style.border} ${
                  selectedColor === c ? 'ring-2 ring-amber-500 font-bold scale-105' : 'opacity-80 hover:opacity-100'
                }`}
              >
                <span className="capitalize">{c}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main View Area */}
      {filteredNotes.length === 0 ? (
        <div
          className={`text-center py-16 px-4 rounded-3xl border border-dashed flex flex-col items-center justify-center ${
            themeConfig.isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-200 bg-white/40'
          }`}
        >
          <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-3xl mb-3 shadow-inner">
            📝
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
            {searchQuery || selectedColor !== 'all'
              ? 'Tidak ada catatan yang cocok'
              : 'Belum ada catatan di papan'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
            {searchQuery || selectedColor !== 'all'
              ? 'Coba ubah kata kunci pencarian atau bersihkan filter warna.'
              : 'Tulis ide, coretan, memo, atau daftar apa saja dengan bebas di sini.'}
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer ${themeConfig.primaryButton}`}
          >
            <Plus className="w-4 h-4" />
            <span>Tulis Catatan Pertamamu</span>
          </button>
        </div>
      ) : layoutMode === 'canvas' ? (
        /* ================= MODE KANVAS BEBAS ================= */
        <div
          ref={canvasRef}
          className={`relative w-full rounded-3xl border transition-colors duration-200 select-none overflow-x-auto overflow-y-hidden shadow-inner ${
            themeConfig.isDark
              ? 'bg-[#14161f]/50 border-slate-800/80'
              : 'bg-amber-50/25 border-slate-200/80'
          }`}
          style={{
            minHeight: `${canvasHeight}px`,
            cursor: draggingId ? 'grabbing' : 'default',
            backgroundImage: themeConfig.isDark
              ? 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 1.5px, transparent 1.5px)'
              : 'radial-gradient(circle, rgba(0, 0, 0, 0.07) 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px',
          }}
        >
          {filteredNotes.map((note, index) => {
            const pos = getNotePosition(note, index);
            const isDragging = draggingId === note.id;

            return (
              <div
                key={note.id}
                style={{
                  position: 'absolute',
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  width: '310px',
                  zIndex: isDragging ? 50 : note.isPinned ? 30 : 20,
                  pointerEvents: draggingId && !isDragging ? 'none' : 'auto',
                  transition: isDragging ? 'none' : 'box-shadow 0.2s ease, transform 0.2s ease',
                }}
              >
                <NoteCard
                  note={note}
                  themeConfig={themeConfig}
                  isCanvasMode={true}
                  isDragging={isDragging}
                  onDragStart={(e) => handleStartDrag(e, note, pos.x, pos.y)}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDeleteWithConfirm}
                  onTogglePin={handleTogglePin}
                  onChangeColor={handleChangeColor}
                  onConvertToTask={onConvertToTask}
                  onUpdateContent={handleUpdateContent}
                />
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= MODE GRID RAPI ================= */
        <div className="space-y-6">
          {/* Pinned Notes Section */}
          {pinnedNotes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Pin className="w-4 h-4 text-amber-500 fill-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Catatan Tersemat ({pinnedNotes.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    themeConfig={themeConfig}
                    isCanvasMode={false}
                    onEdit={handleOpenEditModal}
                    onDelete={handleDeleteWithConfirm}
                    onTogglePin={handleTogglePin}
                    onChangeColor={handleChangeColor}
                    onConvertToTask={onConvertToTask}
                    onUpdateContent={handleUpdateContent}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Notes Section */}
          {otherNotes.length > 0 && (
            <div>
              {pinnedNotes.length > 0 && (
                <div className="flex items-center gap-2 mb-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Catatan Lainnya ({otherNotes.length})
                  </h3>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {otherNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    themeConfig={themeConfig}
                    isCanvasMode={false}
                    onEdit={handleOpenEditModal}
                    onDelete={handleDeleteWithConfirm}
                    onTogglePin={handleTogglePin}
                    onChangeColor={handleChangeColor}
                    onConvertToTask={onConvertToTask}
                    onUpdateContent={handleUpdateContent}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Note Creation / Editing Modal */}
      <NoteModal
        key={activeEditingNote ? activeEditingNote.id : 'new-note'}
        isOpen={activeModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveModal}
        initialNote={activeEditingNote}
        onConvertToTask={onConvertToTask}
        themeConfig={themeConfig}
      />
    </div>
  );
};
