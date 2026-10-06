import { KanbanBoard } from '@/components/kanban/KanbanBoard';

export const metadata = {
  title: 'Papan Catatan',
  description: 'Aplikasi manajemen tugas interaktif dengan Quick Paste pesan WhatsApp dan alur kerja Kanban yang modern dan ceria.',
};

export default function Home() {
  return <KanbanBoard />;
}
