import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TaskStatus, Priority } from '@prisma/client';
import { auth } from '@/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const VALID_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];
const VALID_PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH'];

// GET /api/tasks/[id] - Get single task with strict authorization check
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

    const { id } = await context.params;

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Tugas tidak ditemukan' },
        { status: 404 }
      );
    }

    // Auto-claim legacy task without owner, or verify ownership
    if (!task.userId) {
      await prisma.task.update({
        where: { id },
        data: { userId },
      });
      task.userId = userId;
    } else if (task.userId !== userId) {
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

// PATCH /api/tasks/[id] - Update task with strict ownership and input validation
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

    const { id } = await context.params;

    // Check existing task
    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Tugas tidak ditemukan' },
        { status: 404 }
      );
    }

    // Auto-claim legacy task or verify ownership
    if (!existingTask.userId) {
      await prisma.task.update({
        where: { id },
        data: { userId },
      });
    } else if (existingTask.userId !== userId) {
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
      order?: number;
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

    if (body.order !== undefined) {
      const numOrder = Number(body.order);
      if (Number.isFinite(numOrder)) {
        updateData.order = Math.max(0, Math.floor(numOrder));
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui tugas' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Delete a task with strict ownership check
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

    const { id } = await context.params;

    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Tugas tidak ditemukan' },
        { status: 404 }
      );
    }

    if (existingTask.userId && existingTask.userId !== userId) {
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
