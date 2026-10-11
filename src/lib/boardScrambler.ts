export interface ScrambledTaskItem {
  id: string;
  title: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  dueDateStr?: string;
}

export const CHEERFUL_SAMPLE_TASKS: ScrambledTaskItem[] = [
  {
    id: 'cheerful-1',
    title: 'Ngopi santai di cafe favorit ☕',
    category: 'Santai',
    priority: 'MEDIUM',
    status: 'TODO',
    dueDateStr: 'Hari ini',
  },
  {
    id: 'cheerful-2',
    title: 'Baca buku inspiratif 15 menit 📖',
    category: 'Belajar',
    priority: 'LOW',
    status: 'TODO',
    dueDateStr: 'Besok',
  },
  {
    id: 'cheerful-3',
    title: 'Rapikan meja kerja & tempel stiker ✨',
    category: 'Kreatif',
    priority: 'HIGH',
    status: 'TODO',
    dueDateStr: 'Hari ini',
  },
  {
    id: 'cheerful-4',
    title: 'Fokus tuntaskan proyek utama 💻',
    category: 'Kerja',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    dueDateStr: 'Sedang Berjalan',
  },
  {
    id: 'cheerful-5',
    title: 'Bikin playlist lofi buat teman fokus 🎧',
    category: 'Kreatif',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
  },
  {
    id: 'cheerful-6',
    title: 'Jalan santai sore & cari angin segar 🏃',
    category: 'Kesehatan',
    priority: 'LOW',
    status: 'IN_PROGRESS',
  },
  {
    id: 'cheerful-7',
    title: 'Selesaikan konsep desain estetik 🎨',
    category: 'Kreatif',
    priority: 'HIGH',
    status: 'DONE',
  },
  {
    id: 'cheerful-8',
    title: 'Target harian sukses tercapai! 🌟',
    category: 'Personal',
    priority: 'MEDIUM',
    status: 'DONE',
  },
];

/**
 * Returns scrambled tasks for screenshot generation if privacyMode is 'cheerful'.
 * If 'original', keeps the user's real tasks.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDisplayTasksForCapture(realTasks: any[], privacyMode: 'cheerful' | 'original'): ScrambledTaskItem[] {
  if (privacyMode === 'original' && realTasks && realTasks.length > 0) {
    return realTasks.map((t, idx) => ({
      id: t.id || `task-${idx}`,
      title: t.title || 'Tugas Tanpa Judul',
      category: t.category || 'Personal',
      priority: t.priority || 'MEDIUM',
      status: t.status || 'TODO',
      dueDateStr: t.dueDate ? 'Tenggat' : undefined,
    }));
  }

  // If privacy mode is cheerful OR user has no tasks:
  return CHEERFUL_SAMPLE_TASKS;
}
