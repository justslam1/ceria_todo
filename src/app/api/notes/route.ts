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

    // Auto-claim any legacy notes without owner to the logged-in user
    await prisma.note.updateMany({
      where: { userId: null },
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
    const { title, content, color, isPinned } = body;

    const trimmedTitle = typeof title === 'string' ? title.trim().slice(0, 200) : '';
    const trimmedContent = typeof content === 'string' ? content.trim().slice(0, 20000) : '';

    if (!trimmedTitle && !trimmedContent) {
      return NextResponse.json(
        { success: false, error: 'Judul atau isi catatan tidak boleh kosong' },
        { status: 400 }
      );
    }

    const validColor = VALID_COLORS.includes(color) ? color : 'yellow';

    const note = await prisma.note.create({
      data: {
        userId,
        title: trimmedTitle || 'Catatan Baru',
        content: trimmedContent,
        color: validColor,
        isPinned: Boolean(isPinned),
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
