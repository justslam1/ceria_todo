import { Task, CreateTaskInput, UpdateTaskInput } from '@/types/task';
import { Board, CreateBoardInput, UpdateBoardInput } from '@/types/board';
import { NoteItem } from '@/types/note';

const GUEST_BOARDS_KEY = 'ceria_guest_boards';
const GUEST_TASKS_KEY = 'ceria_guest_tasks';
const GUEST_NOTES_KEY = 'ceria_guest_notes';
const GUEST_INITIALIZED_KEY = 'ceria_guest_initialized';

const DEFAULT_GUEST_BOARDS: Board[] = [
  {
    id: 'guest-board-task',
    userId: null,
    title: 'Tugas Utama',
    type: 'TASK',
    icon: '📋',
    color: 'amber',
    isDefault: true,
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'guest-board-note',
    userId: null,
    title: 'Catatan Utama',
    type: 'NOTE',
    icon: '📖',
    color: 'amber',
    isDefault: true,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_GUEST_TASKS: Task[] = [
  {
    id: 'guest-task-1',
    boardId: 'guest-board-task',
    userId: null,
    title: 'Selamat datang di Ceria Todo',
    description: 'Ini adalah mode tamu. Anda dapat langsung mengelola aktivitas tanpa perlu mendaftar terlebih dahulu.',
    status: 'TODO',
    priority: 'MEDIUM',
    category: 'Personal',
    dueDate: null,
    estimatedTime: null,
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'guest-task-2',
    boardId: 'guest-board-task',
    userId: null,
    title: 'Coba geser kartu tugas ini',
    description: 'Tarik (drag and drop) kartu ini ke kolom Sedang Dikerjakan atau Selesai untuk memperbarui statusnya.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    category: 'Work',
    dueDate: null,
    estimatedTime: null,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'guest-task-3',
    boardId: 'guest-board-task',
    userId: null,
    title: 'Simpan permanen ke cloud',
    description: 'Data mode tamu tersimpan aman di peramban ini. Klik tombol Masuk kapan saja untuk menyinkronkan data ke akun Google Anda.',
    status: 'DONE',
    priority: 'LOW',
    category: 'Personal',
    dueDate: null,
    estimatedTime: null,
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_GUEST_NOTES: NoteItem[] = [
  {
    id: 'guest-note-1',
    boardId: 'guest-board-note',
    userId: null,
    title: 'Catatan Cepat',
    content: 'Anda juga dapat membuat catatan tempel secara bebas di mode tamu.',
    color: 'yellow',
    isPinned: false,
    posX: 40,
    posY: 40,
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function isQuotaExceededError(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    (err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err.code === 22)
  );
}

function notifyQuotaExceeded(message: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ceria:storage-quota-exceeded', {
        detail: { message },
      })
    );
    console.warn(`[Ceria Storage Quota]: ${message}`);
  }
}

export function initGuestStorage(): void {
  if (!isBrowser()) return;
  const isInitialized = localStorage.getItem(GUEST_INITIALIZED_KEY);
  if (!isInitialized) {
    try {
      if (!localStorage.getItem(GUEST_BOARDS_KEY)) {
        localStorage.setItem(GUEST_BOARDS_KEY, JSON.stringify(DEFAULT_GUEST_BOARDS));
      }
      if (!localStorage.getItem(GUEST_TASKS_KEY)) {
        localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify(DEFAULT_GUEST_TASKS));
      }
      if (!localStorage.getItem(GUEST_NOTES_KEY)) {
        localStorage.setItem(GUEST_NOTES_KEY, JSON.stringify(DEFAULT_GUEST_NOTES));
      }
      localStorage.setItem(GUEST_INITIALIZED_KEY, 'true');
    } catch (err) {
      console.warn('Gagal menginisialisasi penyimpanan mode tamu:', err);
    }
  }
}

export function getGuestBoards(): Board[] {
  if (!isBrowser()) return DEFAULT_GUEST_BOARDS;
  initGuestStorage();
  try {
    const data = localStorage.getItem(GUEST_BOARDS_KEY);
    if (!data) return DEFAULT_GUEST_BOARDS;
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Auto-heal nilai teks ikon dan nama papan bawaan agar lebih ringkas
      let updated = false;
      const healed = parsed.map((b: Board) => {
        const currentBoard = { ...b };
        if (currentBoard.icon === 'clipboard') {
          updated = true;
          currentBoard.icon = '📋';
        }
        if (currentBoard.icon === 'book') {
          updated = true;
          currentBoard.icon = '📖';
        }
        if (currentBoard.isDefault && currentBoard.title === 'Papan Tugas Utama') {
          updated = true;
          currentBoard.title = 'Tugas Utama';
        }
        if (currentBoard.isDefault && currentBoard.title === 'Papan Catatan Utama') {
          updated = true;
          currentBoard.title = 'Catatan Utama';
        }
        return currentBoard;
      });
      if (updated) {
        try {
          localStorage.setItem(GUEST_BOARDS_KEY, JSON.stringify(healed));
        } catch {
          // ignore auto-heal save failure if storage is tight
        }
      }
      return healed;
    }
    return DEFAULT_GUEST_BOARDS;
  } catch {
    return DEFAULT_GUEST_BOARDS;
  }
}

