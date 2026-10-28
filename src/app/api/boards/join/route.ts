import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// POST /api/boards/join - Join a board with inviteCode
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

    if (session?.user?.isSuspended) {
      return NextResponse.json(
        { success: false, error: 'Akun Anda telah ditangguhkan. Silakan hubungi administrator.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    let rawCode = typeof body?.code === 'string' ? body.code.trim() : '';

    if (!rawCode) {
      return NextResponse.json(
        { success: false, error: 'Kode undangan wajib dimasukkan' },
        { status: 400 }
      );
    }

    // Support entering full URL: extract code if it has /join/ or ?join=
    if (rawCode.includes('join/')) {
      rawCode = rawCode.split('join/').pop()?.split('?')[0] || rawCode;
    } else if (rawCode.includes('join=')) {
      rawCode = rawCode.split('join=').pop()?.split('&')[0] || rawCode;
    }

    const code = rawCode.trim().toUpperCase();

    const board = await prisma.board.findFirst({
      where: {
        inviteCode: code,
      },
      include: {
        user: {
          select: { name: true, image: true },
        },
        _count: {
          select: { tasks: true, notes: true, members: true },
        },
      },
    });

    if (!board) {
      return NextResponse.json(
        { success: false, error: 'Kode undangan tidak valid atau papan tidak ditemukan' },
        { status: 404 }
      );
    }

    // If user is already the owner
    if (board.userId === userId) {
      return NextResponse.json({
        success: true,
        message: 'Anda adalah pemilik papan ini',
        data: {
          id: board.id,
          title: board.title,
          type: board.type,
          icon: board.icon,
          color: board.color,
          role: 'OWNER',
        },
      });
    }

    // Check if user is already a member
    const existingMember = await prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId: board.id,
          userId,
        },
      },
    });

    if (!existingMember) {
      await prisma.boardMember.create({
        data: {
          boardId: board.id,
          userId,
          role: 'MEMBER',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: existingMember ? 'Anda sudah menjadi anggota papan ini' : `Berhasil bergabung ke papan "${board.title}"! 🎉`,
      data: {
        id: board.id,
        title: board.title,
        type: board.type,
        icon: board.icon,
        color: board.color,
        role: 'MEMBER',
        isShared: true,
      },
    });
  } catch (error) {
    console.error('Error joining board:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal bergabung ke papan' },
      { status: 500 }
    );
  }
}
