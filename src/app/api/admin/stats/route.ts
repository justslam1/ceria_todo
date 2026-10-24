import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { isUserAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  try {
    const session = await auth();
    const userEmail = session?.user?.email;

    if (!userEmail || !isUserAdmin(userEmail, session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Hanya admin yang diizinkan.' },
        { status: 403 }
      );
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

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
      showcasesRaw,
      announcement,
      tasksByCategoryRaw,
      recentUsersForTrend,
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
          role: true,
          isSuspended: true,
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
      prisma.boardShowcase.findMany({
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          thumbnail: true,
          likesCount: true,
          clonesCount: true,
          isFeatured: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: [{ isFeatured: 'desc' }, { likesCount: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.systemAnnouncement.findFirst({
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.task.groupBy({
        by: ['category'],
        _count: {
          _all: true,
        },
      }),
      prisma.user.findMany({
        where: {
          createdAt: {
            gte: fourteenDaysAgo,
          },
        },
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
    ]);

    const dbLatencyMs = Date.now() - startTime;

    // Process user list
    const users = usersRaw.map((u) => {
      const todoCount = u.tasks.filter((t) => t.status === 'TODO').length;
      const inProgressCount = u.tasks.filter((t) => t.status === 'IN_PROGRESS').length;
      const doneCount = u.tasks.filter((t) => t.status === 'DONE').length;

      return {
        id: u.id,
        name: u.name || 'Pengguna Ceria',
        email: u.email || '-',
        image: u.image,
        role: u.role || 'USER',
        isSuspended: !!u.isSuspended,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        isAdmin: isUserAdmin(u.email, u.role),
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

    // 14 Days Signup Trend
    const trendMap = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      trendMap.set(key, 0);
    }
    recentUsersForTrend.forEach((u) => {
      const key = u.createdAt.toISOString().split('T')[0];
      if (trendMap.has(key)) {
        trendMap.set(key, (trendMap.get(key) || 0) + 1);
      }
    });
    const signupTrend = Array.from(trendMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    // Categories
    const categories = tasksByCategoryRaw
      .map((c) => ({
        category: c.category || 'Personal',
        count: c._count._all,
      }))
      .sort((a, b) => b.count - a.count);

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
      analytics: {
        signupTrend,
        categories,
      },
      systemHealth: {
        status: 'Optimal',
        dbLatencyMs,
        tablesCount: {
          users: totalUsers,
          boards: totalBoards,
          notes: totalNotes,
          tasks: totalTasks,
          showcases: totalShowcases,
          likes: totalLikes,
        },
      },
      users,
      showcases: showcasesRaw,
      announcement: announcement || null,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat memuat data dasbor admin' },
      { status: 500 }
    );
  }
}
