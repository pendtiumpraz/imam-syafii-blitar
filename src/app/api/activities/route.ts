import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { softDelete } from '@/lib/soft-delete';

// GET /api/activities - Get all activities (public and admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || 'all';
    const status = searchParams.get('status') || 'all';

    const skip = (page - 1) * limit;

    // Build where conditions
    const whereConditions: any = {};

    if (search) {
      whereConditions.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    if (category !== 'all') {
      whereConditions.type = category;
    }

    if (status !== 'all') {
      whereConditions.status = status;
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where: whereConditions,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        orderBy: {
          date: 'desc'
        },
        skip,
        take: limit,
      }),
      prisma.activity.count({ where: whereConditions })
    ]);

    // Parse photos JSON string to array
    const formattedActivities = activities.map(activity => ({
      ...activity,
      photos: JSON.parse(activity.photos || '[]')
    }));

    return NextResponse.json({
      activities: formattedActivities,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

// POST /api/activities - Create new activity (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.role || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      type,
      date,
      location,
      photos,
      status
    } = body;

    // Validate required fields
    if (!title || !description || !type || !date) {
      return NextResponse.json(
        { error: 'Title, description, type, and date are required' },
        { status: 400 }
      );
    }

    const activity = await prisma.activity.create({
      data: {
        title,
        description,
        type,
        date: new Date(date),
        location: location || null,
        photos: JSON.stringify(photos || []),
        status: status || 'planned',
        createdBy: session.user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json({
      ...activity,
      photos: JSON.parse(activity.photos || '[]')
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    );
  }
}

// PUT /api/activities - Update activity (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.role || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      id,
      title,
      description,
      type,
      date,
      location,
      photos,
      status
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      );
    }

    const activity = await prisma.activity.update({
      where: { id },
      data: {
        title,
        description,
        type,
        date: date ? new Date(date) : undefined,
        location,
        photos: photos ? JSON.stringify(photos) : undefined,
        status,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json({
      ...activity,
      photos: JSON.parse(activity.photos || '[]')
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    return NextResponse.json(
      { error: 'Failed to update activity' },
      { status: 500 }
    );
  }
}

// DELETE /api/activities - Delete activity (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.role || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      );
    }

    // Check if activity exists
    const activity = await prisma.activity.findUnique({
      where: { id }
    });

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    // Soft delete the activity
    await softDelete(prisma.activity, { id }, session.user?.id);

    return NextResponse.json({
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json(
      { error: 'Failed to delete activity' },
      { status: 500 }
    );
  }
}
