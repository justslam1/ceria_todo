import {
  UserPreferences,
  ThemeConfig,
  BgPatternId,
  WashiTapeStyle,
  SoundProfile,
  WorkflowPreset,
  FontMood,
  CelebrationFx,
  CustomCategory,
  NoteColor,
  NoteColorMode,
  PinStyle,
  CompletionStamp,
  StampColor,
  ViewDensity,
  SortByOption,
  DeskBuddyType,
} from '@/types/preferences';

export type {
  CustomCategory,
  NoteColor,
  NoteColorMode,
  PinStyle,
  CompletionStamp,
  StampColor,
  ViewDensity,
  SortByOption,
  DeskBuddyType,
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  appName: 'Papan Catatan',
  customLogoUrl: null,
  appIconPreset: '✨',
  appBadgeText: 'v1.0',
  userName: 'Sobat Ceria',
  boardTitle: 'Studio Papan Buletin Kerja',
  boardIcon: '📌',
  dailyMotto: 'Kelola tugas lebih ringan & menyenangkan! ✨',
  theme: 'sunset',
  bgPattern: 'dots',
  customBgUrl: null,
  bgDim: 30, // 30% default overlay
  bgBlur: 2, // 2px default soft blur
  avatarIcon: '✨',
  washiTapeStyle: 'soft',
  soundProfile: 'pop',
  fontMood: 'modern',
  celebrationFx: 'confetti',
  noteColorMode: 'column',
  dailyTargetGoal: 4,
  rewardNote: 'Beli Es Kopi Susu gula aren! ☕✨',
  rewardClaimedDate: null,
  customCategories: [
    { id: 'cat-personal', name: 'Personal', color: 'purple' },
    { id: 'cat-kerja', name: 'Kerja', color: 'amber' },
    { id: 'cat-belajar', name: 'Belajar', color: 'sky' },
    { id: 'cat-sehat', name: 'Kesehatan', color: 'emerald' },
  ],
  columns: {
    TODO: {
      title: 'Rencana Brilian',
      subtitle: 'Ide & tugas baru yang siap dieksekusi',
      emoji: '💡',
    },
    IN_PROGRESS: {
      title: 'Aksi Seru',
      subtitle: 'Sedang dikerjakan dengan semangat',
      emoji: '⚡',
    },
    DONE: {
      title: 'Misi Sukses',
      subtitle: 'Telah selesai dengan hasil gemilang! 🎉',
      emoji: '🏆',
    },
  },
  pinStyle: 'pin',
  completionStamp: 'SELESAI!',
  stampColor: 'red',
  viewDensity: 'cozy',
  sortBy: 'manual',
  deskBuddy: 'cat',
  footerText: 'Slam Area © 2026',
};

export const APP_ICON_PRESETS = [
  { id: '✨', label: 'Sparkles', icon: '✨' },
  { id: '🚀', label: 'Roket', icon: '🚀' },
  { id: '☕', label: 'Kopi', icon: '☕' },
  { id: '🔥', label: 'Api Semangat', icon: '🔥' },
  { id: '🎯', label: 'Target', icon: '🎯' },
  { id: '🐱', label: 'Kucing', icon: '🐱' },
  { id: '⭐', label: 'Bintang', icon: '⭐' },
  { id: '🥑', label: 'Alpukat', icon: '🥑' },
  { id: '🌈', label: 'Pelangi', icon: '🌈' },
  { id: '⚡', label: 'Kilat', icon: '⚡' },
];

export const FONT_MOOD_OPTIONS: { id: FontMood; label: string; previewText: string; desc: string; fontClass: string }[] = [
  {
    id: 'modern',
    label: 'Modern Sans (Bawaan)',
    previewText: 'Tugas Harian Penting',
    desc: 'Bersih, tajam & mudah dibaca untuk kerja profesional',
    fontClass: 'font-sans',
  },
  {
    id: 'handwriting',
    label: 'Tulisan Tangan (Caveat)',
    previewText: 'Catatan Sticky Note ✨',
    desc: 'Estetik tulisan spidol asli, terasa seperti papan fisik!',
    fontClass: 'font-handwriting text-base font-bold',
  },
  {
    id: 'rounded',
    label: 'Rounded Soft (Nunito)',
    previewText: 'Misi Ceria Semangat',
    desc: 'Huruf bulat empuk, ramah & nyaman dipandang',
    fontClass: 'font-rounded font-semibold',
  },
];

