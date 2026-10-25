import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { TaskStatus, Priority, Prisma } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Sesi tidak ditemukan.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tasks = [], notes = [], boards = [] } = body;

    // Pastikan user memiliki papan default
    let userBoards = await prisma.board.findMany({
      where: { userId },
    });

    let defaultTaskBoard = userBoards.find((b) => b.isDefault && b.type === 'TASK');
    let defaultNoteBoard = userBoards.find((b) => b.isDefault && b.type === 'NOTE');

    if (!defaultTaskBoard) {
      defaultTaskBoard = await prisma.board.create({
        data: {
          userId,
          title: 'Papan Tugas Utama',
          type: 'TASK',
          icon: '📋',
          color: 'amber',
          isDefault: true,
          order: 0,
        },
      });
    }

    if (!defaultNoteBoard) {
      defaultNoteBoard = await prisma.board.create({
        data: {
          userId,
          title: 'Papan Catatan Utama',
          type: 'NOTE',
          icon: '📖',
          color: 'amber',
          isDefault: true,
          order: 1,
        },
      });
    }

    // Peta ID papan guest ke ID papan database user
    const boardIdMap = new Map<string, string>();
    boardIdMap.set('guest-board-task', defaultTaskBoard.id);
    boardIdMap.set('guest-board-note', defaultNoteBoard.id);

    // Jika ada papan kustom dari guest, buatkan untuk user
    for (const b of boards) {
      if (b.id !== 'guest-board-task' && b.id !== 'guest-board-note') {
        try {
          const createdBoard = await prisma.board.create({
            data: {
              userId,
              title: b.title || 'Papan Kustom',
              type: b.type === 'NOTE' ? 'NOTE' : 'TASK',
              icon: b.icon === 'clipboard' ? '📋' : b.icon === 'book' ? '📖' : (b.icon || '📁'),
              color: b.color || 'amber',
              isDefault: false,
              order: userBoards.length + 1,
            },
          });
          boardIdMap.set(b.id, createdBoard.id);
        } catch (e) {
          console.error('Gagal migrasi papan kustom:', e);
        }
      }
    }

    let importedTasksCount = 0;
    let importedNotesCount = 0;

    // Migrasi Tasks
    for (const t of tasks) {
      if (!t.title) continue;
      const targetBoardId = (t.boardId && boardIdMap.get(t.boardId)) || defaultTaskBoard.id;

      const validStatuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];
      const status: TaskStatus = validStatuses.includes(t.status) ? t.status : 'TODO';

      const validPriorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH'];
      const priority: Priority = validPriorities.includes(t.priority) ? t.priority : 'MEDIUM';

      let parsedDueDate: Date | null = null;
      if (t.dueDate) {
        const d = new Date(t.dueDate);
        if (!isNaN(d.getTime())) {
          parsedDueDate = d;
        }
      }

      await prisma.task.create({
        data: {
          userId,
          boardId: targetBoardId,
          title: String(t.title).slice(0, 255),
          description: t.description ? String(t.description) : null,
          status,
          priority,
          category: t.category ? String(t.category).slice(0, 50) : 'Personal',
          dueDate: parsedDueDate,
          estimatedTime: t.estimatedTime ? String(t.estimatedTime).slice(0, 50) : null,
          imageUrl: t.imageUrl || null,
          order: typeof t.order === 'number' ? t.order : 0,
        },
      });
      importedTasksCount++;
    }

    // Migrasi Notes
    for (const n of notes) {
      if (!n.title && !n.content) continue;
      const targetBoardId = (n.boardId && boardIdMap.get(n.boardId)) || defaultNoteBoard.id;

      await prisma.note.create({
        data: {
          userId,
          boardId: targetBoardId,
          title: n.title ? String(n.title).slice(0, 255) : '',
          content: n.content ? String(n.content) : '',
          imageUrl: n.imageUrl || null,
          isSticker: Boolean(n.isSticker),
          color: n.color || 'yellow',
          isPinned: Boolean(n.isPinned),
          posX: typeof n.posX === 'number' ? n.posX : 50,
          posY: typeof n.posY === 'number' ? n.posY : 50,
          width: typeof n.width === 'number' ? n.width : null,
          rotation: typeof n.rotation === 'number' ? n.rotation : 0,
          order: typeof n.order === 'number' ? n.order : 0,
        },
      });
      importedNotesCount++;
    }

    return NextResponse.json({
      success: true,
      data: {
        tasksCount: importedTasksCount,
        notesCount: importedNotesCount,
      },
    });
  } catch (error: unknown) {
    console.error('Gagal migrasi data tamu:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat memigrasikan data tamu.' },
      { status: 500 }
    );
  }
}
