import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// POST /api/boards/[id]/leave - Member leaves a shared board
export async function POST(
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

    const board = await prisma.board.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!board) {
      return NextResponse.json(
        { success: false, error: 'Papan tidak ditemukan' },
        { status: 404 }
      );
    }

    if (board.userId === userId) {
      return NextResponse.json(
        { success: false, error: 'Pemilik papan tidak dapat keluar dari papan sendiri. Hapus papan jika tidak digunakan.' },
        { status: 400 }
      );
    }

    await prisma.boardMember.deleteMany({
      where: {
        boardId: id,
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Anda telah keluar dari papan ini',
    });
  } catch (error) {
    console.error('Error leaving board:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal keluar dari papan' },
      { status: 500 }
    );
  }
}