export const CELEBRATION_OPTIONS: { id: CelebrationFx; label: string; desc: string; icon: string }[] = [
  { id: 'confetti', label: 'Hujan Konfeti Ceria', desc: 'Ledakan warna-warni semarak klasik', icon: '🎊' },
  { id: 'fireworks', label: 'Kembang Api Spektakuler', desc: 'Letupan kembang api ganda kiri-kanan', icon: '🎆' },
  { id: 'stars', label: 'Taburan Bintang Emas', desc: 'Hujan bintang keemasan berkilauan', icon: '✨' },
  { id: 'none', label: 'Hening / Tanpa Animasi', desc: 'Tanpa selebrasi untuk fokus tenang', icon: '🔕' },
];

export const CATEGORY_COLORS: { id: string; label: string; classNames: string; dotHex: string }[] = [
  { id: 'purple', label: 'Ungu Lilac', classNames: 'bg-purple-100 text-purple-800 border-purple-200', dotHex: '#a855f7' },
  { id: 'pink', label: 'Merah Muda', classNames: 'bg-pink-100 text-pink-800 border-pink-200', dotHex: '#ec4899' },
  { id: 'amber', label: 'Oranye Amber', classNames: 'bg-amber-100 text-amber-800 border-amber-200', dotHex: '#f59e0b' },
  { id: 'emerald', label: 'Hijau Emerald', classNames: 'bg-emerald-100 text-emerald-800 border-emerald-200', dotHex: '#10b981' },
  { id: 'sky', label: 'Biru Langit', classNames: 'bg-sky-100 text-sky-800 border-sky-200', dotHex: '#0ea5e9' },
  { id: 'rose', label: 'Mawar Rose', classNames: 'bg-rose-100 text-rose-800 border-rose-200', dotHex: '#f43f5e' },
  { id: 'indigo', label: 'Indigo Gelap', classNames: 'bg-indigo-100 text-indigo-800 border-indigo-200', dotHex: '#6366f1' },
  { id: 'teal', label: 'Toska Teal', classNames: 'bg-teal-100 text-teal-800 border-teal-200', dotHex: '#14b8a6' },
];

export function getCategoryBadgeClasses(categoryName: string, customCategories?: CustomCategory[]): string {
  if (!categoryName) return 'bg-purple-100 text-purple-700 border-purple-200';
  const clean = categoryName.trim().toLowerCase();
  const target = (customCategories || DEFAULT_PREFERENCES.customCategories).find(
    (c) => c.name.trim().toLowerCase() === clean
  );
  if (target) {
    const colorObj = CATEGORY_COLORS.find((c) => c.id === target.color);
    if (colorObj) return colorObj.classNames;
  }
  // Default fallback deterministic hash based on name
  const hash = clean.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const picked = CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
  return picked.classNames;
}

export function getCategoryDotHex(categoryName: string, customCategories?: CustomCategory[]): string {
  if (!categoryName) return '#a855f7';
  const clean = categoryName.trim().toLowerCase();
  const target = (customCategories || DEFAULT_PREFERENCES.customCategories).find(
    (c) => c.name.trim().toLowerCase() === clean
  );
  if (target) {
    const colorObj = CATEGORY_COLORS.find((c) => c.id === target.color);
    if (colorObj) return colorObj.dotHex;
  }
  const hash = clean.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const picked = CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
  return picked.dotHex;
}

