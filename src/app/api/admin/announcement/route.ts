import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { isUserAdmin } from '@/lib/admin';

function sanitizeLinkUrl(url?: unknown): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  // Hanya izinkan skema https://, http://, atau path internal relatif /
  if (trimmed.startsWith('/') || /^https?:\/\//i.test(trimmed)) {
    return trimmed.slice(0, 1000);
  }
  return null;
}

export async function GET() {
  try {
    const session = await auth();
    const userEmail = session?.user?.email;

    if (!userEmail || !isUserAdmin(userEmail, session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Hanya admin yang diizinkan.' },
        { status: 403 }
      );
    }

    const announcement = await prisma.systemAnnouncement.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      announcement: announcement || null,
    });
  } catch (error) {
    console.error('Error fetching admin announcement:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat pengumuman sistem' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email;

    if (!userEmail || !isUserAdmin(userEmail, session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Hanya admin yang diizinkan.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { message, type = 'info', isActive = true, linkUrl = null } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Pesan pengumuman tidak boleh kosong' },
        { status: 400 }
      );
    }

    const existing = await prisma.systemAnnouncement.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    let saved;
    if (existing) {
      saved = await prisma.systemAnnouncement.update({
        where: { id: existing.id },
        data: {
          message: message.trim(),
          type: ['info', 'celebration', 'warning'].includes(type) ? type : 'info',
          isActive: Boolean(isActive),
          linkUrl: sanitizeLinkUrl(linkUrl),
          updatedAt: new Date(),
        },
      });
    } else {
      saved = await prisma.systemAnnouncement.create({
        data: {
          message: message.trim(),
          type: ['info', 'celebration', 'warning'].includes(type) ? type : 'info',
          isActive: Boolean(isActive),
          linkUrl: sanitizeLinkUrl(linkUrl),
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      announcement: saved,
    });
  } catch (error) {
    console.error('Error saving announcement:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menyimpan pengumuman sistem' },
      { status: 500 }
    );
  }
}
