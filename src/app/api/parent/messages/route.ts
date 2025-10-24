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
    const type = searchParams.get('type'); // inbox, sent, archived
    const threadId = searchParams.get('threadId'); // Get specific thread
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const userId = session.user.id;

    // If requesting specific thread
    if (threadId) {
      const messages = await prisma.messages.findMany({
        where: {
          threadId,
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ],
          status: { not: 'ARCHIVED' }
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          sentAt: 'asc'
        }
      });

      // Mark messages as read if user is receiver
      await prisma.messages.updateMany({
        where: {
          threadId,
          receiverId: userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return NextResponse.json({
        thread: {
          id: threadId,
          messages: messages.map(msg => ({
            ...msg,
            attachments: JSON.parse(msg.attachments)
          }))
        }
      });
    }

    // Build where conditions based on type
    let whereConditions: any = {
      status: { not: 'ARCHIVED' }
    };

    switch (type) {
      case 'sent':
        whereConditions.senderId = userId;
        break;
      case 'archived':
        whereConditions = {
          OR: [
            { senderId: userId, status: 'ARCHIVED' },
            { receiverId: userId, status: 'ARCHIVED' }
          ]
        };
        break;
      default: // inbox
        whereConditions.receiverId = userId;
    }

    if (unreadOnly && type !== 'sent') {
      whereConditions.isRead = false;
    }

    if (search) {
      whereConditions.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get messages (only thread starters or parent messages)
    const messages = await prisma.messages.findMany({
      where: {
        ...whereConditions,
        parentMessageId: null // Only get thread starters
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        replies: {
          select: {
            id: true,
            isRead: true,
            sentAt: true,
            sender: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            sentAt: 'desc'
          },
          take: 1
        },
        _count: {
          select: {
            replies: true
          }
        }
      },
      orderBy: {
        sentAt: 'desc'
      },
      skip: offset,
      take: limit
    });

    // Get total count
    const totalCount = await prisma.messages.count({
      where: {
        ...whereConditions,
        parentMessageId: null
      }
    });

    // Get unread count
    const unreadCount = await prisma.messages.count({
      where: {
        receiverId: userId,
        isRead: false,
        status: { not: 'ARCHIVED' }
      }
    });

    // Format messages
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      threadId: msg.threadId,
      subject: msg.subject,
      content: msg.content.substring(0, 150) + (msg.content.length > 150 ? '...' : ''),
      type: msg.type,
      priority: msg.priority,
      status: msg.status,
      isRead: msg.isRead,
      readAt: msg.readAt,
      sentAt: msg.sentAt,
      sender: msg.sender,
      receiver: msg.receiver,
      replyCount: msg._count.replies,
      lastReply: msg.replies[0] || null,
      hasAttachments: JSON.parse(msg.attachments).length > 0,
      timeAgo: getTimeAgo(msg.sentAt)
    }));

    const result = {
      messages: formattedMessages,
      stats: {
        total: totalCount,
        unread: unreadCount,
        inbox: await prisma.messages.count({
          where: { receiverId: userId, status: { not: 'ARCHIVED' } }
        }),
        sent: await prisma.messages.count({
          where: { senderId: userId, status: { not: 'ARCHIVED' } }
        }),
        archived: await prisma.messages.count({
          where: {
            OR: [
              { senderId: userId, status: 'ARCHIVED' },
              { receiverId: userId, status: 'ARCHIVED' }
            ]
          }
        })
      },
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + messages.length < totalCount
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching messages:', error);
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
    const {
      receiverId,
      subject,
      content,
      type = 'NORMAL',
      priority = 'NORMAL',
      attachments = [],
      parentMessageId,
      threadId
    } = body;

    // Validate required fields
    if (!receiverId || !subject || !content) {
      return NextResponse.json(
        { error: 'Receiver, subject, and content are required' },
        { status: 400 }
      );
    }

    // Verify receiver exists and is staff/teacher
    const receiver = await prisma.users.findFirst({
      where: {
        id: receiverId,
        role: { in: ['ADMIN', 'STAFF'] },
        isActive: true
      }
    });

    if (!receiver) {
      return NextResponse.json(
        { error: 'Invalid receiver' },
        { status: 400 }
      );
    }

    // Generate thread ID if this is a new thread
    const finalThreadId = threadId || `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const message = await prisma.messages.create({
      data: {
        senderId: session.user.id,
        receiverId,
        subject,
        content,
        type,
        priority,
        attachments: JSON.stringify(attachments),
        parentMessageId,
        threadId: finalThreadId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    // Create notification for receiver
    await prisma.notifications.create({
      data: {
        userId: receiverId,
        type: 'MESSAGE',
        title: `Pesan baru dari ${session.user.name}`,
        message: `Subject: ${subject}`,
        data: JSON.stringify({
          messageId: message.id,
          threadId: finalThreadId,
          senderId: session.user.id,
          senderName: session.user.name
        }),
        actionUrl: `/messages?threadId=${finalThreadId}`,
        actionText: 'Lihat Pesan'
      }
    });

    return NextResponse.json({
      ...message,
      attachments: JSON.parse(message.attachments)
    }, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
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