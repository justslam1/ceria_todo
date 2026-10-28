import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/notifications - Get notifications for current user with unread count
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Silakan masuk ke akun Anda' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '30', 10)), 100);

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil notifikasi' },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications - Mark notification(s) as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Silakan masuk ke akun Anda' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));

    if (body.markAllAsRead) {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: 'Semua notifikasi ditandai telah dibaca' });
    }

    if (body.id && typeof body.id === 'string') {
      await prisma.notification.updateMany({
        where: { id: body.id, userId },
        data: { isRead: body.isRead !== undefined ? Boolean(body.isRead) : true },
      });
      return NextResponse.json({ success: true, message: 'Status notifikasi diperbarui' });
    }

    return NextResponse.json(
      { success: false, error: 'Parameter tidak valid' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui notifikasi' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications - Delete notification(s)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Silakan masuk ke akun Anda' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));

    if (body.clearAll) {
      await prisma.notification.deleteMany({
        where: { userId },
      });
      return NextResponse.json({ success: true, message: 'Semua notifikasi telah dihapus' });
    }

    if (body.id && typeof body.id === 'string') {
      await prisma.notification.deleteMany({
        where: { id: body.id, userId },
      });
      return NextResponse.json({ success: true, message: 'Notifikasi berhasil dihapus' });
    }

    return NextResponse.json(
      { success: false, error: 'Parameter tidak valid' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus notifikasi' },
      { status: 500 }
    );
  }
}
