'use client';

import React, { useState, useMemo } from 'react';
import { Search, Plus, Pin, RefreshCw, BookOpen, Filter, X } from 'lucide-react';
import { NoteItem, NoteColor, NOTE_COLOR_STYLES } from '@/types/note';
import { ThemeConfig } from '@/types/preferences';
import { NoteCard } from '@/components/notes/NoteCard';
import { NoteModal } from '@/components/notes/NoteModal';

interface NotesBoardProps {
  notes: NoteItem[];
  isLoading: boolean;
  themeConfig: ThemeConfig;
  onCreateNote: (data: { title: string; content: string; color: NoteColor; isPinned: boolean }) => Promise<void>;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<'all' | NoteColor>('all');
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const [internalEditingNote, setInternalEditingNote] = useState<NoteItem | null>(null);

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

  // Separate pinned and unpinned notes
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
      await onCreateNote(data);
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
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
                Tulis ide bebas, daftar belanja, draft, atau rangkuman. Bisa diubah jadi tugas kapan saja! ✨
              </p>
            </div>
          </div>

          {/* Action Tools: Search, Filter, Refresh, Add */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56 min-w-[140px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari catatan..."
                style={{ color: themeConfig.isDark ? '#ffffff' : '#0f172a' }}
                className={`w-full pl-9 pr-7 py-2 rounded-xl border text-xs transition-all outline-hidden ${
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
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer whitespace-nowrap ${themeConfig.primaryButton}`}
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

      {/* Main Grid View */}
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
      ) : (
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
