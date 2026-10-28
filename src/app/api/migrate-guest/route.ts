import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { TaskStatus, Priority } from '@prisma/client';

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

    if (session?.user?.isSuspended) {
      return NextResponse.json(
        { success: false, error: 'Akun Anda telah ditangguhkan. Silakan hubungi administrator.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { tasks = [], notes = [], boards = [] } = body;

    if (!Array.isArray(tasks) || !Array.isArray(notes) || !Array.isArray(boards)) {
      return NextResponse.json(
        { success: false, error: 'Format data migrasi tidak valid.' },
        { status: 400 }
      );
    }

    // Batasi jumlah payload untuk mencegah Denial of Service / Kehabisan Memori
    if (tasks.length > 100 || notes.length > 100 || boards.length > 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'Batas maksimum migrasi terlampaui (maksimal 100 tugas, 100 catatan, 10 papan).',
        },
        { status: 400 }
      );
    }

    // Pastikan user memiliki papan default
    const userBoards = await prisma.board.findMany({
      where: { userId },
    });

    let defaultTaskBoard = userBoards.find((b) => b.isDefault && b.type === 'TASK');
    let defaultNoteBoard = userBoards.find((b) => b.isDefault && b.type === 'NOTE');

    if (!defaultTaskBoard) {
      defaultTaskBoard = await prisma.board.create({
        data: {
          userId,
          title: 'Tugas Utama',
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
          title: 'Catatan Utama',
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

    // Jika ada papan kustom dari guest, buatkan untuk user (maksimal 10)
    for (const b of boards.slice(0, 10)) {
      if (b && typeof b.title === 'string' && b.id !== 'guest-board-task' && b.id !== 'guest-board-note') {
        try {
          const createdBoard = await prisma.board.create({
            data: {
              userId,
              title: b.title.trim().slice(0, 80) || 'Papan Kustom',
              type: b.type === 'NOTE' ? 'NOTE' : 'TASK',
              icon: typeof b.icon === 'string' && b.icon.trim() ? b.icon.trim().slice(0, 20) : '📁',
              color: typeof b.color === 'string' && b.color.trim() ? b.color.trim().slice(0, 30) : 'amber',
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

    // Persiapkan data tasks dengan validasi ketat
    const tasksToCreate = [];
    for (const t of tasks) {
      if (!t || typeof t.title !== 'string' || !t.title.trim()) continue;
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

      const validImg = typeof t.imageUrl === 'string' && t.imageUrl.length > 0 && t.imageUrl.length <= 2_500_000 ? t.imageUrl : null;

      tasksToCreate.push({
        userId,
        boardId: targetBoardId,
        title: t.title.trim().slice(0, 150),
        description: typeof t.description === 'string' ? t.description.slice(0, 10000) : null,
        status,
        priority,
        category: typeof t.category === 'string' ? t.category.trim().slice(0, 50) : 'Personal',
        dueDate: parsedDueDate,
        estimatedTime: typeof t.estimatedTime === 'string' ? t.estimatedTime.trim().slice(0, 50) : null,
        imageUrl: validImg,
        order: typeof t.order === 'number' && Number.isFinite(t.order) ? Math.max(0, Math.floor(t.order)) : 0,
      });
    }

    // Persiapkan data notes dengan validasi ketat
    const notesToCreate = [];
    for (const n of notes) {
      if (!n) continue;
      const titleStr = typeof n.title === 'string' ? n.title.trim().slice(0, 200) : '';
      const contentStr = typeof n.content === 'string' ? n.content.trim().slice(0, 20000) : '';
      const validImg = typeof n.imageUrl === 'string' && n.imageUrl.startsWith('data:image/') && n.imageUrl.length <= 2_500_000 ? n.imageUrl : null;

      if (!titleStr && !contentStr && !validImg) continue;

      const targetBoardId = (n.boardId && boardIdMap.get(n.boardId)) || defaultNoteBoard.id;
      const validColors = ['yellow', 'pink', 'blue', 'green', 'purple', 'cream'];
      const color = validColors.includes(n.color) ? n.color : 'yellow';

      notesToCreate.push({
        userId,
        boardId: targetBoardId,
        title: titleStr || (n.isSticker ? '' : validImg ? 'Catatan Gambar' : 'Catatan Baru'),
        content: contentStr,
        imageUrl: validImg,
        isSticker: Boolean(n.isSticker),
        color,
        isPinned: Boolean(n.isPinned),
        posX: typeof n.posX === 'number' && Number.isFinite(n.posX) ? n.posX : 50,
        posY: typeof n.posY === 'number' && Number.isFinite(n.posY) ? n.posY : 50,
        width: typeof n.width === 'number' && Number.isFinite(n.width) ? Math.max(120, Math.min(800, n.width)) : null,
        rotation: typeof n.rotation === 'number' && Number.isFinite(n.rotation) ? n.rotation : 0,
        order: typeof n.order === 'number' && Number.isFinite(n.order) ? Math.max(0, Math.floor(n.order)) : 0,
      });
    }

    // Eksekusi migrasi batch secara transaksional
    if (tasksToCreate.length > 0) {
      await prisma.$transaction(
        tasksToCreate.map((data) => prisma.task.create({ data }))
      );
    }

    if (notesToCreate.length > 0) {
      await prisma.$transaction(
        notesToCreate.map((data) => prisma.note.create({ data }))
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        tasksCount: tasksToCreate.length,
        notesCount: notesToCreate.length,
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