export function saveGuestBoard(data: CreateBoardInput | UpdateBoardInput, boardId?: string): Board {
  if (!isBrowser()) throw new Error('Operasi hanya dapat dilakukan di peramban');
  const boards = getGuestBoards();
  const now = new Date().toISOString();

  let targetBoard: Board;
  if (boardId) {
    const index = boards.findIndex((b) => b.id === boardId);
    if (index === -1) throw new Error('Papan tidak ditemukan');
    const updatedBoard: Board = {
      ...boards[index],
      ...data,
      updatedAt: now,
    };
    boards[index] = updatedBoard;
    targetBoard = updatedBoard;
  } else {
    const input = data as CreateBoardInput;
    const newBoard: Board = {
      id: `guest-board-${Date.now()}`,
      userId: null,
      title: input.title,
      type: input.type,
      icon: input.icon || (input.type === 'TASK' ? '📋' : '📖'),
      color: input.color || 'amber',
      isDefault: false,
      order: boards.length,
      createdAt: now,
      updatedAt: now,
    };
    boards.push(newBoard);
    targetBoard = newBoard;
  }

  try {
    localStorage.setItem(GUEST_BOARDS_KEY, JSON.stringify(boards));
  } catch (err: unknown) {
    if (isQuotaExceededError(err)) {
      notifyQuotaExceeded('Penyimpanan lokal penuh saat menyimpan papan.');
      throw new Error('Penyimpanan lokal peramban penuh. Harap bersihkan data lama atau masuk dengan Google.');
    }
    throw err;
  }
  return targetBoard;
}

export function deleteGuestBoard(boardId: string): void {
  if (!isBrowser()) return;
  try {
    const boards = getGuestBoards().filter((b) => b.id !== boardId);
    localStorage.setItem(GUEST_BOARDS_KEY, JSON.stringify(boards));

    // Also remove associated tasks and notes
    const tasks = getGuestTasks().filter((t) => t.boardId !== boardId);
    localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify(tasks));

    const notes = getGuestNotes().filter((n) => n.boardId !== boardId);
    localStorage.setItem(GUEST_NOTES_KEY, JSON.stringify(notes));
  } catch (err) {
    console.warn('Gagal menghapus papan tamu dari penyimpanan lokal:', err);
  }
}

export function getGuestTasks(boardId?: string): Task[] {
  if (!isBrowser()) return DEFAULT_GUEST_TASKS;
  initGuestStorage();
  try {
    const data = localStorage.getItem(GUEST_TASKS_KEY);
    if (!data) return DEFAULT_GUEST_TASKS;
    const tasks: Task[] = JSON.parse(data);
    if (!Array.isArray(tasks)) return DEFAULT_GUEST_TASKS;
    if (boardId) {
      return tasks.filter((t) => t.boardId === boardId);
    }
    return tasks;
  } catch {
    return DEFAULT_GUEST_TASKS;
  }
}

