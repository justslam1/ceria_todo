export type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'cream';

export interface NoteItem {
  id: string;
  userId?: string | null;
  title: string;
  content: string;
  color: NoteColor;
  isPinned: boolean;
  posX?: number | null;
  posY?: number | null;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

export interface NoteThemeStyle {
  bg: string;
  border: string;
  headerBg: string;
  tapeColor: string;
  pinBg: string;
  badge: string;
  accent: string;
}

export const NOTE_COLOR_STYLES: Record<NoteColor, NoteThemeStyle> = {
  yellow: {
    bg: 'bg-amber-50/90 dark:bg-amber-950/40',
    border: 'border-amber-200/90 dark:border-amber-800/60',
    headerBg: 'bg-amber-100/70 dark:bg-amber-900/30',
    tapeColor: 'bg-amber-200/70 border-amber-300/80',
    pinBg: 'bg-amber-500 text-white',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    accent: 'text-amber-700 dark:text-amber-300',
  },
  pink: {
    bg: 'bg-rose-50/90 dark:bg-rose-950/40',
    border: 'border-rose-200/90 dark:border-rose-800/60',
    headerBg: 'bg-rose-100/70 dark:bg-rose-900/30',
    tapeColor: 'bg-rose-200/70 border-rose-300/80',
    pinBg: 'bg-rose-500 text-white',
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
    accent: 'text-rose-700 dark:text-rose-300',
  },
  blue: {
    bg: 'bg-sky-50/90 dark:bg-sky-950/40',
    border: 'border-sky-200/90 dark:border-sky-800/60',
    headerBg: 'bg-sky-100/70 dark:bg-sky-900/30',
    tapeColor: 'bg-sky-200/70 border-sky-300/80',
    pinBg: 'bg-sky-500 text-white',
    badge: 'bg-sky-100 text-sky-800 border-sky-200',
    accent: 'text-sky-700 dark:text-sky-300',
  },
  green: {
    bg: 'bg-emerald-50/90 dark:bg-emerald-950/40',
    border: 'border-emerald-200/90 dark:border-emerald-800/60',
    headerBg: 'bg-emerald-100/70 dark:bg-emerald-900/30',
    tapeColor: 'bg-emerald-200/70 border-emerald-300/80',
    pinBg: 'bg-emerald-500 text-white',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    accent: 'text-emerald-700 dark:text-emerald-300',
  },
  purple: {
    bg: 'bg-purple-50/90 dark:bg-purple-950/40',
    border: 'border-purple-200/90 dark:border-purple-800/60',
    headerBg: 'bg-purple-100/70 dark:bg-purple-900/30',
    tapeColor: 'bg-purple-200/70 border-purple-300/80',
    pinBg: 'bg-purple-500 text-white',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    accent: 'text-purple-700 dark:text-purple-300',
  },
  cream: {
    bg: 'bg-stone-50/90 dark:bg-stone-900/50',
    border: 'border-stone-200/90 dark:border-stone-700/60',
    headerBg: 'bg-stone-100/70 dark:bg-stone-800/40',
    tapeColor: 'bg-stone-200/70 border-stone-300/80',
    pinBg: 'bg-stone-600 text-white',
    badge: 'bg-stone-100 text-stone-800 border-stone-200',
    accent: 'text-stone-700 dark:text-stone-300',
  },
};