export const NOTE_COLOR_OPTIONS: { id: NoteColor; label: string; dotHex: string; paperBg: string; border: string; tapeBg: string; titleColor: string }[] = [
  {
    id: 'yellow',
    label: 'Kuning Hangat (Klasik)',
    dotHex: '#f59e0b',
    paperBg: 'bg-gradient-to-b from-amber-50 via-amber-100/80 to-yellow-100/90',
    border: 'border-amber-300/80 shadow-[2px_5px_14px_rgba(180,83,9,0.14)]',
    tapeBg: 'bg-amber-200/80 border-amber-300/70',
    titleColor: 'text-amber-950',
  },
  {
    id: 'blue',
    label: 'Biru Langit (Fokus)',
    dotHex: '#0ea5e9',
    paperBg: 'bg-gradient-to-b from-sky-50 via-sky-100/80 to-blue-100/90',
    border: 'border-sky-300/80 shadow-[2px_5px_14px_rgba(3,105,161,0.14)]',
    tapeBg: 'bg-sky-200/80 border-sky-300/70',
    titleColor: 'text-sky-950',
  },
  {
    id: 'green',
    label: 'Hijau Matcha (Tenang)',
    dotHex: '#10b981',
    paperBg: 'bg-gradient-to-b from-emerald-50 via-emerald-100/80 to-teal-100/90',
    border: 'border-emerald-300/80 shadow-[2px_5px_14px_rgba(4,120,87,0.14)]',
    tapeBg: 'bg-emerald-200/80 border-emerald-300/70',
    titleColor: 'text-emerald-950',
  },
  {
    id: 'pink',
    label: 'Pink Mawar (Prioritas/Semangat)',
    dotHex: '#ec4899',
    paperBg: 'bg-gradient-to-b from-pink-50 via-pink-100/80 to-rose-100/90',
    border: 'border-pink-300/80 shadow-[2px_5px_14px_rgba(244,63,94,0.14)]',
    tapeBg: 'bg-pink-200/80 border-pink-300/70',
    titleColor: 'text-pink-950',
  },
  {
    id: 'purple',
    label: 'Ungu Lavender (Kreatif)',
    dotHex: '#a855f7',
    paperBg: 'bg-gradient-to-b from-purple-50 via-purple-100/80 to-indigo-100/90',
    border: 'border-purple-300/80 shadow-[2px_5px_14px_rgba(168,85,247,0.14)]',
    tapeBg: 'bg-purple-200/80 border-purple-300/70',
    titleColor: 'text-purple-950',
  },
  {
    id: 'white',
    label: 'Putih Catatan (Bersih)',
    dotHex: '#e2e8f0',
    paperBg: 'bg-gradient-to-b from-white via-slate-50 to-slate-100/90',
    border: 'border-slate-300/80 shadow-[2px_5px_14px_rgba(100,116,139,0.12)]',
    tapeBg: 'bg-slate-200/80 border-slate-300/70',
    titleColor: 'text-slate-900',
  },
];