export function saveGuestTask(data: CreateTaskInput): Task {
  if (!isBrowser()) throw new Error('Operasi hanya dapat dilakukan di peramban');
  const allTasks = getGuestTasks();
  const now = new Date().toISOString();

  let newTask: Task = {
    id: `guest-task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    boardId: data.boardId || null,
    userId: null,
    title: data.title,
    description: data.description || null,
    status: data.status || 'TODO',
    priority: data.priority || 'MEDIUM',
    category: data.category || 'Personal',
    dueDate: data.dueDate ? (data.dueDate instanceof Date ? data.dueDate.toISOString() : data.dueDate) : null,
    estimatedTime: data.estimatedTime || null,
    imageUrl: data.imageUrl || null,
    order: data.order ?? allTasks.length,
    createdAt: now,
    updatedAt: now,
  };

  const updatedTasks = [newTask, ...allTasks];
  try {
    localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify(updatedTasks));
  } catch (err: unknown) {
    if (isQuotaExceededError(err)) {
      if (newTask.imageUrl) {
        try {
          newTask = { ...newTask, imageUrl: null };
          localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify([newTask, ...allTasks]));
          notifyQuotaExceeded('Penyimpanan lokal hampir penuh. Tugas disimpan tanpa lampiran gambar.');
          return newTask;
        } catch {
          // Tetap penuh meski tanpa gambar
        }
      }
      notifyQuotaExceeded('Penyimpanan lokal peramban penuh.');
      throw new Error('Penyimpanan lokal peramban penuh. Harap hapus beberapa tugas/catatan lama atau masuk dengan Google.');
    }
    throw err;
  }
  return newTask;
}

export function saveGuestTasksBatch(tasksData: CreateTaskInput[]): Task[] {
  if (!isBrowser()) throw new Error('Operasi hanya dapat dilakukan di peramban');
  if (!tasksData.length) return [];

  const allTasks = getGuestTasks();
  const now = new Date().toISOString();

  let newTasks: Task[] = tasksData.map((data, idx) => ({
    id: `guest-task-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
    boardId: data.boardId || null,
    userId: null,
    title: data.title,
    description: data.description || null,
    status: data.status || 'TODO',
    priority: data.priority || 'MEDIUM',
    category: data.category || 'Personal',
    dueDate: data.dueDate ? (data.dueDate instanceof Date ? data.dueDate.toISOString() : data.dueDate) : null,
    estimatedTime: data.estimatedTime || null,
    imageUrl: data.imageUrl || null,
    order: data.order ?? (allTasks.length + idx),
    createdAt: now,
    updatedAt: now,
  }));

  try {
    localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify([...newTasks, ...allTasks]));
  } catch (err: unknown) {
    if (isQuotaExceededError(err)) {
      try {
        newTasks = newTasks.map((t) => ({ ...t, imageUrl: null }));
        localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify([...newTasks, ...allTasks]));
        notifyQuotaExceeded('Penyimpanan lokal hampir penuh. Tugas disimpan tanpa lampiran gambar.');
        return newTasks;
      } catch {
        notifyQuotaExceeded('Penyimpanan lokal peramban penuh.');
        throw new Error('Penyimpanan lokal peramban penuh. Harap hapus beberapa tugas lama atau masuk dengan Google.');
      }
    }
    throw err;
  }

  return newTasks;
}

export function updateGuestTask(id: string, updates: Partial<UpdateTaskInput> | Partial<Task>): Task {
  if (!isBrowser()) throw new Error('Operasi hanya dapat dilakukan di peramban');
  const allTasks = getGuestTasks();
  const index = allTasks.findIndex((t) => t.id === id);
  if (index === -1) throw new Error('Tugas tidak ditemukan');

  const formattedDueDate =
    updates.dueDate !== undefined
      ? updates.dueDate instanceof Date
        ? updates.dueDate.toISOString()
        : updates.dueDate
      : allTasks[index].dueDate;

  let updated: Task = {
    ...allTasks[index],
    ...updates,
    dueDate: formattedDueDate,
    updatedAt: new Date().toISOString(),
  };

  allTasks[index] = updated;
  try {
    localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify(allTasks));
  } catch (err: unknown) {
    if (isQuotaExceededError(err)) {
      if (updated.imageUrl && updated.imageUrl !== allTasks[index].imageUrl) {
        try {
          updated = { ...updated, imageUrl: allTasks[index].imageUrl || null };
          allTasks[index] = updated;
          localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify(allTasks));
          notifyQuotaExceeded('Penyimpanan lokal penuh. Gambar baru tidak dapat disimpan.');
          return updated;
        } catch {
          // Still full
        }
      }
      notifyQuotaExceeded('Penyimpanan lokal peramban penuh.');
      throw new Error('Penyimpanan lokal peramban penuh. Harap hapus beberapa tugas lama atau masuk dengan Google.');
    }
    throw err;
  }
  return updated;
}

export function reorderGuestTasks(orderedTasks: Task[]): void {
  if (!isBrowser()) return;
  try {
    const allTasks = getGuestTasks();
    const updatedMap = new Map(orderedTasks.map((t) => [t.id, t]));
    const result = allTasks.map((t) => updatedMap.get(t.id) || t);
    localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify(result));
  } catch (err) {
    console.warn('Gagal menyimpan urutan tugas tamu:', err);
  }
}

export function deleteGuestTask(id: string): void {
  if (!isBrowser()) return;
  try {
    const allTasks = getGuestTasks().filter((t) => t.id !== id);
    localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify(allTasks));
  } catch (err) {
    console.warn('Gagal menghapus tugas tamu:', err);
  }
}

