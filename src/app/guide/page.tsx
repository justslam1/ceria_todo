'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  Check,
  CheckSquare,
  Square,
  Volume2,
  VolumeX,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Gamepad2,
  Palette,
  Flame,
  CloudRain,
  Coffee,
  Bookmark,
  Keyboard,
  Zap,
  Award,
  Trash2,
  MousePointer,
  CheckCircle2,
} from 'lucide-react';
import { UserPreferences } from '@/types/preferences';
import { loadUserPreferences, getThemeConfig, DESK_BUDDY_OPTIONS } from '@/lib/userPreferences';
import { triggerCelebration } from '@/lib/confetti';
import { playPopSound, playVictoryChime, isSoundMuted, setSoundMuted } from '@/lib/soundEffects';
import { ambientSound, AmbientSoundType } from '@/lib/ambientSound';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface PlacedSticker {
  id: string;
  emoji: string;
  x: number;
  y: number;
  rotation: number;
}

const STICKER_PALETTE = ['⭐', '☕', '🐱', '🚀', '🥑', '💡', '💮', '🍕', '🎯', '🍩', '💖', '🔥'];

export default function GuidePage() {
  const { language } = useLanguage();
  const isId = language === 'id';

  const [preferences] = useState<UserPreferences>(() =>
    typeof window !== 'undefined' ? loadUserPreferences() : ({} as UserPreferences)
  );
  const themeConfig = getThemeConfig(preferences);
  const [muted, setMuted] = useState<boolean>(() =>
    typeof window !== 'undefined' ? isSoundMuted() : false
  );

  // Sticker Stamp Playground
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [selectedSticker, setSelectedSticker] = useState<string>('⭐');
  const scrapbookRef = useRef<HTMLDivElement>(null);

  // Chapter 1: WhatsApp Magic Simulation
  const [isWAParsed, setIsWAParsed] = useState(false);
  const [subtasksCompleted, setSubtasksCompleted] = useState<boolean[]>([true, false, false]);

  // Chapter 2: View Switcher Simulation
  const [previewTab, setPreviewTab] = useState<'kanban' | 'notes'>('kanban');

  // Chapter 3: Pomodoro & Ambient Simulation
  const [activeAmbient, setActiveAmbient] = useState<AmbientSoundType>('none');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);

  // Chapter 4: Desk Buddy Showcase
  const [selectedBuddyIndex, setSelectedBuddyIndex] = useState(0);
  const [buddyReaction, setBuddyReaction] = useState<string>(
    DESK_BUDDY_OPTIONS[0]?.defaultQuote || 'Meow! Satu per satu pasti kelar kok! 🐾'
  );

  // Chapter 5: Pressed Key State for Shortcut demo
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  // Completion Badge
  const [isGraduated, setIsGraduated] = useState(false);

  useEffect(() => {
    return () => {
      ambientSound.stop();
    };
  }, []);

  // Timer countdown simulation
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 25 * 60));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
    if (!next) playPopSound();
  };

  const handleStampSticker = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrapbookRef.current) return;
    const rect = scrapbookRef.current.getBoundingClientRect();
    const x = Math.max(20, Math.min(rect.width - 40, e.clientX - rect.left));
    const y = Math.max(20, Math.min(rect.height - 40, e.clientY - rect.top));
    const rotation = Math.floor(Math.random() * 40) - 20;

    const newSticker: PlacedSticker = {
      id: `${Date.now()}-${Math.random()}`,
      emoji: selectedSticker,
      x,
      y,
      rotation,
    };

    setStickers((prev) => [...prev, newSticker]);
    playPopSound();
  };

  const handleClearStickers = () => {
    setStickers([]);
    playPopSound();
  };

  const handleToggleAmbient = (type: AmbientSoundType) => {
    if (activeAmbient === type) {
      ambientSound.stop();
      setActiveAmbient('none');
    } else {
      ambientSound.play(type);
      setActiveAmbient(type);
      playPopSound();
    }
  };

  const handleToggleSubtask = (index: number) => {
    setSubtasksCompleted((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
    playPopSound();
  };

  const handleGraduation = () => {
    setIsGraduated(true);
    triggerCelebration();
    playVictoryChime();
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`min-h-screen relative overflow-x-hidden transition-colors duration-300 font-sans ${
        themeConfig.isDark
          ? 'bg-[#12141a] text-slate-100'
          : 'bg-[#faf6ee] text-stone-800'
      }`}
      style={{
        backgroundImage: themeConfig.isDark
          ? 'radial-gradient(#262a36 1.5px, transparent 1.5px)'
          : 'radial-gradient(#e4ded3 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Top Floating Scrapbook Ribbon Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-amber-50/80 dark:bg-slate-900/80 border-b border-amber-900/10 dark:border-slate-800 shadow-xs px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-200/80 hover:bg-amber-300/90 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-950 dark:text-amber-300 font-bold text-xs sm:text-sm shadow-xs border border-amber-300/80 dark:border-slate-700 transition-all active:scale-95 hover:-translate-x-0.5"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>{isId ? 'Kembali ke Papan' : 'Back to Board'}</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-slate-800 text-amber-800 dark:text-amber-400 border border-amber-300/60 dark:border-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              <span>{isId ? 'Buku Panduan Komik' : 'Comic Scrapbook'}</span>
            </span>

            <button
              onClick={toggleSound}
              className="p-2 rounded-xl border border-amber-300/70 dark:border-slate-700 bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:scale-105 active:scale-95 transition-all"
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-600" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Scrapbook Container */}
      <main
        ref={scrapbookRef}
        onClick={handleStampSticker}
        className="max-w-5xl mx-auto px-4 py-8 sm:py-12 relative cursor-crosshair"
      >
        {/* Render Clicked Stamped Stickers */}
        {stickers.map((st) => (
          <div
            key={st.id}
            style={{
              position: 'absolute',
              left: `${st.x}px`,
              top: `${st.y}px`,
              transform: `translate(-50%, -50%) rotate(${st.rotation}deg)`,
              pointerEvents: 'none',
              zIndex: 30,
            }}
            className="text-3xl select-none filter drop-shadow-md animate-in zoom-in-50 duration-150"
          >
            {st.emoji}
          </div>
        ))}

        {/* Hero Header Scrapbook Card */}
        <section
          onClick={(e) => e.stopPropagation()}
          className="relative mb-12 p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border-2 border-dashed border-amber-400/80 dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.06)] -rotate-0.5"
        >
          {/* Washi Tape on Top Center */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-36 h-7 bg-amber-200/90 dark:bg-amber-600/60 backdrop-blur-xs border-y border-dashed border-amber-400/80 rounded-xs shadow-xs rotate-1 pointer-events-none flex items-center justify-center">
            <span className="text-[10px] font-black text-amber-900 dark:text-amber-100 tracking-widest uppercase">
              ★ CERIA SCRAPBOOK ★
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isId ? 'Panduan Satset & Santai' : 'Fun & Satset Quick Guide'}</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                {isId ? 'Kelola Tugas Jadi Seru & Ceria! ✨' : 'Make Task Management Fun! ✨'}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                {isId
                  ? 'Bosan dengan to-do list kaku yang bikin stres? Di sini tugas disulap jadi strip komik warna-warni, ada teman meja lucu, musik fokus, dan game seru saat istirahat!'
                  : 'Tired of boring and stressful task lists? Here your tasks turn into cheerful colorful notes, accompanied by a desk buddy, focus ambient sounds, and relaxing mini games!'}
              </p>
            </div>

            {/* Sticker Drawer Tool */}
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-slate-800/80 border border-amber-200 dark:border-slate-700 shadow-inner flex flex-col items-center gap-2.5 shrink-0">
              <div className="flex items-center justify-between w-full text-xs font-bold text-amber-900 dark:text-amber-200">
                <span className="flex items-center gap-1.5">
                  <MousePointer className="w-3.5 h-3.5" />
                  {isId ? 'Klik di mana saja untuk menempel:' : 'Click canvas to stamp:'}
                </span>
                {stickers.length > 0 && (
                  <button
                    onClick={handleClearStickers}
                    className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    {isId ? 'Bersihkan' : 'Clear'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-[240px]">
                {STICKER_PALETTE.map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setSelectedSticker(st);
                      playPopSound();
                    }}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg transition-transform active:scale-90 cursor-pointer ${
                      selectedSticker === st
                        ? 'bg-amber-300 dark:bg-amber-500 scale-110 shadow-sm border border-amber-400'
                        : 'bg-white dark:bg-slate-700 hover:scale-105 border border-amber-200/60 dark:border-slate-600'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* COMIC CHAPTER 1: WhatsApp Quick Paste */}
        <section
          onClick={(e) => e.stopPropagation()}
          className="relative mb-14 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-slate-800 shadow-md rotate-0.5"
        >
          {/* Top Washi Tape Corner */}
          <div className="absolute -top-3 left-6 w-24 h-6 bg-emerald-200/90 dark:bg-emerald-700/60 border-y border-dashed border-emerald-400/80 rounded-xs -rotate-2 pointer-events-none" />

          <div className="mb-6 flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                {isId ? 'BABAK 1' : 'CHAPTER 1'}
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>💬</span>
                <span>{isId ? 'Tragedi Chat WA Numpuk' : 'The WhatsApp Chat Avalanche'}</span>
              </h2>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
              ⚡ Quick Paste Magic
            </span>
          </div>

          {/* Comic Strips Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Panel 1 */}
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-slate-800/60 border border-amber-200/60 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Panel 1</span>
                <span>🤯 Panik</span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 font-mono shadow-inner">
                <p className="font-bold text-emerald-700 dark:text-emerald-400 mb-1">Pesan dari Pak Bos:</p>
                <p>&quot;Tolong rapikan slide deck, kirim invoice ke vendor, dan beli kopi cold brew ya!&quot;</p>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {isId
                  ? 'Pusing harus ketik ulang satu-satu jadi daftar tugas manual? Jangan buang waktumu!'
                  : 'Stressed typing all points into your to-do list one by one? Save your precious time!'}
              </p>
            </div>

            {/* Panel 2 */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-slate-800/60 border border-emerald-200/60 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <span>Panel 2</span>
                <span>🪄 Sihir 1 Detik</span>
              </div>
              <div className="flex items-center justify-center p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-700">
                <span className="text-3xl animate-bounce">📋 ➔ ✨ ➔ ✅</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {isId
                  ? 'Cukup salin (Ctrl+C) chat WA lalu klik tombol "Quick Paste WA" di pojok atas!'
                  : 'Simply copy (Ctrl+C) the WA message and click the "Quick Paste" button in the board!'}
              </p>
            </div>

            {/* Panel 3 */}
            <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-slate-800/60 border border-sky-200/60 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-sky-700 dark:text-sky-400">
                <span>Panel 3</span>
                <span>🎉 Hasil Satset</span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-700 text-xs space-y-1.5 shadow-xs">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Tugas Baru Otomatis</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-5">
                  ✓ Checklist subtask rapi siap dicentang!
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {isId
                  ? 'Sistem otomatis memecah kalimat jadi subtask checklist yang interaktif.'
                  : 'The smart parser breaks bullet points into checkable subtasks automatically.'}
              </p>
            </div>
          </div>

          {/* Interactive Playground for Chapter 1 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-800 border-2 border-dashed border-emerald-300 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase">
                  {isId ? '🎯 Coba Simulasi Langsung:' : '🎯 Try Live Simulation:'}
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {isWAParsed
                    ? isId
                      ? 'Hebat! Coba centang subtask di kartu tugas bawah ini:'
                      : 'Great! Try checking the subtasks in this card below:'
                    : isId
                    ? 'Klik tombol di kanan untuk melihat cara kerja Quick Paste!'
                    : 'Click the button on the right to see Quick Paste in action!'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsWAParsed((prev) => !prev);
                  playPopSound();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isWAParsed ? (isId ? 'Ulangi Contoh' : 'Reset Demo') : (isId ? '✨ Sulap Jadi Tugas!' : '✨ Turn into Task!')}</span>
              </button>
            </div>

            {isWAParsed && (
              <div className="mt-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-slate-700 shadow-sm animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span>📌</span>
                    <span>Tugas Tim Presentasi & Kopi</span>
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Prioritas Tinggi 🔥
                  </span>
                </div>

                <div className="space-y-2">
                  {[
                    'Rapikan slide presentasi pitch deck',
                    'Kirim draft invoice ke Pak Budi',
                    'Beli kopi cold brew & camilan sore',
                  ].map((sub, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleToggleSubtask(idx)}
                      className="flex items-center gap-2.5 text-xs text-left w-full p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      {subtasksCompleted[idx] ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span
                        className={
                          subtasksCompleted[idx]
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-700 dark:text-slate-200 font-medium'
                        }
                      >
                        {sub}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* COMIC CHAPTER 2: Two Worlds: Kanban vs Sticky Notes */}
        <section
          onClick={(e) => e.stopPropagation()}
          className="relative mb-14 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-slate-800 shadow-md -rotate-0.5"
        >
          {/* Top Washi Tape Corner */}
          <div className="absolute -top-3 right-8 w-24 h-6 bg-purple-200/90 dark:bg-purple-700/60 border-y border-dashed border-purple-400/80 rounded-xs rotate-2 pointer-events-none" />

          <div className="mb-6 flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                {isId ? 'BABAK 2' : 'CHAPTER 2'}
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>📋 ↔️ 📝</span>
                <span>{isId ? 'Dua Dunia: Rapi atau Bebas?' : 'Two Modes: Structured or Free?'}</span>
              </h2>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
              Mode Switcher
            </span>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
            {isId
              ? 'Tiap orang punya gaya kerja berbeda. Ceria Todo memberi kamu dua cara pandang yang bisa diganti kapan saja hanya dalam 1 klik di Navbar atas!'
              : 'Everyone has a unique work style. Ceria Todo gives you two views you can switch between with one click anytime in the top Navbar!'}
          </p>

          {/* Interactive Tab Switcher Demo */}
          <div className="p-4 sm:p-6 rounded-2xl bg-amber-50/60 dark:bg-slate-800/60 border border-amber-200/80 dark:border-slate-700">
            <div className="flex items-center justify-center gap-2 mb-6">
              <button
                onClick={() => {
                  setPreviewTab('kanban');
                  playPopSound();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  previewTab === 'kanban'
                    ? 'bg-amber-500 text-white shadow-md scale-105'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-amber-100'
                }`}
              >
                <span>📋</span>
                <span>{isId ? 'Papan Tugas (Kanban)' : 'Kanban Board'}</span>
              </button>

              <button
                onClick={() => {
                  setPreviewTab('notes');
                  playPopSound();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  previewTab === 'notes'
                    ? 'bg-purple-600 text-white shadow-md scale-105'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-purple-100'
                }`}
              >
                <span>📝</span>
                <span>{isId ? 'Papan Catatan (Sticky Notes)' : 'Sticky Notes Board'}</span>
              </button>
            </div>

            {/* View Preview Display */}
            {previewTab === 'kanban' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-200">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border-t-4 border-amber-400 shadow-2xs space-y-2">
                  <span className="text-[11px] font-black text-amber-800 dark:text-amber-400 uppercase">
                    📌 Rencana (To Do)
                  </span>
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-slate-800 border border-amber-200/60 text-xs font-semibold">
                    Riset materi presentasi
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border-t-4 border-sky-400 shadow-2xs space-y-2">
                  <span className="text-[11px] font-black text-sky-800 dark:text-sky-400 uppercase">
                    ⏳ Dikerjakan (In Progress)
                  </span>
                  <div className="p-2.5 rounded-lg bg-sky-50 dark:bg-slate-800 border border-sky-200/60 text-xs font-semibold">
                    Desain mockup halaman
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border-t-4 border-emerald-400 shadow-2xs space-y-2">
                  <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-400 uppercase">
                    🎉 Selesai (Done)
                  </span>
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-slate-800 border border-emerald-200/60 text-xs font-semibold line-through text-slate-400">
                    Kirim email konfirmasi
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-200">
                <div className="p-4 rounded-xl bg-[#fef9c3] dark:bg-yellow-950/80 border border-yellow-300 dark:border-yellow-800 shadow-xs -rotate-2 relative">
                  <div className="w-3 h-3 rounded-full bg-red-400 shadow-xs absolute -top-1.5 left-1/2 -translate-x-1/2" />
                  <p className="text-xs font-bold text-yellow-950 dark:text-yellow-200 mt-1">
                    💡 Ide nama brand baru yang catchy!
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#fce7f3] dark:bg-pink-950/80 border border-pink-300 dark:border-pink-800 shadow-xs rotate-1 relative">
                  <div className="w-3 h-3 rounded-full bg-sky-400 shadow-xs absolute -top-1.5 left-1/2 -translate-x-1/2" />
                  <p className="text-xs font-bold text-pink-950 dark:text-pink-200 mt-1">
                    🛒 Belanja: susu almond & kopi bubuk
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#ccfbf1] dark:bg-teal-950/80 border border-teal-300 dark:border-teal-800 shadow-xs -rotate-1 relative">
                  <div className="w-3 h-3 rounded-full bg-purple-400 shadow-xs absolute -top-1.5 left-1/2 -translate-x-1/2" />
                  <p className="text-xs font-bold text-teal-950 dark:text-teal-200 mt-1">
                    🎯 Target bulan ini: tidur sebelum jam 11
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* COMIC CHAPTER 3: Anti-Burnout Club: Pomodoro & Games */}
        <section
          onClick={(e) => e.stopPropagation()}
          className="relative mb-14 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-slate-800 shadow-md rotate-0.5"
        >
          {/* Top Washi Tape Corner */}
          <div className="absolute -top-3 left-10 w-28 h-6 bg-rose-200/90 dark:bg-rose-700/60 border-y border-dashed border-rose-400/80 rounded-xs -rotate-1 pointer-events-none" />

          <div className="mb-6 flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                {isId ? 'BABAK 3' : 'CHAPTER 3'}
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>🍅 🎧 👾</span>
                <span>{isId ? 'Anti-Burnout Club: Fokus & Rehat' : 'Anti-Burnout: Focus & Chill'}</span>
              </h2>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800">
              Pomodoro + Ambient + Games
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Ambient Sound & Pomodoro Simulation */}
            <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-slate-800/70 border border-amber-200/80 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Timer className="w-4 h-4 text-rose-500" />
                  <span>Pomodoro & Ambient Lofi</span>
                </span>
                <span className="text-lg font-black font-mono text-slate-800 dark:text-slate-100">
                  {formatTimer(timerSeconds)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsTimerRunning((prev) => !prev);
                    playPopSound();
                  }}
                  className="flex-1 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                >
                  {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isTimerRunning ? (isId ? 'Jeda' : 'Pause') : (isId ? 'Mulai Fokus' : 'Start Focus')}</span>
                </button>
                <button
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSeconds(25 * 60);
                    playPopSound();
                  }}
                  className="p-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-200 cursor-pointer"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Ambient Sound Buttons */}
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">
                  {isId ? '🎵 Coba Suara Penenang (Web Audio Asli):' : '🎵 Try Procedural Ambient Audio:'}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleToggleAmbient('rain')}
                    className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                      activeAmbient === 'rain'
                        ? 'bg-sky-500 text-white border-sky-600 shadow-xs'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    <CloudRain className="w-4 h-4 text-sky-400" />
                    <span>Hujan 🌧️</span>
                  </button>

                  <button
                    onClick={() => handleToggleAmbient('cafe')}
                    className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                      activeAmbient === 'cafe'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    <Coffee className="w-4 h-4 text-amber-500" />
                    <span>Kafe ☕</span>
                  </button>

                  <button
                    onClick={() => handleToggleAmbient('fire')}
                    className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                      activeAmbient === 'fire'
                        ? 'bg-orange-500 text-white border-orange-600 shadow-xs'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span>Api Unggun 🔥</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Secret Mini Games */}
            <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-slate-800/70 border border-indigo-200/80 dark:border-slate-700 space-y-3">
              <span className="text-xs font-black uppercase text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <Gamepad2 className="w-4 h-4 text-indigo-500" />
                <span>{isId ? '3 Game Rahasia Saat Istirahat' : '3 Secret Relaxation Games'}</span>
              </span>

              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="text-lg">🐍</span>
                    <div>
                      <p className="text-slate-800 dark:text-slate-100">Buddy Snake</p>
                      <p className="text-[10px] text-slate-500 font-normal">Makan camilan bareng maskotmu</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    Klasik
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="text-lg">🔨</span>
                    <div>
                      <p className="text-slate-800 dark:text-slate-100">Whack-A-Distraction</p>
                      <p className="text-[10px] text-slate-500 font-normal">Pukul godaan rebahan & sosmed!</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                    Anti Jenuh
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="text-lg">🏓</span>
                    <div>
                      <p className="text-slate-800 dark:text-slate-100">Focus Pong</p>
                      <p className="text-[10px] text-slate-500 font-normal">Tenis meja retro santai 5 menit</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    Refleks
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-indigo-800 dark:text-indigo-300 bg-indigo-100/70 dark:bg-indigo-950/60 p-2 rounded-xl">
                💡 <strong>Tips:</strong> Klik langsung maskot <em>Desk Buddy</em> di pojok kanan bawah papan untuk membuka game ini!
              </p>
            </div>
          </div>
        </section>

        {/* COMIC CHAPTER 4: Desk Buddy & Personalization */}
        <section
          onClick={(e) => e.stopPropagation()}
          className="relative mb-14 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-slate-800 shadow-md -rotate-0.5"
        >
          {/* Top Washi Tape Corner */}
          <div className="absolute -top-3 right-12 w-28 h-6 bg-amber-300/90 dark:bg-amber-700/60 border-y border-dashed border-amber-500/80 rounded-xs rotate-2 pointer-events-none" />

          <div className="mb-6 flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                {isId ? 'BABAK 4' : 'CHAPTER 4'}
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>🐱 🎨</span>
                <span>{isId ? 'Teman Meja & Papan Seleramu' : 'Desk Buddy & Personal Touch'}</span>
              </h2>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
              Desk Buddy
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Buddy Speech Showcase */}
            <div className="p-6 rounded-2xl bg-amber-50/80 dark:bg-slate-800/80 border border-amber-200 dark:border-slate-700 flex flex-col items-center text-center space-y-3">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-700 border-2 border-amber-300 flex items-center justify-center text-5xl shadow-md animate-bounce">
                  {DESK_BUDDY_OPTIONS[selectedBuddyIndex]?.avatar || '🐱'}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-700 shadow-xs max-w-sm">
                <p className="text-xs font-bold text-amber-950 dark:text-amber-200">
                  &quot;{buddyReaction}&quot;
                </p>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isId ? 'Pilih teman mejamu di bawah ini:' : 'Choose your desk buddy below:'}
              </p>

              {/* Buddy Selector Buttons */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {DESK_BUDDY_OPTIONS.filter((b) => b.id !== 'none').map((b, idx) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setSelectedBuddyIndex(idx);
                      setBuddyReaction(b.defaultQuote);
                      playPopSound();
                    }}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition-all cursor-pointer ${
                      selectedBuddyIndex === idx
                        ? 'bg-amber-300 border-amber-500 scale-110 shadow-sm'
                        : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:scale-105'
                    }`}
                    title={b.name}
                  >
                    {b.avatar}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Tips on Aesthetic */}
            <div className="space-y-3">
              <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-orange-500" />
                <span>{isId ? 'Eksplorasi Fitur Estetik' : 'Aesthetic Customization'}</span>
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">✓</span>
                  <span><strong>Palet Warna Tema:</strong> Ganti warna pastel, tema senja, hingga neon gelap via tombol Palette di Navbar.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">✓</span>
                  <span><strong>Papan Catatan & Washi Tape:</strong> Tempel sticky notes dengan berbagai pilihan pin & selotip bermotif.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">✓</span>
                  <span><strong>Showcase Galeri:</strong> Bangga dengan setup papanmu? Bagikan ke galeri dan contek kreasi pengguna lain!</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* COMIC CHAPTER 5: Cheat Sheet Shortcuts */}
        <section
          onClick={(e) => e.stopPropagation()}
          className="relative mb-14 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-slate-800 shadow-md"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-sky-500" />
              <span>{isId ? 'Tombol Cepat Satset (Keyboard Shortcuts)' : 'Quick Keyboard Shortcuts'}</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {isId ? 'Klik tombol untuk uji ketukan:' : 'Click key to test sound:'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'N', label: isId ? 'Tugas Baru' : 'New Task', icon: '📝' },
              { key: 'P', label: isId ? 'Pomodoro' : 'Pomodoro', icon: '🍅' },
              { key: 'W', label: isId ? 'Quick Paste' : 'Quick Paste', icon: '⚡' },
              { key: '?', label: isId ? 'Buku Panduan' : 'Quick Guide', icon: '📖' },
            ].map((sc) => (
              <button
                key={sc.key}
                onClick={() => {
                  setPressedKey(sc.key);
                  playPopSound();
                  setTimeout(() => setPressedKey(null), 300);
                }}
                className={`p-3 rounded-2xl border transition-all text-center flex flex-col items-center gap-1.5 cursor-pointer ${
                  pressedKey === sc.key
                    ? 'bg-amber-300 dark:bg-amber-600 border-amber-500 scale-95 shadow-inner'
                    : 'bg-amber-50/60 dark:bg-slate-800/80 border-amber-200 dark:border-slate-700 hover:-translate-y-0.5 shadow-2xs'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 shadow-xs border border-slate-200 dark:border-slate-600 flex items-center justify-center font-black text-base font-mono">
                  {sc.key}
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {sc.icon} {sc.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* GRADUATION / FINISH STAMP */}
        <section
          onClick={(e) => e.stopPropagation()}
          className="text-center p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-amber-100/70 to-orange-100/70 dark:from-slate-800 dark:to-slate-900 border-2 border-dashed border-amber-400 dark:border-slate-700 shadow-lg relative overflow-hidden"
        >
          {!isGraduated ? (
            <div className="space-y-4">
              <span className="text-4xl">🎓</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {isId ? 'Sudah Siap Jadi Master Satset?' : 'Ready to Become a Satset Master?'}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                {isId
                  ? 'Tekan stempel di bawah untuk merayakan selesainya membaca panduan ini dan mulai beraksi!'
                  : 'Press the rubber stamp below to celebrate finishing the guide and start taking action!'}
              </p>

              <button
                type="button"
                onClick={handleGraduation}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-black text-sm sm:text-base shadow-lg hover:shadow-xl active:scale-95 transition-all cursor-pointer -rotate-1 hover:rotate-0"
              >
                <Award className="w-5 h-5" />
                <span>{isId ? '💮 STEMPEL: LULUS PANDUAN CERIA!' : '💮 STAMP: CERIA GUIDE PASSED!'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-5 animate-in zoom-in-90 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center text-3xl shadow-lg">
                <Check className="w-10 h-10 stroke-[3]" />
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
                {isId ? '🎉 Selamat! Kamu Resmi Lulus!' : '🎉 Congratulations! You Passed!'}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto font-medium">
                {isId
                  ? 'Kini kamu siap menguasai alur kerja harian tanpa stres. Yuk mulai tambahkan tugas pertamamu di papan!'
                  : 'Now you are ready to conquer your daily workflow stress-free. Go ahead and start adding tasks on your board!'}
              </p>

              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>{isId ? 'Menuju Papan Utama 🚀' : 'Go to Main Board 🚀'}</span>
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
