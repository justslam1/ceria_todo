import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/showcase/[id] - Get details of a single showcase
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;
    const { id } = await context.params;

    const showcase = await prisma.boardShowcase.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        likes: currentUserId
          ? {
              where: { userId: currentUserId },
              select: { id: true },
            }
          : false,
      },
    });

    if (!showcase) {
      return NextResponse.json(
        { success: false, error: 'Showcase tidak ditemukan' },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { likes, ...rest } = showcase as any;

    return NextResponse.json({
      success: true,
      data: {
        ...rest,
        isLiked: Array.isArray(likes) && likes.length > 0,
      },
    });
  } catch (error) {
    console.error('Error fetching showcase:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil detail showcase' },
      { status: 500 }
    );
  }
}

// DELETE /api/showcase/[id] - Delete user's own showcase
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

    const showcase = await prisma.boardShowcase.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!showcase) {
      return NextResponse.json(
        { success: false, error: 'Showcase tidak ditemukan' },
        { status: 404 }
      );
    }

    if (showcase.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Anda hanya dapat menghapus karya milik sendiri' },
        { status: 403 }
      );
    }

    await prisma.boardShowcase.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Showcase berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting showcase:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus showcase' },
      { status: 500 }
    );
  }
}