export function getStickyNoteStyle(
  status: string,
  priority: string,
  explicitColor: NoteColor | null | undefined,
  mode: NoteColorMode = 'column'
) {
  // If explicitly chosen color
  if (explicitColor && explicitColor !== 'auto') {
    const found = NOTE_COLOR_OPTIONS.find((c) => c.id === explicitColor);
    if (found) {
      return {
        paperBg: `${found.paperBg} ${found.border}`,
        tapeBg: found.tapeBg,
        title: found.titleColor,
        dragging: `ring-2 ring-orange-400 shadow-2xl scale-105 rotate-2 z-50 ${found.paperBg}`,
        btnBg: 'bg-white/80 hover:bg-white text-slate-800 border-slate-300/70',
        divider: 'border-slate-300/40',
        grip: 'text-slate-500/70 hover:text-slate-800',
        subtleText: 'text-slate-600/70',
      };
    }
  }

  // If Mode is Priority-based
  if (mode === 'priority') {
    if (priority === 'HIGH') {
      const p = NOTE_COLOR_OPTIONS.find((c) => c.id === 'pink')!;
      return {
        paperBg: `${p.paperBg} ${p.border}`,
        tapeBg: p.tapeBg,
        title: p.titleColor,
        dragging: 'ring-2 ring-rose-400 border-rose-400 shadow-2xl scale-105 rotate-2 z-50 bg-rose-100',
        btnBg: 'bg-rose-200/80 hover:bg-rose-300 text-rose-950 border-rose-400/60',
        divider: 'border-rose-300/40',
        grip: 'text-rose-500/70 hover:text-rose-800',
        subtleText: 'text-rose-900/60',
      };
    }
    if (priority === 'LOW') {
      const g = NOTE_COLOR_OPTIONS.find((c) => c.id === 'green')!;
      return {
        paperBg: `${g.paperBg} ${g.border}`,
        tapeBg: g.tapeBg,
        title: g.titleColor,
        dragging: 'ring-2 ring-emerald-400 border-emerald-400 shadow-2xl scale-105 rotate-2 z-50 bg-emerald-100',
        btnBg: 'bg-emerald-200/80 hover:bg-emerald-300 text-emerald-950 border-emerald-400/60',
        divider: 'border-emerald-300/40',
        grip: 'text-emerald-500/70 hover:text-emerald-800',
        subtleText: 'text-emerald-900/60',
      };
    }
    // MEDIUM priority -> Yellow/Blue depending on status
  }

  // Column default
  switch (status) {
    case 'TODO':
      return {
        paperBg: 'bg-gradient-to-b from-amber-50 via-amber-100/80 to-yellow-100/90 border-amber-300/70 shadow-[2px_5px_14px_rgba(180,83,9,0.14)]',
        tapeBg: 'bg-amber-200/60 border-amber-300/50',
        dragging: 'ring-2 ring-amber-400 border-amber-400 shadow-2xl scale-105 rotate-2 z-50 bg-amber-100',
        btnBg: 'bg-amber-200/80 hover:bg-amber-300 text-amber-950 border-amber-400/60',
        divider: 'border-amber-300/40',
        grip: 'text-amber-500/70 hover:text-amber-800',
        title: 'text-amber-950',
        subtleText: 'text-amber-900/60',
      };
    case 'IN_PROGRESS':
      return {
        paperBg: 'bg-gradient-to-b from-sky-50 via-sky-100/80 to-blue-100/90 border-sky-300/70 shadow-[2px_5px_14px_rgba(3,105,161,0.14)]',
        tapeBg: 'bg-sky-200/60 border-sky-300/50',
        dragging: 'ring-2 ring-sky-400 border-sky-400 shadow-2xl scale-105 rotate-2 z-50 bg-sky-100',
        btnBg: 'bg-sky-200/80 hover:bg-sky-300 text-sky-950 border-sky-400/60',
        divider: 'border-sky-300/40',
        grip: 'text-sky-500/70 hover:text-sky-800',
        title: 'text-sky-950',
        subtleText: 'text-sky-900/60',
      };
    case 'DONE':
    default:
      return {
        paperBg: 'bg-gradient-to-b from-emerald-50 via-emerald-100/80 to-teal-100/90 border-emerald-300/70 shadow-[2px_5px_14px_rgba(4,120,87,0.14)]',
        tapeBg: 'bg-emerald-200/60 border-emerald-300/50',
        dragging: 'ring-2 ring-emerald-400 border-emerald-400 shadow-2xl scale-105 rotate-2 z-50 bg-emerald-100',
        btnBg: 'bg-emerald-200/80 hover:bg-emerald-300 text-emerald-950 border-emerald-400/60',
        divider: 'border-emerald-300/40',
        grip: 'text-emerald-500/70 hover:text-emerald-800',
        title: 'text-emerald-950',
        subtleText: 'text-emerald-900/60',
      };
  }
}

