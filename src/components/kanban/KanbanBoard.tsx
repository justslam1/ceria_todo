'use client';

import React, { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Task, TaskStatus, CreateTaskInput, UpdateTaskInput } from '@/types/task';
import { UserPreferences, SortByOption } from '@/types/preferences';
import {
  loadUserPreferences,
  saveUserPreferences,
  getThemeConfig,
  DEFAULT_PREFERENCES,
} from '@/lib/userPreferences';
import { KanbanColumn } from './KanbanColumn';
import { NotesBoard } from '@/components/notes/NotesBoard';
import { NoteItem, NoteColor } from '@/types/note';
import { Navbar } from '@/components/ui/Navbar';
import { QuickPasteModal } from '@/components/modals/QuickPasteModal';
import { TaskFormModal } from '@/components/modals/TaskFormModal';
import { PersonalizationModal } from '@/components/modals/PersonalizationModal';
import { PomodoroBar } from '@/components/pomodoro/PomodoroBar';
import { ArchiveModal } from '@/components/modals/ArchiveModal';
import { DeskBuddy } from '@/components/ui/DeskBuddy';
import { BoardStickers } from '@/components/ui/BoardStickers';
import {
  toggleSubtaskInRawDescription,
  isTaskPinned,
  toggleTaskPin,
  isTaskArchived,
  setTaskArchived,
} from '@/lib/subtasks';
import { triggerCelebration } from '@/lib/confetti';
import { playPopSound, playVictoryChime, isSoundMuted, setSoundMuted } from '@/lib/soundEffects';
import {
  Search,
  Filter,
  RefreshCw,
  X,
  Calendar,
  Clock,
  SlidersHorizontal,
  Target,
  Gift,
  Award,
  Timer,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  ArrowUpDown,
  LayoutGrid,
  Rows3,
  Columns3,
} from 'lucide-react';

