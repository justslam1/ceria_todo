'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Undo2, Redo2, Trash2, Sparkles, Paintbrush, Eraser, PaintBucket } from 'lucide-react';
import { SoundProfile } from '@/types/preferences';
import { playPopSound } from '@/lib/soundEffects';

interface PixelArtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (imageUrl: string, title?: string) => Promise<void> | void;
  soundProfile?: SoundProfile;
  isDark?: boolean;
}

const GRID_SIZE = 16;

// Retro & Cute Color Palette presets
const PALETTE = [
  '#000000', '#ffffff', '#475569', '#94a3b8',
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#22c55e', '#10b981', '#06b6d4', '#3b82f6',
  '#6366f1', '#8b5cf6', '#d946ef', '#ec4899',
  '#78350f', '#fbcfe8', '#fef08a', '#bbf7d0',
];

// Presets for quick fun starts
const PRESETS: Record<string, { name: string; icon: string; pixels: string[] }> = {
  heart: {
    name: 'Hati ❤️',
    icon: '❤️',
    pixels: (() => {
      const g = Array(256).fill('');
      const heartIdxs = [
        35, 36, 38, 39,
        50, 51, 52, 53, 54, 55, 56, 57,
        66, 67, 68, 69, 70, 71, 72, 73,
        82, 83, 84, 85, 86, 87, 88, 89,
        99, 100, 101, 102, 103, 104,
        116, 117, 118, 119,
        133, 134
      ];
      heartIdxs.forEach((idx) => { g[idx] = '#ef4444'; });
      return g;
    })(),
  },
  star: {
    name: 'Bintang ⭐',
    icon: '⭐',
    pixels: (() => {
      const g = Array(256).fill('');
      const starIdxs = [
        23, 24,
        39, 40,
        55, 56,
        64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75,
        82, 83, 84, 85, 86, 87, 88, 89,
        99, 100, 101, 102,
        114, 115, 118, 119,
        129, 130, 135, 136,
        144, 145, 152, 153
      ];
      starIdxs.forEach((idx) => { g[idx] = '#f59e0b'; });
      return g;
    })(),
  },
  sword: {
    name: 'Pedang ⚔️',
    icon: '🗡️',
    pixels: (() => {
      const g = Array(256).fill('');
      const bladeIdxs = [30, 45, 60, 75, 90, 105, 120, 135];
      bladeIdxs.forEach((i) => { g[i] = '#06b6d4'; });
      [149, 150, 151, 136, 166].forEach((i) => { g[i] = '#eab308'; });
      [167, 182, 197].forEach((i) => { g[i] = '#78350f'; });
      [212, 213].forEach((i) => { g[i] = '#eab308'; });
      return g;
    })(),
  },
  cat: {
    name: 'Kucing 🐱',
    icon: '🐱',
    pixels: (() => {
      const g = Array(256).fill('');
      const headIdxs = [
        34, 35, 43, 44,
        50, 51, 52, 53, 54, 55, 56, 57, 58, 59,
        66, 67, 76, 77,
        82, 83, 84, 87, 88, 91, 92, 93,
        98, 99, 100, 103, 104, 107, 108, 109,
        115, 116, 117, 118, 120, 121, 122, 123,
        132, 133, 134, 135, 136, 137, 138, 139,
        149, 150, 151, 152, 153, 154
      ];
      headIdxs.forEach((i) => { g[i] = '#f97316'; });
      [85, 90].forEach((i) => { g[i] = '#000000'; });
      [119].forEach((i) => { g[i] = '#ec4899'; });
      return g;
    })(),
  },
};