export const WORKFLOW_PRESETS: WorkflowPreset[] = [
  {
    id: 'default',
    name: 'Ceria Kanban (Bawaan)',
    icon: '✨',
    desc: 'Alur kerja menyenangkan dan positif untuk sehari-hari',
    columns: {
      TODO: {
        title: 'Rencana Brilian',
        subtitle: 'Ide & tugas baru yang siap dieksekusi',
        emoji: '💡',
      },
      IN_PROGRESS: {
        title: 'Aksi Seru',
        subtitle: 'Sedang dikerjakan dengan semangat',
        emoji: '⚡',
      },
      DONE: {
        title: 'Misi Sukses',
        subtitle: 'Telah selesai dengan hasil gemilang! 🎉',
        emoji: '🏆',
      },
    },
  },
  {
    id: 'study',
    name: 'Mahasiswa / Belajar',
    icon: '🎓',
    desc: 'Untuk PR, kuliah, skripsi, dan materi ujian',
    columns: {
      TODO: {
        title: 'Daftar PR & Tugas',
        subtitle: 'Antrean materi & tugas yang harus dipelajari',
        emoji: '📚',
      },
      IN_PROGRESS: {
        title: 'Sedang Digarap',
        subtitle: 'Fokus belajar dan ngerjain sekarang',
        emoji: '✍️',
      },
      DONE: {
        title: 'Tuntas & Dikumpul',
        subtitle: 'Lolos deadline & tuntas dipelajari!',
        emoji: '🎓',
      },
    },
  },
  {
    id: 'freelance',
    name: 'Freelance & Proyek',
    icon: '💼',
    desc: 'Cocok untuk freelancer, desainer, dan pembuat konten',
    columns: {
      TODO: {
        title: 'Brief & Antrean Order',
        subtitle: 'Request klien dan ide proyek baru',
        emoji: '📋',
      },
      IN_PROGRESS: {
        title: 'Proses Pengerjaan',
        subtitle: 'Tahap produksi dan revisi aktif',
        emoji: '🎨',
      },
      DONE: {
        title: 'Serah Terima Klien',
        subtitle: 'Proyek rampung dan diserahkan!',
        emoji: '🚀',
      },
    },
  },
  {
    id: 'agile',
    name: 'Agile & Minimalis',
    icon: '⚡',
    desc: 'Gaya to-do klasik yang singkat, to the point',
    columns: {
      TODO: {
        title: 'To Do',
        subtitle: 'Tugas yang akan datang',
        emoji: '📝',
      },
      IN_PROGRESS: {
        title: 'In Progress',
        subtitle: 'Tugas yang sedang berjalan',
        emoji: '⏳',
      },
      DONE: {
        title: 'Done',
        subtitle: 'Tugas yang telah selesai',
        emoji: '✅',
      },
    },
  },
];

export const WASHI_TAPE_OPTIONS: { id: WashiTapeStyle; label: string; desc: string; preview: string }[] = [
  { id: 'soft', label: 'Pastel Lembut', desc: 'Selotip washi tape transparan alami', preview: 'bg-amber-200/60' },
  { id: 'colorful', label: 'Warna Berani', desc: 'Warna cerah yang lebih tegas', preview: 'bg-amber-400' },
  { id: 'pattern', label: 'Garis Strip', desc: 'Motif washi tape diagonal modern', preview: 'bg-amber-300' },
  { id: 'none', label: 'Tanpa Selotip', desc: 'Tampilan sticky note flat minimalis', preview: 'bg-transparent border-dashed' },
];

export const SOUND_PROFILE_OPTIONS: { id: SoundProfile; label: string; desc: string; icon: string }[] = [
  { id: 'pop', label: 'Ceria Pop (Bawaan)', desc: 'Pop lembut & akord kemenangan C-Major', icon: '🎵' },
  { id: 'bubble', label: 'Cute Bubble', desc: 'Letupan gelembung "bloop" & water chime', icon: '🫧' },
  { id: 'arcade', label: 'Retro 8-Bit', desc: 'Suara koin game lawas & chiptune fanfare', icon: '👾' },
];

