import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { checkBoardAccess, generateInviteCode } from '@/lib/boardPermissions';

// GET /api/boards/[id]/share - Get invite code and member list
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Silakan login terlebih dahulu' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const { hasAccess, isOwner, role, board } = await checkBoardAccess(id, userId);

    if (!hasAccess || !board) {
      return NextResponse.json(
        { success: false, error: 'Papan tidak ditemukan atau Anda tidak memiliki akses' },
        { status: 404 }
      );
    }

    // Ensure invite code exists
    let inviteCode = board.inviteCode;
    if (!inviteCode && isOwner) {
      inviteCode = generateInviteCode();
      await prisma.board.update({
        where: { id },
        data: { inviteCode },
      });
    }

    // Fetch members with user details
    const members = await prisma.boardMember.findMany({
      where: { boardId: id },
      include: {
        user: {
          select: { id: true, name: true, image: true, email: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        boardId: board.id,
        title: board.title,
        icon: board.icon,
        type: board.type,
        inviteCode,
        isOwner,
        myRole: role,
        owner: board.user,
        members: members.map((m) => ({
          id: m.id,
          role: m.role,
          createdAt: m.createdAt.toISOString(),
          user: m.user,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching board share info:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil informasi berbagi papan' },
      { status: 500 }
    );
  }
}

// POST /api/boards/[id]/share - Regenerate invite code (Only Owner)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const { hasAccess, isOwner } = await checkBoardAccess(id, userId);

    if (!hasAccess || !isOwner) {
      return NextResponse.json(
        { success: false, error: 'Hanya pemilik papan yang dapat membuat ulang kode undangan' },
        { status: 403 }
      );
    }

    const newInviteCode = generateInviteCode();
    await prisma.board.update({
      where: { id },
      data: { inviteCode: newInviteCode },
    });

    return NextResponse.json({
      success: true,
      data: { inviteCode: newInviteCode },
      message: 'Kode undangan berhasil diperbarui',
    });
  } catch (error) {
    console.error('Error regenerating invite code:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui kode undangan' },
      { status: 500 }
    );
  }
}
