import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/showcase - Retrieve published community board setups
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category')?.trim();
    const sort = searchParams.get('sort')?.trim() || 'popular';
    const search = searchParams.get('q')?.trim();
    const mineOnly = searchParams.get('mine') === 'true';

    // Build filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (mineOnly) {
      if (!currentUserId) {
        return NextResponse.json({ success: true, data: [] });
      }
      where.userId = currentUserId;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderBy: any =
      sort === 'latest'
        ? [{ isFeatured: 'desc' }, { createdAt: 'desc' }]
        : [{ isFeatured: 'desc' }, { likesCount: 'desc' }, { clonesCount: 'desc' }, { createdAt: 'desc' }];

    const showcases = await prisma.boardShowcase.findMany({
      where,
      orderBy,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        likes: currentUserId
          ? {
              where: { userId: currentUserId },
              select: { id: true },
            }
          : false,
      },
      take: 50,
    });

    const data = showcases.map((item) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { likes, ...rest } = item as any;
      return {
        ...rest,
        isLiked: Array.isArray(likes) && likes.length > 0,
      };
    });

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    console.error('Error fetching showcases:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data galeri showcase' },
      { status: 500 }
    );
  }
}

// POST /api/showcase - Publish a new board showcase
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Silakan login terlebih dahulu untuk mempublikasikan meja Anda' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, category, thumbnail, configJson } = body;

    const trimmedTitle = (title || '').trim();
    if (!trimmedTitle) {
      return NextResponse.json(
        { success: false, error: 'Judul showcase tidak boleh kosong' },
        { status: 400 }
      );
    }

    if (trimmedTitle.length > 80) {
      return NextResponse.json(
        { success: false, error: 'Judul maksimal 80 karakter' },
        { status: 400 }
      );
    }

    if (!configJson) {
      return NextResponse.json(
        { success: false, error: 'Konfigurasi papan tidak boleh kosong' },
        { status: 400 }
      );
    }

    // Verify configJson is valid JSON
    let serializedConfig = '';
    if (typeof configJson === 'string') {
      try {
        JSON.parse(configJson);
        serializedConfig = configJson;
      } catch {
        return NextResponse.json(
          { success: false, error: 'Format konfigurasi JSON tidak valid' },
          { status: 400 }
        );
      }
    } else {
      serializedConfig = JSON.stringify(configJson);
    }

    const newShowcase = await prisma.boardShowcase.create({
      data: {
        userId,
        title: trimmedTitle,
        description: (description || '').trim() || null,
        category: (category || 'Aesthetic').trim(),
        thumbnail: thumbnail || null,
        configJson: serializedConfig,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...newShowcase,
          isLiked: false,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating showcase:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mempublikasikan setup papan ke galeri' },
      { status: 500 }
    );
  }
}
