import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get parent account
    const parentAccount = await prisma.parent_accounts.findFirst({
      where: { userId: session.user.id },
      include: {
        parentStudents: {
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                grade: true,
                institutionType: true
              }
            }
          }
        }
      }
    });

    if (!parentAccount) {
      return NextResponse.json(
        { error: 'Parent account not found' },
        { status: 404 }
      );
    }

    // Build where conditions
    const whereConditions: any = {
      AND: [
        {
          OR: [
            { targetAudience: 'ALL' },
            { targetAudience: 'PARENT' }
          ]
        },
        {
          publishDate: {
            lte: new Date()
          }
        },
        {
          OR: [
            { expiryDate: null },
            { expiryDate: { gte: new Date() } }
          ]
        }
      ]
    };

    // Add filters
    if (category) {
      whereConditions.AND.push({ category });
    }
    if (priority) {
      whereConditions.AND.push({ priority });
    }
    if (search) {
      whereConditions.AND.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    // Get total count
    const totalCount = await prisma.announcements.count({
      where: whereConditions
    });

    // Get announcements
    const announcements = await prisma.announcements.findMany({
      where: whereConditions,
      orderBy: [
        { isPinned: 'desc' },
        { priority: 'desc' },
        { publishDate: 'desc' }
      ],
      skip: offset,
      take: limit,
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
        targetAudience: true,
        priority: true,
        category: true,
        attachments: true,
        featuredImage: true,
        status: true,
        publishDate: true,
        expiryDate: true,
        isPinned: true,
        viewCount: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Format announcements
    const formattedAnnouncements = announcements.map(announcement => ({
      ...announcement,
      timeAgo: getTimeAgo(announcement.publishDate),
      isNew: (Date.now() - announcement.publishDate.getTime()) < 24 * 60 * 60 * 1000,
      attachments: JSON.parse(announcement.attachments || '[]')
    }));

    // Get pinned announcements
    const pinnedAnnouncements = offset === 0 ? await prisma.announcements.findMany({
      where: {
        ...whereConditions,
        isPinned: true
      },
      orderBy: {
        publishDate: 'desc'
      },
      take: 3,
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
        targetAudience: true,
        priority: true,
        category: true,
        attachments: true,
        featuredImage: true,
        status: true,
        publishDate: true,
        expiryDate: true,
        isPinned: true,
        viewCount: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true
      }
    }) : [];

    // Get announcement statistics
    const stats = {
      total: totalCount,
      unread: totalCount,
      byCategory: await getAnnouncementsByCategory(whereConditions),
      byPriority: await getAnnouncementsByPriority(whereConditions),
      recent: announcements.filter(a => 
        (Date.now() - a.publishDate.getTime()) < 7 * 24 * 60 * 60 * 1000
      ).length
    };

    const result = {
      announcements: formattedAnnouncements,
      pinnedAnnouncements: pinnedAnnouncements.map(announcement => ({
        ...announcement,
        timeAgo: getTimeAgo(announcement.publishDate)
      })),
      stats,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + announcements.length < totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: Math.floor(offset / limit) + 1
      },
      filters: {
        availableCategories: ['GENERAL', 'ACADEMIC', 'EVENT', 'PAYMENT', 'EMERGENCY'],
        availablePriorities: ['LOW', 'NORMAL', 'HIGH', 'URGENT']
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get time ago string
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Baru saja';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} menit yang lalu`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} jam yang lalu`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} hari yang lalu`;
  } else {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks} minggu yang lalu`;
  }
}

// Helper function to get announcements by category
async function getAnnouncementsByCategory(baseWhere: any) {
  const categories = ['GENERAL', 'ACADEMIC', 'EVENT', 'PAYMENT', 'EMERGENCY'];
  const results = await Promise.all(
    categories.map(async (category) => {
      const count = await prisma.announcements.count({
        where: {
          ...baseWhere,
          category
        }
      });
      return { category, count };
    })
  );
  return results.filter(r => r.count > 0);
}

// Helper function to get announcements by priority
async function getAnnouncementsByPriority(baseWhere: any) {
  const priorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
  const results = await Promise.all(
    priorities.map(async (priority) => {
      const count = await prisma.announcements.count({
        where: {
          ...baseWhere,
          priority
        }
      });
      return { priority, count };
    })
  );
  return results.filter(r => r.count > 0);
}

// POST endpoint to mark announcement as read
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { announcementId } = body;

    if (!announcementId) {
      return NextResponse.json(
        { error: 'Announcement ID is required' },
        { status: 400 }
      );
    }

    // Increment view count
    await prisma.announcements.update({
      where: { id: announcementId },
      data: {
        viewCount: {
          increment: 1
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating announcement view:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}