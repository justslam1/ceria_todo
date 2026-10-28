import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TaskStatus, Priority } from '@prisma/client';
import { auth } from '@/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const VALID_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];
const VALID_PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH'];

async function getTaskAccess(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      board: {
        include: {
          members: {
            where: { userId },
            select: { id: true },
          },
        },
      },
      assignedTo: {
        select: { id: true, name: true, image: true, email: true },
      },
    },
  });

  if (!task) return { hasAccess: false, task: null };

  // Access allowed if user created the task
  if (task.userId === userId) {
    return { hasAccess: true, task };
  }

  // Access allowed if task belongs to a board the user owns or is a member of
  if (task.board && (task.board.userId === userId || task.board.members.length > 0)) {
    return { hasAccess: true, task };
  }

  return { hasAccess: false, task: null };
}

// GET /api/tasks/[id] - Get single task
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Silakan masuk ke akun Anda' },
        { status: 401 }
      );
    }

    if (session?.user?.isSuspended) {
      return NextResponse.json(
        { success: false, error: 'Akun Anda telah ditangguhkan. Silakan hubungi administrator.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const { hasAccess, task } = await getTaskAccess(id, userId);

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Tugas tidak ditemukan' },
        { status: 404 }
      );
    }

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak memiliki hak akses ke tugas ini' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data tugas' },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/[id] - Update task
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Silakan masuk ke akun Anda' },
        { status: 401 }
      );
    }

    if (session?.user?.isSuspended) {
      return NextResponse.json(
        { success: false, error: 'Akun Anda telah ditangguhkan. Silakan hubungi administrator.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const { hasAccess, task: existingTask } = await getTaskAccess(id, userId);

    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Tugas tidak ditemukan' },
        { status: 404 }
      );
    }

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak memiliki hak mengubah tugas ini' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const updateData: {
      title?: string;
      description?: string | null;
      status?: TaskStatus;
      priority?: Priority;
      category?: string;
      dueDate?: Date | null;
      estimatedTime?: string | null;
      imageUrl?: string | null;
      order?: number;
      assignedToId?: string | null;
    } = {};

    if (body.title !== undefined) {
      if (typeof body.title === 'string' && body.title.trim().length > 0) {
        updateData.title = body.title.trim().slice(0, 150);
      }
    }

    if (body.description !== undefined) {
      if (body.description === null) {
        updateData.description = null;
      } else if (typeof body.description === 'string') {
        updateData.description = body.description.slice(0, 10000);
      }
    }

    if (body.status !== undefined && VALID_STATUSES.includes(body.status as TaskStatus)) {
      updateData.status = body.status as TaskStatus;
    }

    if (body.priority !== undefined && VALID_PRIORITIES.includes(body.priority as Priority)) {
      updateData.priority = body.priority as Priority;
    }

    if (body.category !== undefined && typeof body.category === 'string') {
      updateData.category = body.category.trim().slice(0, 50);
    }

    if (body.dueDate !== undefined) {
      if (!body.dueDate) {
        updateData.dueDate = null;
      } else {
        const d = new Date(body.dueDate);
        updateData.dueDate = isNaN(d.getTime()) ? null : d;
      }
    }

    if (body.estimatedTime !== undefined) {
      if (body.estimatedTime === null) {
        updateData.estimatedTime = null;
      } else if (typeof body.estimatedTime === 'string') {
        updateData.estimatedTime = body.estimatedTime.trim().slice(0, 50);
      }
    }

    if (body.imageUrl !== undefined) {
      if (body.imageUrl === null || body.imageUrl === '') {
        updateData.imageUrl = null;
      } else if (typeof body.imageUrl === 'string' && body.imageUrl.length <= 2_500_000) {
        updateData.imageUrl = body.imageUrl;
      }
    }

    if (body.order !== undefined) {
      const numOrder = Number(body.order);
      if (Number.isFinite(numOrder)) {
        updateData.order = Math.max(0, Math.floor(numOrder));
      }
    }

    if (body.assignedToId !== undefined) {
      if (body.assignedToId === null || body.assignedToId === '') {
        updateData.assignedToId = null;
      } else if (typeof body.assignedToId === 'string') {
        updateData.assignedToId = body.assignedToId;
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: { id: true, name: true, image: true, email: true },
        },
      },
    });

    // Record activity on the board
    if (existingTask.boardId) {
      if (updateData.status === 'DONE' && existingTask.status !== 'DONE') {
        await prisma.boardActivity.create({
          data: {
            boardId: existingTask.boardId,
            userId,
            userName: session?.user?.name || 'Pengguna',
            action: 'TASK_COMPLETED',
            details: updatedTask.title,
          },
        }).catch(() => {});
      } else if (updateData.assignedToId !== undefined && updateData.assignedToId !== existingTask.assignedToId) {
        const assigneeName = updatedTask.assignedTo?.name || 'seseorang';
        await prisma.boardActivity.create({
          data: {
            boardId: existingTask.boardId,
            userId,
            userName: session?.user?.name || 'Pengguna',
            action: 'TASK_ASSIGNED',
            details: updateData.assignedToId ? `Menugaskan "${updatedTask.title}" ke ${assigneeName}` : `Membatalkan penugasan "${updatedTask.title}"`,
          },
        }).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui tugas' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Silakan masuk ke akun Anda' },
        { status: 401 }
      );
    }

    if (session?.user?.isSuspended) {
      return NextResponse.json(
        { success: false, error: 'Akun Anda telah ditangguhkan. Silakan hubungi administrator.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const { hasAccess, task: existingTask } = await getTaskAccess(id, userId);

    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Tugas tidak ditemukan' },
        { status: 404 }
      );
    }

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak memiliki hak menghapus tugas ini' },
        { status: 403 }
      );
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Tugas berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus tugas' },
      { status: 500 }
    );
  }
}
