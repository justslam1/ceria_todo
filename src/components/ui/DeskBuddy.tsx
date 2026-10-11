'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DeskBuddyType, DeskBuddyPosition, DeskBuddySize, SoundProfile } from '@/types/preferences';
import { DESK_BUDDY_OPTIONS } from '@/lib/userPreferences';
import { playPopSound, playVictoryChime } from '@/lib/soundEffects';
import { X, Sparkles, Heart, Moon, Zap } from 'lucide-react';

interface DeskBuddyProps {
  buddyType: DeskBuddyType;
  soundProfile?: SoundProfile;
  completedTasksCount?: number;
  dailyGoal?: number;
  customName?: string;
  customQuotes?: string[];
  position?: DeskBuddyPosition;
  size?: DeskBuddySize;
  isLoading?: boolean;
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

const HUNGRY_QUOTES: Record<string, string[]> = {
  cat: [
    'Meoww... Perutku berbunyi keroncongan 🥺 Selesaikan tugas biar dapat ikan lezat ya!',
    'Makan ikan bakal bikin aku semangat lagi! Ayo selesaikan satu tugas lagi! 🐟',
  ],
  dog: [
    'Guk... Ekor lemas karena lapar 🥺 Tuntaskan tugas di papan agar kita dapat biskuit!',
    'Aroma biskuit tulang tercium saat misi selesai! Ayo semangat! 🦴',
  ],
  plant: [
    'Daunku agak layu butuh siraman air segar 💧 Selesaikan tugas untuk menyiramku!',
    'Tanaman butuh air, pikiran butuh fokus! Ayo tuntaskan tugasmu 🌱',
  ],
  coffee: [
    'Bip-bop... Level energi menipis 🔋 Butuh donat manis untuk isi ulang daya!',
    'Selesaikan tugas untuk mengisi stok baterai & donat kafein! 🍩',
  ],
  owl: [
    'Hoo... Fokus malam butuh camilan biji kenari 🌰 Selesaikan misi untuk dapat stok!',
    'Mata butuh nutrisi, ayo selesaikan tugas agar dapat biji gurih! ✨',
  ],
  robot: [
    'Peringatan baterai lemah: <30% ⚡ Butuh pasokan daya dari tugas selesai!',
    'Algoritma pengisian daya: Tuntaskan tugas = Pasokan baterai terisi! 🔋',
  ],
  toast: [
    'Roti tanpa selai terasa hampa 🥺 Selesaikan tugas biar dapat olesan selai stroberi!',
    'Aroma manis menunggumu di tugas berikutnya! 🍓🍞',
  ],
};

const FEED_REACTIONS: Record<string, string> = {
  cat: 'Nyam nyam! Ikannya sedap banget meow! Energi terisi penuh & rasa sayang bertambah! 🐟🥰',
  dog: 'Kriuk! Biskuit favoritku! Ekor bergoyang makin gembira & bertenaga! 🦴✨',
  plant: 'Sluuurp! Air segar bikin daunku makin hijau berkilau & segar bugar! 💧🌿',
  coffee: 'Nyam! Donat manis pembangkit kafein! Sistem kembali optimal 100%! 🍩☕',
  owl: 'Krak! Biji kenari gurih penambah fokus malam! Hoo! Kenyang & bertenaga! 🌰✨',
  robot: 'Bzzzt! Daya baterai terisi penuh 100%! Sistem optimal berkecepatan tinggi! 🔋⚡',
  toast: 'Olesan selai manis bikin hariku makin cerah & renyah! Semangat kembali penuh! 🍓🍞',
};

// Opsi D: Tingkatan Persahabatan & Pembukaan Aksesoris Kosmetik
export interface FriendshipTier {
  level: number;
  label: string;
  minHearts: number;
  accessoryName: string;
  accessoryIcon: string;
  auraClass: string;
}

export const FRIENDSHIP_TIERS: FriendshipTier[] = [
  { level: 1, label: 'Teman Baru 🌱', minHearts: 0, accessoryName: 'Belum ada', accessoryIcon: '', auraClass: '' },
  { level: 2, label: 'Sahabat Akrab 🎀', minHearts: 15, accessoryName: 'Pita Manis', accessoryIcon: '🎀', auraClass: '' },
  { level: 3, label: 'Partner Sejati 😎', minHearts: 30, accessoryName: 'Kacamata Hitam', accessoryIcon: '🕶️', auraClass: '' },
  { level: 4, label: 'Pahlawan Produktif 🦸', minHearts: 50, accessoryName: 'Jubah Pahlawan', accessoryIcon: '🦸', auraClass: '' },
  { level: 5, label: 'Soulmate Abadi 👑', minHearts: 80, accessoryName: 'Mahkota Juara & Aura Emas', accessoryIcon: '👑', auraClass: 'ring-2 ring-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.6)]' },
];

export function getFriendshipTier(hearts: number): FriendshipTier {
  for (let i = FRIENDSHIP_TIERS.length - 1; i >= 0; i--) {
    if (hearts >= FRIENDSHIP_TIERS[i].minHearts) {
      return FRIENDSHIP_TIERS[i];
    }
  }
  return FRIENDSHIP_TIERS[0];
}

// Opsi B: Perhitungan Rasa Lapar / Energi Tamagotchi
function calculateInitialFullness(): number {
  if (typeof window === 'undefined') return 80;
  try {
    const storedFullness = localStorage.getItem('ceria_desk_buddy_fullness');
    const storedTime = localStorage.getItem('ceria_desk_buddy_last_fed_time');
    if (!storedTime) return storedFullness ? Number(storedFullness) : 80;

    const lastFed = Number(storedTime);
    const now = Date.now();
    const elapsedMinutes = Math.floor((now - lastFed) / (1000 * 60));
    // Berkurang 10% setiap 45 menit santai (sekitar 13% per jam)
    const decay = Math.floor(elapsedMinutes / 45) * 10;
    const initial = storedFullness ? Number(storedFullness) : 80;
    return Math.max(0, initial - decay);
  } catch {
    return 80;
  }
}

// Aturan Inaktivitas: Poin hati berkurang jika tidak ada interaksi dalam 24 jam
function calculateInactivityHearts(): { initialHearts: number; lostHearts: number } {
  if (typeof window === 'undefined') return { initialHearts: 0, lostHearts: 0 };
  try {
    const storedHearts = localStorage.getItem('ceria_desk_buddy_hearts');
    const heartsVal = storedHearts ? Number(storedHearts) || 0 : 0;

    const now = Date.now();
    const storedLast = localStorage.getItem('ceria_desk_buddy_last_interaction_time');
    if (!storedLast) {
      localStorage.setItem('ceria_desk_buddy_last_interaction_time', String(now));
      return { initialHearts: heartsVal, lostHearts: 0 };
    }

    const lastTime = Number(storedLast);
    const elapsedHours = (now - lastTime) / (1000 * 60 * 60);

    // Periode tenggang 24 jam: jika lebih dari 24 jam tidak ada interaksi (sapa/makan/tugas)
    if (elapsedHours >= 24) {
      const daysInactive = Math.floor(elapsedHours / 24);
      // Berkurang 2 hati per 24 jam ketidakhadiran
      const lost = Math.min(heartsVal, daysInactive * 2);
      const nextHearts = Math.max(0, heartsVal - lost);

      localStorage.setItem('ceria_desk_buddy_last_interaction_time', String(now));
      localStorage.setItem('ceria_desk_buddy_hearts', String(nextHearts));
      return { initialHearts: nextHearts, lostHearts: lost };
    }

    return { initialHearts: heartsVal, lostHearts: 0 };
  } catch {
    return { initialHearts: 0, lostHearts: 0 };
  }
}

export const DeskBuddy: React.FC<DeskBuddyProps> = ({
  buddyType,
  soundProfile = 'pop',
  completedTasksCount = 0,
  dailyGoal = 4,
  customName,
  customQuotes = [],
  position = 'bottom-left',
  size = 'large',
  isLoading = false,
}) => {
  const config = DESK_BUDDY_OPTIONS.find((b) => b.id === buddyType);

  const displayName = customName?.trim() || config?.name || 'Maskot';

  // Track previous task count outside of render to prevent false celebrations on load/refresh
  const prevCountRef = useRef<number | null>(null);

  const sizeStyles = {
    normal: {
      btn: 'w-12 h-12 rounded-2xl text-2xl',
      crown: '-top-3.5 text-base',
      sleepBadge: '-top-1 -right-1 text-[10px] px-1',
      treatBtn: 'h-8 px-2 text-xs',
      treatEmoji: 'text-xs',
    },
    large: {
      btn: 'w-[60px] h-[60px] rounded-2xl text-3xl',
      crown: '-top-4 text-xl',
      sleepBadge: '-top-1 -right-1 text-xs px-1.5',
      treatBtn: 'h-9 px-2.5 text-xs',
      treatEmoji: 'text-sm',
    },
    jumbo: {
      btn: 'w-[72px] h-[72px] rounded-3xl text-4xl',
      crown: '-top-5 text-2xl',
      sleepBadge: '-top-1.5 -right-1.5 text-sm px-2 py-0.5',
      treatBtn: 'h-10 px-3 text-sm',
      treatEmoji: 'text-base',
    },
  }[size] || {
    btn: 'w-[60px] h-[60px] rounded-2xl text-3xl',
    crown: '-top-4 text-xl',
    sleepBadge: '-top-1 -right-1 text-xs px-1.5',
    treatBtn: 'h-9 px-2.5 text-xs',
    treatEmoji: 'text-sm',
  };

  // Inactivity decay evaluation on mount
  const [inactivityData] = useState(calculateInactivityHearts);
  const [hearts, setHearts] = useState<number>(inactivityData.initialHearts);
  const [lostHeartsNotice] = useState<number>(inactivityData.lostHearts);

  const [bubbleText, setBubbleText] = useState<string>(() => {
    if (inactivityData.lostHearts > 0) {
      return `Aku kangen kamu! Karena lebih dari 24 jam tanpa sapaan/tugas, poin hati berkurang -${inactivityData.lostHearts} ❤️. Yuk sering berinteraksi lagi! 🥺💔`;
    }
    return config?.defaultQuote || '';
  });
  const [isBubbleVisible, setIsBubbleVisible] = useState<boolean>(false);
  const [isJumping, setIsJumping] = useState<boolean>(false);

  const [treats, setTreats] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ceria_desk_buddy_treats');
      // Berikan modal awal 5 camilan jika pengguna baru memulai
      return stored !== null ? Number(stored) || 0 : 5;
    }
    return 5;
  });

  const [fullness, setFullness] = useState<number>(calculateInitialFullness);
  const [showHeartFloater, setShowHeartFloater] = useState<boolean>(false);
  const [earnedTreatFloater, setEarnedTreatFloater] = useState<number>(0);

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
    }
  }

  // Opsi A: Selesaikan tugas memberikan camilan tambahan (+1 Treat / +2 Treat Bonus Target)
  useEffect(() => {
    // Saat masih loading awal, sinkronkan baseline count tanpa selebrasi
    if (isLoading) {
      prevCountRef.current = completedTasksCount;
      return;
    }

    // Pertama kali selesai loading: tetapkan baseline count tanpa selebrasi
    if (prevCountRef.current === null) {
      prevCountRef.current = completedTasksCount;
      return;
    }

    const prev = prevCountRef.current;
    if (completedTasksCount > prev && buddyType !== 'none') {
      prevCountRef.current = completedTasksCount;
      setIsJumping(true);
      const earned = completedTasksCount - prev;
      const isGoalJustReached = completedTasksCount >= dailyGoal && prev < dailyGoal && dailyGoal > 0;
      const totalBonus = earned + (isGoalJustReached ? 2 : 0);

      setTreats((prevTreats) => {
        const next = prevTreats + totalBonus;
        if (typeof window !== 'undefined') {
          localStorage.setItem('ceria_desk_buddy_treats', String(next));
        }
        return next;
      });

      setEarnedTreatFloater(totalBonus);
      const floaterTimer = setTimeout(() => setEarnedTreatFloater(0), 1800);

      if (isGoalJustReached) {
        setBubbleText(
          `🎉 HORE! Target harian tuntas! Kamu dapat bonus +${totalBonus} ${config?.treatName || 'Camilan'}! Juara sejati! 👑`
        );
      } else {
        const cheerQuotes = [
          `Mantap! Tugas beres & dapat +${totalBonus} ${config?.treatEmoji} ${config?.treatName || 'Camilan'}! ✨`,
          `Keren! Stok ${config?.treatEmoji} bertambah! Teruskan momentum positif ini! 🔥`,
          `Satu langkah lebih dekat ke target harianmu! (+${totalBonus} ${config?.treatEmoji}) 🎯`,
        ];
        const picked = cheerQuotes[completedTasksCount % cheerQuotes.length];
        setBubbleText(picked);
      }
      setIsBubbleVisible(true);
      return () => clearTimeout(floaterTimer);
    } else {
      prevCountRef.current = completedTasksCount;
    }
  }, [completedTasksCount, isLoading, buddyType, dailyGoal, config]);

  // Update interaction timestamp when tasks are completed
  useEffect(() => {
    if (completedTasksCount > 0 && typeof window !== 'undefined') {
      localStorage.setItem('ceria_desk_buddy_last_interaction_time', String(Date.now()));
    }
  }, [completedTasksCount]);

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

  const friendship = getFriendshipTier(hearts);
  const isGoalReached = completedTasksCount >= dailyGoal && dailyGoal > 0;
  const isHungry = fullness <= 25;

  const handleBuddyClick = () => {
    playPopSound(soundProfile);
    setIsJumping(true);

    let pool: string[] = [];

    // Jika lapar, maskot sesekali mengeluh lapar dengan nada imut
    if (isHungry && Math.random() > 0.4) {
      const hungryPool = HUNGRY_QUOTES[buddyType] || [
        'Perutku keroncongan nih... 🥺 Selesaikan tugas biar dapat camilan lezat ya! 🐾',
      ];
      pool = [...hungryPool];
    } else {
      if (isNightMode) {
        pool = [...NIGHT_QUOTES];
      }
      const charQuotes = QUOTES_COLLECTION[buddyType] || [config.defaultQuote];
      pool = [...pool, ...charQuotes];

      if (customQuotes && customQuotes.length > 0) {
        pool = [...pool, ...customQuotes.filter((q) => q.trim().length > 0)];
      }
    }

    if (pool.length === 0) pool = [config.defaultQuote];

    const randomQuote = pool[Math.floor(Math.random() * pool.length)];
    setBubbleText(randomQuote);
    setIsBubbleVisible(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ceria_desk_buddy_last_interaction_time', String(Date.now()));
    }
  };

  // Opsi A & B: Memberi Makan Maskot
  const handleFeed = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Jika stok camilan habis (0), beri motivasi untuk selesaikan tugas
    if (treats <= 0) {
      playPopSound('pop');
      setIsJumping(true);
      setBubbleText(
        `Stok ${config.treatName} habis! 🥺 Selesaikan tugas di papan untuk dapat camilan lezat ya! 🎯🐾`
      );
      setIsBubbleVisible(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('ceria_desk_buddy_last_interaction_time', String(Date.now()));
      }
      return;
    }

    // Konsumsi 1 camilan & tambah 1 hati & tambah energi kenyang
    playPopSound('bubble');
    setIsJumping(true);

    const newTreats = treats - 1;
    const newHearts = hearts + 1;
    const newFullness = Math.min(100, fullness + 35);

    setTreats(newTreats);
    setHearts(newHearts);
    setFullness(newFullness);

    if (typeof window !== 'undefined') {
      localStorage.setItem('ceria_desk_buddy_treats', String(newTreats));
      localStorage.setItem('ceria_desk_buddy_hearts', String(newHearts));
      localStorage.setItem('ceria_desk_buddy_fullness', String(newFullness));
      localStorage.setItem('ceria_desk_buddy_last_fed_time', String(Date.now()));
      localStorage.setItem('ceria_desk_buddy_last_interaction_time', String(Date.now()));
    }

    setShowHeartFloater(true);
    setTimeout(() => setShowHeartFloater(false), 1200);

    const reaction = FEED_REACTIONS[buddyType] || 'Nyam! Terima kasih makanannya! 🥰';
    setBubbleText(reaction);
    setIsBubbleVisible(true);

    // Nada kemenangan khusus saat tembus tonggak level kosmetik
    if ([15, 30, 50, 80].includes(newHearts)) {
      playVictoryChime(soundProfile);
    }
  };

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
    <div className="relative max-w-[230px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-amber-300 dark:border-amber-500/40 rounded-2xl p-2.5 shadow-xl text-slate-800 dark:text-slate-100 text-xs animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-start justify-between gap-1 mb-1">
        <span className="font-bold text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1 truncate">
          {isNightMode ? (
            <Moon className="w-3 h-3 text-indigo-400 shrink-0" />
          ) : (
            <Sparkles className="w-3 h-3 shrink-0" />
          )}
          <span className="truncate">
            [{friendship.label.split(' ')[0]} {friendship.accessoryIcon}] {displayName}
          </span>
        </span>
        <button
          onClick={() => setIsBubbleVisible(false)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer transition-colors shrink-0"
          title="Tutup pesan"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      <p className="text-[11px] leading-snug font-medium text-slate-700 dark:text-slate-200">
        {bubbleText}
      </p>

      {/* Mini Status Footer in Speech Bubble */}
      <div className="mt-2 pt-1.5 border-t border-amber-200/50 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1 font-semibold">
          <Zap className={`w-2.5 h-2.5 ${fullness > 50 ? 'text-amber-500' : 'text-rose-500'}`} />
          {fullness}% Kenyang
        </span>
        <span
          className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1 cursor-help"
          title="Berinteraksi minimal 1x setiap 24 jam (sapa / makan / selesai tugas) agar poin hati tidak berkurang (-2 ❤️ per hari tidak aktif)"
        >
          <span>{hearts} ❤️</span>
          <span>•</span>
          <span>Stok: {treats} {config.treatEmoji}</span>
        </span>
      </div>

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
        {/* Floating Heart Particle Animation on Feed (+1 ❤️) */}
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

        {/* Floating Broken Heart Notification if Inactive (-X 💔) */}
        {lostHeartsNotice > 0 && (
          <div
            className={`absolute -top-7 ${
              isRight ? 'right-3' : 'left-3'
            } z-50 pointer-events-none flex items-center gap-1 text-xs font-black text-rose-600 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-full border border-rose-300 shadow-md animate-in fade-in slide-out-to-top-6 duration-1000`}
          >
            <span>💔 -{lostHeartsNotice} ❤️</span>
          </div>
        )}

        {/* Floating Earned Treat Particle Animation on Task Complete (+1 🦴) */}
        {earnedTreatFloater > 0 && (
          <div
            className={`absolute -top-8 ${
              isRight ? 'right-12' : 'left-12'
            } z-50 pointer-events-none flex items-center gap-1 text-xs font-black text-amber-600 bg-amber-100/90 dark:bg-amber-950/90 border border-amber-400 px-1.5 py-0.5 rounded-full shadow-lg animate-in fade-in slide-out-to-top-6 duration-1000`}
          >
            <span>+{earnedTreatFloater} {config.treatEmoji}</span>
            <span>Camilan!</span>
          </div>
        )}

        {/* Mascot Avatar Button */}
        <div className="relative">
          {/* Opsi D: Aksesoris Kosmetik Berdasarkan Level & Target */}
          {/* Level 5 atau Target Tercapai: Mahkota Emas */}
          {(isGoalReached || friendship.level === 5) && (
            <div
              className={`absolute ${sizeStyles.crown} left-1/2 -translate-x-1/2 z-10 drop-shadow-md animate-bounce`}
              title={
                isGoalReached
                  ? 'Target harian tercapai! Maskot memakai mahkota juara 👑'
                  : 'Level 5 (Soulmate Abadi): Mahkota Emas Berlian 👑'
              }
            >
              👑
            </div>
          )}

          {/* Opsi D: Aksesoris Level 2 (Pita 🎀), Level 3 (Kacamata 🕶️), Level 4 (Jubah 🦸) */}
          {!isGoalReached && friendship.level === 2 && (
            <div
              className="absolute -top-2 -left-1 z-10 text-xs drop-shadow-xs"
              title="Aksesoris Terbuka: Pita Manis 🎀 (Level 2)"
            >
              🎀
            </div>
          )}
          {!isGoalReached && friendship.level === 3 && (
            <div
              className="absolute -top-1.5 -left-1.5 z-10 text-xs drop-shadow-xs"
              title="Aksesoris Terbuka: Kacamata Keren 🕶️ (Level 3)"
            >
              🕶️
            </div>
          )}
          {!isGoalReached && friendship.level === 4 && (
            <div
              className="absolute -bottom-1 -left-1 z-10 text-xs drop-shadow-xs"
              title="Aksesoris Terbuka: Jubah Pahlawan 🦸 (Level 4)"
            >
              🦸
            </div>
          )}

          {/* Night mode sleepy badge */}
          {isNightMode && (
            <div
              className={`absolute ${sizeStyles.sleepBadge} z-10 bg-indigo-900/90 text-indigo-200 rounded-full border border-indigo-400/50 shadow-xs`}
              title="Mode Malam: Maskot sedang mengantuk 😴"
            >
              💤
            </div>
          )}

          {/* Opsi B: Indikator Lapar jika Energi < 25% */}
          {isHungry && !isNightMode && (
            <div
              className="absolute -bottom-1 -right-1 z-10 bg-rose-500 text-white text-[9px] px-1 rounded-full border border-white font-bold shadow-xs animate-pulse"
              title="Maskot sedang lapar! Beri makan camilan agar bersemangat 🥺"
            >
              🥺
            </div>
          )}

          <button
            onClick={handleBuddyClick}
            className={`${sizeStyles.btn} bg-gradient-to-tr from-amber-100 via-orange-50 to-yellow-100 dark:from-slate-800 dark:to-slate-900 border-2 border-amber-300/80 dark:border-amber-500/60 shadow-lg flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95 ${
              friendship.auraClass
            } ${
              isJumping
                ? '-translate-y-2 rotate-6 shadow-2xl ring-2 ring-amber-400'
                : 'hover:-translate-y-0.5'
            }`}
            title={`Klik ${displayName} untuk sapaan! (${friendship.label}, ${hearts} ❤️ • Energi: ${fullness}%)`}
          >
            <span>{config.avatar}</span>
          </button>
        </div>

        {/* Opsi A & B: Feed Treat Button dengan Sistem Stok & Energi */}
        {config.treatEmoji && (
          <button
            onClick={handleFeed}
            className={`${sizeStyles.treatBtn} rounded-xl bg-white/95 dark:bg-slate-800/95 border transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95 ${
              treats > 0
                ? 'border-amber-300/80 dark:border-amber-500/40 text-amber-900 dark:text-amber-200 hover:scale-105 hover:bg-amber-50/80'
                : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-amber-300 opacity-85'
            } ${isHungry && treats > 0 ? 'ring-2 ring-amber-400 animate-pulse' : ''}`}
            title={
              treats > 0
                ? `Beri makan ${displayName} dengan ${config.treatName} (+1 ❤️, +35% Energi). Stok: ${treats}`
                : `Stok ${config.treatName} habis! Selesaikan tugas untuk dapat camilan.`
            }
          >
            <span className={sizeStyles.treatEmoji}>{config.treatEmoji}</span>
            <span
              className={`text-[11px] font-bold ${
                treats > 0 ? 'text-amber-800 dark:text-amber-200' : 'text-slate-400'
              }`}
            >
              x{treats}
            </span>
          </button>
        )}
      </div>

      {/* If top, speech bubble appears below mascot */}
      {isTop && speechBubble}
    </aside>
  );
};
