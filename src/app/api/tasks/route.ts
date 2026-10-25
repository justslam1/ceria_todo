import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TaskStatus, Priority, Prisma } from '@prisma/client';
import { auth } from '@/auth';

const VALID_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];
const VALID_PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH'];

function parseStatus(val: unknown): TaskStatus {
  return typeof val === 'string' && VALID_STATUSES.includes(val as TaskStatus)
    ? (val as TaskStatus)
    : 'TODO';
}

function parsePriority(val: unknown): Priority {
  return typeof val === 'string' && VALID_PRIORITIES.includes(val as Priority)
    ? (val as Priority)
    : 'MEDIUM';
}

function parseDueDate(val: unknown): Date | null {
  if (!val) return null;
  const d = new Date(val as string | number);
  return isNaN(d.getTime()) ? null : d;
}

// GET /api/tasks - Retrieve tasks strictly isolated to logged-in user
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const statusParam = searchParams.get('status');
    const boardIdParam = searchParams.get('boardId');
    const status = statusParam && VALID_STATUSES.includes(statusParam as TaskStatus)
      ? (statusParam as TaskStatus)
      : null;

    const where: Prisma.TaskWhereInput = {
      userId,
      ...(boardIdParam ? { boardId: boardIdParam } : {}),
      ...(status ? { status } : {}),
    };

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
      take: 500,
    });

    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil daftar tugas' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create single or batch tasks strictly attached to current user
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

    // Helper to find target boardId with strict ownership verification
    const getEffectiveBoardId = async (providedBoardId?: string | null) => {
      if (providedBoardId) {
        const userBoard = await prisma.board.findFirst({
          where: { id: providedBoardId, userId },
          select: { id: true },
        });
        if (userBoard) return userBoard.id;
      }
      const defaultBoard = await prisma.board.findFirst({
        where: { userId, type: 'TASK', isDefault: true },
        select: { id: true },
      }) || await prisma.board.findFirst({
        where: { userId, type: 'TASK' },
        select: { id: true },
      });
      return defaultBoard?.id || null;
    };

    // Batch creation (WhatsApp Quick Paste / Restore)
    if (Array.isArray(body)) {
      if (body.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Data tugas tidak boleh kosong' },
          { status: 400 }
        );
      }

      // Security: Limit batch size to prevent DoS / Memory Exhaustion
      if (body.length > 100) {
        return NextResponse.json(
          { success: false, error: 'Maksimal 100 tugas dalam satu permintaan batch' },
          { status: 400 }
        );
      }

      // Pre-fetch all user's boards of type TASK to validate ownership efficiently
      const userBoards = await prisma.board.findMany({
        where: { userId, type: 'TASK' },
        select: { id: true, isDefault: true },
      });
      const validBoardIds = new Set(userBoards.map((b) => b.id));
      const defaultBoardId = userBoards.find((b) => b.isDefault)?.id || userBoards[0]?.id || null;

      const tasksToCreate = body
        .filter((item) => item && typeof item.title === 'string' && item.title.trim().length > 0)
        .map((item, index) => {
          const targetBoardId = item.boardId && validBoardIds.has(item.boardId) ? item.boardId : defaultBoardId;
          const validImg = typeof item.imageUrl === 'string' && item.imageUrl.length > 0 && item.imageUrl.length <= 2_500_000 ? item.imageUrl : null;
          return {
            userId,
            boardId: targetBoardId,
            title: item.title.trim().slice(0, 150),
            description: typeof item.description === 'string' ? item.description.slice(0, 10000) : null,
            status: parseStatus(item.status),
            priority: parsePriority(item.priority),
            category: typeof item.category === 'string' ? item.category.trim().slice(0, 50) : 'Personal',
            dueDate: parseDueDate(item.dueDate),
            estimatedTime: typeof item.estimatedTime === 'string' ? item.estimatedTime.trim().slice(0, 50) : null,
            imageUrl: validImg,
            order: typeof item.order === 'number' && Number.isFinite(item.order) ? Math.max(0, Math.floor(item.order)) : index,
          };
        });

      if (tasksToCreate.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Tidak ada tugas valid untuk disimpan' },
          { status: 400 }
        );
      }

      const createdTasks = await prisma.$transaction(
        tasksToCreate.map((data) => prisma.task.create({ data }))
      );

      return NextResponse.json(
        { success: true, data: createdTasks, count: createdTasks.length },
        { status: 201 }
      );
    }

    // Single task creation with strict bounds
    const { title, boardId, description, status, priority, category, dueDate, estimatedTime, imageUrl, order } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Judul tugas wajib diisi' },
        { status: 400 }
      );
    }

    const effectiveBoardId = await getEffectiveBoardId(boardId);

    const newTask = await prisma.task.create({
      data: {
        userId,
        boardId: effectiveBoardId,
        title: title.trim().slice(0, 150),
        description: typeof description === 'string' ? description.slice(0, 10000) : null,
        status: parseStatus(status),
        priority: parsePriority(priority),
        category: typeof category === 'string' ? category.trim().slice(0, 50) : 'Personal',
        dueDate: parseDueDate(dueDate),
        estimatedTime: typeof estimatedTime === 'string' ? estimatedTime.trim().slice(0, 50) : null,
        imageUrl: typeof imageUrl === 'string' && imageUrl.length > 0 && imageUrl.length <= 2_500_000 ? imageUrl : null,
        order: typeof order === 'number' && Number.isFinite(order) ? Math.max(0, Math.floor(order)) : 0,
      },
    });

    return NextResponse.json({ success: true, data: newTask }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal membuat tugas baru' },
      { status: 500 }
    );
  }
}
