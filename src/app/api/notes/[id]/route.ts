import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const VALID_COLORS = ['yellow', 'pink', 'blue', 'green', 'purple', 'cream'];

// GET /api/notes/[id]
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Silakan masuk ke akun Anda' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const note = await prisma.note.findUnique({
      where: { id },
    });

    if (!note) {
      return NextResponse.json(
        { success: false, error: 'Catatan tidak ditemukan' },
        { status: 404 }
      );
    }

    if (note.userId && note.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak memiliki hak akses ke catatan ini' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: note });
  } catch (error) {
    console.error('Error getting note:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data catatan' },
      { status: 500 }
    );
  }
}

// PATCH /api/notes/[id] - Update note
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Silakan masuk ke akun Anda' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const existing = await prisma.note.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Catatan tidak ditemukan' },
        { status: 404 }
      );
    }

    if (existing.userId && existing.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak memiliki hak akses untuk mengubah catatan ini' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) {
      updateData.title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : 'Catatan';
    }
    if (body.content !== undefined) {
      updateData.content = typeof body.content === 'string' ? body.content.trim().slice(0, 20000) : '';
    }
    if (body.color !== undefined && VALID_COLORS.includes(body.color)) {
      updateData.color = body.color;
    }
    if (body.isPinned !== undefined) {
      updateData.isPinned = Boolean(body.isPinned);
    }
    if (body.posX !== undefined) {
      updateData.posX = typeof body.posX === 'number' && Number.isFinite(body.posX) ? body.posX : null;
    }
    if (body.posY !== undefined) {
      updateData.posY = typeof body.posY === 'number' && Number.isFinite(body.posY) ? body.posY : null;
    }
    if (body.order !== undefined && typeof body.order === 'number') {
      updateData.order = Math.max(0, Math.floor(body.order));
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updatedNote });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui catatan' },
      { status: 500 }
    );
  }
}

// DELETE /api/notes/[id] - Delete note
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Silakan masuk ke akun Anda' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const existing = await prisma.note.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Catatan tidak ditemukan' },
        { status: 404 }
      );
    }

    if (existing.userId && existing.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak memiliki hak akses untuk menghapus catatan ini' },
        { status: 403 }
      );
    }

    await prisma.note.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Catatan berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus catatan' },
      { status: 500 }
    );
  }
}
