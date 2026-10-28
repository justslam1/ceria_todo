import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// DELETE /api/boards/[id]/members/[memberId] - Remove a member (Owner only)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; memberId: string }> }
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

    const { id, memberId } = await context.params;

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

    if (board.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Hanya pemilik papan yang dapat mengeluarkan anggota' },
        { status: 403 }
      );
    }

    await prisma.boardMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({
      success: true,
      message: 'Anggota berhasil dikeluarkan dari papan',
    });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengeluarkan anggota' },
      { status: 500 }
    );
  }
}
