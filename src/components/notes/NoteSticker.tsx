'use client';

import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Pin, Trash2, ZoomIn, StickyNote, X, RotateCw, RotateCcw, Maximize2, Rotate3d, BringToFront, SendToBack } from 'lucide-react';
import { NoteItem } from '@/types/note';

interface NoteStickerProps {
  note: NoteItem;
  onDelete: (id: string) => void;
  onTogglePin?: (id: string, currentPinned: boolean) => void;
  onToggleSticker?: (id: string, isSticker: boolean) => void;
  onUpdateTransform?: (id: string, transform: { width?: number; rotation?: number }) => void;
  onUpdateOrder?: (id: string, direction: 'front' | 'back') => void;
  isCanvasMode?: boolean;
  onDragStart?: (e: React.PointerEvent) => void;
  isDragging?: boolean;
  onSelect?: (id: string) => void;
}

export const NoteSticker: React.FC<NoteStickerProps> = ({
  note,
  onDelete,
  onTogglePin,
  onToggleSticker,
  onUpdateTransform,
  onUpdateOrder,
  isCanvasMode = false,
  onDragStart,
  isDragging = false,
  onSelect,
}) => {
  const [showLightbox, setShowLightbox] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  // Live transform state for fluid 60fps drag
  const [liveWidth, setLiveWidth] = useState<number | null>(null);
  const [liveRotation, setLiveRotation] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Current values
  const effectiveWidth = liveWidth !== null ? liveWidth : note.width || 280;
  const effectiveRotation = liveRotation !== null ? liveRotation : note.rotation || 0;

  // Pointer down on main sticker body (drag start)
  const handleBodyPointerDown = (e: React.PointerEvent) => {
    if (onSelect) {
      onSelect(note.id);
    }
    if (!isCanvasMode || !onDragStart) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.handle-ctrl')) {
      return;
    }
    onDragStart(e);
  };

  // ================= 1. CORNER RESIZE HANDLER =================
  const handleResizeStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setIsResizing(true);
    const startClientX = e.clientX;
    const startWidth = effectiveWidth;
    let finalWidth = startWidth;

    const onPointerMove = (moveEv: PointerEvent) => {
      const dx = moveEv.clientX - startClientX;
      // Proportional resize between 120px and 800px
      const newWidth = Math.max(120, Math.min(800, Math.round(startWidth + dx)));
      finalWidth = newWidth;
      setLiveWidth(newWidth);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      setIsResizing(false);
      setLiveWidth(null);

      if (finalWidth !== (note.width || 280)) {
        onUpdateTransform?.(note.id, { width: finalWidth });
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // ================= 2. TOP ROTATION HANDLER =================
  const handleRotateStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setIsRotating(true);
    const rect = containerRef.current?.getBoundingClientRect();
    const centerX = rect ? rect.left + rect.width / 2 : e.clientX;
    const centerY = rect ? rect.top + rect.height / 2 : e.clientY;
    let finalDeg = effectiveRotation;

    const onPointerMove = (moveEv: PointerEvent) => {
      const rad = Math.atan2(moveEv.clientY - centerY, moveEv.clientX - centerX);
      let deg = (rad * 180) / Math.PI + 90;

      // Normalize to [-180, 180]
      while (deg > 180) deg -= 360;
      while (deg < -180) deg += 360;

      // Magnetic Snapping (0°, 90°, -90°, 45°, -45°)
      if (Math.abs(deg) <= 5) {
        deg = 0;
      } else if (Math.abs(deg - 90) <= 4) {
        deg = 90;
      } else if (Math.abs(deg + 90) <= 4) {
        deg = -90;
      } else if (Math.abs(deg - 45) <= 3) {
        deg = 45;
      } else if (Math.abs(deg + 45) <= 3) {
        deg = -45;
      }

      const roundedDeg = Math.round(deg * 2) / 2;
      finalDeg = roundedDeg;
      setLiveRotation(roundedDeg);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      setIsRotating(false);
      setLiveRotation(null);

      if (finalDeg !== (note.rotation || 0)) {
        onUpdateTransform?.(note.id, { rotation: finalDeg });
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // Quick incremental rotation step (-15° / +15°)
  const handleStepRotate = (delta: number) => {
    let nextRot = (effectiveRotation + delta) % 360;
    if (nextRot > 180) nextRot -= 360;
    if (nextRot < -180) nextRot += 360;
    if (Math.abs(nextRot) <= 4) nextRot = 0;
    onUpdateTransform?.(note.id, { rotation: nextRot });
  };

  // Quick Reset back to 280px & 0°
  const handleResetTransform = () => {
    onUpdateTransform?.(note.id, { width: 280, rotation: 0 });
  };

  if (!note.imageUrl) return null;

  return (
    <div
      ref={containerRef}
      onPointerDown={handleBodyPointerDown}
      className={`group relative transition-all duration-150 inline-block select-none ${
        isCanvasMode
          ? isDragging
            ? 'scale-[1.03] cursor-grabbing z-50 drop-shadow-2xl ring-2 ring-amber-400/80 rounded-2xl'
            : 'hover:scale-[1.01] cursor-grab drop-shadow-md hover:drop-shadow-xl'
          : 'drop-shadow-sm hover:drop-shadow-md'
      }`}
      style={{
        width: `${effectiveWidth}px`,
        transform: `rotate(${effectiveRotation}deg)`,
        transformOrigin: 'center center',
        touchAction: isCanvasMode ? 'none' : 'auto',
      }}
    >
      {/* Pinned pushpin indicator */}
      {note.isPinned && (
        <div
          className="absolute -top-3.5 left-3 z-30 w-7 h-7 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-md border-2 border-white pointer-events-none rotate-[-12deg]"
          title="Stiker Tersemat"
        >
          <Pin className="w-3.5 h-3.5 fill-current" />
        </div>
      )}

      {/* Transform Badges during Active Resizing or Rotating */}
      {(isResizing || isRotating) && (
        <div className="absolute -top-11 left-1/2 -translate-x-1/2 z-50 px-2.5 py-1 rounded-full bg-slate-900/90 text-white text-[10px] font-bold shadow-xl border border-white/20 whitespace-nowrap pointer-events-none flex items-center gap-1.5 animate-in fade-in zoom-in-95">
          {isResizing && <span>Lebar: {Math.round(effectiveWidth)}px</span>}
          {isRotating && (
            <span>
              Rotasi: {effectiveRotation}° {effectiveRotation === 0 ? '✨ (Lurus)' : ''}
            </span>
          )}
        </div>
      )}

      {/* Floating Action Bar (Muncul saat hover / sentuh / aktif) */}
      <div className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-1 rounded-xl shadow-xl border border-white/20">
        {/* Step Rotate -15° */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleStepRotate(-15);
          }}
          className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
          title="Putar -15° (Berlawanan arah jarum jam)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Step Rotate +15° */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleStepRotate(15);
          }}
          className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
          title="Putar +15° (Searah jarum jam)"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        {/* Reset Transform (0° & 280px) */}
        {(effectiveRotation !== 0 || effectiveWidth !== 280) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleResetTransform();
            }}
            className="p-1 text-amber-300 hover:text-amber-200 hover:bg-amber-500/30 rounded-lg transition-colors cursor-pointer"
            title="Reset ke ukuran standar (280px) & sudut tegak (0°)"
          >
            <Rotate3d className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Bring to Front / Send to Back (Pengaturan Layer / Tumpukan) */}
        {onUpdateOrder && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateOrder(note.id, 'front');
              }}
              className="p-1 text-white/80 hover:text-emerald-300 hover:bg-emerald-500/30 rounded-lg transition-colors cursor-pointer"
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
              className="p-1 text-white/80 hover:text-sky-300 hover:bg-sky-500/30 rounded-lg transition-colors cursor-pointer"
              title="Kirim ke Paling Belakang (Layer Terbawah) 🔽"
            >
              <SendToBack className="w-3.5 h-3.5" />
            </button>
          </>
        )}

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
          title="Perbesar gambar penuh"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        {/* Convert to Note Box */}
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
          className="w-full h-auto object-contain rounded-2xl pointer-events-none"
          loading="lazy"
          draggable={false}
        />
      </div>

      {/* ================= INTERACTIVE TRANSFORM HANDLES ================= */}
      {isCanvasMode && (
        <>
          {/* Top Rotation Stem & Handle */}
          <div
            onPointerDown={handleRotateStart}
            className="handle-ctrl absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing z-40"
            title="Tarik untuk memutar stiker (Snap magnetik ke 0°)"
          >
            <div className="w-5 h-5 rounded-full bg-white dark:bg-slate-800 border-2 border-purple-500 shadow-md flex items-center justify-center hover:scale-125 transition-transform">
              <RotateCw className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="w-0.5 h-3 bg-purple-500/60 shadow-xs" />
          </div>

          {/* Bottom-Right Corner Resize Handle */}
          <div
            onPointerDown={handleResizeStart}
            className="handle-ctrl absolute -bottom-2.5 -right-2.5 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border-2 border-amber-500 shadow-md flex items-center justify-center cursor-nwse-resize opacity-0 group-hover:opacity-100 hover:scale-125 transition-all z-40"
            title="Tarik untuk memperbesar / memperkecil ukuran"
          >
            <Maximize2 className="w-3 h-3 text-amber-600 dark:text-amber-400 rotate-90" />
          </div>
        </>
      )}

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