export const KanbanBoard: React.FC = () => {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [soundMuted, setSoundMutedState] = useState(() =>
    typeof window !== 'undefined' ? isSoundMuted() : false
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  // Preferences & Customization State
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    typeof window !== 'undefined' ? loadUserPreferences() : DEFAULT_PREFERENCES
  );
  const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Pomodoro & Archive State
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [pomodoroTask, setPomodoroTask] = useState<Task | null>(null);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  // Modals state
  const [isQuickPasteOpen, setIsQuickPasteOpen] = useState(false);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [defaultStatusForNew, setDefaultStatusForNew] = useState<TaskStatus>('TODO');
  const [singleColumnTab, setSingleColumnTab] = useState<TaskStatus>('TODO');

  // Notes Mode State
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes'>('tasks');
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isNotesLoading, setIsNotesLoading] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);

  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentDate(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Active Theme Config
  const themeConfig = useMemo(() => {
    return getThemeConfig(preferences.theme);
  }, [preferences.theme]);

  // Update document title & favicon dynamically with personalized logo, title, slogan & dark mode
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // 1. Dynamic Title
    const appName = preferences.appName?.trim() || 'Papan Catatan';
    document.title = appName;

    // 2. Dynamic Favicon (Logo Unggahan atau Ikon Preset Emoji jika diubah)
    let faviconUrl = preferences.customLogoUrl;
    if (!faviconUrl && preferences.appIconPreset && preferences.appIconPreset !== '✨') {
      faviconUrl = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="85">${encodeURIComponent(preferences.appIconPreset)}</text></svg>`;
    }

    if (faviconUrl) {
      const existingIcons = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
      if (existingIcons.length > 0) {
        existingIcons.forEach((el) => {
          el.href = faviconUrl;
        });
      } else {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = faviconUrl;
        document.head.appendChild(link);
      }
    }

    // 3. Sinkronisasi dark mode class
    if (themeConfig.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [
    preferences.appName,
    preferences.dailyMotto,
    preferences.boardTitle,
    preferences.customLogoUrl,
    preferences.appIconPreset,
    themeConfig.isDark,
  ]);

  const handleToggleSound = () => {
    const nextVal = !soundMuted;
    setSoundMutedState(nextVal);
    setSoundMuted(nextVal);
    if (!nextVal) {
      playPopSound(preferences.soundProfile);
    }
  };

  const handleSavePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    saveUserPreferences(newPrefs);
  };

  // Initial load on mount
  useEffect(() => {
    let ignore = false;

    async function loadInitialTasks() {
      try {
        const res = await fetch('/api/tasks', { signal: AbortSignal.timeout(8000) });
        const data = await res.json();
        if (!ignore) {
          if (data.success && Array.isArray(data.data)) {
            setTasks(data.data);
            setNetworkError(null);
          } else {
            setNetworkError(data.error || 'Format data dari server tidak sesuai.');
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error('Gagal mengambil data tugas:', err);
          setNetworkError('Gagal memuat tugas. Periksa koneksi atau status database.');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadInitialTasks();

    return () => {
      ignore = true;
    };
  }, []);

  // Manual refresh handler
  const handleRefreshTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/tasks', { signal: AbortSignal.timeout(8000) });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTasks(data.data);
        setNetworkError(null);
      } else {
        setNetworkError(data.error || 'Format data dari server tidak sesuai.');
      }
    } catch (err) {
      console.error('Gagal mengambil data tugas:', err);
      setNetworkError('Gagal memuat tugas. Periksa koneksi atau status database.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial notes load
  useEffect(() => {
    let ignore = false;

    async function loadInitialNotes() {
      try {
        const res = await fetch('/api/notes', { signal: AbortSignal.timeout(8000) });
        const data = await res.json();
        if (!ignore && data.success && Array.isArray(data.data)) {
          setNotes(data.data);
        }
      } catch (err) {
        if (!ignore) {
          console.error('Gagal mengambil data catatan:', err);
        }
      }
    }

    loadInitialNotes();

    return () => {
      ignore = true;
    };
  }, []);

  // Fetch notes from API for manual refresh
  const fetchNotes = useCallback(async () => {
    setIsNotesLoading(true);
    try {
      const res = await fetch('/api/notes', { signal: AbortSignal.timeout(8000) });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setNotes(data.data);
      }
    } catch (err) {
      console.error('Gagal mengambil data catatan:', err);
    } finally {
      setIsNotesLoading(false);
    }
  }, []);

  const handleCreateNote = async (data: { title: string; content: string; color: NoteColor; isPinned: boolean }) => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        setNotes((prev) => [resData.data, ...prev]);
        playPopSound(preferences.soundProfile);
      }
    } catch (err) {
      console.error('Gagal membuat catatan:', err);
    }
  };

  const handleUpdateNote = async (id: string, updateData: Partial<NoteItem>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updateData, updatedAt: new Date().toISOString() } : n))
    );
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        setNotes((prev) =>
          prev.map((n) => (n.id === id ? resData.data : n))
        );
      }
    } catch (err) {
      console.error('Gagal memperbarui catatan:', err);
      fetchNotes();
    }
  };

  const handleDeleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      playPopSound(preferences.soundProfile);
    } catch (err) {
      console.error('Gagal menghapus catatan:', err);
      fetchNotes();
    }
  };

  const handleConvertNoteToTask = async (note: NoteItem) => {
    try {
      const newTaskInput: CreateTaskInput = {
        title: note.title.trim() || 'Catatan Baru',
        description: note.content || '',
        status: 'TODO',
        priority: 'MEDIUM',
        category: 'Catatan Bebas',
      };
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTaskInput),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setTasks((prev) => [data.data, ...prev]);
        triggerCelebration(preferences.celebrationFx);
        playVictoryChime(preferences.soundProfile);
        setActiveTab('tasks');
      }
    } catch (err) {
      console.error('Gagal mengonversi catatan ke tugas:', err);
    }
  };

  // Active vs Archived tasks
  const activeTasks = useMemo(() => {
    return tasks.filter((t) => !isTaskArchived(t.description));
  }, [tasks]);

  const archivedTasks = useMemo(() => {
    return tasks.filter((t) => isTaskArchived(t.description));
  }, [tasks]);

  // Pinned Focus Tasks (active only, excluding completed)
  const pinnedTasks = useMemo(() => {
    return activeTasks.filter((t) => isTaskPinned(t.description) && t.status !== 'DONE');
  }, [activeTasks]);

  // Extract unique categories for filter dropdown (including custom defined categories)
  const categories = useMemo(() => {
    const set = new Set<string>();
    (preferences.customCategories || []).forEach((c) => {
      if (c.name) set.add(c.name);
    });
    activeTasks.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [activeTasks, preferences.customCategories]);

  // Filter active tasks based on search & tags
  const filteredTasks = useMemo(() => {
    return activeTasks.filter((task) => {
      const matchSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory =
        selectedCategory === 'ALL' || task.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchPriority =
        selectedPriority === 'ALL' || task.priority === selectedPriority;

      return matchSearch && matchCategory && matchPriority;
    });
  }, [activeTasks, searchQuery, selectedCategory, selectedPriority]);

  // Sort filtered tasks if a specific sorting mode is active
  const sortedFilteredTasks = useMemo(() => {
    const list = [...filteredTasks];
    if (preferences.sortBy === 'priority') {
      const priorityWeight: Record<string, number> = { HIGH: 1, MEDIUM: 2, LOW: 3 };
      list.sort((a, b) => (priorityWeight[a.priority] || 2) - (priorityWeight[b.priority] || 2));
    } else if (preferences.sortBy === 'dueDate') {
      list.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    } else if (preferences.sortBy === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title, 'id'));
    }
    return list;
  }, [filteredTasks, preferences.sortBy]);

  const effectiveColumnCount = preferences.activeColumnCount || 3;

  // Group tasks by status
  const todoTasks = useMemo(() => {
    if (effectiveColumnCount === 2) {
      // In 2-column mode, both TODO and any existing IN_PROGRESS tasks are shown in Column 1 (TODO)
      return sortedFilteredTasks.filter((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS');
    }
    return sortedFilteredTasks.filter((t) => t.status === 'TODO');
  }, [sortedFilteredTasks, effectiveColumnCount]);

  const inProgressTasks = useMemo(
    () => sortedFilteredTasks.filter((t) => t.status === 'IN_PROGRESS'),
    [sortedFilteredTasks]
  );
  const doneTasks = useMemo(
    () => sortedFilteredTasks.filter((t) => t.status === 'DONE'),
    [sortedFilteredTasks]
  );

  // Milestone / Progress calculations based on active tasks
  const totalCount = activeTasks.length;
  const doneCount = activeTasks.filter((t) => t.status === 'DONE').length;
  const inProgressCount = activeTasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const todoCount = activeTasks.filter((t) => t.status === 'TODO').length;
  const completionPercentage = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Dynamic Background Style
  const backgroundPatternStyle = useMemo(() => {
    if (preferences.bgPattern === 'custom' && preferences.customBgUrl) {
      return {
        backgroundColor: themeConfig.bgHex,
        backgroundImage: `url(${preferences.customBgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
    if (preferences.bgPattern === 'clean') {
      return { backgroundColor: themeConfig.bgHex };
    }
    if (preferences.bgPattern === 'grid') {
      return {
        backgroundColor: themeConfig.bgHex,
        backgroundImage: `linear-gradient(to right, ${themeConfig.dotColor} 1px, transparent 1px), linear-gradient(to bottom, ${themeConfig.dotColor} 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      };
    }
    // dots (default)
    return {
      backgroundColor: themeConfig.bgHex,
      backgroundImage: `radial-gradient(${themeConfig.dotColor} 1.2px, transparent 1.2px)`,
      backgroundSize: '20px 20px',
    };
  }, [preferences.bgPattern, preferences.customBgUrl, themeConfig]);

  // Handle Drag & Drop with Optimistic UI Update & Audio/Confetti
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;
    const isMovingToDone = newStatus === 'DONE' && source.droppableId !== 'DONE';

    if (isMovingToDone) {
      triggerCelebration(preferences.celebrationFx);
      playVictoryChime(preferences.soundProfile);
    } else {
      playPopSound(preferences.soundProfile);
    }

    const previousTasks = [...tasks];

    setTasks((prev) => {
      const taskIndex = prev.findIndex((t) => t.id === draggableId);
      if (taskIndex === -1) return prev;

      const updated = [...prev];
      const targetTask = { ...updated[taskIndex], status: newStatus, order: destination.index };
      updated.splice(taskIndex, 1);
      updated.splice(destination.index, 0, targetTask);
      return updated;
    });

    try {
      const res = await fetch(`/api/tasks/${draggableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          order: destination.index,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        console.warn('Gagal memperbarui urutan tugas di server:', errData);
        setTasks(previousTasks);
        setNetworkError(errData?.error || 'Gagal menyimpan posisi tugas. Pastikan MySQL di XAMPP aktif.');
      }
    } catch (err) {
      console.warn('Gagal memindahkan tugas (koneksi terganggu):', err);
      setTasks(previousTasks);
      setNetworkError('Koneksi terputus saat memindahkan tugas. Pastikan MySQL di XAMPP aktif.');
    }
  };

  // Quick Status change button handler
  const handleStatusChange = async (id: string, newStatus: TaskStatus) => {
    if (newStatus === 'DONE') {
      triggerCelebration(preferences.celebrationFx);
      playVictoryChime(preferences.soundProfile);
    } else {
      playPopSound(preferences.soundProfile);
    }

    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        console.warn('Gagal memperbarui status di server:', errData);
        setTasks(previousTasks);
        setNetworkError(errData?.error || 'Gagal memperbarui status tugas. Pastikan MySQL di XAMPP aktif.');
      }
    } catch (err) {
      console.warn('Gagal mengubah status tugas (koneksi terganggu):', err);
      setTasks(previousTasks);
      setNetworkError('Koneksi terputus saat mengubah status tugas.');
    }
  };

  // Delete task handler
  const handleDeleteTask = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tugas ini?')) return;

    playPopSound(preferences.soundProfile);
    const previousTasks = [...tasks];
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        console.warn('Gagal menghapus tugas di server:', errData);
        setTasks(previousTasks);
        setNetworkError(errData?.error || 'Gagal menghapus tugas dari server.');
      }
    } catch (err) {
      console.warn('Gagal menghapus tugas (koneksi terganggu):', err);
      setTasks(previousTasks);
      setNetworkError('Koneksi terputus saat menghapus tugas.');
    }
  };

  // Subtask checkbox toggle handler
  const handleToggleSubtask = async (taskId: string, subtaskIndex: number) => {
    playPopSound(preferences.soundProfile);
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const newDescription = toggleSubtaskInRawDescription(targetTask.description, subtaskIndex);
    const previousTasks = [...tasks];

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, description: newDescription } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newDescription }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        console.warn('Gagal memperbarui sub-tugas di server:', errData);
        setTasks(previousTasks);
        setNetworkError(errData?.error || 'Gagal memperbarui daftar sub-tugas. Pastikan MySQL di XAMPP aktif.');
      }
    } catch (err) {
      console.warn('Gagal memperbarui sub-tugas (koneksi terganggu):', err);
      setTasks(previousTasks);
      setNetworkError('Koneksi terputus saat memperbarui sub-tugas.');
    }
  };

  // Focus Pin toggle handler
  const handleTogglePin = async (taskId: string) => {
    playPopSound(preferences.soundProfile);
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const newDescription = toggleTaskPin(targetTask.description);
    const previousTasks = [...tasks];

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, description: newDescription } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newDescription }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        console.warn('Gagal memperbarui status pin di server:', errData);
        setTasks(previousTasks);
        setNetworkError(errData?.error || 'Gagal memperbarui pin fokus. Pastikan MySQL di XAMPP aktif.');
      }
    } catch (err) {
      console.warn('Gagal mengubah pin fokus (koneksi terganggu):', err);
      setTasks(previousTasks);
      setNetworkError('Koneksi terputus saat mengubah pin. Pastikan MySQL di XAMPP aktif.');
    }
  };

  // Archive Completed Tasks Handler
  const handleArchiveDoneTasks = async () => {
    const unarchivedDone = activeTasks.filter((t) => t.status === 'DONE');
    if (unarchivedDone.length === 0) return;

    if (
      !confirm(
        `Arsipkan ${unarchivedDone.length} tugas yang telah selesai? Kolom akan menjadi bersih dan tugas tetap tersimpan di riwayat arsip.`
      )
    ) {
      return;
    }

    playVictoryChime(preferences.soundProfile);
    triggerCelebration(preferences.celebrationFx);

    const previousTasks = [...tasks];
    const updatedTasks = tasks.map((t) => {
      if (t.status === 'DONE' && !isTaskArchived(t.description)) {
        return { ...t, description: setTaskArchived(t.description, true) };
      }
      return t;
    });
    setTasks(updatedTasks);

    try {
      await Promise.all(
        unarchivedDone.map((t) =>
          fetch(`/api/tasks/${t.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: setTaskArchived(t.description, true) }),
            signal: AbortSignal.timeout(8000),
          })
        )
      );
    } catch (err) {
      console.error('Gagal mengarsipkan sebagian tugas di server:', err);
      setTasks(previousTasks);
      setNetworkError('Gagal mengarsipkan tugas di server. Perubahan dikembalikan.');
    }
  };

  // Unarchive task handler
  const handleUnarchiveTask = async (taskId: string) => {
    playPopSound(preferences.soundProfile);
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const newDescription = setTaskArchived(targetTask.description, false);
    const previousTasks = [...tasks];

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, description: newDescription } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newDescription }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error('Gagal mengembalikan tugas dari arsip');
    } catch (err) {
      console.error(err);
      setTasks(previousTasks);
    }
  };

  // Delete single archived task handler
  const handleDeleteArchivedTask = async (taskId: string) => {
    await handleDeleteTask(taskId);
  };

  // Clear all archived tasks handler
  const handleClearAllArchived = async () => {
    const toDelete = tasks.filter((t) => isTaskArchived(t.description));
    if (toDelete.length === 0) return;

    setTasks((prev) => prev.filter((t) => !isTaskArchived(t.description)));

    try {
      await Promise.all(
        toDelete.map((t) =>
          fetch(`/api/tasks/${t.id}`, {
            method: 'DELETE',
            signal: AbortSignal.timeout(8000),
          })
        )
      );
    } catch (err) {
      console.error('Gagal menghapus arsip di server:', err);
    }
  };

  // Start Pomodoro Focus with Task
  const handleStartPomodoro = (task: Task) => {
    setPomodoroTask(task);
    setIsPomodoroOpen(true);
  };

  // Restore data from JSON backup file
  // Restore data from JSON backup file using safe single batch
  const handleRestoreData = async (
    importedTasks: Task[],
    importedPreferences: UserPreferences
  ) => {
    handleSavePreferences(importedPreferences);

    if (importedTasks.length > 0) {
      setIsLoading(true);
      try {
        const payload = importedTasks.slice(0, 100).map((it) => ({
          title: it.title,
          description: it.description || '',
          status: it.status || 'TODO',
          priority: it.priority || 'MEDIUM',
          category: it.category || 'General',
          dueDate: it.dueDate || null,
          estimatedTime: it.estimatedTime || null,
        }));

        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(15000),
        });

        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setTasks((prev) => [...data.data, ...prev]);
        }
      } catch (err) {
        console.error('Gagal memulihkan data tugas:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Save manual task (create or edit)
  const handleSaveTask = async (
    taskData: CreateTaskInput | UpdateTaskInput,
    id?: string
  ) => {
    try {
      if (id) {
        const res = await fetch(`/api/tasks/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
          signal: AbortSignal.timeout(8000),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Gagal memperbarui tugas');
        }
        playPopSound(preferences.soundProfile);
        setTasks((prev) => prev.map((t) => (t.id === id ? data.data : t)));
      } else {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
          signal: AbortSignal.timeout(8000),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Gagal membuat tugas baru');
        }

        if (taskData.status === 'DONE') {
          triggerCelebration(preferences.celebrationFx);
          playVictoryChime(preferences.soundProfile);
        } else {
          playPopSound(preferences.soundProfile);
        }

        setTasks((prev) => [data.data, ...prev]);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        throw new Error('Waktu tunggu koneksi habis. Pastikan MySQL di XAMPP sedang aktif.');
      }
      throw err;
    }
  };

  const fontMoodClass = useMemo(() => {
    if (preferences.fontMood === 'handwriting') return 'font-handwriting';
    if (preferences.fontMood === 'rounded') return 'font-rounded';
    return 'font-sans';
  }, [preferences.fontMood]);

  // Handle tasks created from WhatsApp Quick Paste
  const handleTasksSavedFromWhatsApp = (newTasks: Task[]) => {
    playPopSound(preferences.soundProfile);
    setTasks((prev) => [...newTasks, ...prev]);
  };

  const handleOpenEdit = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskFormOpen(true);
  };

  const handleOpenNewInColumn = (status: TaskStatus) => {
    setTaskToEdit(null);
    setDefaultStatusForNew(status);
    setIsTaskFormOpen(true);
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
          <span>Memuat Ceria Todo Board...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col relative ${fontMoodClass} transition-colors duration-300 ${
        themeConfig.isDark ? 'text-slate-100' : 'text-slate-800'
      }`}
    >
      {/* Background Wallpaper / Pattern (Fixed for smooth performance) */}
      <div
        className="fixed inset-0 pointer-events-none z-0 transition-all duration-300 overflow-hidden"
        style={{
          ...backgroundPatternStyle,
          filter:
            preferences.bgPattern === 'custom' &&
            preferences.customBgUrl &&
            (preferences.bgBlur ?? 0) > 0
              ? `blur(${preferences.bgBlur}px)`
              : undefined,
          transform:
            preferences.bgPattern === 'custom' &&
            preferences.customBgUrl &&
            (preferences.bgBlur ?? 0) > 0
              ? 'scale(1.05)'
              : undefined,
        }}
      />

      {/* Dim / Softness Overlay for Custom Wallpaper */}
      {preferences.bgPattern === 'custom' && preferences.customBgUrl && (
        <div
          className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-300 ${
            themeConfig.isDark ? 'bg-black' : 'bg-slate-950'
          }`}
          style={{
            opacity: (preferences.bgDim ?? 30) / 100,
          }}
        />
      )}

      {/* Main App Content on top of background */}
      <div className="relative z-1 flex flex-col min-h-screen">
        {/* Free-floating Corkboard Stickers & Doodles */}
        <BoardStickers
          stickers={preferences.stickers || []}
          onChangeStickers={(newStickers) =>
            handleSavePreferences({ ...preferences, stickers: newStickers })
          }
          soundProfile={preferences.soundProfile}
          isDark={themeConfig.isDark}
        />

        {/* Top Navigation with Sound Mute/Unmute & Personalization */}
        <Navbar
          onOpenQuickPaste={() => setIsQuickPasteOpen(true)}
          onOpenNewTask={() => handleOpenNewInColumn('TODO')}
          onOpenPersonalization={() => setIsPersonalizationOpen(true)}
          onOpenPomodoro={() => setIsPomodoroOpen((prev) => !prev)}
          onOpenArchive={() => setIsArchiveOpen(true)}
          isSoundMuted={soundMuted}
          onToggleSound={handleToggleSound}
          preferences={preferences}
          themeConfig={themeConfig}
          counts={{
            total: totalCount,
            todo: todoCount,
            inProgress: inProgressCount,
            done: doneCount,
          }}
          archivedCount={archivedTasks.length}
          activeTab={activeTab}
          onTabChange={(tab) => {
            playPopSound(preferences.soundProfile);
            setActiveTab(tab);
          }}
          notesCount={notes.length}
          onOpenNewNote={() => {
            setActiveTab('notes');
            setEditingNote(null);
            setIsNoteModalOpen(true);
          }}
        />

        {/* Main Board Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex flex-col gap-2.5">
          {activeTab === 'notes' ? (
            <NotesBoard
              notes={notes}
              isLoading={isNotesLoading}
              themeConfig={themeConfig}
              onCreateNote={handleCreateNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              onConvertToTask={handleConvertNoteToTask}
              onRefreshNotes={fetchNotes}
              isModalOpen={isNoteModalOpen}
              onOpenCreateModal={() => {
                setEditingNote(null);
                setIsNoteModalOpen(true);
              }}
              onCloseModal={() => {
                setIsNoteModalOpen(false);
                setEditingNote(null);
              }}
              editingNote={editingNote}
              onSelectEditingNote={(n) => {
                setEditingNote(n);
                setIsNoteModalOpen(true);
              }}
            />
          ) : (
            <>
              {/* Board Header & Progress Milestone Banner */}
        {(preferences.showBoardHeader !== false || (preferences.showDailyGoalBanner !== false && preferences.dailyTargetGoal > 0)) && (
          <div
            className={`p-3 sm:px-4 sm:py-3 rounded-2xl border shadow-xs flex flex-col gap-2 transition-all duration-300 ${
              themeConfig.isDark
                ? 'bg-[#1b1e28]/40 backdrop-blur-md border-slate-700/50 shadow-slate-950/20'
                : `bg-white/40 backdrop-blur-md ${themeConfig.headerBorder} shadow-slate-200/50`
            }`}
          >
            {preferences.showBoardHeader !== false && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2.5">
              {/* Board Icon Magnet/Pin */}
              <div
                className={`w-7.5 h-7.5 rounded-xl flex items-center justify-center text-base font-bold shadow-2xs border ${themeConfig.badgeBg} ${themeConfig.badgeBorder}`}
              >
                {preferences.boardIcon || '📌'}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h2
                    className={`font-black text-sm flex items-center gap-1.5 ${
                      themeConfig.isDark ? 'text-white' : 'text-slate-800'
                    }`}
                  >
                    <span>{preferences.boardTitle || 'Studio Papan Buletin Kerja'}</span>
                    {completionPercentage === 100 && totalCount > 0 && (
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                        🏆 Sempurna!
                      </span>
                    )}
                  </h2>

                  {/* Quick Edit Board Button */}
                  <button
                    onClick={() => setIsPersonalizationOpen(true)}
                    className={`p-0.5 rounded-lg transition-all cursor-pointer ${
                      themeConfig.isDark
                        ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                        : 'text-slate-400 hover:text-orange-500 hover:bg-orange-50'
                    }`}
                    title="Ubah Nama & Tampilan Papan"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                  </button>
                </div>

                {/* Personalized Greeting & Dynamic Progress */}
                <p
                  className={`text-[11px] ${
                    themeConfig.isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {preferences.userName && (
                    <span className="font-semibold text-orange-500 mr-1">
                      Halo, {preferences.userName}! {preferences.avatarIcon}
                    </span>
                  )}
                  {totalCount === 0
                    ? 'Papan buletin siap diisi. Tekan "+ Tambah Tugas" atau "Quick Paste WA" untuk memulai!'
                    : completionPercentage === 100
                    ? 'Luar biasa! Semua misi berhasil dituntaskan hari ini!'
                    : `${doneCount} dari ${totalCount} misi selesai (${completionPercentage}%). Semangat terus! 💪`}
                </p>
              </div>
            </div>

            {/* Badges: Live Date & Time + Completion Percentage */}
            <div className="flex flex-wrap items-center gap-1.5">
              {currentDate && (
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-semibold shadow-2xs ${
                    themeConfig.isDark
                      ? 'bg-slate-900/50 border-slate-700/50 text-slate-300'
                      : 'bg-amber-50/70 border-amber-200/70 text-amber-900'
                  }`}
                >
                  <Calendar className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>{currentDate}</span>
                  <span className="text-amber-300">•</span>
                  <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className={`font-mono ${themeConfig.isDark ? 'text-amber-400' : 'text-slate-800'}`}>
                    {currentTime}
                  </span>
                </div>
              )}

              <div
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[11px] font-bold shadow-2xs ${
                  themeConfig.isDark
                    ? 'bg-slate-900/50 border-slate-700/50 text-slate-200'
                    : 'bg-slate-100/70 border-slate-200/80 text-slate-800'
                }`}
              >
                <span className={themeConfig.isDark ? 'text-slate-400 font-normal' : 'text-slate-500 font-normal'}>
                  Pencapaian:
                </span>
                <span>{completionPercentage}%</span>
              </div>
            </div>
          </div>
        )}

          {/* Gamifikasi: Target Harian & Hadiah (Daily Target & Self-Reward) */}
          {preferences.showDailyGoalBanner !== false && preferences.dailyTargetGoal > 0 && (
            <div
              className={`px-3 py-1.5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-2 transition-all ${
                doneCount >= preferences.dailyTargetGoal
                  ? 'bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-amber-500/15 border-emerald-400/60 shadow-xs backdrop-blur-xs'
                  : themeConfig.isDark
                  ? 'bg-slate-900/30 border-slate-700/40 backdrop-blur-xs'
                  : 'bg-amber-50/30 border-amber-200/50 backdrop-blur-xs'
              }`}
            >
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    doneCount >= preferences.dailyTargetGoal
                      ? 'bg-emerald-500 text-white shadow-xs animate-bounce'
                      : 'bg-amber-500/20 text-amber-600'
                  }`}
                >
                  {doneCount >= preferences.dailyTargetGoal ? (
                    <Award className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Target className="w-3.5 h-3.5 text-amber-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold ${themeConfig.isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      Target Harian:{' '}
                      <span className="text-orange-500 font-extrabold">
                        {doneCount} / {preferences.dailyTargetGoal} Selesai
                      </span>
                    </span>
                    {doneCount >= preferences.dailyTargetGoal && (
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        🎉 TERCAPAI!
                      </span>
                    )}
                  </div>
                  {preferences.rewardNote && (
                    <div className={`flex items-center gap-1.5 text-[10px] truncate ${themeConfig.isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      <Gift className="w-3 h-3 text-rose-500 shrink-0" />
                      <span>Hadiah: <strong className={`${themeConfig.isDark ? 'text-rose-400' : 'text-rose-600'} font-semibold`}>{preferences.rewardNote}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar & Quick Claim Button */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
                <div className="w-24 sm:w-32 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden shrink-0">
                  <div
                    className={`h-full transition-all duration-500 ${
                      doneCount >= preferences.dailyTargetGoal ? 'bg-emerald-500' : 'bg-orange-500'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.round((doneCount / preferences.dailyTargetGoal) * 100))}%`,
                    }}
                  />
                </div>

                {doneCount >= preferences.dailyTargetGoal && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerCelebration(preferences.celebrationFx);
                      playVictoryChime(preferences.soundProfile);
                    }}
                    className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[11px] font-bold shadow-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer shrink-0 flex items-center gap-1"
                  >
                    <span>Klaim Hadiah 🎁</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Segmented Color Progress Bar */}
          {preferences.showBoardHeader !== false && (
            <div
              className={`w-full h-1.5 rounded-full overflow-hidden flex shadow-inner ${
                themeConfig.isDark ? 'bg-slate-900' : 'bg-slate-100'
              }`}
            >
              {totalCount > 0 ? (
                <>
                  <div
                    style={{ width: `${(doneCount / totalCount) * 100}%` }}
                    className="bg-emerald-500 transition-all duration-300"
                    title={`Selesai: ${doneCount} tugas`}
                  />
                  <div
                    style={{ width: `${(inProgressCount / totalCount) * 100}%` }}
                    className="bg-sky-500 transition-all duration-300"
                    title={`Sedang dikerjakan: ${inProgressCount} tugas`}
                  />
                  <div
                    style={{ width: `${(todoCount / totalCount) * 100}%` }}
                    className="bg-amber-400 transition-all duration-300"
                    title={`Rencana: ${todoCount} tugas`}
                  />
                </>
              ) : (
                <div className={`w-full ${themeConfig.isDark ? 'bg-slate-800' : 'bg-slate-200/50'}`} />
              )}
            </div>
          )}
        </div>
        )}

        {/* Search, Filter & Controls Toolbar */}
        <div
          className={`p-2 sm:px-3 sm:py-2 rounded-2xl border shadow-xs flex flex-col md:flex-row items-center justify-between gap-2 transition-colors duration-300 ${
            themeConfig.isDark
              ? 'bg-[#1b1e28]/40 backdrop-blur-md border-slate-700/50'
              : 'bg-white/40 backdrop-blur-md border-slate-200/60 shadow-slate-200/40'
          }`}
        >
          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tugas di papan..."
              className={`w-full pl-8 pr-7 py-1.5 rounded-xl border text-xs focus:outline-hidden focus:ring-2 ${
                themeConfig.focusRing
              } ${
                themeConfig.isDark
                  ? 'bg-slate-900/40 border-slate-700/60 text-slate-100 placeholder-slate-400'
                  : 'bg-white/50 border-slate-200 text-slate-800 placeholder-slate-400'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Group */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Category Filter */}
            <div
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl border ${
                themeConfig.isDark
                  ? 'bg-slate-900/40 border-slate-700/60 text-slate-300'
                  : 'bg-white/50 border-slate-200 text-slate-600'
              }`}
            >
              <Filter className="w-3 h-3 text-slate-400" />
              <span className="font-medium text-slate-500 text-[11px]">Kategori:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`bg-transparent font-semibold text-xs focus:outline-hidden cursor-pointer ${
                  themeConfig.isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                <option value="ALL" className={themeConfig.isDark ? 'bg-slate-900 text-white' : ''}>Semua</option>
                {categories.map((c) => (
                  <option key={c} value={c} className={themeConfig.isDark ? 'bg-slate-900 text-white' : ''}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl border ${
                themeConfig.isDark
                  ? 'bg-slate-900/40 border-slate-700/60 text-slate-300'
                  : 'bg-white/50 border-slate-200 text-slate-600'
              }`}
            >
              <span className="font-medium text-slate-500 text-[11px]">Prioritas:</span>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className={`bg-transparent font-semibold text-xs focus:outline-hidden cursor-pointer ${
                  themeConfig.isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                <option value="ALL" className={themeConfig.isDark ? 'bg-slate-900 text-white' : ''}>Semua</option>
                <option value="HIGH" className={themeConfig.isDark ? 'bg-slate-900 text-white' : ''}>Tinggi 🔥</option>
                <option value="MEDIUM" className={themeConfig.isDark ? 'bg-slate-900 text-white' : ''}>Sedang ⚡</option>
                <option value="LOW" className={themeConfig.isDark ? 'bg-slate-900 text-white' : ''}>Santai 🍃</option>
              </select>
            </div>

            {/* Sort Selector */}
            <div
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl border ${
                themeConfig.isDark
                  ? 'bg-slate-900/40 border-slate-700/60 text-slate-300'
                  : 'bg-white/50 border-slate-200 text-slate-600'
              }`}
            >
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              <span className="font-medium text-slate-500 text-[11px]">Urutkan:</span>
              <select
                value={preferences.sortBy || 'manual'}
                onChange={(e) =>
                  handleSavePreferences({
                    ...preferences,
                    sortBy: e.target.value as SortByOption,
                  })
                }
                className={`bg-transparent font-semibold text-xs focus:outline-hidden cursor-pointer ${
                  themeConfig.isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                <option value="manual" className={themeConfig.isDark ? 'bg-slate-900 text-white' : ''}>Manual (Bebas)</option>
                <option value="priority" className={themeConfig.isDark ? 'bg-slate-900 text-white' : ''}>Prioritas 🔥</option>
                <option value="dueDate" className={themeConfig.isDark ? 'bg-slate-900 text-white' : ''}>Tenggat Terdekat 🗓️</option>
                <option value="title" className={themeConfig.isDark ? 'bg-slate-900 text-white' : ''}>Abjad (A-Z) 🔤</option>
              </select>
            </div>

            {/* View Density Quick Toggle */}
            <button
              type="button"
              onClick={() => {
                playPopSound(preferences.soundProfile);
                handleSavePreferences({
                  ...preferences,
                  viewDensity: preferences.viewDensity === 'compact' ? 'cozy' : 'compact',
                });
              }}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl border transition-colors cursor-pointer ${
                themeConfig.isDark
                  ? 'bg-slate-900/40 border-slate-700/60 text-slate-300 hover:bg-slate-800/60'
                  : 'bg-white/50 border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title={
                preferences.viewDensity === 'compact'
                  ? 'Ganti ke Mode Nyaman (Cozy)'
                  : 'Ganti ke Mode Ringkas (Compact)'
              }
            >
              {preferences.viewDensity === 'compact' ? (
                <>
                  <Rows3 className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-semibold text-[11px]">Ringkas</span>
                </>
              ) : (
                <>
                  <LayoutGrid className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-semibold text-[11px]">Nyaman</span>
                </>
              )}
            </button>

            {/* Active Column Count Quick Toggle (1, 2, 3 Kolom) */}
            <div
              className={`flex items-center p-0.5 rounded-xl border text-xs ${
                themeConfig.isDark
                  ? 'bg-slate-900/40 border-slate-700/60 text-slate-300'
                  : 'bg-white/50 border-slate-200 text-slate-600'
              }`}
              title="Pilih jumlah kolom papan (1, 2, atau 3 kolom)"
            >
              <div className="flex items-center gap-1 px-1.5 py-0.5 text-slate-400">
                <Columns3 className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium hidden lg:inline">Kolom:</span>
              </div>
              <div className="flex items-center gap-0.5">
                {([1, 2, 3] as const).map((num) => {
                  const isActive = (preferences.activeColumnCount || 3) === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        playPopSound(preferences.soundProfile);
                        handleSavePreferences({
                          ...preferences,
                          activeColumnCount: num,
                        });
                      }}
                      className={`w-6 h-6 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                        isActive
                          ? 'bg-orange-500 text-white shadow-2xs scale-105'
                          : 'hover:bg-slate-200/50 text-slate-500 dark:text-slate-400'
                      }`}
                      title={`Tampilkan ${num} Kolom`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefreshTasks}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                themeConfig.isDark
                  ? 'bg-slate-900/40 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  : 'bg-white/50 border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50'
              }`}
              title="Muat ulang tugas"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Pinned Focus Shelf (Fokus Utama Hari Ini) */}
        {pinnedTasks.length > 0 && (
          <div
            className={`p-3 rounded-2xl border shadow-xs transition-all duration-300 flex flex-col gap-2 ${
              themeConfig.isDark
                ? 'bg-gradient-to-r from-amber-950/30 via-slate-900/40 to-amber-950/20 border-amber-500/40'
                : 'bg-gradient-to-r from-amber-100/80 via-yellow-50/70 to-amber-100/60 border-amber-300/90 shadow-amber-200/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-xs shadow-xs animate-bounce">
                  📌
                </div>
                <div>
                  <h3
                    className={`font-black text-xs sm:text-sm tracking-tight flex items-center gap-1.5 ${
                      themeConfig.isDark ? 'text-amber-300' : 'text-amber-950'
                    }`}
                  >
                    <span>Fokus Utama Hari Ini</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-400 text-amber-950 font-bold border border-amber-500 shadow-2xs">
                      {pinnedTasks.length} Prioritas
                    </span>
                  </h3>
                </div>
              </div>

              <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 hidden sm:block">
                ✨ Selesaikan fokus ini dulu untuk hasil maksimal!
              </div>
            </div>

            {/* Pinned Task Pills Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
              {pinnedTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                    themeConfig.isDark
                      ? 'bg-slate-900/80 border-slate-700/80 hover:border-amber-400/60'
                      : 'bg-white/90 border-amber-200 hover:border-amber-400 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs">
                      {task.status === 'TODO' ? '💡' : '⚡'}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-bold truncate ${
                          themeConfig.isDark ? 'text-white' : 'text-slate-800'
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {task.category} • {task.status === 'TODO' ? 'Rencana' : 'Sedang dikerjakan'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartPomodoro(task)}
                      className="p-1 rounded-lg text-amber-600 hover:bg-amber-100/70 transition-colors cursor-pointer"
                      title="Mulai Pomodoro Fokus ⏱️"
                    >
                      <Timer className="w-3.5 h-3.5" />
                    </button>
                    {task.status === 'IN_PROGRESS' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(task.id, 'TODO')}
                        className="w-5 h-5 rounded-lg flex items-center justify-center bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 shadow-2xs active:scale-95 transition-all cursor-pointer"
                        title="Kembalikan ke Rencana (←)"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        handleStatusChange(
                          task.id,
                          task.status === 'TODO'
                            ? preferences.activeColumnCount === 2
                              ? 'DONE'
                              : 'IN_PROGRESS'
                            : 'DONE'
                        )
                      }
                      className="w-5 h-5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center p-0"
                      title={
                        task.status === 'TODO' && preferences.activeColumnCount !== 2
                          ? 'Mulai Kerjakan (→)'
                          : 'Selesaikan Misi (→)'
                      }
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTogglePin(task.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Lepas sematan fokus"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DragDrop Board Grid with 1, 2, or 3 Columns */}
        <DragDropContext onDragEnd={handleDragEnd}>
          {effectiveColumnCount === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-start pb-8">
              {/* Kolom 1: TODO */}
              <KanbanColumn
                id="TODO"
                title={preferences.columns?.TODO?.title || 'Rencana Brilian'}
                subtitle={preferences.columns?.TODO?.subtitle || 'Ide & tugas baru yang siap dieksekusi'}
                emoji={preferences.columns?.TODO?.emoji || '💡'}
                status="TODO"
                tasks={todoTasks}
                washiTapeStyle={preferences.washiTapeStyle}
                customCategories={preferences.customCategories}
                fontMood={preferences.fontMood}
                noteColorMode={preferences.noteColorMode}
                pinStyle={preferences.pinStyle}
                completionStamp={preferences.completionStamp}
                stampColor={preferences.stampColor}
                viewDensity={preferences.viewDensity}
                paperTexture={preferences.paperTexture}
                activeColumnCount={3}
                onEditTask={handleOpenEdit}
                onDeleteTask={handleDeleteTask}
                onStatusChange={handleStatusChange}
                onAddTaskToColumn={handleOpenNewInColumn}
                onToggleSubtask={handleToggleSubtask}
                onTogglePin={handleTogglePin}
                onStartPomodoro={handleStartPomodoro}
              />

              {/* Kolom 2: IN_PROGRESS */}
              <KanbanColumn
                id="IN_PROGRESS"
                title={preferences.columns?.IN_PROGRESS?.title || 'Aksi Seru'}
                subtitle={preferences.columns?.IN_PROGRESS?.subtitle || 'Sedang dikerjakan dengan semangat'}
                emoji={preferences.columns?.IN_PROGRESS?.emoji || '⚡'}
                status="IN_PROGRESS"
                tasks={inProgressTasks}
                washiTapeStyle={preferences.washiTapeStyle}
                customCategories={preferences.customCategories}
                fontMood={preferences.fontMood}
                noteColorMode={preferences.noteColorMode}
                pinStyle={preferences.pinStyle}
                completionStamp={preferences.completionStamp}
                stampColor={preferences.stampColor}
                viewDensity={preferences.viewDensity}
                paperTexture={preferences.paperTexture}
                activeColumnCount={3}
                onEditTask={handleOpenEdit}
                onDeleteTask={handleDeleteTask}
                onStatusChange={handleStatusChange}
                onAddTaskToColumn={handleOpenNewInColumn}
                onToggleSubtask={handleToggleSubtask}
                onTogglePin={handleTogglePin}
                onStartPomodoro={handleStartPomodoro}
              />

              {/* Kolom 3: DONE */}
              <KanbanColumn
                id="DONE"
                title={preferences.columns?.DONE?.title || 'Misi Sukses'}
                subtitle={preferences.columns?.DONE?.subtitle || 'Telah selesai dengan hasil gemilang! 🎉'}
                emoji={preferences.columns?.DONE?.emoji || '🏆'}
                status="DONE"
                tasks={doneTasks}
                washiTapeStyle={preferences.washiTapeStyle}
                customCategories={preferences.customCategories}
                fontMood={preferences.fontMood}
                noteColorMode={preferences.noteColorMode}
                pinStyle={preferences.pinStyle}
                completionStamp={preferences.completionStamp}
                stampColor={preferences.stampColor}
                viewDensity={preferences.viewDensity}
                paperTexture={preferences.paperTexture}
                activeColumnCount={3}
                onEditTask={handleOpenEdit}
                onDeleteTask={handleDeleteTask}
                onStatusChange={handleStatusChange}
                onAddTaskToColumn={handleOpenNewInColumn}
                onToggleSubtask={handleToggleSubtask}
                onTogglePin={handleTogglePin}
                onStartPomodoro={handleStartPomodoro}
                onArchiveDone={handleArchiveDoneTasks}
              />
            </div>
          )}

          {effectiveColumnCount === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start pb-8 max-w-5xl mx-auto w-full">
              {/* Kolom 1: TODO (Simple Checklist) */}
              <KanbanColumn
                id="TODO"
                title={preferences.columns?.TODO?.title || 'Rencana Brilian'}
                subtitle={preferences.columns?.TODO?.subtitle || 'Ide & tugas baru yang siap dieksekusi'}
                emoji={preferences.columns?.TODO?.emoji || '💡'}
                status="TODO"
                tasks={todoTasks}
                washiTapeStyle={preferences.washiTapeStyle}
                customCategories={preferences.customCategories}
                fontMood={preferences.fontMood}
                noteColorMode={preferences.noteColorMode}
                pinStyle={preferences.pinStyle}
                completionStamp={preferences.completionStamp}
                stampColor={preferences.stampColor}
                viewDensity={preferences.viewDensity}
                paperTexture={preferences.paperTexture}
                activeColumnCount={2}
                onEditTask={handleOpenEdit}
                onDeleteTask={handleDeleteTask}
                onStatusChange={handleStatusChange}
                onAddTaskToColumn={handleOpenNewInColumn}
                onToggleSubtask={handleToggleSubtask}
                onTogglePin={handleTogglePin}
                onStartPomodoro={handleStartPomodoro}
              />

              {/* Kolom 2: DONE */}
              <KanbanColumn
                id="DONE"
                title={preferences.columns?.DONE?.title || 'Misi Sukses'}
                subtitle={preferences.columns?.DONE?.subtitle || 'Telah selesai dengan hasil gemilang! 🎉'}
                emoji={preferences.columns?.DONE?.emoji || '🏆'}
                status="DONE"
                tasks={doneTasks}
                washiTapeStyle={preferences.washiTapeStyle}
                customCategories={preferences.customCategories}
                fontMood={preferences.fontMood}
                noteColorMode={preferences.noteColorMode}
                pinStyle={preferences.pinStyle}
                completionStamp={preferences.completionStamp}
                stampColor={preferences.stampColor}
                viewDensity={preferences.viewDensity}
                paperTexture={preferences.paperTexture}
                activeColumnCount={2}
                onEditTask={handleOpenEdit}
                onDeleteTask={handleDeleteTask}
                onStatusChange={handleStatusChange}
                onAddTaskToColumn={handleOpenNewInColumn}
                onToggleSubtask={handleToggleSubtask}
                onTogglePin={handleTogglePin}
                onStartPomodoro={handleStartPomodoro}
                onArchiveDone={handleArchiveDoneTasks}
              />
            </div>
          )}

          {effectiveColumnCount === 1 && (
            <div className="max-w-2xl mx-auto w-full pb-8 flex flex-col gap-3.5">
              {/* Single Column Tab Switcher */}
              <div
                className={`p-1.5 rounded-2xl border flex items-center justify-between gap-1 shadow-xs transition-colors ${
                  themeConfig.isDark
                    ? 'bg-[#1b1e28]/60 backdrop-blur-md border-slate-700/60'
                    : 'bg-white/60 backdrop-blur-md border-slate-200/80 shadow-slate-200/30'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    playPopSound(preferences.soundProfile);
                    setSingleColumnTab('TODO');
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    singleColumnTab === 'TODO'
                      ? 'bg-amber-500 text-white shadow-2xs scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span>{preferences.columns?.TODO?.emoji || '💡'}</span>
                  <span className="truncate">{preferences.columns?.TODO?.title || 'Rencana'}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      singleColumnTab === 'TODO'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {todoTasks.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playPopSound(preferences.soundProfile);
                    setSingleColumnTab('IN_PROGRESS');
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    singleColumnTab === 'IN_PROGRESS'
                      ? 'bg-sky-500 text-white shadow-2xs scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span>{preferences.columns?.IN_PROGRESS?.emoji || '⚡'}</span>
                  <span className="truncate">{preferences.columns?.IN_PROGRESS?.title || 'Aksi'}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      singleColumnTab === 'IN_PROGRESS'
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {inProgressTasks.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playPopSound(preferences.soundProfile);
                    setSingleColumnTab('DONE');
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    singleColumnTab === 'DONE'
                      ? 'bg-emerald-500 text-white shadow-2xs scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span>{preferences.columns?.DONE?.emoji || '🏆'}</span>
                  <span className="truncate">{preferences.columns?.DONE?.title || 'Selesai'}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      singleColumnTab === 'DONE'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {doneTasks.length}
                  </span>
                </button>
              </div>

              {/* Single Column Body */}
              {singleColumnTab === 'TODO' && (
                <KanbanColumn
                  id="TODO"
                  title={preferences.columns?.TODO?.title || 'Rencana Brilian'}
                  subtitle={preferences.columns?.TODO?.subtitle || 'Ide & tugas baru yang siap dieksekusi'}
                  emoji={preferences.columns?.TODO?.emoji || '💡'}
                  status="TODO"
                  tasks={todoTasks}
                  washiTapeStyle={preferences.washiTapeStyle}
                  customCategories={preferences.customCategories}
                  fontMood={preferences.fontMood}
                  noteColorMode={preferences.noteColorMode}
                  pinStyle={preferences.pinStyle}
                  completionStamp={preferences.completionStamp}
                  stampColor={preferences.stampColor}
                  viewDensity={preferences.viewDensity}
                  paperTexture={preferences.paperTexture}
                  activeColumnCount={1}
                  onEditTask={handleOpenEdit}
                  onDeleteTask={handleDeleteTask}
                  onStatusChange={handleStatusChange}
                  onAddTaskToColumn={handleOpenNewInColumn}
                  onToggleSubtask={handleToggleSubtask}
                  onTogglePin={handleTogglePin}
                  onStartPomodoro={handleStartPomodoro}
                />
              )}

              {singleColumnTab === 'IN_PROGRESS' && (
                <KanbanColumn
                  id="IN_PROGRESS"
                  title={preferences.columns?.IN_PROGRESS?.title || 'Aksi Seru'}
                  subtitle={preferences.columns?.IN_PROGRESS?.subtitle || 'Sedang dikerjakan dengan semangat'}
                  emoji={preferences.columns?.IN_PROGRESS?.emoji || '⚡'}
                  status="IN_PROGRESS"
                  tasks={inProgressTasks}
                  washiTapeStyle={preferences.washiTapeStyle}
                  customCategories={preferences.customCategories}
                  fontMood={preferences.fontMood}
                  noteColorMode={preferences.noteColorMode}
                  pinStyle={preferences.pinStyle}
                  completionStamp={preferences.completionStamp}
                  stampColor={preferences.stampColor}
                  viewDensity={preferences.viewDensity}
                  paperTexture={preferences.paperTexture}
                  activeColumnCount={1}
                  onEditTask={handleOpenEdit}
                  onDeleteTask={handleDeleteTask}
                  onStatusChange={handleStatusChange}
                  onAddTaskToColumn={handleOpenNewInColumn}
                  onToggleSubtask={handleToggleSubtask}
                  onTogglePin={handleTogglePin}
                  onStartPomodoro={handleStartPomodoro}
                />
              )}

              {singleColumnTab === 'DONE' && (
                <KanbanColumn
                  id="DONE"
                  title={preferences.columns?.DONE?.title || 'Misi Sukses'}
                  subtitle={preferences.columns?.DONE?.subtitle || 'Telah selesai dengan hasil gemilang! 🎉'}
                  emoji={preferences.columns?.DONE?.emoji || '🏆'}
                  status="DONE"
                  tasks={doneTasks}
                  washiTapeStyle={preferences.washiTapeStyle}
                  customCategories={preferences.customCategories}
                  fontMood={preferences.fontMood}
                  noteColorMode={preferences.noteColorMode}
                  pinStyle={preferences.pinStyle}
                  completionStamp={preferences.completionStamp}
                  stampColor={preferences.stampColor}
                  viewDensity={preferences.viewDensity}
                  paperTexture={preferences.paperTexture}
                  activeColumnCount={1}
                  onEditTask={handleOpenEdit}
                  onDeleteTask={handleDeleteTask}
                  onStatusChange={handleStatusChange}
                  onAddTaskToColumn={handleOpenNewInColumn}
                  onToggleSubtask={handleToggleSubtask}
                  onTogglePin={handleTogglePin}
                  onStartPomodoro={handleStartPomodoro}
                  onArchiveDone={handleArchiveDoneTasks}
                />
              )}
            </div>
          )}
        </DragDropContext>
            </>
          )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center mt-auto">
        <p className={`text-xs font-medium tracking-wide transition-colors ${
          themeConfig.isDark ? 'text-slate-500' : 'text-slate-400'
        }`}>
          {preferences.footerText || 'Slam Area © 2026'}
        </p>
      </footer>
      </div>

      {/* WhatsApp Quick Paste Modal */}
      <QuickPasteModal
        isOpen={isQuickPasteOpen}
        onClose={() => setIsQuickPasteOpen(false)}
        onTasksSaved={handleTasksSavedFromWhatsApp}
        customCategories={preferences.customCategories}
      />

      {/* Task Creation & Edit Form Modal */}
      <TaskFormModal
        isOpen={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
        taskToEdit={taskToEdit}
        defaultStatus={defaultStatusForNew}
        customCategories={preferences.customCategories}
        onSave={handleSaveTask}
      />

      {/* Personalization & Theme Preferences Modal */}
      <PersonalizationModal
        isOpen={isPersonalizationOpen}
        onClose={() => setIsPersonalizationOpen(false)}
        currentPreferences={preferences}
        onSavePreferences={handleSavePreferences}
        allTasks={tasks}
        onRestoreData={handleRestoreData}
      />

      {/* Floating Pomodoro Bar */}
      <PomodoroBar
        isOpen={isPomodoroOpen}
        onClose={() => setIsPomodoroOpen(false)}
        activeTask={pomodoroTask}
        onTaskComplete={(taskId: string) => handleStatusChange(taskId, 'DONE')}
        onClearTask={() => setPomodoroTask(null)}
        soundProfile={preferences.soundProfile}
      />

      {/* Archive Modal */}
      <ArchiveModal
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        archivedTasks={archivedTasks}
        onUnarchiveTask={handleUnarchiveTask}
        onDeleteArchivedTask={handleDeleteArchivedTask}
        onClearAllArchived={handleClearAllArchived}
        soundProfile={preferences.soundProfile}
      />

      {/* Virtual Desk Buddy Mascot */}
      <DeskBuddy
        buddyType={preferences.deskBuddy}
        soundProfile={preferences.soundProfile}
        completedTasksCount={doneCount}
        dailyGoal={preferences.dailyTargetGoal}
      />

      {/* Floating Network Error Toast */}
      {networkError && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm sm:max-w-md bg-rose-600/95 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-rose-400/50 backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-5">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-200" />
          <div className="flex-1 text-xs font-medium leading-relaxed">
            {networkError}
          </div>
          <button
            onClick={() => setNetworkError(null)}
            className="p-1 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white cursor-pointer"
            title="Tutup pesan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
