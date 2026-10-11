'use client';

import React, { useState, useEffect } from 'react';
import { DeskBuddyType, DeskBuddyPosition, SoundProfile } from '@/types/preferences';
import { DESK_BUDDY_OPTIONS } from '@/lib/userPreferences';
import { playPopSound, playVictoryChime } from '@/lib/soundEffects';
import { X, Sparkles, MessageCircleHeart, Heart, Moon } from 'lucide-react';

interface DeskBuddyProps {
  buddyType: DeskBuddyType;
  soundProfile?: SoundProfile;
  completedTasksCount?: number;
  dailyGoal?: number;
  customName?: string;
  customQuotes?: string[];
  position?: DeskBuddyPosition;
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
  owl: [
    'Hoo-hoo! Setiap keputusan bijak lahir dari ketenangan pikiran 🌙',
    'Malam hening adalah teman terbaik bagi jiwa yang fokus 🦉',
    'Buku terbuka, tugas terarah, wawasan bertambah luas 📚',
    'Lihatlah gambaran besarnya, selesaikan dengan cermat! 🔭',
    'Istirahat sejenak agar ketajaman matamu tetap terjaga ✨',
  ],
  robot: [
    'Bip-bip-bop! Efisiensi tinggi terdeteksi hari ini! ⚡',
    'Kalkulasi selesai: peluang suksesmu adalah 100%! 🚀',
    'Algoritma harian: fokus, tuntaskan, lalu rayakan! 💻',
    'Jangan lupa bersihkan cache pikiran dengan istirahat sejenak 🤖',
    'Daya komputasi maksimal untuk misi hari ini! 🔥',
  ],
  toast: [
    'Hangat & renyah! Jangan lupa sarapan biar bertenaga ya! 🍓🍞',
    'Kamu sudah bekerja keras, jangan lupa ngemil yang manis-manis! 🥐',
    'Renyah di luar, lembut di dalam. Santai tapi tuntas! ✨',
    'Aroma semangat baru mengepul di setiap tugasmu! ☕',
    'Setiap gigitan kecil seperti langkah kecil menuju mimpimu 🧁',
  ],
};

const NIGHT_QUOTES = [
  'Hoam... sudah larut malam nih, istirahat dan tidur yang cukup ya! 🌙💤',
  'Matamu butuh istirahat. Simpan energimu untuk esok hari yang cerah! 😴',
  'Kerja kerasmu luar biasa hari ini, sekarang waktunya tidur nyenyak! 🛏️',
  'Malam sunyi untuk menenangkan pikiran. Jangan lupa matikan layar! 🌌',
];

const FEED_REACTIONS: Record<string, string> = {
  cat: 'Nyam nyam! Ikannya sedap banget meow! Rasa sayang bertambah! 🐟🥰',
  dog: 'Kriuk! Biskuit favoritku! Ekor bergoyang makin gembira! 🦴✨',
  plant: 'Sluuurp! Air segar bikin daunku makin hijau berkilau! 💧🌿',
  coffee: 'Nyam! Donat manis teman terbaik secangkir kopi! 🍩☕',
  owl: 'Krak! Biji kenari gurih penambah fokus malam! Hoo! 🌰✨',
  robot: 'Bzzzt! Daya baterai terisi penuh 100%! Sistem optimal! 🔋⚡',
  toast: 'Olesan selai manis bikin hariku makin cerah & renyah! 🍓🍞',
};

function getFriendshipLevel(hearts: number): { level: number; label: string } {
  if (hearts >= 50) return { level: 5, label: 'Soulmate Abadi 👑' };
  if (hearts >= 30) return { level: 4, label: 'Partner Sejati ⭐' };
  if (hearts >= 15) return { level: 3, label: 'Sahabat Karib 💖' };
  if (hearts >= 5) return { level: 2, label: 'Sahabat Akrab 🤝' };
  return { level: 1, label: 'Teman Baru 🌱' };
}

