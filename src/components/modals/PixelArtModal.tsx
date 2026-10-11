'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Undo2,
  Redo2,
  Trash2,
  Sparkles,
  Paintbrush,
  Eraser,
  PaintBucket,
  Pipette,
  SplitSquareVertical,
  Download,
  Bookmark,
  Sparkle,
} from 'lucide-react';
import { SoundProfile } from '@/types/preferences';
import { playPopSound } from '@/lib/soundEffects';

interface PixelArtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (imageUrl: string, title?: string) => Promise<void> | void;
  soundProfile?: SoundProfile;
  isDark?: boolean;
}

export type GridDimension = 8 | 16 | 24;

// Palette Warna Retro & Pastel Ceria
const DEFAULT_PALETTE = [
  '#000000', '#ffffff', '#475569', '#94a3b8',
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#22c55e', '#10b981', '#06b6d4', '#3b82f6',
  '#6366f1', '#8b5cf6', '#d946ef', '#ec4899',
  '#78350f', '#fbcfe8', '#fef08a', '#bbf7d0',
];

interface SavedDraft {
  id: string;
  title: string;
  dimension: GridDimension;
  pixels: string[];
  createdAt: number;
}

// Preset template 16x16
const PRESETS_16: Record<string, { name: string; icon: string; pixels: string[] }> = {
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
        133, 134,
      ];
      heartIdxs.forEach((idx) => {
        g[idx] = '#ef4444';
      });
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
        144, 145, 152, 153,
      ];
      starIdxs.forEach((idx) => {
        g[idx] = '#f59e0b';
      });
      return g;
    })(),
  },
  mushroom: {
    name: 'Jamur 🍄',
    icon: '🍄',
    pixels: (() => {
      const g = Array(256).fill('');
      const red = [
        52, 53, 54, 55, 56, 57, 58, 59,
        67, 68, 71, 72, 75, 76,
        83, 84, 87, 88, 91, 92,
        98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109,
        114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125,
      ];
      red.forEach((i) => {
        g[i] = '#ef4444';
      });
      [69, 70, 73, 74, 85, 86, 89, 90].forEach((i) => {
        g[i] = '#ffffff';
      });
      const stem = [
        133, 134, 135, 136, 137, 138, 139, 140,
        149, 150, 151, 152, 153, 154, 155, 156,
        165, 166, 167, 168, 169, 170, 171, 172,
      ];
      stem.forEach((i) => {
        g[i] = '#fef08a';
      });
      return g;
    })(),
  },
  sword: {
    name: 'Pedang ⚔️',
    icon: '🗡️',
    pixels: (() => {
      const g = Array(256).fill('');
      const bladeIdxs = [30, 45, 60, 75, 90, 105, 120, 135];
      bladeIdxs.forEach((i) => {
        g[i] = '#06b6d4';
      });
      [149, 150, 151, 136, 166].forEach((i) => {
        g[i] = '#eab308';
      });
      [167, 182, 197].forEach((i) => {
        g[i] = '#78350f';
      });
      [212, 213].forEach((i) => {
        g[i] = '#eab308';
      });
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
        149, 150, 151, 152, 153, 154,
      ];
      headIdxs.forEach((i) => {
        g[i] = '#f97316';
      });
      [85, 90].forEach((i) => {
        g[i] = '#000000';
      });
      [119].forEach((i) => {
        g[i] = '#ec4899';
      });
      return g;
    })(),
  },
  coffee: {
    name: 'Kopi ☕',
    icon: '☕',
    pixels: (() => {
      const g = Array(256).fill('');
      const cup = [
        83, 84, 85, 86, 87, 88, 89, 90, 91,
        99, 100, 101, 102, 103, 104, 105, 106, 107,
        115, 116, 117, 118, 119, 120, 121, 122, 123,
        132, 133, 134, 135, 136, 137, 138, 139,
        149, 150, 151, 152, 153, 154,
      ];
      cup.forEach((i) => {
        g[i] = '#3b82f6';
      });
      [92, 93, 109, 125, 124, 123].forEach((i) => {
        g[i] = '#3b82f6';
      });
      // steam
      [36, 52, 68, 40, 56, 72].forEach((i) => {
        g[i] = '#94a3b8';
      });
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
  const [gridSize, setGridSize] = useState<GridDimension>(16);
  const [pixels, setPixels] = useState<string[]>(() => Array(16 * 16).fill(''));
  const [history, setHistory] = useState<string[][]>([]);
  const [redoStack, setRedoStack] = useState<string[][]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('#ef4444');
  const [activeTool, setActiveTool] = useState<'pen' | 'eraser' | 'fill' | 'pipette'>('pen');
  const [isMirrorH, setIsMirrorH] = useState(false);
  const [hasWhiteBorder, setHasWhiteBorder] = useState(true);
  const [title, setTitle] = useState<string>('Karya Pixel');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'drafts'>('editor');
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('ceria_pixel_art_drafts');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const isMouseDownRef = useRef(false);

  const saveDraftsToStorage = (drafts: SavedDraft[]) => {
    setSavedDrafts(drafts);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ceria_pixel_art_drafts', JSON.stringify(drafts));
      } catch {
        // ignore
      }
    }
  };

  // Switch grid dimension safely
  const handleGridSizeChange = (newSize: GridDimension) => {
    if (newSize === gridSize) return;
    const hasAnyColor = pixels.some(Boolean);
    if (hasAnyColor && !confirm(`Ganti ukuran ke ${newSize}x${newSize}? Kanvas saat ini akan di-reset.`)) {
      return;
    }
    playPopSound(soundProfile);
    setGridSize(newSize);
    setPixels(Array(newSize * newSize).fill(''));
    setHistory([]);
    setRedoStack([]);
  };

  // Push history before state modifications
  const pushHistory = useCallback((currentPixels: string[]) => {
    setHistory((prev) => [...prev.slice(-25), currentPixels]);
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
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
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
        const row = Math.floor(idx / gridSize);
        const col = idx % gridSize;

        if (row > 0) queue.push(idx - gridSize);
        if (row < gridSize - 1) queue.push(idx + gridSize);
        if (col > 0) queue.push(idx - 1);
        if (col < gridSize - 1) queue.push(idx + 1);
      }
    }

    pushHistory(pixels);
    setPixels(newPixels);
  };

  const applyPixelColor = (index: number) => {
    if (activeTool === 'pipette') {
      const picked = pixels[index];
      if (picked) {
        setSelectedColor(picked);
        setActiveTool('pen');
        playPopSound(soundProfile);
      }
      return;
    }

    const colorToApply = activeTool === 'eraser' ? '' : selectedColor;

    if (activeTool === 'fill') {
      floodFill(index, pixels[index], colorToApply);
      playPopSound(soundProfile);
      return;
    }

    // Mirroring calculations
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    const mirrorCol = gridSize - 1 - col;
    const mirrorIdx = row * gridSize + mirrorCol;

    setPixels((prev) => {
      const next = [...prev];
      next[index] = colorToApply;
      if (isMirrorH && mirrorIdx !== index) {
        next[mirrorIdx] = colorToApply;
      }
      return next;
    });
  };

  const handlePointerDown = (index: number) => {
    isMouseDownRef.current = true;
    if (activeTool !== 'pipette') {
      pushHistory(pixels);
    }
    applyPixelColor(index);
    playPopSound(soundProfile);
  };

  const handlePointerEnter = (index: number) => {
    if (!isMouseDownRef.current || activeTool === 'fill' || activeTool === 'pipette') return;
    applyPixelColor(index);
  };

  const handlePointerUp = () => {
    isMouseDownRef.current = false;
  };

  const handleClear = () => {
    if (confirm('Kosongkan seluruh kanvas pixel art?')) {
      playPopSound(soundProfile);
      pushHistory(pixels);
      setPixels(Array(gridSize * gridSize).fill(''));
    }
  };

  const handleLoadPreset = (key: string) => {
    const preset = PRESETS_16[key];
    if (preset) {
      playPopSound(soundProfile);
      setGridSize(16);
      pushHistory(pixels);
      setPixels([...preset.pixels]);
      setTitle(preset.name.split(' ')[0]);
    }
  };

  // Save current art to local drafts
  const handleSaveToDrafts = () => {
    const hasAnyColor = pixels.some(Boolean);
    if (!hasAnyColor) {
      alert('Kanvas masih kosong!');
      return;
    }
    playPopSound(soundProfile);
    const newDraft: SavedDraft = {
      id: `draft-${Date.now()}`,
      title: title.trim() || 'Karya Pixel',
      dimension: gridSize,
      pixels: [...pixels],
      createdAt: Date.now(),
    };
    saveDraftsToStorage([newDraft, ...savedDrafts]);
    alert('Karya berhasil disimpan ke galeri draf!');
  };

  const handleLoadDraft = (draft: SavedDraft) => {
    playPopSound(soundProfile);
    setGridSize(draft.dimension);
    pushHistory(pixels);
    setPixels([...draft.pixels]);
    setTitle(draft.title);
    setActiveTab('editor');
  };

  const handleDeleteDraft = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playPopSound(soundProfile);
    saveDraftsToStorage(savedDrafts.filter((d) => d.id !== id));
  };

  // Generate crisp HTML5 Canvas representation
  const renderArtToCanvas = (withDieCutOutline: boolean = hasWhiteBorder) => {
    const exportCanvas = document.createElement('canvas');
    const scale = 16;
    const padding = withDieCutOutline ? 2 : 0; // extra padding pixels for die-cut border
    const totalDim = gridSize + padding * 2;

    exportCanvas.width = totalDim * scale;
    exportCanvas.height = totalDim * scale;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return null;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);

    // If Die-Cut Outline is enabled: draw a white 1-pixel padded contour behind non-empty pixels
    if (withDieCutOutline) {
      ctx.fillStyle = '#ffffff';
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          if (pixels[y * gridSize + x]) {
            // Draw surrounding 3x3 white border
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                ctx.fillRect(
                  (x + padding + dx) * scale,
                  (y + padding + dy) * scale,
                  scale,
                  scale
                );
              }
            }
          }
        }
      }
    }

    // Draw main colored pixels
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const color = pixels[y * gridSize + x];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect((x + padding) * scale, (y + padding) * scale, scale, scale);
        }
      }
    }

    return exportCanvas;
  };

  // Download image directly to device as PNG file
  const handleDownloadPNG = () => {
    const hasAnyColor = pixels.some(Boolean);
    if (!hasAnyColor) {
      alert('Kanvas masih kosong!');
      return;
    }
    const canvas = renderArtToCanvas(hasWhiteBorder);
    if (!canvas) return;
    playPopSound(soundProfile);

    const link = document.createElement('a');
    link.download = `${title.trim() || 'pixel-art'}-${gridSize}x${gridSize}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Save and Attach to Board
  const handleSaveAndAttach = async () => {
    const hasAnyColor = pixels.some(Boolean);
    if (!hasAnyColor) {
      alert('Kanvas masih kosong! Gambarlah sesuatu sebelum menempelkannya.');
      return;
    }

    setIsSaving(true);
    try {
      const canvas = renderArtToCanvas(hasWhiteBorder);
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
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
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 select-none overflow-y-auto"
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-xl rounded-3xl border shadow-2xl p-4 sm:p-5 flex flex-col gap-3.5 relative animate-in zoom-in-95 duration-200 my-auto ${
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
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide">
                  Pixel Art Studio
                </h2>
                {/* Mode Tab Switcher */}
                <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveTab('editor')}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                      activeTab === 'editor'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                  >
                    Kanvas
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('drafts')}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                      activeTab === 'drafts'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                  >
                    <span>Galeri Draf</span>
                    {savedDrafts.length > 0 && (
                      <span className="px-1 py-0.2 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 text-[9px] font-black">
                        {savedDrafts.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Gambar seni piksel retro, unduh PNG, lalu tempel sebagai stiker dekorasi!
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

        {activeTab === 'drafts' ? (
          /* ================= DRAFTS GALLERY VIEW ================= */
          <div className="flex flex-col gap-3 py-2 min-h-[300px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                Koleksi Karya Tersimpan ({savedDrafts.length}):
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                + Kembali ke Kanvas
              </button>
            </div>

            {savedDrafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center gap-2">
                <Bookmark className="w-8 h-8 opacity-40" />
                <p className="text-xs font-medium">Belum ada draf yang disimpan.</p>
                <p className="text-[11px] opacity-75">
                  Klik tombol bookmark di kanvas untuk menyimpan karyamu ke sini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {savedDrafts.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => handleLoadDraft(d)}
                    className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:border-amber-400 hover:scale-[1.02] transition-all cursor-pointer flex flex-col gap-1.5 group relative shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate text-slate-800 dark:text-slate-100">
                        {d.title}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteDraft(d.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Hapus draf"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{d.dimension}x{d.dimension}</span>
                      <span>Buka ↗</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ================= ACTIVE CANVAS EDITOR ================= */
          <>
            {/* Top Toolbar: Grid Size, Presets, Mirror, Die-cut Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              {/* Grid Dimension Selector */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 px-1.5">Grid:</span>
                {([8, 16, 24] as GridDimension[]).map((dim) => (
                  <button
                    key={dim}
                    type="button"
                    onClick={() => handleGridSizeChange(dim)}
                    className={`px-2 py-0.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                      gridSize === dim
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {dim}x{dim}
                  </button>
                ))}
              </div>

              {/* Presets (Only for 16x16) */}
              {gridSize === 16 && (
                <div className="flex items-center gap-1 overflow-x-auto text-xs">
                  <span className="text-[10px] font-bold text-slate-400">Template:</span>
                  {Object.entries(PRESETS_16).map(([key, p]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleLoadPreset(key)}
                      className="px-1.5 py-0.5 rounded-lg bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-[11px] transition-colors flex items-center gap-0.5 shrink-0 cursor-pointer"
                    >
                      <span>{p.icon}</span>
                      <span className="hidden sm:inline">{p.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Main Canvas & Toolbox Area */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
              {/* Interactive Grid Canvas */}
              <div
                className="relative p-2 bg-slate-200/80 dark:bg-slate-950 rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-inner"
                style={{ touchAction: 'none' }}
              >
                <div
                  className="p-[1px] rounded-lg shadow-xs overflow-hidden"
                  style={{
                    width: '272px',
                    height: '272px',
                    display: 'grid',
                    gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
                    gap: gridSize === 24 ? '0px' : '1px',
                    backgroundColor: gridSize === 24 ? '#94a3b8' : '#cbd5e1',
                    backgroundImage:
                      'repeating-conic-gradient(#f8fafc 0% 25%, #f1f5f9 0% 50%)',
                    backgroundSize: '16px 16px',
                  }}
                >
                  {pixels.map((color, idx) => (
                    <div
                      key={idx}
                      onPointerDown={() => handlePointerDown(idx)}
                      onPointerEnter={() => handlePointerEnter(idx)}
                      style={{ backgroundColor: color || 'transparent' }}
                      className="w-full h-full cursor-crosshair transition-transform active:scale-90"
                    />
                  ))}
                </div>

                {/* Mirror guide line overlay if active */}
                {isMirrorH && (
                  <div className="absolute top-2 bottom-2 left-1/2 -translate-x-1/2 w-[2px] bg-amber-500/70 pointer-events-none border-x border-amber-300/40" />
                )}
              </div>

              {/* Tools & Palette Controls */}
              <div className="flex flex-col gap-2.5 w-full sm:w-48">
                {/* Tool Selector Grid */}
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTool('pen');
                      playPopSound(soundProfile);
                    }}
                    className={`p-1.5 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold transition-all cursor-pointer ${
                      activeTool === 'pen'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                    title="Kuas / Pensil"
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
                    className={`p-1.5 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold transition-all cursor-pointer ${
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
                    className={`p-1.5 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold transition-all cursor-pointer ${
                      activeTool === 'fill'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                    title="Cat Tumpah (Fill)"
                  >
                    <PaintBucket className="w-3.5 h-3.5 mb-0.5" />
                    <span>Isi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTool('pipette');
                      playPopSound(soundProfile);
                    }}
                    className={`p-1.5 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold transition-all cursor-pointer ${
                      activeTool === 'pipette'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                    title="Pipet Warna (Eyedropper)"
                  >
                    <Pipette className="w-3.5 h-3.5 mb-0.5" />
                    <span>Pipet</span>
                  </button>
                </div>

                {/* Mirror & Sticker Outline Options */}
                <div className="flex items-center gap-1.5 justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMirrorH((prev) => !prev);
                      playPopSound(soundProfile);
                    }}
                    className={`flex-1 py-1 px-1.5 rounded-lg border flex items-center justify-center gap-1 text-[10px] transition-all cursor-pointer ${
                      isMirrorH
                        ? 'bg-amber-100 border-amber-400 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title="Mode Cermin Simetri Horizontal"
                  >
                    <SplitSquareVertical className="w-3 h-3 text-amber-600" />
                    <span>Simetri 🪞</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setHasWhiteBorder((prev) => !prev);
                      playPopSound(soundProfile);
                    }}
                    className={`flex-1 py-1 px-1.5 rounded-lg border flex items-center justify-center gap-1 text-[10px] transition-all cursor-pointer ${
                      hasWhiteBorder
                        ? 'bg-indigo-100 border-indigo-400 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title="Beri garis tepi putih die-cut seperti stiker fisik asli"
                  >
                    <Sparkle className="w-3 h-3 text-indigo-600" />
                    <span>Border ✂️</span>
                  </button>
                </div>

                {/* Color Palette & Custom Color Picker */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                    <span>Warna:</span>
                    <label
                      className="flex items-center gap-1 cursor-pointer hover:opacity-80"
                      title="Pilih warna kustom bebas"
                    >
                      <input
                        type="color"
                        value={selectedColor}
                        onChange={(e) => {
                          setSelectedColor(e.target.value);
                          setActiveTool('pen');
                        }}
                        className="w-5 h-5 rounded-full border shadow-xs cursor-pointer p-0 bg-transparent"
                      />
                      <span className="text-[10px] text-amber-600 font-mono">Bebas 🎨</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {DEFAULT_PALETTE.map((c) => (
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

                {/* Quick Actions (Undo / Redo / Clear / Bookmark Draft) */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleUndo}
                      disabled={history.length === 0}
                      className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
                      title="Undo (Ctrl+Z)"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRedo}
                      disabled={redoStack.length === 0}
                      className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
                      title="Redo (Ctrl+Shift+Z)"
                    >
                      <Redo2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveToDrafts}
                      className="p-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
                      title="Simpan ke Galeri Draf 💾"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                    title="Kosongkan Kanvas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={30}
            placeholder="Beri nama karya..."
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 flex-1 min-w-[140px]"
          />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDownloadPNG}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Unduh file PNG resolusi tinggi ke komputer"
            >
              <Download className="w-3.5 h-3.5 text-blue-500" />
              <span>Unduh PNG</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAndAttach}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
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