export function getGuestNotes(boardId?: string): NoteItem[] {
  if (!isBrowser()) return DEFAULT_GUEST_NOTES;
  initGuestStorage();
  try {
    const data = localStorage.getItem(GUEST_NOTES_KEY);
    if (!data) return DEFAULT_GUEST_NOTES;
    const notes: NoteItem[] = JSON.parse(data);
    if (!Array.isArray(notes)) return DEFAULT_GUEST_NOTES;
    if (boardId) {
      return notes.filter((n) => n.boardId === boardId);
    }
    return notes;
  } catch {
    return DEFAULT_GUEST_NOTES;
  }
}

export function saveGuestNote(data: Partial<NoteItem> & { title: string; content: string }): NoteItem {
  if (!isBrowser()) throw new Error('Operasi hanya dapat dilakukan di peramban');
  const notes = getGuestNotes();
  const now = new Date().toISOString();

  let newNote: NoteItem = {
    id: `guest-note-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    boardId: data.boardId || null,
    userId: null,
    title: data.title,
    content: data.content,
    imageUrl: data.imageUrl || null,
    isSticker: data.isSticker ?? false,
    color: data.color || 'yellow',
    isPinned: data.isPinned ?? false,
    posX: data.posX ?? 50,
    posY: data.posY ?? 50,
    width: data.width,
    rotation: data.rotation ?? 0,
    flipH: data.flipH ?? false,
    flipV: data.flipV ?? false,
    order: data.order ?? notes.length,
    createdAt: now,
    updatedAt: now,
  };

  const updatedNotes = [newNote, ...notes];
  try {
    localStorage.setItem(GUEST_NOTES_KEY, JSON.stringify(updatedNotes));
  } catch (err: unknown) {
    if (isQuotaExceededError(err)) {
      if (newNote.imageUrl) {
        try {
          newNote = { ...newNote, imageUrl: null };
          localStorage.setItem(GUEST_NOTES_KEY, JSON.stringify([newNote, ...notes]));
          notifyQuotaExceeded('Penyimpanan lokal hampir penuh. Catatan disimpan tanpa gambar.');
          return newNote;
        } catch {
          // Still full
        }
      }
      notifyQuotaExceeded('Penyimpanan lokal peramban penuh.');
      throw new Error('Penyimpanan lokal peramban penuh. Harap hapus beberapa catatan lama atau masuk dengan Google.');
    }
    throw err;
  }
  return newNote;
}

export function updateGuestNote(id: string, updates: Partial<NoteItem>): NoteItem {
  if (!isBrowser()) throw new Error('Operasi hanya dapat dilakukan di peramban');
  const notes = getGuestNotes();
  const index = notes.findIndex((n) => n.id === id);
  if (index === -1) throw new Error('Catatan tidak ditemukan');

  let updated: NoteItem = {
    ...notes[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  notes[index] = updated;
  try {
    localStorage.setItem(GUEST_NOTES_KEY, JSON.stringify(notes));
  } catch (err: unknown) {
    if (isQuotaExceededError(err)) {
      if (updated.imageUrl && updated.imageUrl !== notes[index].imageUrl) {
        try {
          updated = { ...updated, imageUrl: notes[index].imageUrl || null };
          notes[index] = updated;
          localStorage.setItem(GUEST_NOTES_KEY, JSON.stringify(notes));
          notifyQuotaExceeded('Penyimpanan lokal penuh. Gambar baru pada catatan tidak dapat disimpan.');
          return updated;
        } catch {
          // Still full
        }
      }
      notifyQuotaExceeded('Penyimpanan lokal peramban penuh.');
      throw new Error('Penyimpanan lokal peramban penuh. Harap hapus beberapa catatan lama atau masuk dengan Google.');
    }
    throw err;
  }
  return updated;
}

export function deleteGuestNote(id: string): void {
  if (!isBrowser()) return;
  try {
    const notes = getGuestNotes().filter((n) => n.id !== id);
    localStorage.setItem(GUEST_NOTES_KEY, JSON.stringify(notes));
  } catch (err) {
    console.warn('Gagal menghapus catatan tamu:', err);
  }
}

export function hasGuestData(): boolean {
  if (!isBrowser()) return false;
  const tasks = localStorage.getItem(GUEST_TASKS_KEY);
  const notes = localStorage.getItem(GUEST_NOTES_KEY);
  return Boolean(
    (tasks && JSON.parse(tasks || '[]').length > 0) ||
    (notes && JSON.parse(notes || '[]').length > 0)
  );
}

export function clearGuestStorage(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(GUEST_BOARDS_KEY);
  localStorage.removeItem(GUEST_TASKS_KEY);
  localStorage.removeItem(GUEST_NOTES_KEY);
  localStorage.removeItem(GUEST_INITIALIZED_KEY);
}
