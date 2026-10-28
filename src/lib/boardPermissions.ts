import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export function generateInviteCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Avoid 0, 1, I, O
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `CERIA-${code}`;
}

export async function checkBoardAccess(boardId: string, userId: string) {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      members: {
        where: { userId },
        select: { id: true, role: true },
      },
      user: {
        select: { id: true, name: true, image: true, email: true },
      },
    },
  });

  if (!board) {
    return { hasAccess: false, isOwner: false, role: null, board: null };
  }

  if (board.userId === userId) {
    return { hasAccess: true, isOwner: true, role: 'OWNER' as const, board };
  }

  if (board.members.length > 0) {
    const memberRole = board.members[0].role === 'OWNER' ? ('OWNER' as const) : ('MEMBER' as const);
    return { hasAccess: true, isOwner: false, role: memberRole, board };
  }

  return { hasAccess: false, isOwner: false, role: null, board };
}
