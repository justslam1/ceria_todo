import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

const VALID_COLORS = ['yellow', 'pink', 'blue', 'green', 'purple', 'cream'];

// GET /api/notes - Retrieve notes isolated to the logged-in user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Silakan masuk ke akun Anda terlebih dahulu' },
        { status: 401 }
      );
    }

    // Auto-claim only orphan notes (userId null or deleted legacy users that don't exist in User table)
    const existingUsers = await prisma.user.findMany({ select: { id: true } });
    const existingUserIds = existingUsers.map((u) => u.id);

    await prisma.note.updateMany({
      where: {
        OR: [
          { userId: null },
          { userId: { notIn: existingUserIds } },
        ],
      },
      data: { userId },
    });

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('q')?.trim() || '';

    const notes = await prisma.note.findMany({
      where: {
        userId,
        ...(search
          ? {
              OR: [
                { title: { contains: search } },
                { content: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    return NextResponse.json({ success: true, data: notes, count: notes.length });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data catatan dari basis data' },
      { status: 500 }
    );
  }
}

// POST /api/notes - Create a new note
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Silakan masuk ke akun Anda terlebih dahulu' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, content, imageUrl, isSticker, color, isPinned, posX, posY, width, rotation, order } = body;

    const trimmedTitle = typeof title === 'string' ? title.trim().slice(0, 200) : '';
    const trimmedContent = typeof content === 'string' ? content.trim().slice(0, 20000) : '';
    const validImageUrl = typeof imageUrl === 'string' && imageUrl.startsWith('data:image/') ? imageUrl : null;

    if (!trimmedTitle && !trimmedContent && !validImageUrl) {
      return NextResponse.json(
        { success: false, error: 'Judul, isi, atau gambar catatan tidak boleh kosong' },
        { status: 400 }
      );
    }

    const validColor = VALID_COLORS.includes(color) ? color : 'yellow';

    const note = await prisma.note.create({
      data: {
        userId,
        title: trimmedTitle || (isSticker ? '' : validImageUrl ? 'Catatan Gambar' : 'Catatan Baru'),
        content: trimmedContent,
        imageUrl: validImageUrl,
        isSticker: Boolean(isSticker),
        color: validColor,
        isPinned: Boolean(isPinned),
        posX: typeof posX === 'number' && Number.isFinite(posX) ? posX : null,
        posY: typeof posY === 'number' && Number.isFinite(posY) ? posY : null,
        width: typeof width === 'number' && Number.isFinite(width) ? Math.max(120, Math.min(800, width)) : 280,
        rotation: typeof rotation === 'number' && Number.isFinite(rotation) ? rotation : 0,
        order: typeof order === 'number' ? Math.max(0, Math.floor(order)) : 0,
      },
    });

    return NextResponse.json({ success: true, data: note }, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menyimpan catatan' },
      { status: 500 }
    );
  }
}
