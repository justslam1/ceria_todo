'use client';

import React, { useState, useEffect, useMemo, useCallback, useSyncExternalStore, useRef } from 'react';
import dynamic from 'next/dynamic';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Task, TaskStatus, CreateTaskInput, UpdateTaskInput } from '@/types/task';
import { UserPreferences, SortByOption, BoardSticker } from '@/types/preferences';
import {
  loadUserPreferences,
  saveUserPreferences,
  getThemeConfig,
  DEFAULT_PREFERENCES,
  DESK_BUDDY_OPTIONS,
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
import { QuoteStickerModal } from '@/components/modals/QuoteStickerModal';
import { PixelArtModal } from '@/components/modals/PixelArtModal';
import { ShowcaseModal } from '@/components/modals/ShowcaseModal';
import { DeskBuddy } from '@/components/ui/DeskBuddy';
import { BoardStickers } from '@/components/ui/BoardStickers';
import { Board, BoardType, CreateBoardInput, UpdateBoardInput } from '@/types/board';
import { BoardFormModal } from '@/components/modals/BoardFormModal';

const StickyNotesMatchModal = dynamic(
  () => import('@/components/modals/StickyNotesMatchModal').then((m) => m.StickyNotesMatchModal),
  { ssr: false }
);
const WhackADistractionModal = dynamic(
  () => import('@/components/modals/WhackADistractionModal').then((m) => m.WhackADistractionModal),
  { ssr: false }
);
const BuddySnakeModal = dynamic(
  () => import('@/components/modals/BuddySnakeModal').then((m) => m.BuddySnakeModal),
  { ssr: false }
);
const FocusPongModal = dynamic(
  () => import('@/components/modals/FocusPongModal').then((m) => m.FocusPongModal),
  { ssr: false }
);
import {
  toggleSubtaskInRawDescription,
  isTaskPinned,
  toggleTaskPin,
  isTaskArchived,
  setTaskArchived,
  resetSubtasksInRawDescription,
} from '@/lib/subtasks';
import { compressImage, getImageFileFromClipboard } from '@/lib/imageCompression';
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
import { useLanguage } from '@/lib/i18n/LanguageContext';

const MEMORY_TRIGGER_WORDS = ['gabut', 'rehat', 'game'];
const SNAKE_TRIGGER_WORDS = ['snake', 'ular'];
const PONG_TRIGGER_WORDS = ['pong', 'tenis'];
const KONAMI_SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
];

