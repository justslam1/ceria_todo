import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { isUserAdmin } from '@/lib/admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email;

    if (!userEmail || !isUserAdmin(userEmail, session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Hanya admin yang diizinkan.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { isFeatured } = body;

    const updated = await prisma.boardShowcase.update({
      where: { id },
      data: {
        isFeatured: Boolean(isFeatured),
      },
    });

    return NextResponse.json({
      success: true,
      showcase: {
        id: updated.id,
        isFeatured: updated.isFeatured,
      },
    });
  } catch (error) {
    console.error('Error toggling featured showcase:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui status showcase' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email;

    if (!userEmail || !isUserAdmin(userEmail, session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Hanya admin yang diizinkan.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    await prisma.boardShowcase.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Showcase berhasil dihapus oleh admin',
    });
  } catch (error) {
    console.error('Error moderating/deleting showcase:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus showcase' },
      { status: 500 }
    );
  }
}