export const PixelArtModal: React.FC<PixelArtModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  soundProfile = 'pop',
  isDark = false,
}) => {
  const [pixels, setPixels] = useState<string[]>(() => Array(256).fill(''));
  const [history, setHistory] = useState<string[][]>([]);
  const [redoStack, setRedoStack] = useState<string[][]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('#ef4444');
  const [activeTool, setActiveTool] = useState<'pen' | 'eraser' | 'fill'>('pen');
  const [title, setTitle] = useState<string>('Karya Pixel');
  const [isSaving, setIsSaving] = useState(false);

  const isMouseDownRef = useRef(false);

  // Push history before state changes
  const pushHistory = useCallback((currentPixels: string[]) => {
    setHistory((prev) => [...prev.slice(-20), currentPixels]);
    setRedoStack([]);
  }, []);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    playPopSound(soundProfile);
    const previous = history[history.length - 1];
    setRedoStack((prev) => [...prev, pixels]);
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setPixels(previous);
  }, [history, pixels, soundProfile]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    playPopSound(soundProfile);
    const next = redoStack[redoStack.length - 1];
    setHistory((prev) => [...prev, pixels]);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setPixels(next);
  }, [redoStack, pixels, soundProfile]);

  // Keyboard shortcut for Undo / Redo
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleUndo, handleRedo]);

  if (!isOpen) return null;

  // Flood fill algorithm
  const floodFill = (startIndex: number, targetColor: string, fillColor: string) => {
    if (targetColor === fillColor) return;
    const newPixels = [...pixels];
    const queue = [startIndex];
    const visited = new Set<number>();

    while (queue.length > 0) {
      const idx = queue.pop()!;
      if (visited.has(idx)) continue;
      visited.add(idx);

      if (newPixels[idx] === targetColor) {
        newPixels[idx] = fillColor;
        const row = Math.floor(idx / GRID_SIZE);
        const col = idx % GRID_SIZE;

        if (row > 0) queue.push(idx - GRID_SIZE);
        if (row < GRID_SIZE - 1) queue.push(idx + GRID_SIZE);
        if (col > 0) queue.push(idx - 1);
        if (col < GRID_SIZE - 1) queue.push(idx + 1);
      }
    }

    pushHistory(pixels);
    setPixels(newPixels);
  };

  const applyPixelColor = (index: number) => {
    const colorToApply = activeTool === 'eraser' ? '' : selectedColor;

    if (activeTool === 'fill') {
      floodFill(index, pixels[index], colorToApply);
      playPopSound(soundProfile);
      return;
    }

    if (pixels[index] === colorToApply) return;

    setPixels((prev) => {
      const next = [...prev];
      next[index] = colorToApply;
      return next;
    });
  };

  const handlePointerDown = (index: number) => {
    isMouseDownRef.current = true;
    pushHistory(pixels);
    applyPixelColor(index);
    playPopSound(soundProfile);
  };

  const handlePointerEnter = (index: number) => {
    if (!isMouseDownRef.current || activeTool === 'fill') return;
    applyPixelColor(index);
  };

  const handlePointerUp = () => {
    isMouseDownRef.current = false;
  };

  const handleClear = () => {
    if (confirm('Kosongkan seluruh kanvas pixel art?')) {
      playPopSound(soundProfile);
      pushHistory(pixels);
      setPixels(Array(256).fill(''));
    }
  };

  const handleLoadPreset = (key: string) => {
    const preset = PRESETS[key];
    if (preset) {
      playPopSound(soundProfile);
      pushHistory(pixels);
      setPixels([...preset.pixels]);
      setTitle(preset.name.split(' ')[0]);
    }
  };

  // Export 16x16 pixels to a crisp, high-res 256x256 PNG data URL
  const handleSaveAndAttach = async () => {
    const hasAnyColor = pixels.some((c) => Boolean(c));
    if (!hasAnyColor) {
      alert('Kanvas masih kosong! Gambarlah sesuatu sebelum menempelkannya.');
      return;
    }

    setIsSaving(true);
    try {
      const exportCanvas = document.createElement('canvas');
      const scale = 16; // 16x16 * 16 = 256x256 px
      exportCanvas.width = GRID_SIZE * scale;
      exportCanvas.height = GRID_SIZE * scale;
      const ctx = exportCanvas.getContext('2d');

      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);

        for (let y = 0; y < GRID_SIZE; y++) {
          for (let x = 0; x < GRID_SIZE; x++) {
            const color = pixels[y * GRID_SIZE + x];
            if (color) {
              ctx.fillStyle = color;
              ctx.fillRect(x * scale, y * scale, scale, scale);
            }
          }
        }

        const dataUrl = exportCanvas.toDataURL('image/png');
        await onSubmit(dataUrl, title.trim() || 'Karya Pixel');
        onClose();
      }
    } catch (err) {
      console.error('Gagal mengekspor pixel art:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 select-none"
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl p-4 sm:p-5 flex flex-col gap-4 relative animate-in zoom-in-95 duration-200 ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white border-amber-300 text-slate-800'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-2.5 border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👾</span>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide flex items-center gap-1.5">
                Pixel Art Studio
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  16x16
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Gambar seni piksel retro bebas lalu tempel di desktop!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Templates */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 shrink-0">Preset:</span>
          {Object.entries(PRESETS).map(([key, p]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleLoadPreset(key)}
              className="px-2 py-1 rounded-xl bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-xs transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>{p.icon}</span>
              <span>{p.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Main Canvas & Toolbox Row */}
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
          {/* 16x16 Interactive Grid */}
          <div
            className="relative p-2 bg-slate-200/70 dark:bg-slate-950 rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-inner"
            style={{ touchAction: 'none' }}
          >
            <div
              className="grid grid-cols-16 gap-[1px] bg-slate-300/60 dark:bg-slate-800/80 p-[1px] rounded-lg shadow-xs"
              style={{
                width: '272px',
                height: '272px',
                backgroundImage:
                  'repeating-conic-gradient(#f8fafc 0% 25%, #f1f5f9 0% 50%)',
                backgroundSize: '17px 17px',
              }}
            >
              {pixels.map((color, idx) => (
                <div
                  key={idx}
                  onPointerDown={() => handlePointerDown(idx)}
                  onPointerEnter={() => handlePointerEnter(idx)}
                  style={{ backgroundColor: color || 'transparent' }}
                  className="w-4 h-4 cursor-crosshair transition-transform active:scale-90"
                />
              ))}
            </div>
          </div>

          {/* Tools & Palette Controls */}
          <div className="flex flex-col gap-3 w-full sm:w-44">
            {/* Tool Selector */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setActiveTool('pen');
                  playPopSound(soundProfile);
                }}
                className={`p-2 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold transition-all cursor-pointer ${
                  activeTool === 'pen'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
                title="Kuas / Pensil (Klik/Seret)"
              >
                <Paintbrush className="w-3.5 h-3.5 mb-0.5" />
                <span>Kuas</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTool('eraser');
                  playPopSound(soundProfile);
                }}
                className={`p-2 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold transition-all cursor-pointer ${
                  activeTool === 'eraser'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
                title="Penghapus"
              >
                <Eraser className="w-3.5 h-3.5 mb-0.5" />
                <span>Hapus</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTool('fill');
                  playPopSound(soundProfile);
                }}
                className={`p-2 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold transition-all cursor-pointer ${
                  activeTool === 'fill'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
                title="Cat Tumpah / Fill Bucket"
              >
                <PaintBucket className="w-3.5 h-3.5 mb-0.5" />
                <span>Isi Cat</span>
              </button>
            </div>

            {/* Color Swatches Palette */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1.5">
                <span>Pilih Warna:</span>
                <div
                  className="w-4 h-4 rounded-full border shadow-xs"
                  style={{ backgroundColor: selectedColor }}
                  title="Warna aktif"
                />
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setSelectedColor(c);
                      setActiveTool('pen');
                      playPopSound(soundProfile);
                    }}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 active:scale-95 cursor-pointer ${
                      selectedColor === c && activeTool !== 'eraser'
                        ? 'border-amber-500 scale-110 ring-2 ring-amber-300'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Quick Actions (Undo / Redo / Clear) */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
                  title="Redo (Ctrl+Shift+Z)"
                >
                  <Redo2 className="w-4 h-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                title="Bersihkan Semua"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={30}
            placeholder="Beri nama karya..."
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 flex-1 max-w-[200px]"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveAndAttach}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Menempelkan...' : 'Tempel ke Papan!'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
