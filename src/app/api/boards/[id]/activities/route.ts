import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { checkBoardAccess } from '@/lib/boardPermissions';

// GET /api/boards/[id]/activities - Get recent activities for a board
export async function GET(
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
    const { hasAccess } = await checkBoardAccess(id, userId);

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak memiliki hak akses ke papan ini' },
        { status: 403 }
      );
    }

    const activities = await prisma.boardActivity.findMany({
      where: { boardId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      data: activities.map((a) => ({
        id: a.id,
        boardId: a.boardId,
        userId: a.userId,
        userName: a.userName,
        action: a.action,
        details: a.details,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data aktivitas' },
      { status: 500 }
    );
  }
}
