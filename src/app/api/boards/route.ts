import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { BoardType } from '@prisma/client';
import { generateInviteCode } from '@/lib/boardPermissions';

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

    if (session?.user?.isSuspended) {
      return NextResponse.json(
        { success: false, error: 'Akun Anda telah ditangguhkan. Silakan hubungi administrator.' },
        { status: 403 }
      );
    }

    // Check if user has any owned boards; if not, create defaults
    const ownedBoardCount = await prisma.board.count({
      where: { userId },
    });

    if (ownedBoardCount === 0) {
      const defaultTaskBoard = await prisma.board.create({
        data: {
          userId,
          title: 'Tugas Utama',
          type: 'TASK',
          icon: '📋',
          color: 'amber',
          isDefault: true,
          order: 0,
          inviteCode: generateInviteCode(),
        },
      });

      const defaultNoteBoard = await prisma.board.create({
        data: {
          userId,
          title: 'Catatan Utama',
          type: 'NOTE',
          icon: '📖',
          color: 'amber',
          isDefault: true,
          order: 1,
          inviteCode: generateInviteCode(),
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
    }

    // Retrieve both owned boards and shared boards (where user is a member)
    const boards = await prisma.board.findMany({
      where: {
        OR: [
          { userId },
          { members: { some: { userId } } },
        ],
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: {
        user: {
          select: { name: true, image: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, image: true, email: true },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
            notes: true,
            members: true,
          },
        },
      },
    });

    const data = boards.map((b) => {
      const isOwner = b.userId === userId;
      return {
        id: b.id,
        userId: b.userId,
        title: b.title,
        type: b.type,
        icon: b.icon,
        color: b.color,
        isDefault: b.isDefault,
        order: b.order,
        inviteCode: b.inviteCode,
        role: isOwner ? 'OWNER' : 'MEMBER',
        isShared: (b._count.members > 0) || !isOwner,
        ownerName: b.user?.name || null,
        membersCount: b._count.members,
        members: b.members.map((m) => ({
          id: m.id,
          role: m.role,
          createdAt: m.createdAt.toISOString(),
          user: m.user,
        })),
        tasksCount: b._count.tasks,
        notesCount: b._count.notes,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      };
    });

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

    if (session?.user?.isSuspended) {
      return NextResponse.json(
        { success: false, error: 'Akun Anda telah ditangguhkan. Silakan hubungi administrator.' },
        { status: 403 }
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

    // Batasi kuota jumlah papan per pengguna (maksimal 30 papan)
    const userBoardCount = await prisma.board.count({
      where: { userId },
    });
    if (userBoardCount >= 30) {
      return NextResponse.json(
        { success: false, error: 'Batas maksimum papan tercapai (maksimal 30 papan per akun)' },
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
        icon: typeof icon === 'string' && icon.trim() ? icon.trim().slice(0, 30) : validBoardType === 'TASK' ? '📋' : '📖',
        color: typeof color === 'string' && color.trim() ? color.trim().slice(0, 30) : 'amber',
        isDefault: false,
        order: nextOrder,
        inviteCode: generateInviteCode(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...newBoard,
        role: 'OWNER',
        isShared: false,
        membersCount: 0,
        members: [],
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
