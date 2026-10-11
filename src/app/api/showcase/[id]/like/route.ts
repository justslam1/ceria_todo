import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/showcase/[id]/like - Toggle like on a showcase
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Masuk dengan akun Google untuk menyukai karya ini' },
        { status: 401 }
      );
    }

    const { id: showcaseId } = await context.params;

    const showcase = await prisma.boardShowcase.findUnique({
      where: { id: showcaseId },
      select: { id: true, likesCount: true },
    });

    if (!showcase) {
      return NextResponse.json(
        { success: false, error: 'Showcase tidak ditemukan' },
        { status: 404 }
      );
    }

    const existingLike = await prisma.boardLike.findUnique({
      where: {
        userId_showcaseId: {
          userId,
          showcaseId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.$transaction([
        prisma.boardLike.delete({
          where: { id: existingLike.id },
        }),
        prisma.boardShowcase.update({
          where: { id: showcaseId },
          data: {
            likesCount: {
              decrement: showcase.likesCount > 0 ? 1 : 0,
            },
          },
        }),
      ]);

      const updated = await prisma.boardShowcase.findUnique({
        where: { id: showcaseId },
        select: { likesCount: true },
      });

      return NextResponse.json({
        success: true,
        liked: false,
        likesCount: updated?.likesCount ?? 0,
      });
    } else {
      // Like
      await prisma.$transaction([
        prisma.boardLike.create({
          data: {
            userId,
            showcaseId,
          },
        }),
        prisma.boardShowcase.update({
          where: { id: showcaseId },
          data: {
            likesCount: {
              increment: 1,
            },
          },
        }),
      ]);

      const updated = await prisma.boardShowcase.findUnique({
        where: { id: showcaseId },
        select: { likesCount: true },
      });

      return NextResponse.json({
        success: true,
        liked: true,
        likesCount: updated?.likesCount ?? 1,
      });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui status like' },
      { status: 500 }
    );
  }
}