export const DeskBuddy: React.FC<DeskBuddyProps> = ({
  buddyType,
  soundProfile = 'pop',
  completedTasksCount = 0,
  dailyGoal = 4,
  customName,
  customQuotes = [],
  position = 'bottom-left',
}) => {
  const config = DESK_BUDDY_OPTIONS.find((b) => b.id === buddyType);

  const displayName = customName?.trim() || config?.name || 'Maskot';

  const [bubbleText, setBubbleText] = useState<string>(() => config?.defaultQuote || '');
  const [isBubbleVisible, setIsBubbleVisible] = useState<boolean>(true);
  const [isJumping, setIsJumping] = useState<boolean>(false);
  const [hearts, setHearts] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ceria_desk_buddy_hearts');
      return stored ? Number(stored) || 0 : 0;
    }
    return 0;
  });
  const [showHeartFloater, setShowHeartFloater] = useState<boolean>(false);

  const isNightMode = (() => {
    if (typeof window === 'undefined') return false;
    const hour = new Date().getHours();
    return hour >= 21 || hour < 5;
  })();

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
      if (completedTasksCount >= dailyGoal && dailyGoal > 0) {
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

    // Combine default quotes, character quotes, night quotes if applicable, and custom quotes
    let pool: string[] = [];
    if (isNightMode) {
      pool = [...NIGHT_QUOTES];
    }
    const charQuotes = QUOTES_COLLECTION[buddyType] || [config.defaultQuote];
    pool = [...pool, ...charQuotes];

    if (customQuotes && customQuotes.length > 0) {
      pool = [...pool, ...customQuotes.filter((q) => q.trim().length > 0)];
    }

    if (pool.length === 0) pool = [config.defaultQuote];

    const randomQuote = pool[Math.floor(Math.random() * pool.length)];
    setBubbleText(randomQuote);
    setIsBubbleVisible(true);
  };

  const handleFeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    playPopSound('bubble');
    setIsJumping(true);

    const newHearts = hearts + 1;
    setHearts(newHearts);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ceria_desk_buddy_hearts', String(newHearts));
    }

    setShowHeartFloater(true);
    setTimeout(() => setShowHeartFloater(false), 1200);

    const reaction = FEED_REACTIONS[buddyType] || 'Nyam! Terima kasih makanannya! 🥰';
    setBubbleText(reaction);
    setIsBubbleVisible(true);

    // Play special sound on level milestone
    if ([5, 15, 30, 50].includes(newHearts)) {
      playVictoryChime(soundProfile);
    }
  };

  const friendship = getFriendshipLevel(hearts);
  const isGoalReached = completedTasksCount >= dailyGoal && dailyGoal > 0;

  // Positioning classes
  const isTop = position.startsWith('top-');
  const isRight = position.endsWith('-right');

  const positionClasses = {
    'bottom-left': 'fixed bottom-14 left-4 z-40 select-none flex flex-col items-start gap-1.5',
    'bottom-right': 'fixed bottom-[152px] right-4 z-40 select-none flex flex-col items-end gap-1.5',
    'top-left': 'fixed top-20 left-4 z-40 select-none flex flex-col items-start gap-1.5',
    'top-right': 'fixed top-20 right-4 z-40 select-none flex flex-col items-end gap-1.5',
  }[position] || 'fixed bottom-14 left-4 z-40 select-none flex flex-col items-start gap-1.5';

  const bubbleTailClass = isTop
    ? isRight
      ? 'absolute -top-1.5 right-5 w-3 h-3 bg-white dark:bg-slate-900 border-l border-t border-amber-300 dark:border-amber-500/40 rotate-45'
      : 'absolute -top-1.5 left-5 w-3 h-3 bg-white dark:bg-slate-900 border-l border-t border-amber-300 dark:border-amber-500/40 rotate-45'
    : isRight
      ? 'absolute -bottom-1.5 right-5 w-3 h-3 bg-white dark:bg-slate-900 border-r border-b border-amber-300 dark:border-amber-500/40 rotate-45'
      : 'absolute -bottom-1.5 left-5 w-3 h-3 bg-white dark:bg-slate-900 border-r border-b border-amber-300 dark:border-amber-500/40 rotate-45';

  const speechBubble = isBubbleVisible && (
    <div className="relative max-w-[220px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-amber-300 dark:border-amber-500/40 rounded-2xl p-2.5 shadow-xl text-slate-800 dark:text-slate-100 text-xs animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-start justify-between gap-1 mb-1">
        <span className="font-bold text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
          {isNightMode ? <Moon className="w-3 h-3 text-indigo-400" /> : <Sparkles className="w-3 h-3" />}
          {displayName}
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

      {/* Bubble tail pointed to the avatar */}
      <div className={bubbleTailClass} />
    </div>
  );

  return (
    <aside aria-label="Teman Meja Virtual" className={`${positionClasses} transition-all`}>
      {/* If top, speech bubble appears below mascot */}
      {!isTop && speechBubble}

      {/* Mascot Avatar & Actions Bar */}
      <div className={`flex items-center gap-1.5 relative ${isRight ? 'flex-row-reverse' : ''}`}>
        {/* Floating Heart Particle Animation on Feed */}
        {showHeartFloater && (
          <div
            className={`absolute -top-7 ${
              isRight ? 'right-3' : 'left-3'
            } z-50 pointer-events-none flex items-center gap-1 text-xs font-black text-rose-500 animate-in fade-in slide-out-to-top-6 duration-1000`}
          >
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            <span>+1 ❤️</span>
          </div>
        )}

        {/* Mascot Avatar Button */}
        <div className="relative">
          {/* Champion Crown if Daily Goal reached */}
          {isGoalReached && (
            <div
              className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 text-base drop-shadow-md animate-bounce"
              title="Target harian tercapai! Maskot memakai mahkota juara 👑"
            >
              👑
            </div>
          )}

          {/* Night mode sleepy badge */}
          {isNightMode && (
            <div
              className="absolute -top-1 -right-1 z-10 bg-indigo-900/90 text-indigo-200 text-[10px] px-1 rounded-full border border-indigo-400/50 shadow-xs"
              title="Mode Malam: Maskot sedang mengantuk 😴"
            >
              💤
            </div>
          )}

          <button
            onClick={handleBuddyClick}
            className={`w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-100 via-orange-50 to-yellow-100 dark:from-slate-800 dark:to-slate-900 border-2 border-amber-300/80 dark:border-amber-500/60 shadow-lg flex items-center justify-center text-2xl cursor-pointer transition-all hover:scale-110 active:scale-95 ${
              isJumping ? '-translate-y-2 rotate-6 shadow-2xl ring-2 ring-amber-400' : 'hover:-translate-y-0.5'
            }`}
            title={`Klik ${displayName} untuk sapaan! (Level: ${friendship.label}, ${hearts} ❤️)`}
          >
            <span>{config.avatar}</span>
          </button>
        </div>

        {/* Feed Treat Button */}
        {config.treatEmoji && (
          <button
            onClick={handleFeed}
            className="h-8 px-2 rounded-xl bg-white/95 dark:bg-slate-800/95 border border-amber-300/80 dark:border-amber-500/40 shadow-xs text-xs font-bold text-amber-900 dark:text-amber-200 hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer transition-all"
            title={`Beri makan ${displayName} dengan ${config.treatName} (+1 ❤️)`}
          >
            <span>{config.treatEmoji}</span>
            <span className="text-[10px] hidden sm:inline text-amber-700 dark:text-amber-300">
              {hearts > 0 ? hearts : 'Feed'}
            </span>
            <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
          </button>
        )}

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

      {/* If top, speech bubble appears below mascot */}
      {isTop && speechBubble}
    </aside>
  );
};
