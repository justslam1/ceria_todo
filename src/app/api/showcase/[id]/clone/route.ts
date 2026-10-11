import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/showcase/[id]/clone - Increment clone count when someone applies this template
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const showcase = await prisma.boardShowcase.findUnique({
      where: { id },
    });

    if (!showcase) {
      return NextResponse.json(
        { success: false, error: 'Showcase tidak ditemukan' },
        { status: 404 }
      );
    }

    const updated = await prisma.boardShowcase.update({
      where: { id },
      data: {
        clonesCount: {
          increment: 1,
        },
      },
      select: {
        id: true,
        clonesCount: true,
        configJson: true,
      },
    });

    return NextResponse.json({
      success: true,
      clonesCount: updated.clonesCount,
      configJson: updated.configJson,
    });
  } catch (error) {
    console.error('Error cloning showcase:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal merekam clone template' },
      { status: 500 }
    );
  }
}
