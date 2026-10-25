import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// In-memory anti-spam rate limiter per IP & showcase (cooldown: 60 detik)
const cloneRateLimitMap = new Map<string, number>();
const COOLDOWN_MS = 60 * 1000;

function isSpamming(key: string): boolean {
  const now = Date.now();
  const lastTime = cloneRateLimitMap.get(key);
  if (lastTime && now - lastTime < COOLDOWN_MS) {
    return true;
  }
  cloneRateLimitMap.set(key, now);

  // Bersihkan entri kedaluwarsa jika ukuran map sudah besar
  if (cloneRateLimitMap.size > 2000) {
    for (const [k, timestamp] of cloneRateLimitMap.entries()) {
      if (now - timestamp > COOLDOWN_MS) {
        cloneRateLimitMap.delete(k);
      }
    }
  }
  return false;
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
      select: {
        id: true,
        clonesCount: true,
        configJson: true,
      },
    });

    if (!showcase) {
      return NextResponse.json(
        { success: false, error: 'Showcase tidak ditemukan' },
        { status: 404 }
      );
    }

    // Ambil identitas IP untuk pencegahan spam counter
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = (forwarded ? forwarded.split(',')[0].trim() : null) || 'anonymous';
    const rateLimitKey = `${clientIp}:${id}`;

    // Jika dalam masa cooldown, kembalikan data tanpa menambah counter (idempotent anti-spam)
    if (isSpamming(rateLimitKey)) {
      return NextResponse.json({
        success: true,
        clonesCount: showcase.clonesCount,
        configJson: showcase.configJson,
      });
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
