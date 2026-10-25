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
    const { role, isSuspended } = body;

    // Fetch target user
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, isSuspended: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }

    // Safety: prevent self-demotion or self-suspension
    if (targetUser.email === userEmail) {
      if (role && role !== 'ADMIN') {
        return NextResponse.json(
          { success: false, error: 'Anda tidak dapat mencabut hak akses admin dari akun Anda sendiri.' },
          { status: 400 }
        );
      }
      if (isSuspended === true) {
        return NextResponse.json(
          { success: false, error: 'Anda tidak dapat menangguhkan akun Anda sendiri.' },
          { status: 400 }
        );
      }
    }

    // Safety: Super-admin accounts configured via ADMIN_EMAILS cannot be suspended or demoted by others
    if (targetUser.email && isUserAdmin(targetUser.email)) {
      if (isSuspended === true) {
        return NextResponse.json(
          { success: false, error: 'Akun Super Admin yang terdaftar di konfigurasi sistem tidak dapat ditangguhkan.' },
          { status: 400 }
        );
      }
      if (role && role !== 'ADMIN') {
        return NextResponse.json(
          { success: false, error: 'Hak akses admin pada akun Super Admin tidak dapat dicabut.' },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(role !== undefined ? { role: role === 'ADMIN' ? 'ADMIN' : 'USER' } : {}),
        ...(isSuspended !== undefined ? { isSuspended: Boolean(isSuspended) } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        role: updated.role,
        isSuspended: updated.isSuspended,
      },
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui status pengguna' },
      { status: 500 }
    );
  }
}