export const THEME_LIST: ThemeConfig[] = [
  {
    id: 'sunset',
    name: 'Ceria Sunset',
    tagline: 'Hangat, oranye & penuh energi ceria',
    emoji: '🌅',
    previewColors: ['#fb923c', '#f59e0b', '#fbbf24'],
    bgClass: 'bg-[#faf8f5]',
    bgHex: '#faf8f5',
    dotColor: '#e2e8f0',
    cardBg: 'bg-white/90',
    headerBorder: 'border-amber-200/80',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-300',
    accentGradient: 'from-amber-400 via-orange-400 to-rose-400',
    accentTextGradient: 'from-amber-600 via-orange-500 to-rose-500',
    primaryButton: 'bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white shadow-orange-200',
    focusRing: 'focus:ring-amber-400',
    isDark: false,
  },
  {
    id: 'matcha',
    name: 'Matcha Zen',
    tagline: 'Tenang, sejuk dengan sentuhan teh hijau',
    emoji: '🍵',
    previewColors: ['#34d399', '#10b981', '#059669'],
    bgClass: 'bg-[#f4f7f4]',
    bgHex: '#f4f7f4',
    dotColor: '#d1e0d5',
    cardBg: 'bg-white/90',
    headerBorder: 'border-emerald-200/80',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900',
    badgeBorder: 'border-emerald-300',
    accentGradient: 'from-emerald-400 via-teal-400 to-green-500',
    accentTextGradient: 'from-emerald-700 via-teal-600 to-green-600',
    primaryButton: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-200',
    focusRing: 'focus:ring-emerald-400',
    isDark: false,
  },
  {
    id: 'berry',
    name: 'Berry Sweet',
    tagline: 'Manis, lembut & estetik bernuansa lilac & rose',
    emoji: '🍓',
    previewColors: ['#f472b6', '#fb7185', '#c084fc'],
    bgClass: 'bg-[#faf4f7]',
    bgHex: '#faf4f7',
    dotColor: '#ebd6e4',
    cardBg: 'bg-white/90',
    headerBorder: 'border-pink-200/80',
    badgeBg: 'bg-pink-100',
    badgeText: 'text-pink-900',
    badgeBorder: 'border-pink-300',
    accentGradient: 'from-pink-400 via-rose-400 to-purple-400',
    accentTextGradient: 'from-pink-600 via-rose-500 to-purple-600',
    primaryButton: 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-pink-200',
    focusRing: 'focus:ring-pink-400',
    isDark: false,
  },
  {
    id: 'ocean',
    name: 'Ocean Breeze',
    tagline: 'Segar & luas seperti angin pantai biru',
    emoji: '🌊',
    previewColors: ['#38bdf8', '#0ea5e9', '#6366f1'],
    bgClass: 'bg-[#f2f7fb]',
    bgHex: '#f2f7fb',
    dotColor: '#cfe0ee',
    cardBg: 'bg-white/90',
    headerBorder: 'border-sky-200/80',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-900',
    badgeBorder: 'border-sky-300',
    accentGradient: 'from-sky-400 via-cyan-400 to-blue-500',
    accentTextGradient: 'from-sky-600 via-cyan-600 to-blue-600',
    primaryButton: 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-sky-200',
    focusRing: 'focus:ring-sky-400',
    isDark: false,
  },
  {
    id: 'midnight',
    name: 'Midnight Focus',
    tagline: 'Elegan, teduh & nyaman untuk kerja malam hari',
    emoji: '🌙',
    previewColors: ['#6366f1', '#8b5cf6', '#f59e0b'],
    bgClass: 'bg-[#14161d]',
    bgHex: '#14161d',
    dotColor: '#2b3040',
    cardBg: 'bg-[#1e222d]/90',
    headerBorder: 'border-slate-700/80',
    badgeBg: 'bg-indigo-950/80',
    badgeText: 'text-indigo-200',
    badgeBorder: 'border-indigo-700/80',
    accentGradient: 'from-indigo-500 via-purple-500 to-amber-400',
    accentTextGradient: 'from-indigo-400 via-purple-300 to-amber-300',
    primaryButton: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-950/50',
    focusRing: 'focus:ring-indigo-400',
    isDark: true,
  },
];

export const PATTERN_OPTIONS: { id: BgPatternId; label: string; icon: string; desc: string }[] = [
  { id: 'dots', label: 'Polkadot Dots', icon: '⁖', desc: 'Pola titik halus klasik' },
  { id: 'grid', label: 'Buku Berpetak', icon: '▦', desc: 'Garis grid kertas catatan' },
  { id: 'clean', label: 'Polos Minimalis', icon: '▢', desc: 'Latar bersih tanpa corak' },
  { id: 'custom', label: 'Foto Sendiri 📸', icon: '🖼️', desc: 'Unggah wallpaper dari galeri' },
];

export const AVATAR_OPTIONS = ['✨', '🐱', '☕', '🚀', '🌱', '🎨', '🥑', '🦊', '⭐', '🎧'];

export const BOARD_ICONS = ['📌', '🚀', '☕', '🎨', '🌟', '📚', '💼', '🎯', '💡', '🌈'];

