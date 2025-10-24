import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getNotificationService } from '@/lib/notification-service';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const notificationService = getNotificationService();

    if (unreadOnly) {
      const notifications = await notificationService.getUnreadNotifications(
        session.user.id,
        limit
      );
      const stats = await notificationService.getNotificationStats(session.user.id);
      
      return NextResponse.json({
        notifications,
        stats,
        hasMore: notifications.length === limit,
      });
    } else {
      const notifications = await notificationService.getAllNotifications(
        session.user.id,
        limit,
        offset
      );
      const stats = await notificationService.getNotificationStats(session.user.id);
      
      return NextResponse.json({
        notifications,
        stats,
        hasMore: notifications.length === limit,
      });
    }
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create notifications (admin/teacher only)
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !['SUPER_ADMIN', 'ADMIN', 'USTADZ'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const notificationService = getNotificationService();

    const notificationId = await notificationService.createNotification({
      userId: body.userId,
      type: body.type,
      title: body.title,
      message: body.message,
      data: body.data,
      actionUrl: body.actionUrl,
      actionText: body.actionText,
      channels: body.channels,
      scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      priority: body.priority,
      category: body.category,
    });

    return NextResponse.json({
      success: true,
      notificationId,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}