'use client';

import React, { useState, useRef } from 'react';
import { BoardSticker, SoundProfile } from '@/types/preferences';
import { STICKER_PRESETS } from '@/lib/userPreferences';
import { playPopSound } from '@/lib/soundEffects';
import { X, RotateCw, Smile, Trash2 } from 'lucide-react';

let stickerCounter = 0;
function createStickerId(count: number): string {
  stickerCounter += 1;
  return `stk-${count + 1}-${stickerCounter}`;
}

interface BoardStickersProps {
  stickers: BoardSticker[];
  onChangeStickers: (newStickers: BoardSticker[]) => void;
  soundProfile?: SoundProfile;
  isDark?: boolean;
}

export const BoardStickers: React.FC<BoardStickersProps> = ({
  stickers,
  onChangeStickers,
  soundProfile = 'pop',
  isDark = false,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dragging state ref to avoid render stuttering
  const draggingRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  // Handle pointer down on sticker to start drag
  const handlePointerDown = (e: React.PointerEvent, sticker: BoardSticker) => {
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    draggingRef.current = {
      id: sticker.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: (sticker.x / 100) * rect.width,
      initialY: (sticker.y / 100) * rect.height,
    };

    setActiveStickerId(sticker.id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const dx = e.clientX - draggingRef.current.startX;
    const dy = e.clientY - draggingRef.current.startY;

    const newPxX = Math.max(0, Math.min(rect.width - 48, draggingRef.current.initialX + dx));
    const newPxY = Math.max(0, Math.min(rect.height - 48, draggingRef.current.initialY + dy));

    const newPercentX = Math.round((newPxX / rect.width) * 100);
    const newPercentY = Math.round((newPxY / rect.height) * 100);

    const updated = stickers.map((s) =>
      s.id === draggingRef.current?.id ? { ...s, x: newPercentX, y: newPercentY } : s
    );
    onChangeStickers(updated);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingRef.current) {
      playPopSound(soundProfile);
      draggingRef.current = null;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore if not captured
      }
    }
  };

  // Add a new sticker from drawer
  const handleAddSticker = (emoji: string) => {
    playPopSound(soundProfile);
    const newId = createStickerId(stickers.length);
    // Deterministic placement in center area with variation based on current count
    const offsetX = 20 + ((stickers.length * 17) % 55);
    const offsetY = 15 + ((stickers.length * 23) % 65);
    const rotation = ((stickers.length % 5) - 2) * 6; // between -12 and +12 deg

    const newSticker: BoardSticker = {
      id: newId,
      emoji,
      x: offsetX,
      y: offsetY,
      rotation,
      scale: 1,
    };

    onChangeStickers([...stickers, newSticker]);
  };

  // Rotate sticker clockwise
  const handleRotateSticker = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playPopSound(soundProfile);
    const updated = stickers.map((s) => {
      if (s.id !== id) return s;
      let nextRot = s.rotation + 15;
      if (nextRot > 35) nextRot = -25;
      return { ...s, rotation: nextRot };
    });
    onChangeStickers(updated);
  };

  // Delete sticker
  const handleDeleteSticker = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playPopSound(soundProfile);
    onChangeStickers(stickers.filter((s) => s.id !== id));
    if (activeStickerId === id) setActiveStickerId(null);
  };

  // Clear all stickers
  const handleClearAll = () => {
    if (stickers.length === 0) return;
    if (confirm('Hapus semua stiker dekoratif dari papan buletin?')) {
      playPopSound(soundProfile);
      onChangeStickers([]);
      setActiveStickerId(null);
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
    >
      {/* Floating Stickers on Corkboard */}
      {stickers.map((sticker) => {
        const isActive = activeStickerId === sticker.id;
        return (
          <div
            key={sticker.id}
            onPointerDown={(e) => handlePointerDown(e, sticker)}
            onClick={() => setActiveStickerId(sticker.id)}
            style={{
              left: `${sticker.x}%`,
              top: `${sticker.y}%`,
              transform: `rotate(${sticker.rotation}deg) scale(${sticker.scale || 1})`,
            }}
            className="absolute pointer-events-auto select-none cursor-grab active:cursor-grabbing touch-none group transition-transform duration-75 hover:scale-115 hover:z-30"
          >
            {/* The Sticker Emoji */}
            <div className="relative text-3xl sm:text-4xl drop-shadow-[0_4px_6px_rgba(0,0,0,0.22)] filter transition-all active:scale-95">
              {sticker.emoji}
            </div>

            {/* Floating controls badge (visible on hover or when active) */}
            <div
              className={`absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-full px-1.5 py-0.5 shadow-md border border-slate-200 dark:border-slate-700 transition-all ${
                isActive ? 'opacity-100 scale-100 z-40' : 'opacity-0 group-hover:opacity-100 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto'
              }`}
            >
              <button
                type="button"
                onClick={(e) => handleRotateSticker(sticker.id, e)}
                className="p-1 text-slate-500 hover:text-amber-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Putar stiker"
              >
                <RotateCw className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={(e) => handleDeleteSticker(sticker.id, e)}
                className="p-1 text-slate-400 hover:text-rose-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Hapus stiker"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}

      {/* Floating Sticker Drawer Toggle Button in bottom-right corner (next to buddy/toasts) */}
      <div className="fixed bottom-14 right-4 pointer-events-auto z-40 flex flex-col items-end gap-2">
        {/* Drawer Popover */}
        {isDrawerOpen && (
          <div className="w-72 sm:w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-amber-300 dark:border-amber-500/40 rounded-2xl p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                <Smile className="w-3.5 h-3.5 text-amber-500" />
                <span>Koleksi Stiker Meja</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.2 rounded-full font-semibold">
                  {stickers.length} aktif
                </span>
              </div>
              <div className="flex items-center gap-1">
                {stickers.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Hapus semua stiker"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Tutup laci stiker"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
              Klik stiker untuk menempelkannya ke papan, lalu seret bebas sesuka hati! ✨
            </p>

            {/* Sticker Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
              {STICKER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleAddSticker(preset.emoji)}
                  className="w-11 h-11 rounded-xl bg-amber-50/70 dark:bg-slate-800/80 hover:bg-amber-100 dark:hover:bg-slate-700/80 border border-amber-200/60 dark:border-slate-700 flex items-center justify-center text-2xl transition-all hover:scale-115 active:scale-95 shadow-2xs cursor-pointer"
                  title={`Tempel ${preset.label}`}
                >
                  <span>{preset.emoji}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <button
          type="button"
          onClick={() => {
            playPopSound(soundProfile);
            setIsDrawerOpen((prev) => !prev);
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-2xl border shadow-lg font-bold text-xs transition-all cursor-pointer active:scale-95 ${
            isDrawerOpen
              ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-300'
              : isDark
              ? 'bg-slate-900/90 text-slate-200 hover:text-white border-slate-700 hover:bg-slate-800'
              : 'bg-white/90 text-slate-700 hover:text-amber-800 border-amber-200/80 hover:bg-amber-50/80'
          }`}
          title="Buka / Tutup Stiker Meja Dekoratif"
        >
          <span className="text-base">🎨</span>
          <span className="hidden sm:inline">Stiker Meja</span>
          {stickers.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-amber-950">
              {stickers.length}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
