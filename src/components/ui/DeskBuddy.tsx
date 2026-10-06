'use client';

import React, { useState, useEffect } from 'react';
import { DeskBuddyType, SoundProfile } from '@/types/preferences';
import { DESK_BUDDY_OPTIONS } from '@/lib/userPreferences';
import { playPopSound } from '@/lib/soundEffects';
import { X, Sparkles, MessageCircleHeart } from 'lucide-react';

interface DeskBuddyProps {
  buddyType: DeskBuddyType;
  soundProfile?: SoundProfile;
  completedTasksCount?: number;
  dailyGoal?: number;
}

const QUOTES_COLLECTION: Record<string, string[]> = {
  cat: [
    'Meow! Fokus satu tugas demi satu tugas, santai tapi pasti! 🐾',
    'Kerja bagus! Jangan lupa meregangkan badan seperti kucing 🐱',
    'Purr... Aku menemanimu sampai semua misi tuntas! ✨',
    'Hebat! Setiap coretan tugas adalah kemenangan kecil! 🏆',
    'Sudah minum air putih belum? Jaga kesehatan ya! 💧',
  ],
  dog: [
    'Guk guk! Semangat membara, kamu pasti bisa tuntaskan hari ini! 🦴',
    'Ayo selesaikan satu lagi, aku bangga padamu! 🐕',
    'Ekor bergoyang senang melihat progresmu yang rapi! 🎉',
    'Fokus, tekad kuat, dan pantang menyerah! Let\'s go! 🚀',
    'Kamu luar biasa! Istirahat sejenak kalau sudah lelah ya! 🎾',
  ],
  plant: [
    'Tumbuh pelan-pelan tapi pasti setiap hari 🌿',
    'Ketenangan pikiran membawa fokus terbaik 🍃',
    'Satu tugas selesai seperti satu tunas baru yang mekar 🌸',
    'Bernapas dalam-dalam, nikmati proses belajarmu 🌱',
    'Tanaman subur dari perawatan harian, begitu pun mimpimu ✨',
  ],
  coffee: [
    'Bip-bop! Aroma kopi hangat siap menemani fokusmu! ☕',
    'Energi maksimal! Selesaikan misi dengan teliti ⚡',
    'Tingkat kafein: optimal. Produktivitas: meroket! 🚀',
    'Sruput kopi, centang tugas, rasakan kepuasannya! 💯',
    'Jangan lupa jaga hidrasi dan tersenyum hari ini! 🍪',
  ],
};

export const DeskBuddy: React.FC<DeskBuddyProps> = ({
  buddyType,
  soundProfile = 'pop',
  completedTasksCount = 0,
  dailyGoal = 4,
}) => {
  const config = DESK_BUDDY_OPTIONS.find((b) => b.id === buddyType);

  const [bubbleText, setBubbleText] = useState<string>(() => config?.defaultQuote || '');
  const [isBubbleVisible, setIsBubbleVisible] = useState<boolean>(true);
  const [isJumping, setIsJumping] = useState<boolean>(false);

  // Sync state when buddyType changes (adjusting state during render)
  const [prevBuddyType, setPrevBuddyType] = useState<DeskBuddyType>(buddyType);
  if (buddyType !== prevBuddyType) {
    setPrevBuddyType(buddyType);
    if (config?.defaultQuote) {
      setBubbleText(config.defaultQuote);
      setIsBubbleVisible(true);
    }
  }

  // React to completed tasks increment (adjusting state during render)
  const [prevCount, setPrevCount] = useState<number>(completedTasksCount);
  if (completedTasksCount !== prevCount) {
    setPrevCount(completedTasksCount);
    if (completedTasksCount > prevCount && buddyType !== 'none') {
      setIsJumping(true);
      if (completedTasksCount >= dailyGoal) {
        setBubbleText('🎉 HORE! Target harian berhasil tercapai! Kamu juara sejati!');
      } else {
        const cheerQuotes = [
          'Mantap! Satu tugas lagi beres dengan sukses! ✨',
          'Keren banget, teruskan momentum positif ini! 🔥',
          'Satu langkah lebih dekat ke target harianmu! 🎯',
        ];
        const picked = cheerQuotes[completedTasksCount % cheerQuotes.length];
        setBubbleText(picked);
      }
      setIsBubbleVisible(true);
    }
  }

  // Jumping animation timeout reset
  useEffect(() => {
    if (isJumping) {
      const timer = setTimeout(() => setIsJumping(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isJumping]);

  if (!config || buddyType === 'none') {
    return null;
  }

  const handleBuddyClick = () => {
    playPopSound(soundProfile);
    setIsJumping(true);
    const quotes = QUOTES_COLLECTION[buddyType] || [config.defaultQuote];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setBubbleText(randomQuote);
    setIsBubbleVisible(true);
  };

  return (
    <aside
      aria-label="Teman Meja Virtual"
      className="fixed bottom-14 left-4 z-40 select-none flex flex-col items-start gap-1.5 transition-all"
    >
      {/* Speech Bubble */}
      {isBubbleVisible && (
        <div className="relative max-w-[210px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-amber-300 dark:border-amber-500/40 rounded-2xl p-2.5 shadow-xl text-slate-800 dark:text-slate-100 text-xs animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between gap-1 mb-1">
            <span className="font-bold text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {config.name}
            </span>
            <button
              onClick={() => setIsBubbleVisible(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer transition-colors"
              title="Tutup pesan"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-[11px] leading-snug font-medium text-slate-700 dark:text-slate-200">
            {bubbleText}
          </p>

          {/* Bubble tail pointed to the avatar below */}
          <div className="absolute -bottom-1.5 left-4 w-3 h-3 bg-white dark:bg-slate-900 border-r border-b border-amber-300 dark:border-amber-500/40 rotate-45" />
        </div>
      )}

      {/* Mascot Avatar Button */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleBuddyClick}
          className={`w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-100 via-orange-50 to-yellow-100 dark:from-slate-800 dark:to-slate-900 border-2 border-amber-300/80 dark:border-amber-500/60 shadow-lg flex items-center justify-center text-2xl cursor-pointer transition-all hover:scale-110 active:scale-95 ${
            isJumping ? '-translate-y-2 rotate-6 shadow-2xl ring-2 ring-amber-400' : 'hover:-translate-y-0.5'
          }`}
          title={`Klik ${config.name} untuk sapaan & motivasi!`}
        >
          <span>{config.avatar}</span>
        </button>

        {/* Toggle Speech bubble button if hidden */}
        {!isBubbleVisible && (
          <button
            onClick={handleBuddyClick}
            className="p-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-500 hover:text-amber-600 transition-colors cursor-pointer"
            title="Buka obrolan teman meja"
          >
            <MessageCircleHeart className="w-3.5 h-3.5 text-amber-500" />
          </button>
        )}
      </div>
    </aside>
  );
};
