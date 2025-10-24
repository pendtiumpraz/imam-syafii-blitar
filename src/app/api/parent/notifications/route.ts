import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // GRADE_UPDATE, ATTENDANCE_ALERT, PAYMENT_DUE, etc.
    const isRead = searchParams.get('isRead'); // true, false
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const userId = session.user.id;

    // Build where conditions
    const whereConditions: any = {
      userId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } }
      ]
    };

    if (type) {
      whereConditions.type = type;
    }

    if (isRead !== null) {
      whereConditions.isRead = isRead === 'true';
    }

    // Get notifications
    const notifications = await prisma.notifications.findMany({
      where: whereConditions,
      orderBy: [
        { isRead: 'asc' },
        { createdAt: 'desc' }
      ],
      skip: offset,
      take: limit
    });

    // Get total count
    const totalCount = await prisma.notifications.count({
      where: whereConditions
    });

    // Get unread count
    const unreadCount = await prisma.notifications.count({
      where: {
        userId,
        isRead: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      }
    });

    // Get count by type
    const notificationTypes = [
      'GRADE_UPDATE',
      'ATTENDANCE_ALERT', 
      'PAYMENT_DUE',
      'ANNOUNCEMENT',
      'MESSAGE',
      'APPOINTMENT'
    ];

    const countByType = await Promise.all(
      notificationTypes.map(async (notificationType) => {
        const count = await prisma.notifications.count({
          where: {
            userId,
            type: notificationType,
            isRead: false,
            OR: [
              { expiresAt: null },
              { expiresAt: { gte: new Date() } }
            ]
          }
        });
        return { type: notificationType, count };
      })
    );

    // Format notifications
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: JSON.parse(notification.data),
      actionUrl: notification.actionUrl,
      actionText: notification.actionText,
      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      expiresAt: notification.expiresAt,
      timeAgo: getTimeAgo(notification.createdAt),
      isExpiringSoon: notification.expiresAt 
        ? notification.expiresAt <= new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day
        : false
    }));

    const result = {
      notifications: formattedNotifications,
      stats: {
        total: totalCount,
        unread: unreadCount,
        countByType: countByType.filter(item => item.count > 0)
      },
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + notifications.length < totalCount
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, notificationIds, notificationId } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    switch (action) {
      case 'markAsRead':
        if (notificationId) {
          // Mark single notification as read
          await prisma.notifications.updateMany({
            where: {
              id: notificationId,
              userId
            },
            data: {
              isRead: true,
              readAt: new Date()
            }
          });
        } else if (notificationIds && Array.isArray(notificationIds)) {
          // Mark multiple notifications as read
          await prisma.notifications.updateMany({
            where: {
              id: { in: notificationIds },
              userId
            },
            data: {
              isRead: true,
              readAt: new Date()
            }
          });
        } else {
          return NextResponse.json(
            { error: 'notificationId or notificationIds required' },
            { status: 400 }
          );
        }
        break;

      case 'markAllAsRead':
        // Mark all unread notifications as read
        await prisma.notifications.updateMany({
          where: {
            userId,
            isRead: false
          },
          data: {
            isRead: true,
            readAt: new Date()
          }
        });
        break;

      case 'delete':
        if (notificationId) {
          // Delete single notification
          await prisma.notifications.deleteMany({
            where: {
              id: notificationId,
              userId
            }
          });
        } else if (notificationIds && Array.isArray(notificationIds)) {
          // Delete multiple notifications
          await prisma.notifications.deleteMany({
            where: {
              id: { in: notificationIds },
              userId
            }
          });
        } else {
          return NextResponse.json(
            { error: 'notificationId or notificationIds required' },
            { status: 400 }
          );
        }
        break;

      case 'clearExpired':
        // Delete expired notifications
        await prisma.notifications.deleteMany({
          where: {
            userId,
            expiresAt: { lt: new Date() }
          }
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating notifications:', error);
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