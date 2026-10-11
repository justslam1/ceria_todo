'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Pin, Sparkles, CheckSquare, List, Palette, Check, Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';
import { NoteItem, NoteColor, NOTE_COLOR_STYLES } from '@/types/note';
import { ThemeConfig } from '@/types/preferences';
import { compressImage, getImageFileFromClipboard } from '@/lib/imageCompression';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteData: { title: string; content: string; imageUrl?: string | null; color: NoteColor; isPinned: boolean }) => void;
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
  const [imageUrl, setImageUrl] = useState<string | null>(initialNote?.imageUrl || null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [color, setColor] = useState<NoteColor>(initialNote?.color || 'yellow');
  const [isPinned, setIsPinned] = useState(Boolean(initialNote?.isPinned));
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus textarea when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProcessImage = async (file: File | Blob) => {
    try {
      setIsCompressing(true);
      const compressed = await compressImage(file);
      setImageUrl(compressed);
    } catch (err) {
      console.error('Gagal memproses gambar:', err);
      alert('Gagal memproses gambar. Pastikan format file berupa gambar yang valid.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const imageFile = getImageFileFromClipboard(e);
    if (imageFile) {
      e.preventDefault();
      await handleProcessImage(imageFile);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim() && !imageUrl) return;
    onSave({
      title: title.trim(),
      content: content.trim(),
      imageUrl,
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
      onPaste={handlePaste}
    >
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all duration-200 max-h-[92vh] flex flex-col ${
          themeConfig.isDark ? 'bg-slate-900 border-slate-700 text-white shadow-2xl' : 'bg-white border-slate-200 text-slate-800 shadow-2xl'
        }`}
      >
        {/* Top Decorative Header with active note color */}
        <div
          className={`p-4 border-b flex items-center justify-between shrink-0 ${
            themeConfig.isDark ? 'bg-slate-800/95 border-slate-700/80 text-white' : `${style.headerBg} ${style.border}`
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {initialNote ? 'Ubah Catatan' : 'Tulis Catatan Baru'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Note Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-1.5">
              Judul Catatan
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Ide Fitur Baru, Bukti Transfer, Sketsa..."
              style={{ color: themeConfig.isDark ? '#ffffff' : '#0f172a' }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-all outline-hidden ${
                themeConfig.isDark
                  ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50'
              }`}
            />
          </div>

          {/* Quick Toolbar for content */}
          <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Isi Catatan
            </label>
            <div className="flex items-center gap-1.5">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleProcessImage(file);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  themeConfig.isDark
                    ? 'bg-slate-800 border-slate-700 text-purple-300 hover:bg-slate-700 hover:text-white'
                    : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                }`}
                title="Pilih gambar atau tekan Ctrl+V untuk tempel screenshot langsung dari clipboard"
              >
                {isCompressing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
                )}
                <span>{isCompressing ? 'Memproses...' : imageUrl ? 'Ganti Foto' : '+ Gambar'}</span>
              </button>

              <button
                type="button"
                onClick={() => insertPrefixAtCursor('- [ ] ')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  themeConfig.isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
                title="Sisipkan kotak centang"
              >
                <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
                <span>+ Checklist</span>
              </button>
              <button
                type="button"
                onClick={() => insertPrefixAtCursor('• ')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  themeConfig.isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
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
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tulis ide bebas, catatan harian, rangkuman, atau tekan Ctrl+V untuk paste tangkapan layar/gambar..."
              style={{ color: themeConfig.isDark ? '#ffffff' : '#0f172a' }}
              className={`w-full px-3.5 py-3 rounded-2xl border text-sm transition-all outline-hidden resize-y leading-relaxed font-normal ${
                themeConfig.isDark
                  ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50'
              }`}
            />
            <p className={`text-[11px] mt-1 flex justify-between font-medium ${themeConfig.isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="truncate mr-2">Tips: Tekan <strong>Ctrl+V</strong> untuk paste gambar | <strong>Ctrl+Enter</strong> simpan</span>
              <span className="shrink-0">{content.length} karakter</span>
            </p>
          </div>

          {/* Image Attachment Preview */}
          {imageUrl && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
                  <span>Gambar Terlampir:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Hapus Foto</span>
                </button>
              </div>
              <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-white/5 max-h-56 flex items-center justify-center p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Lampiran memo"
                  className="w-full max-h-52 object-contain rounded-xl shadow-xs"
                />
              </div>
            </div>
          )}

          {/* Color & Pin Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Color Palette */}
            <div>
              <span className={`text-xs font-bold flex items-center gap-1 mb-1.5 ${themeConfig.isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                <Palette className="w-3.5 h-3.5 text-amber-500" />
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
              <span className={`text-xs font-bold flex items-center gap-1.5 ${themeConfig.isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
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
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500 text-amber-600 hover:text-white dark:text-amber-300 dark:hover:text-white transition-all cursor-pointer active:scale-95"
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
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  themeConfig.isDark
                    ? 'text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
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