export const COLUMN_ICON_OPTIONS = {
  TODO: [
    '💡', '📚', '📋', '📝', '📌', '💭', '🎯', '📥', '✨', '🗓️', '🔍', '🧩', '🌱', '☕'
  ],
  IN_PROGRESS: [
    '⚡', '✍️', '🎨', '⏳', '🔥', '⚙️', '🔨', '🏃', '🚀', '💻', '🛠️', '🚧', '🎧', '🌪️'
  ],
  DONE: [
    '🏆', '🎓', '✅', '🎉', '🚀', '🌟', '🥇', '💯', '🌈', '💎', '📦', '🎈', '🕊️', '🏁'
  ],
};

export const PIN_STYLE_OPTIONS: { id: PinStyle; label: string; icon: string; desc: string }[] = [
  { id: 'pin', label: 'Paku Payung 📌', icon: '📌', desc: 'Paku payung merah klasik ala papan buletin' },
  { id: 'paperclip', label: 'Klip Kertas 📎', icon: '📎', desc: 'Penjepit kertas perak minimalis rapi' },
  { id: 'woodpeg', label: 'Jepit Kayu 🪵', icon: '🪵', desc: 'Jepitan kayu jemuran ala polaroid' },
  { id: 'magnet', label: 'Magnet Bulat 🧲', icon: '🧲', desc: 'Magnet kulkas mengkilap warna-warni' },
  { id: 'tape', label: 'Selotip Saja 🏷️', icon: '🏷️', desc: 'Hanya strip washi tape tanpa sematan' },
];

export const COMPLETION_STAMP_OPTIONS: { id: CompletionStamp; label: string; desc: string }[] = [
  { id: 'SELESAI!', label: 'SELESAI!', desc: 'Stempel standar misi beres gemilang' },
  { id: 'LUNAS', label: 'LUNAS', desc: 'Cocok untuk tagihan, belanja & kewajiban' },
  { id: 'APPROVED', label: 'APPROVED', desc: 'Cap verifikasi persetujuan profesional' },
  { id: 'MANTAP! 👍', label: 'MANTAP! 👍', desc: 'Apresiasi santai penuh semangat' },
  { id: 'DONE ✓', label: 'DONE ✓', desc: 'Cap centang modern minimalis' },
  { id: 'none', label: 'Tanpa Stempel', desc: 'Kartu selesai bersih tanpa cap' },
];