export const KanbanBoard: React.FC = () => {
  const { t, language } = useLanguage();
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskCompletedTrigger, setTaskCompletedTrigger] = useState(0);
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
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isPixelModalOpen, setIsPixelModalOpen] = useState(false);
  const [isShowcaseOpen, setIsShowcaseOpen] = useState(false);
  const [isStickyMatchOpen, setIsStickyMatchOpen] = useState(false);
  const [stickyMatchTriggerWord, setStickyMatchTriggerWord] = useState('rehat');
  const [isWhackGameOpen, setIsWhackGameOpen] = useState(false);
  const [isSnakeGameOpen, setIsSnakeGameOpen] = useState(false);
  const [isPongGameOpen, setIsPongGameOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [defaultStatusForNew, setDefaultStatusForNew] = useState<TaskStatus>('TODO');
  const [singleColumnTab, setSingleColumnTab] = useState<TaskStatus>('TODO');

  // Notes Mode State
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes'>('tasks');
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isNotesLoading, setIsNotesLoading] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);

  // Multi-Board State
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [newBoardInitialType, setNewBoardInitialType] = useState<BoardType>('TASK');

  // Abort controllers to prevent race conditions during rapid tab/board switching
  const tasksAbortRef = useRef<AbortController | null>(null);
  const notesAbortRef = useRef<AbortController | null>(null);

  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [currentHour, setCurrentHour] = useState<number>(() => {
    if (typeof window !== 'undefined') return new Date().getHours();
    return 8;
  });

  // Easter Egg Triggers:
  // 1) Mengetik kata 'gabut', 'rehat', atau 'game' -> Sticky Notes Match
  // 2) Konami Code (↑ ↑ ↓ ↓ ← → ← →) -> Procrastination Invaders (Whack-a-Distraction)
  // 3) Mengetik kata 'snake' atau 'ular' -> Buddy Snake
  // 4) Mengetik kata 'pong' atau 'tenis' -> Focus Pong
  useEffect(() => {
    let keyBuffer = '';
    let lastKeyTime = 0;
    let konamiIndex = 0;
    let lastKonamiTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isStickyMatchOpen || isWhackGameOpen || isSnakeGameOpen || isPongGameOpen) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
          return;
        }
      }

      const now = Date.now();

      // Check Konami Code sequence (↑ ↑ ↓ ↓ ← → ← →)
      if (now - lastKonamiTime > 3000) {
        konamiIndex = 0;
      }
      if (e.key === KONAMI_SEQUENCE[konamiIndex]) {
        konamiIndex += 1;
        lastKonamiTime = now;
        if (konamiIndex === KONAMI_SEQUENCE.length) {
          konamiIndex = 0;
          e.preventDefault();
          playVictoryChime('arcade');
          setIsWhackGameOpen(true);
          return;
        }
      } else if (e.key === KONAMI_SEQUENCE[0]) {
        konamiIndex = 1;
        lastKonamiTime = now;
      } else if (e.key.startsWith('Arrow')) {
        konamiIndex = 0;
      }

      // Check word buffer ('gabut', 'rehat', 'game', 'snake', 'ular', 'pong', 'tenis')
      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        if (now - lastKeyTime > 2000) {
          keyBuffer = '';
        }
        lastKeyTime = now;
        keyBuffer = (keyBuffer + e.key.toLowerCase()).slice(-10);

        const matchedMemory = MEMORY_TRIGGER_WORDS.find((w) => keyBuffer.endsWith(w));
        if (matchedMemory) {
          keyBuffer = '';
          playPopSound('arcade');
          setStickyMatchTriggerWord(matchedMemory);
          setIsStickyMatchOpen(true);
          return;
        }

        const matchedSnake = SNAKE_TRIGGER_WORDS.find((w) => keyBuffer.endsWith(w));
        if (matchedSnake) {
          keyBuffer = '';
          playPopSound('arcade');
          setIsSnakeGameOpen(true);
          return;
        }

        const matchedPong = PONG_TRIGGER_WORDS.find((w) => keyBuffer.endsWith(w));
        if (matchedPong) {
          keyBuffer = '';
          playPopSound('arcade');
          setIsPongGameOpen(true);
        }
      }
    };

    const handleCustomOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ word?: string }>;
      const word = (customEvent.detail?.word || 'rehat').toLowerCase();
      playPopSound('arcade');
      if (SNAKE_TRIGGER_WORDS.includes(word)) {
        setIsSnakeGameOpen(true);
      } else if (PONG_TRIGGER_WORDS.includes(word)) {
        setIsPongGameOpen(true);
      } else {
        setStickyMatchTriggerWord(word);
        setIsStickyMatchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('ceria-open-memory-game', handleCustomOpen);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('ceria-open-memory-game', handleCustomOpen);
    };
  }, [isStickyMatchOpen, isWhackGameOpen, isSnakeGameOpen, isPongGameOpen]);

  useEffect(() => {
    const locale = language === 'en' ? 'en-US' : 'id-ID';
    const updateDateTime = () => {
      const now = new Date();
      setCurrentHour(now.getHours());
      setCurrentDate(
        now.toLocaleDateString(locale, {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
      setCurrentTime(
        now.toLocaleTimeString(locale, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + (language === 'id' ? ' WIB' : '')
      );
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, [language]);

  // Active Theme Config
  const themeConfig = useMemo(() => {
    return getThemeConfig(preferences.theme, preferences.customTheme);
  }, [preferences.theme, preferences.customTheme]);

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

  // Fetch tasks for a specific board
  const fetchTasks = useCallback(async (boardId?: string, silent = false) => {
    if (tasksAbortRef.current) {
      tasksAbortRef.current.abort();
    }
    const controller = new AbortController();
    tasksAbortRef.current = controller;

    if (!silent) {
      setIsLoading(true);
    }
    try {
      const url = boardId ? `/api/tasks?boardId=${encodeURIComponent(boardId)}` : '/api/tasks';
      const res = await fetch(url, { signal: controller.signal });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTasks(data.data);
        setNetworkError(null);
      } else {
        setNetworkError(data.error || 'Format data dari server tidak sesuai.');
      }
    } catch (err: unknown) {
      if (err instanceof Error && (err.name === 'AbortError' || controller.signal.aborted)) {
        return;
      }
      console.error('Gagal mengambil data tugas:', err);
      setNetworkError('Gagal memuat tugas. Periksa koneksi atau status database.');
    } finally {
      if (tasksAbortRef.current === controller) {
        setIsLoading(false);
        tasksAbortRef.current = null;
      }
    }
  }, []);

  // Fetch notes for a specific board
  const fetchNotes = useCallback(async (boardId?: string, silent = false) => {
    if (notesAbortRef.current) {
      notesAbortRef.current.abort();
    }
    const controller = new AbortController();
    notesAbortRef.current = controller;

    if (!silent) {
      setIsNotesLoading(true);
    }
    try {
      const url = boardId ? `/api/notes?boardId=${encodeURIComponent(boardId)}` : '/api/notes';
      const res = await fetch(url, { signal: controller.signal });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setNotes(
          data.data.map((n: NoteItem) => ({
            ...n,
            flipH: n.flipH !== undefined ? n.flipH : Boolean(n.content?.includes('[FLIP_H]')),
            flipV: n.flipV !== undefined ? n.flipV : Boolean(n.content?.includes('[FLIP_V]')),
          }))
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error && (err.name === 'AbortError' || controller.signal.aborted)) {
        return;
      }
      console.error('Gagal mengambil data catatan:', err);
    } finally {
      if (notesAbortRef.current === controller) {
        setIsNotesLoading(false);
        notesAbortRef.current = null;
      }
    }
  }, []);

  // Fetch all boards and initialize active board
  const fetchBoards = useCallback(async (preferredBoardId?: string) => {
    try {
      const res = await fetch('/api/boards');
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const fetchedBoards: Board[] = data.data;
        setBoards(fetchedBoards);

        const savedBoardId =
          preferredBoardId ||
          (typeof window !== 'undefined' ? localStorage.getItem('ceria_active_board_id') : null);
        let target = fetchedBoards.find((b) => b.id === savedBoardId);
        if (!target) {
          target = fetchedBoards.find((b) => b.isDefault && b.type === 'TASK') || fetchedBoards[0];
        }
        setActiveBoard(target);
        if (typeof window !== 'undefined' && target) {
          localStorage.setItem('ceria_active_board_id', target.id);
        }

        if (target.type === 'NOTE') {
          setActiveTab('notes');
          fetchNotes(target.id);
        } else {
          setActiveTab('tasks');
          fetchTasks(target.id);
        }
      }
    } catch (err) {
      console.error('Gagal memuat daftar papan:', err);
      // Fallback: try loading tasks directly if boards fail
      fetchTasks();
    }
  }, [fetchNotes, fetchTasks]);

  // Initial load on mount
  useEffect(() => {
    let ignore = false;

    async function loadData() {
      if (!ignore) {
        await fetchBoards();
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [fetchBoards]);

  // Manual refresh handler
  const handleRefreshTasks = useCallback(async () => {
    if (activeBoard?.type === 'TASK' && activeBoard?.id) {
      await fetchTasks(activeBoard.id);
    } else {
      await fetchTasks();
    }
  }, [activeBoard, fetchTasks]);

  // Board selector handler
  const handleSelectBoard = (board: Board) => {
    setActiveBoard(board);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ceria_active_board_id', board.id);
    }
    playPopSound(preferences.soundProfile);
    if (board.type === 'NOTE') {
      setActiveTab('notes');
      fetchNotes(board.id);
    } else {
      setActiveTab('tasks');
      fetchTasks(board.id);
    }
  };

  // Board CRUD handlers
  const handleOpenCreateBoard = (type?: BoardType) => {
    setEditingBoard(null);
    setNewBoardInitialType(type || (activeTab === 'notes' ? 'NOTE' : 'TASK'));
    setIsBoardModalOpen(true);
  };

  const handleEditBoard = (board: Board) => {
    setEditingBoard(board);
    setIsBoardModalOpen(true);
  };

  const handleSaveBoard = async (data: CreateBoardInput | UpdateBoardInput, boardId?: string) => {
    try {
      if (boardId) {
        const res = await fetch(`/api/boards/${boardId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const resData = await res.json();
        if (!res.ok || !resData.success) {
          throw new Error(resData.error || 'Gagal memperbarui papan');
        }
        const updated: Board = resData.data;
        setBoards((prev) => prev.map((b) => (b.id === boardId ? { ...b, ...updated } : b)));
        if (activeBoard?.id === boardId) {
          setActiveBoard((prev) => (prev ? { ...prev, ...updated } : updated));
        }
        playPopSound(preferences.soundProfile);
      } else {
        const res = await fetch('/api/boards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const resData = await res.json();
        if (!res.ok || !resData.success) {
          throw new Error(resData.error || 'Gagal membuat papan baru');
        }
        const created: Board = resData.data;
        setBoards((prev) => [...prev, created]);
        handleSelectBoard(created);
        triggerCelebration(preferences.celebrationFx);
        playVictoryChime(preferences.soundProfile);
      }
      setIsBoardModalOpen(false);
    } catch (err: unknown) {
      console.error('Error saving board:', err);
      throw err;
    }
  };

  const handleDeleteBoard = async (board: Board) => {
    if (board.isDefault) {
      alert(t.boards.cannotDeleteDefault);
      return;
    }
    if (!confirm(t.boards.deleteBoardConfirm)) {
      return;
    }

    try {
      const res = await fetch(`/api/boards/${board.id}`, {
        method: 'DELETE',
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Gagal menghapus papan');
      }

      playPopSound(preferences.soundProfile);

      const remainingBoards = boards.filter((b) => b.id !== board.id);
      setBoards(remainingBoards);

      if (activeBoard?.id === board.id) {
        const fallback =
          remainingBoards.find((b) => b.type === board.type && b.isDefault) ||
          remainingBoards.find((b) => b.type === board.type) ||
          remainingBoards[0];
        if (fallback) {
          handleSelectBoard(fallback);
        }
      }
    } catch (err) {
      console.error('Gagal menghapus papan:', err);
      alert(err instanceof Error ? err.message : 'Gagal menghapus papan');
    }
  };

  // Global paste handler on Kanban Board: Paste image opens TaskForm with image cover
  useEffect(() => {
    const handleGlobalPasteOnKanban = async (e: ClipboardEvent) => {
      // Only active when looking at tasks tab, and not inside input/textarea or open modals
      if (activeTab !== 'tasks') return;
      if (isTaskFormOpen || isQuickPasteOpen || isPersonalizationOpen || isArchiveOpen) return;

      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      ) {
        return;
      }

      const imageFile = getImageFileFromClipboard(e);
      if (!imageFile) return;

      e.preventDefault();
      try {
        const compressedBase64 = await compressImage(imageFile);
        // Pre-fill new task with the pasted image cover and open form modal
        setTaskToEdit({
          id: '',
          title: 'Tugas Bergambar',
          description: null,
          status: 'TODO',
          priority: 'MEDIUM',
          category: 'Personal',
          dueDate: null,
          estimatedTime: null,
          imageUrl: compressedBase64,
          order: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setDefaultStatusForNew('TODO');
        setIsTaskFormOpen(true);
        playPopSound(preferences.soundProfile);
      } catch (err) {
        console.error('Gagal memproses paste gambar di papan tugas:', err);
      }
    };

    window.addEventListener('paste', handleGlobalPasteOnKanban);
    return () => {
      window.removeEventListener('paste', handleGlobalPasteOnKanban);
    };
  }, [
    activeTab,
    isTaskFormOpen,
    isQuickPasteOpen,
    isPersonalizationOpen,
    isArchiveOpen,
    preferences.soundProfile,
  ]);

  const handleCreateNote = async (data: {
    title: string;
    content: string;
    imageUrl?: string | null;
    isSticker?: boolean;
    color: NoteColor;
    isPinned: boolean;
    posX?: number;
    posY?: number;
    boardId?: string | null;
  }) => {
    try {
      const payload = {
        ...data,
        boardId: data.boardId || (activeBoard?.type === 'NOTE' ? activeBoard.id : undefined),
      };
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        const created = resData.data;
        setNotes((prev) => [
          {
            ...created,
            flipH: created.flipH !== undefined ? created.flipH : Boolean(created.content?.includes('[FLIP_H]')),
            flipV: created.flipV !== undefined ? created.flipV : Boolean(created.content?.includes('[FLIP_V]')),
          },
          ...prev,
        ]);
        if (activeBoard) {
          setBoards((prev) =>
            prev.map((b) =>
              b.id === activeBoard.id
                ? { ...b, _count: { ...b._count, tasks: b._count?.tasks ?? 0, notes: (b._count?.notes ?? 0) + 1 } }
                : b
            )
          );
        }
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
        const updated = resData.data;
        setNotes((prev) =>
          prev.map((n) =>
            n.id === id
              ? {
                  ...updated,
                  flipH: updated.flipH !== undefined ? updated.flipH : Boolean(updated.content?.includes('[FLIP_H]')),
                  flipV: updated.flipV !== undefined ? updated.flipV : Boolean(updated.content?.includes('[FLIP_V]')),
                }
              : n
          )
        );
      }
    } catch (err) {
      console.error('Gagal memperbarui catatan:', err);
      fetchNotes(activeBoard?.id);
    }
  };

  const handleDeleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeBoard) {
      setBoards((prev) =>
        prev.map((b) =>
          b.id === activeBoard.id
            ? { ...b, _count: { ...b._count, tasks: b._count?.tasks ?? 0, notes: Math.max(0, (b._count?.notes ?? 1) - 1) } }
            : b
        )
      );
    }
    try {
      await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      playPopSound(preferences.soundProfile);
    } catch (err) {
      console.error('Gagal menghapus catatan:', err);
      fetchNotes(activeBoard?.id);
    }
  };

  const handleDuplicateNote = async (note: NoteItem) => {
    try {
      const offsetX = 28;
      const offsetY = 28;
      const duplicateTitle = note.title ? `${note.title} (copy)` : (note.isSticker ? 'Stiker (copy)' : 'Catatan (copy)');
      const payload = {
        title: duplicateTitle,
        content: note.content || '',
        imageUrl: note.imageUrl || null,
        isSticker: note.isSticker ?? false,
        color: note.color,
        isPinned: false,
        posX: (note.posX || 0) + offsetX,
        posY: (note.posY || 0) + offsetY,
        boardId: note.boardId || (activeBoard?.type === 'NOTE' ? activeBoard.id : undefined),
      };

      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        const created = resData.data;
        const formatted = {
          ...created,
          flipH: created.flipH !== undefined ? created.flipH : Boolean(created.content?.includes('[FLIP_H]')),
          flipV: created.flipV !== undefined ? created.flipV : Boolean(created.content?.includes('[FLIP_V]')),
        };

        setNotes((prev) => {
          const idx = prev.findIndex((n) => n.id === note.id);
          if (idx !== -1) {
            const next = [...prev];
            next.splice(idx + 1, 0, formatted);
            return next;
          }
          return [formatted, ...prev];
        });

        if (activeBoard) {
          setBoards((prev) =>
            prev.map((b) =>
              b.id === activeBoard.id
                ? { ...b, _count: { ...b._count, tasks: b._count?.tasks ?? 0, notes: (b._count?.notes ?? 0) + 1 } }
                : b
            )
          );
        }
        playPopSound(preferences.soundProfile);
      }
    } catch (err) {
      console.error('Gagal menduplikasi catatan:', err);
    }
  };

  const handleConvertNoteToTask = async (note: NoteItem) => {
    try {
      const targetTaskBoard =
        activeBoard?.type === 'TASK' ? activeBoard : boards.find((b) => b.type === 'TASK');
      const newTaskInput: CreateTaskInput = {
        title: note.title.trim() || (note.isSticker ? 'Stiker Catatan' : 'Catatan Baru'),
        description: note.content || '',
        imageUrl: note.imageUrl || null,
        status: 'TODO',
        priority: 'MEDIUM',
        category: 'Catatan Bebas',
        boardId: targetTaskBoard?.id,
      };
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTaskInput),
      });
      const data = await res.json();
      if (data.success && data.data) {
        if (targetTaskBoard) {
          handleSelectBoard(targetTaskBoard);
        } else {
          setTasks((prev) => [data.data, ...prev]);
          setActiveTab('tasks');
        }
        triggerCelebration(preferences.celebrationFx);
        playVictoryChime(preferences.soundProfile);
      }
    } catch (err) {
      console.error('Gagal mengonversi catatan ke tugas:', err);
    }
  };

  // Create custom quote sticker via Option 1 (Floating desktop quote sticker)
  const handleCreateQuoteSticker = async (imageUrl: string, quoteText: string) => {
    // If user is currently on notes tab, spawn it in notes canvas
    if (activeTab === 'notes') {
      const colWidth = 320;
      const cols = 3;
      const idx = notes.length;
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const posX = 24 + col * (colWidth + 24);
      const posY = 24 + row * 290;

      await handleCreateNote({
        title: quoteText.slice(0, 50),
        content: quoteText,
        imageUrl,
        isSticker: true,
        color: 'yellow',
        isPinned: false,
        posX,
        posY,
      });
      triggerCelebration(preferences.celebrationFx);
      playVictoryChime(preferences.soundProfile);
    } else {
      // If user is on Kanban tasks tab: Add as a floating desktop sticker on the tasks board!
      const currentStickers = preferences.stickers || [];
      const newQuoteSticker: BoardSticker = {
        id: `quote-stk-${Date.now()}`,
        imageUrl,
        text: quoteText,
        width: 250,
        // Place comfortably near center or upper corners
        x: 15 + ((currentStickers.length * 15) % 50),
        y: 20 + ((currentStickers.length * 18) % 45),
        rotation: ((currentStickers.length % 5) - 2) * 4, // slight realistic tilt -8 to +8 deg
        scale: 1,
      };

      const updatedStickers = [...currentStickers, newQuoteSticker];
      handleSavePreferences({
        ...preferences,
        stickers: updatedStickers,
      });

      triggerCelebration(preferences.celebrationFx);
      playVictoryChime(preferences.soundProfile);
    }
  };

  // Create custom Pixel Art sticker (16x16 canvas export)
  const handleCreatePixelArtSticker = async (imageUrl: string, title?: string) => {
    if (activeTab === 'notes') {
      const colWidth = 320;
      const cols = 3;
      const idx = notes.length;
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const posX = 24 + col * (colWidth + 24);
      const posY = 24 + row * 290;

      await handleCreateNote({
        title: title || 'Karya Pixel Art 👾',
        content: title || 'Karya Pixel Art 👾',
        imageUrl,
        isSticker: true,
        color: 'purple',
        isPinned: false,
        posX,
        posY,
      });
      triggerCelebration(preferences.celebrationFx);
      playVictoryChime(preferences.soundProfile);
    } else {
      const currentStickers = preferences.stickers || [];
      const newPixelSticker: BoardSticker = {
        id: `pixel-stk-${Date.now()}`,
        imageUrl,
        text: title || 'Pixel Art',
        width: 140, // 140px width makes crisp pixel art look adorable on desktop
        x: 20 + ((currentStickers.length * 16) % 50),
        y: 25 + ((currentStickers.length * 19) % 40),
        rotation: ((currentStickers.length % 5) - 2) * 5,
        scale: 1,
      };

      handleSavePreferences({
        ...preferences,
        stickers: [...currentStickers, newPixelSticker],
      });

      triggerCelebration(preferences.celebrationFx);
      playVictoryChime(preferences.soundProfile);
    }
  };

  // Apply community showcase template to user preferences
  const handleApplyShowcase = (showcasePrefs: Partial<UserPreferences>) => {
    const updated: UserPreferences = {
      ...preferences,
      ...showcasePrefs,
      appName: showcasePrefs.appName || preferences.appName,
      userName: showcasePrefs.userName || preferences.userName,
    };
    handleSavePreferences(updated);
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
  const totalNotesCount = useMemo(() => {
    if (notes.length > 0) return notes.length;
    return boards
      .filter((b) => b.type === 'NOTE')
      .reduce((acc, b) => acc + (b._count?.notes || 0), 0);
  }, [notes.length, boards]);

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
      setTaskCompletedTrigger((prev) => prev + 1);
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
    const currentTask = tasks.find((t) => t.id === id);
    const isMovingToDone = newStatus === 'DONE' && currentTask?.status !== 'DONE';

    if (isMovingToDone) {
      triggerCelebration(preferences.celebrationFx);
      playVictoryChime(preferences.soundProfile);
      setTaskCompletedTrigger((prev) => prev + 1);
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
    if (activeBoard) {
      setBoards((prev) =>
        prev.map((b) =>
          b.id === activeBoard.id
            ? { ...b, _count: { ...b._count, notes: b._count?.notes ?? 0, tasks: Math.max(0, (b._count?.tasks ?? 1) - 1) } }
            : b
        )
      );
    }

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

  // Duplicate task handler
  const handleDuplicateTask = async (task: Task) => {
    try {
      const resetDescription = resetSubtasksInRawDescription(task.description);
      const payload: CreateTaskInput = {
        title: `${task.title} (copy)`,
        description: resetDescription,
        status: task.status,
        priority: task.priority,
        category: task.category,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
        imageUrl: task.imageUrl || null,
        boardId: task.boardId || (activeBoard?.type === 'TASK' ? activeBoard.id : undefined),
      };

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menduplikasi tugas');
      }

      playPopSound(preferences.soundProfile);

      setTasks((prev) => {
        const idx = prev.findIndex((t) => t.id === task.id);
        if (idx !== -1) {
          const next = [...prev];
          next.splice(idx + 1, 0, data.data);
          return next;
        }
        return [data.data, ...prev];
      });

      if (activeBoard) {
        setBoards((prev) =>
          prev.map((b) =>
            b.id === activeBoard.id
              ? { ...b, _count: { ...b._count, notes: b._count?.notes ?? 0, tasks: (b._count?.tasks ?? 0) + 1 } }
              : b
          )
        );
      }
    } catch (err: unknown) {
      console.error('Gagal menduplikasi tugas:', err);
      alert(err instanceof Error ? err.message : 'Gagal menduplikasi tugas');
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
        t.kanban.archiveConfirm(unarchivedDone.length)
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
          boardId: activeBoard?.type === 'TASK' ? activeBoard.id : undefined,
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
        const currentTask = tasks.find((t) => t.id === id);
        const isMovingToDone = taskData.status === 'DONE' && currentTask?.status !== 'DONE';
        if (isMovingToDone) {
          triggerCelebration(preferences.celebrationFx);
          playVictoryChime(preferences.soundProfile);
          setTaskCompletedTrigger((prev) => prev + 1);
        } else {
          playPopSound(preferences.soundProfile);
        }
        setTasks((prev) => prev.map((t) => (t.id === id ? data.data : t)));
      } else {
        const payload = {
          ...taskData,
          boardId:
            (taskData as CreateTaskInput).boardId ||
            (activeBoard?.type === 'TASK' ? activeBoard.id : undefined),
        };
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(8000),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Gagal membuat tugas baru');
        }

        if (taskData.status === 'DONE') {
          triggerCelebration(preferences.celebrationFx);
          playVictoryChime(preferences.soundProfile);
          setTaskCompletedTrigger((prev) => prev + 1);
        } else {
          playPopSound(preferences.soundProfile);
        }

        setTasks((prev) => [data.data, ...prev]);
        if (activeBoard) {
          setBoards((prev) =>
            prev.map((b) =>
              b.id === activeBoard.id
                ? { ...b, _count: { ...b._count, notes: b._count?.notes ?? 0, tasks: (b._count?.tasks ?? 0) + 1 } }
                : b
            )
          );
        }
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
    if (activeBoard) {
      setBoards((prev) =>
        prev.map((b) =>
          b.id === activeBoard.id
            ? { ...b, _count: { ...b._count, notes: b._count?.notes ?? 0, tasks: (b._count?.tasks ?? 0) + newTasks.length } }
            : b
        )
      );
    }
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
          <span>{t.kanban.loadingBoard}</span>
        </div>
      </div>
    );
  }

  const getColTitle = (col: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    const saved = preferences.columns?.[col]?.title;
    if (language === 'en') {
      if (col === 'TODO' && (!saved || saved === 'Rencana Brilian')) return t.kanban.defaultColTodoTitle;
      if (col === 'IN_PROGRESS' && (!saved || saved === 'Aksi Seru')) return t.kanban.defaultColProgTitle;
      if (col === 'DONE' && (!saved || saved === 'Misi Sukses')) return t.kanban.defaultColDoneTitle;
    }
    if (col === 'TODO') return saved || t.kanban.defaultColTodoTitle;
    if (col === 'IN_PROGRESS') return saved || t.kanban.defaultColProgTitle;
    return saved || t.kanban.defaultColDoneTitle;
  };

  const getColSubtitle = (col: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    const saved = preferences.columns?.[col]?.subtitle;
    if (language === 'en') {
      if (col === 'TODO' && (!saved || saved === 'Ide & tugas baru yang siap dieksekusi')) return t.kanban.defaultColTodoSub;
      if (col === 'IN_PROGRESS' && (!saved || saved === 'Sedang dikerjakan dengan semangat')) return t.kanban.defaultColProgSub;
      if (col === 'DONE' && (!saved || saved === 'Telah selesai dengan hasil gemilang! 🎉')) return t.kanban.defaultColDoneSub;
    }
    if (col === 'TODO') return saved || t.kanban.defaultColTodoSub;
    if (col === 'IN_PROGRESS') return saved || t.kanban.defaultColProgSub;
    return saved || t.kanban.defaultColDoneSub;
  };

  return (
    <div
      className={`min-h-screen flex flex-col relative ${fontMoodClass} transition-colors duration-300 ${
        themeConfig.isDark ? 'text-slate-100' : 'text-slate-800'
      }`}
    >
      {/* Live Canvas Target for Full Screen Capture (Apa Adanya) */}
      <div
        id="kanban-board-canvas"
        className="relative flex flex-col min-h-screen w-full flex-1"
        style={{
          ...backgroundPatternStyle,
          backgroundColor: preferences.customTheme?.bgHex || themeConfig.bgHex || '#faf8f5',
        }}
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
        {/* Free-floating Corkboard Stickers, Doodles & Creator Toolbar */}
        <BoardStickers
          stickers={preferences.stickers || []}
          onChangeStickers={(newStickers) =>
            handleSavePreferences({ ...preferences, stickers: newStickers })
          }
          onOpenQuoteSticker={() => setIsQuoteModalOpen(true)}
          onOpenPixelArt={() => setIsPixelModalOpen(true)}
          onAddStickerToNotes={async (emoji) => {
            const colWidth = 320;
            const cols = 3;
            const idx = notes.length;
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const posX = 24 + col * (colWidth + 24);
            const posY = 24 + row * 290;

            await handleCreateNote({
              title: `Stiker ${emoji}`,
              content: emoji,
              isSticker: false,
              color: 'yellow',
              isPinned: false,
              posX,
              posY,
            });
            triggerCelebration(preferences.celebrationFx);
            playVictoryChime(preferences.soundProfile);
          }}
          soundProfile={preferences.soundProfile}
          isDark={themeConfig.isDark}
          isTasksTab={activeTab === 'tasks'}
          creativeMenuLabel={preferences.creativeMenuLabel}
        />

        {/* Top Navigation with Sound Mute/Unmute & Personalization */}
        <Navbar
          onOpenQuickPaste={() => setIsQuickPasteOpen(true)}
          onOpenNewTask={() => handleOpenNewInColumn('TODO')}
          onOpenPersonalization={() => setIsPersonalizationOpen(true)}
          onOpenPomodoro={() => setIsPomodoroOpen((prev) => !prev)}
          onOpenArchive={() => setIsArchiveOpen(true)}
          onOpenShowcase={() => setIsShowcaseOpen(true)}
          isSoundMuted={soundMuted}
          onToggleSound={handleToggleSound}
          preferences={preferences}
          onSavePreferences={handleSavePreferences}
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
            if (tab === 'notes' && activeBoard?.type !== 'NOTE') {
              const noteBoard = boards.find((b) => b.type === 'NOTE');
              if (noteBoard) {
                setActiveBoard(noteBoard);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('ceria_active_board_id', noteBoard.id);
                }
                fetchNotes(noteBoard.id, notes.length > 0);
              }
            } else if (tab === 'tasks' && activeBoard?.type !== 'TASK') {
              const taskBoard = boards.find((b) => b.type === 'TASK');
              if (taskBoard) {
                setActiveBoard(taskBoard);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('ceria_active_board_id', taskBoard.id);
                }
                fetchTasks(taskBoard.id, tasks.length > 0);
              }
            }
          }}
          notesCount={totalNotesCount}
          onOpenNewNote={() => {
            setActiveTab('notes');
            if (activeBoard?.type !== 'NOTE') {
              const noteBoard = boards.find((b) => b.type === 'NOTE');
              if (noteBoard) {
                setActiveBoard(noteBoard);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('ceria_active_board_id', noteBoard.id);
                }
                fetchNotes(noteBoard.id);
              }
            }
            setEditingNote(null);
            setIsNoteModalOpen(true);
          }}
          boards={boards}
          activeBoard={activeBoard}
          onSelectBoard={handleSelectBoard}
          onOpenCreateBoard={handleOpenCreateBoard}
          onEditBoard={handleEditBoard}
          onDeleteBoard={handleDeleteBoard}
        />

        {/* Main Board Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex flex-col gap-2.5">
          {activeTab === 'notes' ? (
            <NotesBoard
              notes={notes}
              isLoading={isNotesLoading}
              themeConfig={themeConfig}
              preferences={preferences}
              onSavePreferences={handleSavePreferences}
              onCreateNote={handleCreateNote}
              onUpdateNote={handleUpdateNote}
              onDuplicateNote={handleDuplicateNote}
              onDeleteNote={handleDeleteNote}
              onConvertToTask={handleConvertNoteToTask}
              onRefreshNotes={() => fetchNotes(activeBoard?.id)}
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
                    <span>
                      {language === 'en' && (!preferences.boardTitle || preferences.boardTitle === 'Studio Papan Buletin Kerja')
                        ? 'Work Bulletin Studio'
                        : preferences.boardTitle || 'Studio Papan Buletin Kerja'}
                    </span>
                    {completionPercentage === 100 && totalCount > 0 && (
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                        {t.kanban.perfectBadge}
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
                      {t.kanban.greetingTime ? t.kanban.greetingTime(currentHour) : (currentHour >= 4 && currentHour < 11 ? 'Selamat Pagi,' : currentHour >= 11 && currentHour < 15 ? 'Selamat Siang,' : currentHour >= 15 && currentHour < 19 ? 'Selamat Sore,' : 'Selamat Malam,')} {preferences.userName.replace(/✨/g, '').trim()}!{preferences.avatarIcon && preferences.avatarIcon !== '✨' ? ` ${preferences.avatarIcon}` : ''}
                    </span>
                  )}
                  {totalCount === 0
                    ? t.kanban.emptyBoardGreeting
                    : completionPercentage === 100
                    ? t.kanban.allCompletedGreeting
                    : t.kanban.progressGreeting(doneCount, totalCount, completionPercentage)}
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
                  {t.kanban.achievementLabel}
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
                      {t.kanban.dailyTargetLabel}{' '}
                      <span className="text-orange-500 font-extrabold">
                        {doneCount} / {preferences.dailyTargetGoal} {t.kanban.completedSuffix}
                      </span>
                    </span>
                    {doneCount >= preferences.dailyTargetGoal && (
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {t.kanban.achievedBadge}
                      </span>
                    )}
                  </div>
                  {preferences.rewardNote && (
                    <div className={`flex items-center gap-1.5 text-[10px] truncate ${themeConfig.isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      <Gift className="w-3 h-3 text-rose-500 shrink-0" />
                      <span>{t.kanban.rewardLabel} <strong className={`${themeConfig.isDark ? 'text-rose-400' : 'text-rose-600'} font-semibold`}>{preferences.rewardNote}</strong></span>
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
                    <span>{t.kanban.claimRewardBtn}</span>
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
                  />
                  <div
                    style={{ width: `${(inProgressCount / totalCount) * 100}%` }}
                    className="bg-sky-500 transition-all duration-300"
                  />
                  <div
                    style={{ width: `${(todoCount / totalCount) * 100}%` }}
                    className="bg-amber-400 transition-all duration-300"
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
              onChange={(e) => {
                const val = e.target.value;
                const normalized = val.trim().toLowerCase();
                if (MEMORY_TRIGGER_WORDS.includes(normalized)) {
                  setSearchQuery('');
                  playPopSound('arcade');
                  setStickyMatchTriggerWord(normalized);
                  setIsStickyMatchOpen(true);
                  return;
                }
                if (SNAKE_TRIGGER_WORDS.includes(normalized)) {
                  setSearchQuery('');
                  playPopSound('arcade');
                  setIsSnakeGameOpen(true);
                  return;
                }
                if (PONG_TRIGGER_WORDS.includes(normalized)) {
                  setSearchQuery('');
                  playPopSound('arcade');
                  setIsPongGameOpen(true);
                  return;
                }
                setSearchQuery(val);
              }}
              placeholder={t.kanban.searchPlaceholder}
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
              <span className="font-medium text-slate-500 text-[11px]">{t.kanban.categoryLabel}</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`bg-transparent font-semibold text-xs focus:outline-hidden cursor-pointer ${
                  themeConfig.isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                <option value="ALL" className={themeConfig.isDark ? 'bg-slate-900 text-white' : ''}>{t.common.all}</option>
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
              <span className="font-medium text-slate-500 text-[11px]">{t.kanban.priorityLabel}</span>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className={`bg-transparent font-semibold text-xs focus:outline-hidden cursor-pointer ${
                  themeConfig.isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                <option value="ALL" className={themeConfig.isDark ? 'bg-slate-900 text-white' : ''}>{t.common.all}</option>
                <option value="HIGH" className={themeConfig.isDark ? 'bg-slate-900 text-white' : ''}>{t.taskModal.priorityHigh}</option>
                <option value="MEDIUM" className={themeConfig.isDark ? 'bg-slate-900 text-white' : ''}>{t.taskModal.priorityMedium}</option>
                <option value="LOW" className={themeConfig.isDark ? 'bg-slate-900 text-white' : ''}>{t.taskModal.priorityLow}</option>
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
              <span className="font-medium text-slate-500 text-[11px]">{t.kanban.sortByLabel}</span>
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
                <option value="manual" className={themeConfig.isDark ? 'bg-slate-900 text-white' : ''}>{t.kanban.sortManual}</option>
                <option value="priority" className={themeConfig.isDark ? 'bg-slate-900 text-white' : ''}>{t.kanban.sortPriority}</option>
                <option value="dueDate" className={themeConfig.isDark ? 'bg-slate-900 text-white' : ''}>{t.kanban.sortDueDate}</option>
                <option value="title" className={themeConfig.isDark ? 'bg-slate-900 text-white' : ''}>{t.kanban.sortTitle}</option>
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
            >
              {preferences.viewDensity === 'compact' ? (
                <>
                  <Rows3 className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-semibold text-[11px]">{t.kanban.densityCompact}</span>
                </>
              ) : (
                <>
                  <LayoutGrid className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-semibold text-[11px]">{t.kanban.densityCozy}</span>
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
            >
              <div className="flex items-center gap-1 px-1.5 py-0.5 text-slate-400">
                <Columns3 className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium hidden lg:inline">{t.kanban.columnsLabel}</span>
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
              title={t.kanban.refreshTitle}
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
                    <span>{t.kanban.topFocusTitle}</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-400 text-amber-950 font-bold border border-amber-500 shadow-2xs">
                      {pinnedTasks.length} {t.kanban.priorityCountSuffix}
                    </span>
                  </h3>
                </div>
              </div>

              <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 hidden sm:block">
                {t.kanban.topFocusSubtitle}
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
                        {task.category} • {task.status === 'TODO' ? t.kanban.statusTodo : t.kanban.statusInProgress}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartPomodoro(task)}
                      className="p-1 rounded-lg text-amber-600 hover:bg-amber-100/70 transition-colors cursor-pointer"
                      title={t.card.pomodoroTitle}
                    >
                      <Timer className="w-3.5 h-3.5" />
                    </button>
                    {task.status === 'IN_PROGRESS' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(task.id, 'TODO')}
                        className="w-5 h-5 rounded-lg flex items-center justify-center bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 shadow-2xs active:scale-95 transition-all cursor-pointer"
                        title={t.card.backToTodo}
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
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTogglePin(task.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title={t.card.unpinTitle}
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
                title={getColTitle('TODO')}
                subtitle={getColSubtitle('TODO')}
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
                onDuplicateTask={handleDuplicateTask}
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
                title={getColTitle('IN_PROGRESS')}
                subtitle={getColSubtitle('IN_PROGRESS')}
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
                onDuplicateTask={handleDuplicateTask}
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
                title={getColTitle('DONE')}
                subtitle={getColSubtitle('DONE')}
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
                onDuplicateTask={handleDuplicateTask}
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
                title={getColTitle('TODO')}
                subtitle={getColSubtitle('TODO')}
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
                onDuplicateTask={handleDuplicateTask}
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
                title={getColTitle('DONE')}
                subtitle={getColSubtitle('DONE')}
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
                onDuplicateTask={handleDuplicateTask}
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
                  <span className="truncate">{getColTitle('TODO')}</span>
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
                  <span className="truncate">{getColTitle('IN_PROGRESS')}</span>
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
                  <span className="truncate">{getColTitle('DONE')}</span>
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
                  title={getColTitle('TODO')}
                  subtitle={getColSubtitle('TODO')}
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
                  onDuplicateTask={handleDuplicateTask}
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
                  title={getColTitle('IN_PROGRESS')}
                  subtitle={getColSubtitle('IN_PROGRESS')}
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
                  onDuplicateTask={handleDuplicateTask}
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
                  title={getColTitle('DONE')}
                  subtitle={getColSubtitle('DONE')}
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
                  onDuplicateTask={handleDuplicateTask}
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

      {/* Virtual Desk Buddy Mascot */}
      <DeskBuddy
        buddyType={preferences.deskBuddy}
        soundProfile={preferences.soundProfile}
        completedTasksCount={doneCount}
        taskCompletedTrigger={taskCompletedTrigger}
        dailyGoal={preferences.dailyTargetGoal}
        customName={preferences.deskBuddyCustomName}
        customQuotes={preferences.deskBuddyCustomQuotes}
        position={preferences.deskBuddyPosition}
        size={preferences.deskBuddySize || 'large'}
        isLoading={isLoading}
      />
      </div>
      </div>

      {/* WhatsApp Quick Paste Modal */}
      <QuickPasteModal
        isOpen={isQuickPasteOpen}
        onClose={() => setIsQuickPasteOpen(false)}
        onTasksSaved={handleTasksSavedFromWhatsApp}
        customCategories={preferences.customCategories}
        boardId={activeBoard?.type === 'TASK' ? activeBoard.id : undefined}
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

      {/* Quote Sticker Modal (Ocehanmu) */}
      <QuoteStickerModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        onSubmit={handleCreateQuoteSticker}
        soundProfile={preferences.soundProfile}
        isDark={themeConfig.isDark}
      />

      {/* Pixel Art Canvas Modal (16x16) */}
      <PixelArtModal
        isOpen={isPixelModalOpen}
        onClose={() => setIsPixelModalOpen(false)}
        onSubmit={handleCreatePixelArtSticker}
        soundProfile={preferences.soundProfile}
        isDark={themeConfig.isDark}
      />

      {/* Community Board Showcase Gallery Modal */}
      {isShowcaseOpen && (
        <ShowcaseModal
          isOpen={isShowcaseOpen}
          onClose={() => setIsShowcaseOpen(false)}
          preferences={preferences}
          onApplyPreferences={handleApplyShowcase}
          themeConfig={themeConfig}
          tasks={tasks}
        />
      )}

      {/* Board Creation & Edit Form Modal */}
      <BoardFormModal
        isOpen={isBoardModalOpen}
        onClose={() => setIsBoardModalOpen(false)}
        onSave={handleSaveBoard}
        initialType={newBoardInitialType}
        boardToEdit={editingBoard}
        themeConfig={themeConfig}
      />

      {/* Easter Egg: Memory Card Sticky Notes Match Modal (triggered by typing gabut, rehat, game) */}
      {isStickyMatchOpen && (
        <StickyNotesMatchModal
          isOpen={isStickyMatchOpen}
          onClose={() => setIsStickyMatchOpen(false)}
          triggerWord={stickyMatchTriggerWord}
          soundProfile={preferences.soundProfile}
        />
      )}

      {/* Easter Egg: Procrastination Invaders / Whack-a-Distraction (triggered by Konami Code) */}
      {isWhackGameOpen && (
        <WhackADistractionModal
          isOpen={isWhackGameOpen}
          onClose={() => setIsWhackGameOpen(false)}
          buddyAvatar={
            DESK_BUDDY_OPTIONS.find((b) => b.id === preferences.deskBuddy)?.avatar || '🐱'
          }
          buddyName={
            preferences.deskBuddyCustomName?.trim() ||
            DESK_BUDDY_OPTIONS.find((b) => b.id === preferences.deskBuddy)?.name ||
            'Desk Buddy'
          }
          soundProfile={preferences.soundProfile}
        />
      )}

      {/* Easter Egg: Buddy Snake (triggered by typing snake or ular) */}
      {isSnakeGameOpen && (
        <BuddySnakeModal
          isOpen={isSnakeGameOpen}
          onClose={() => setIsSnakeGameOpen(false)}
          buddyAvatar={
            DESK_BUDDY_OPTIONS.find((b) => b.id === preferences.deskBuddy)?.avatar || '🐱'
          }
          buddyName={
            preferences.deskBuddyCustomName?.trim() ||
            DESK_BUDDY_OPTIONS.find((b) => b.id === preferences.deskBuddy)?.name ||
            'Desk Buddy'
          }
          treatEmoji={
            DESK_BUDDY_OPTIONS.find((b) => b.id === preferences.deskBuddy)?.treatEmoji || '🐟'
          }
          treatName={
            DESK_BUDDY_OPTIONS.find((b) => b.id === preferences.deskBuddy)?.treatName || 'Camilan'
          }
          soundProfile={preferences.soundProfile}
        />
      )}

      {/* Easter Egg: Focus Pong (triggered by typing pong or tenis) */}
      {isPongGameOpen && (
        <FocusPongModal
          isOpen={isPongGameOpen}
          onClose={() => setIsPongGameOpen(false)}
          buddyAvatar={
            DESK_BUDDY_OPTIONS.find((b) => b.id === preferences.deskBuddy)?.avatar || '🐱'
          }
          buddyName={
            preferences.deskBuddyCustomName?.trim() ||
            DESK_BUDDY_OPTIONS.find((b) => b.id === preferences.deskBuddy)?.name ||
            'Desk Buddy'
          }
          treatEmoji={
            DESK_BUDDY_OPTIONS.find((b) => b.id === preferences.deskBuddy)?.treatEmoji || '🐟'
          }
          treatName={
            DESK_BUDDY_OPTIONS.find((b) => b.id === preferences.deskBuddy)?.treatName || 'Camilan'
          }
          soundProfile={preferences.soundProfile}
        />
      )}

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
