'use client';

import React, { useState } from 'react';
import { X, Sparkles, Shuffle, Check, Quote as QuoteIcon, Palette } from 'lucide-react';
import {
  QUOTE_STYLE_PRESETS,
  INSPIRING_QUOTES,
  renderQuoteToImage,
} from '@/lib/quoteGenerator';
import { playPopSound } from '@/lib/soundEffects';
import { SoundProfile } from '@/types/preferences';

interface QuoteStickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (imageUrl: string, quoteText: string) => Promise<void> | void;
  soundProfile?: SoundProfile;
  isDark?: boolean;
}

export const QuoteStickerModal: React.FC<QuoteStickerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  soundProfile = 'pop',
  isDark = false,
}) => {
  const [quoteText, setQuoteText] = useState('Fokus pada langkah kecil hari ini, hasil besar akan mengikuti.');
  const [author, setAuthor] = useState('Semangat Diri');
  const [selectedStyle, setSelectedStyle] = useState('sunset');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleRandomQuote = () => {
    playPopSound(soundProfile);
    const rand = INSPIRING_QUOTES[Math.floor(Math.random() * INSPIRING_QUOTES.length)];
    setQuoteText(rand.text);
    setAuthor(rand.author);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteText.trim()) return;

    try {
      setIsGenerating(true);
      const dataUrl = await renderQuoteToImage(quoteText, author, selectedStyle);
      await onSubmit(dataUrl, quoteText.trim());
      playPopSound(soundProfile);
      onClose();
    } catch (err) {
      console.error('Gagal membuat stiker ocehan:', err);
      alert('Terjadi kesalahan saat memproses stiker quote.');
    } finally {
      setIsGenerating(false);
    }
  };

  const activePreset = QUOTE_STYLE_PRESETS.find((p) => p.id === selectedStyle) || QUOTE_STYLE_PRESETS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col transition-all ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-white'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-rose-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md text-base">
              💬
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Buat Stiker Ocehanmu</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Ubah kata mutiara, motto, atau unek-unek menjadi stiker artistik
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          {/* Quote Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <QuoteIcon className="w-3.5 h-3.5 text-amber-500" />
                <span>Isi Ocehan / Kata Mutiara</span>
              </label>
              <button
                type="button"
                onClick={handleRandomQuote}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                title="Ambil kutipan acak"
              >
                <Shuffle className="w-3 h-3" />
                <span>Acak Quote 🎲</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              placeholder="Ketik quote, pengingat, atau ocehan motivasimu..."
              required
              className={`w-full px-3.5 py-2.5 rounded-2xl border text-sm transition-all outline-hidden resize-none leading-relaxed ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white focus:border-amber-400'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-amber-500'
              }`}
            />
          </div>

          {/* Author / Source */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Penulis / Sumber (Opsional)
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Contoh: Steve Jobs / Pengingat Diri / Anonim"
              className={`w-full px-3.5 py-2 rounded-2xl border text-sm transition-all outline-hidden ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white focus:border-amber-400'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-amber-500'
              }`}
            />
          </div>

          {/* Style Presets */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-amber-500" />
              <span>Pilihan Gaya Stiker</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {QUOTE_STYLE_PRESETS.map((preset) => {
                const isSelected = selectedStyle === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      playPopSound(soundProfile);
                      setSelectedStyle(preset.id);
                    }}
                    style={{
                      background: `linear-gradient(135deg, ${preset.bgGradient[0]}, ${preset.bgGradient[1]})`,
                      color: preset.textColor,
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all shadow-2xs relative flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-amber-500 ring-offset-2 scale-[1.02] border-transparent'
                        : 'border-black/10 hover:scale-[1.01]'
                    }`}
                  >
                    <span className="truncate">{preset.name}</span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 ml-1">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview Box */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Pratinjau Hasil Stiker:
            </label>
            <div
              style={{
                background: `linear-gradient(135deg, ${activePreset.bgGradient[0]}, ${activePreset.bgGradient[1]})`,
                borderColor: activePreset.border,
              }}
              className="p-5 rounded-3xl border-2 shadow-lg transition-all"
            >
              <div
                style={{ color: activePreset.quoteColor }}
                className="text-2xl font-black leading-none mb-1 select-none"
              >
                “
              </div>
              <p
                style={{
                  color: activePreset.textColor,
                  fontFamily: activePreset.fontFamily,
                }}
                className="text-sm sm:text-base font-bold leading-snug whitespace-pre-wrap break-words"
              >
                {quoteText.trim() || 'Ketik quote Anda di atas...'}
              </p>
              {author.trim() && (
                <p
                  style={{ color: activePreset.authorColor }}
                  className="mt-2 text-xs font-semibold italic"
                >
                  — {author.trim()}
                </p>
              )}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isGenerating || !quoteText.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-extrabold shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Membuat Stiker...' : 'Tempelkan Stiker Ocehan ✨'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
