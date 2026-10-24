import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const announcement = await prisma.systemAnnouncement.findFirst({
      where: {
        isActive: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      announcement: announcement || null,
    });
  } catch (error) {
    console.error('Error fetching public announcement:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat pengumuman' },
      { status: 500 }
    );
  }
}
