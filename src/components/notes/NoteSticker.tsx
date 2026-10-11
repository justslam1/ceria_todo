'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Pin, Trash2, ZoomIn, StickyNote, X } from 'lucide-react';
import { NoteItem } from '@/types/note';

interface NoteStickerProps {
  note: NoteItem;
  onDelete: (id: string) => void;
  onTogglePin?: (id: string, currentPinned: boolean) => void;
  onToggleSticker?: (id: string, isSticker: boolean) => void;
  isCanvasMode?: boolean;
  onDragStart?: (e: React.PointerEvent) => void;
  isDragging?: boolean;
}

export const NoteSticker: React.FC<NoteStickerProps> = ({
  note,
  onDelete,
  onTogglePin,
  onToggleSticker,
  isCanvasMode = false,
  onDragStart,
  isDragging = false,
}) => {
  const [showLightbox, setShowLightbox] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isCanvasMode || !onDragStart) return;
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    onDragStart(e);
  };

  if (!note.imageUrl) return null;

  return (
    <div
      onPointerDown={handlePointerDown}
      className={`group relative transition-all duration-150 inline-block select-none ${
        isCanvasMode
          ? isDragging
            ? 'scale-[1.03] cursor-grabbing z-50 drop-shadow-2xl ring-2 ring-amber-400/70 rounded-2xl'
            : 'hover:scale-[1.01] cursor-grab drop-shadow-md hover:drop-shadow-xl'
          : 'drop-shadow-sm hover:drop-shadow-md'
      }`}
      style={{
        touchAction: isCanvasMode ? 'none' : 'auto',
      }}
    >
      {/* Pinned pushpin indicator */}
      {note.isPinned && (
        <div
          className="absolute -top-3 left-3 z-30 w-7 h-7 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-md border-2 border-white pointer-events-none rotate-[-12deg]"
          title="Stiker Tersemat"
        >
          <Pin className="w-3.5 h-3.5 fill-current" />
        </div>
      )}

      {/* Floating Action Bar (Muncul saat hover / sentuh) */}
      <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 bg-black/75 backdrop-blur-md px-2 py-1 rounded-xl shadow-lg border border-white/20">
        {/* Toggle Pin */}
        {onTogglePin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(note.id, note.isPinned);
            }}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              note.isPinned
                ? 'bg-amber-400 text-amber-950'
                : 'text-white/80 hover:text-white hover:bg-white/20'
            }`}
            title={note.isPinned ? 'Lepas sematan' : 'Sematkan stiker'}
          >
            <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
          </button>
        )}

        {/* Zoom Lightbox */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowLightbox(true);
          }}
          className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
          title="Perbesar gambar"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        {/* Convert to Note Box (Kembalikan ke kotak catatan memo) */}
        {onToggleSticker && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSticker(note.id, false);
            }}
            className="p-1 text-white/80 hover:text-amber-300 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
            title="Ubah menjadi Kartu Memo Catatan 📝"
          >
            <StickyNote className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Delete Sticker */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          className="p-1 text-rose-300 hover:text-rose-200 hover:bg-rose-500/30 rounded-lg transition-colors cursor-pointer"
          title="Hapus stiker"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Sticker Image */}
      <div
        className="rounded-2xl overflow-hidden cursor-pointer"
        onDoubleClick={() => setShowLightbox(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={note.imageUrl}
          alt={note.title || 'Stiker Gambar'}
          className="w-full max-h-[380px] object-contain rounded-2xl pointer-events-none"
          loading="lazy"
          draggable={false}
        />
      </div>

      {/* Lightbox / Fullscreen Preview Modal */}
      {showLightbox && typeof document !== 'undefined' && createPortal(
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
              alt={note.title || 'Preview Stiker'}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/20 select-none"
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
