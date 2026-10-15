import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { BoardType } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Silakan masuk ke akun Anda terlebih dahulu' },
        { status: 401 }
      );
    }

    let boards = await prisma.board.findMany({
      where: { userId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: {
          select: {
            tasks: true,
            notes: true,
          },
        },
      },
    });

    // Auto-create default boards if user doesn't have any
    if (boards.length === 0) {
      const defaultTaskBoard = await prisma.board.create({
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

      const defaultNoteBoard = await prisma.board.create({
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

      // Auto-migrate orphan tasks and notes to the default boards
      await prisma.task.updateMany({
        where: { userId, boardId: null },
        data: { boardId: defaultTaskBoard.id },
      });

      await prisma.note.updateMany({
        where: { userId, boardId: null },
        data: { boardId: defaultNoteBoard.id },
      });

      boards = await prisma.board.findMany({
        where: { userId },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        include: {
          _count: {
            select: {
              tasks: true,
              notes: true,
            },
          },
        },
      });
    } else {
      // Ensure any orphan tasks/notes without boardId get linked to a default board
      const defaultTaskBoard = boards.find((b) => b.type === 'TASK' && b.isDefault) || boards.find((b) => b.type === 'TASK');
      const defaultNoteBoard = boards.find((b) => b.type === 'NOTE' && b.isDefault) || boards.find((b) => b.type === 'NOTE');

      if (defaultTaskBoard) {
        await prisma.task.updateMany({
          where: { userId, boardId: null },
          data: { boardId: defaultTaskBoard.id },
        });
      }

      if (defaultNoteBoard) {
        await prisma.note.updateMany({
          where: { userId, boardId: null },
          data: { boardId: defaultNoteBoard.id },
        });
      }
    }

    const data = boards.map((b) => ({
      id: b.id,
      userId: b.userId,
      title: b.title,
      type: b.type,
      icon: b.icon,
      color: b.color,
      isDefault: b.isDefault,
      order: b.order,
      tasksCount: b._count.tasks,
      notesCount: b._count.notes,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching boards:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil daftar papan' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Silakan masuk ke akun Anda terlebih dahulu' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, type, icon, color } = body;

    const trimmedTitle = typeof title === 'string' ? title.trim().slice(0, 80) : '';
    if (!trimmedTitle) {
      return NextResponse.json(
        { success: false, error: 'Nama papan wajib diisi' },
        { status: 400 }
      );
    }

    const validTypes: BoardType[] = ['TASK', 'NOTE'];
    const validBoardType: BoardType = validTypes.includes(type) ? type : 'TASK';

    // Get max order
    const lastBoard = await prisma.board.findFirst({
      where: { userId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const nextOrder = (lastBoard?.order ?? 0) + 1;

    const newBoard = await prisma.board.create({
      data: {
        userId,
        title: trimmedTitle,
        type: validBoardType,
        icon: typeof icon === 'string' && icon.trim() ? icon.trim() : validBoardType === 'TASK' ? '📋' : '📖',
        color: typeof color === 'string' && color.trim() ? color.trim() : 'amber',
        isDefault: false,
        order: nextOrder,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...newBoard,
        tasksCount: 0,
        notesCount: 0,
        createdAt: newBoard.createdAt.toISOString(),
        updatedAt: newBoard.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating board:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal membuat papan baru' },
      { status: 500 }
    );
  }
}
