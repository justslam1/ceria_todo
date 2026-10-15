import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const { title, icon, color, order } = body;

    const existingBoard = await prisma.board.findFirst({
      where: { id, userId },
    });

    if (!existingBoard) {
      return NextResponse.json(
        { success: false, error: 'Papan tidak ditemukan' },
        { status: 404 }
      );
    }

    const updated = await prisma.board.update({
      where: { id },
      data: {
        ...(typeof title === 'string' && title.trim() ? { title: title.trim().slice(0, 80) } : {}),
        ...(typeof icon === 'string' && icon.trim() ? { icon: icon.trim() } : {}),
        ...(typeof color === 'string' && color.trim() ? { color: color.trim() } : {}),
        ...(typeof order === 'number' ? { order } : {}),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating board:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui papan' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const existingBoard = await prisma.board.findFirst({
      where: { id, userId },
    });

    if (!existingBoard) {
      return NextResponse.json(
        { success: false, error: 'Papan tidak ditemukan' },
        { status: 404 }
      );
    }

    if (existingBoard.isDefault) {
      return NextResponse.json(
        { success: false, error: 'Papan utama (default) tidak dapat dihapus' },
        { status: 400 }
      );
    }

    // Count boards of the same type to make sure at least 1 board remains
    const sameTypeCount = await prisma.board.count({
      where: { userId, type: existingBoard.type },
    });

    if (sameTypeCount <= 1) {
      return NextResponse.json(
        { success: false, error: 'Anda harus memiliki minimal satu papan untuk jenis ini' },
        { status: 400 }
      );
    }

    // Migrate tasks/notes to the default board before deleting, or cascade
    const defaultBoard = await prisma.board.findFirst({
      where: { userId, type: existingBoard.type, isDefault: true },
    });

    if (defaultBoard) {
      if (existingBoard.type === 'TASK') {
        await prisma.task.updateMany({
          where: { boardId: id },
          data: { boardId: defaultBoard.id },
        });
      } else {
        await prisma.note.updateMany({
          where: { boardId: id },
          data: { boardId: defaultBoard.id },
        });
      }
    }

    await prisma.board.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Papan berhasil dihapus',
      fallbackBoardId: defaultBoard?.id || null,
    });
  } catch (error) {
    console.error('Error deleting board:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus papan' },
      { status: 500 }
    );
  }
}