export const STAMP_COLOR_OPTIONS: {
  id: StampColor;
  label: string;
  borderClass: string;
  textClass: string;
  bgClass: string;
  hex: string;
}[] = [
  { id: 'red', label: 'Merah Karmin', borderClass: 'border-red-600 dark:border-red-500', textClass: 'text-red-600 dark:text-red-400', bgClass: 'bg-red-500/10', hex: '#dc2626' },
  { id: 'green', label: 'Hijau Emerald', borderClass: 'border-emerald-600 dark:border-emerald-500', textClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-500/10', hex: '#16a34a' },
  { id: 'blue', label: 'Biru Arsip', borderClass: 'border-blue-600 dark:border-blue-500', textClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-500/10', hex: '#2563eb' },
  { id: 'purple', label: 'Ungu Lilac', borderClass: 'border-purple-600 dark:border-purple-500', textClass: 'text-purple-600 dark:text-purple-400', bgClass: 'bg-purple-500/10', hex: '#9333ea' },
  { id: 'gold', label: 'Emas Juara', borderClass: 'border-amber-600 dark:border-amber-500', textClass: 'text-amber-700 dark:text-amber-400', bgClass: 'bg-amber-500/10', hex: '#d97706' },
];

export const VIEW_DENSITY_OPTIONS: { id: ViewDensity; label: string; icon: string; desc: string }[] = [
  { id: 'cozy', label: 'Mode Nyaman (Cozy)', icon: '📖', desc: 'Kartu lega, sub-tugas terbuka & mudah dibaca' },
  { id: 'compact', label: 'Mode Ringkas (Compact)', icon: '📑', desc: 'Kartu padat & hemat ruang untuk banyak tugas' },
];

export const SORT_BY_OPTIONS: { id: SortByOption; label: string; desc: string }[] = [
  { id: 'manual', label: 'Manual (Bebas Geser)', desc: 'Urutan bebas via drag-and-drop' },
  { id: 'priority', label: 'Prioritas Tertinggi', desc: 'Tinggi 🔥 ke Santai 🍃' },
  { id: 'dueDate', label: 'Tenggat Terdekat', desc: 'Jatuh tempo paling awal di atas' },
  { id: 'title', label: 'Abjad (A - Z)', desc: 'Nama tugas berurutan alfabetis' },
];

export const DESK_BUDDY_OPTIONS: {
  id: DeskBuddyType;
  name: string;
  avatar: string;
  desc: string;
  defaultQuote: string;
}[] = [
  { id: 'cat', name: 'Mimi si Kucing', avatar: '🐱', desc: 'Kucing manis penyemangat kerja', defaultQuote: 'Meow! Satu per satu pasti kelar kok! 🐾' },
  { id: 'dog', name: 'Bobi si Anjing', avatar: '🐶', desc: 'Anjing setia yang selalu bersemangat', defaultQuote: 'Guk! Kamu pasti bisa, ayo semangat! 🦴' },
  { id: 'plant', name: 'Moko si Sukulen', avatar: '🌱', desc: 'Tanaman tenang pembawa fokus', defaultQuote: 'Tumbuh sedikit demi sedikit setiap hari 🌿' },
  { id: 'coffee', name: 'KopiBot Barista', avatar: '☕', desc: 'Robot kopi pembangkit energi', defaultQuote: 'Bip-bop! Jangan lupa seduh kopi & minum air! ⚡' },
  { id: 'none', name: 'Tanpa Maskot', avatar: '🚫', desc: 'Tampilan bersih tanpa teman meja', defaultQuote: '' },
];

const STORAGE_KEY = 'ceria_todo_user_preferences_v1';

function isSafeUrl(url: unknown): string | null {
  if (typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }
  return null;
}

export function loadUserPreferences(): UserPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      pinStyle: parsed.pinStyle || DEFAULT_PREFERENCES.pinStyle,
      completionStamp: parsed.completionStamp || DEFAULT_PREFERENCES.completionStamp,
      stampColor: parsed.stampColor || DEFAULT_PREFERENCES.stampColor,
      viewDensity: parsed.viewDensity || DEFAULT_PREFERENCES.viewDensity,
      sortBy: parsed.sortBy || DEFAULT_PREFERENCES.sortBy,
      deskBuddy: parsed.deskBuddy || DEFAULT_PREFERENCES.deskBuddy,
      footerText: typeof parsed.footerText === 'string' ? parsed.footerText : DEFAULT_PREFERENCES.footerText,
      customLogoUrl: isSafeUrl(parsed.customLogoUrl),
      customBgUrl: isSafeUrl(parsed.customBgUrl),
      columns: {
        ...DEFAULT_PREFERENCES.columns,
        ...(parsed.columns || {}),
      },
      customCategories: Array.isArray(parsed.customCategories) && parsed.customCategories.length > 0
        ? parsed.customCategories
        : DEFAULT_PREFERENCES.customCategories,
    };
  } catch (err) {
    console.warn('Gagal membaca preferensi pengguna dari localStorage:', err);
    return DEFAULT_PREFERENCES;
  }
}

export function saveUserPreferences(prefs: UserPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (err: unknown) {
    console.error('Gagal menyimpan preferensi pengguna:', err);
    // If QuotaExceededError, gracefully strip heavy base64 images and save settings
    if (
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED' || err.code === 22)
    ) {
      try {
        const leanPrefs: UserPreferences = {
          ...prefs,
          customBgUrl: prefs.customBgUrl?.startsWith('data:') ? null : prefs.customBgUrl,
          customLogoUrl: prefs.customLogoUrl?.startsWith('data:') ? null : prefs.customLogoUrl,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(leanPrefs));
        console.warn('Kapasitas penyimpanan browser penuh. Preferensi disimpan tanpa gambar base64 besar.');
      } catch (innerErr) {
        console.error('Gagal menyimpan lean preferences setelah QuotaExceededError:', innerErr);
      }
    }
  }
}

export function getThemeConfig(themeId: string): ThemeConfig {
  const found = THEME_LIST.find((t) => t.id === themeId);
  return found || THEME_LIST[0];
}

export function getStampStyle(color: StampColor = 'red') {
  const found = STAMP_COLOR_OPTIONS.find((c) => c.id === color);
  return found || STAMP_COLOR_OPTIONS[0];
}
