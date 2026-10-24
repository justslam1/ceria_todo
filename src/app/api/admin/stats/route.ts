import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { isUserAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    const userEmail = session?.user?.email;

    if (!userEmail || !isUserAdmin(userEmail)) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Hanya admin yang diizinkan.' },
        { status: 403 }
      );
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersThisWeek,
      totalBoards,
      totalNotes,
      totalTasks,
      tasksTodo,
      tasksInProgress,
      tasksDone,
      totalShowcases,
      totalLikes,
      usersRaw,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
      }),
      prisma.board.count(),
      prisma.note.count(),
      prisma.task.count(),
      prisma.task.count({ where: { status: 'TODO' } }),
      prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { status: 'DONE' } }),
      prisma.boardShowcase.count(),
      prisma.boardLike.count(),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              boards: true,
              tasks: true,
              notes: true,
              showcases: true,
              boardLikes: true,
            },
          },
          tasks: {
            select: {
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    const users = usersRaw.map((u) => {
      const todoCount = u.tasks.filter((t) => t.status === 'TODO').length;
      const inProgressCount = u.tasks.filter((t) => t.status === 'IN_PROGRESS').length;
      const doneCount = u.tasks.filter((t) => t.status === 'DONE').length;

      return {
        id: u.id,
        name: u.name || 'Pengguna Ceria',
        email: u.email || '-',
        image: u.image,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        isAdmin: isUserAdmin(u.email),
        counts: {
          boards: u._count.boards,
          tasks: u._count.tasks,
          notes: u._count.notes,
          showcases: u._count.showcases,
          likes: u._count.boardLikes,
          tasksTodo: todoCount,
          tasksInProgress: inProgressCount,
          tasksDone: doneCount,
        },
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        newUsersThisWeek,
        totalBoards,
        totalNotes,
        totalTasks,
        tasksTodo,
        tasksInProgress,
        tasksDone,
        totalShowcases,
        totalLikes,
      },
      users,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat memuat data dasbor admin' },
      { status: 500 }
    );
  }
}
