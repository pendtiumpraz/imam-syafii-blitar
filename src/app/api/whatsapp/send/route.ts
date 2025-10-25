import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getWhatsAppService } from '@/lib/whatsapp-service';
import { WhatsAppMessageBuilder } from '@/lib/whatsapp-templates';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to send WhatsApp messages
    if (!session.user?.role || !['SUPER_ADMIN', 'ADMIN', 'USTADZ'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { to, type, message, templateName, templateParams } = body;

    if (!to || !type) {
      return NextResponse.json(
        { error: 'Phone number and message type are required' },
        { status: 400 }
      );
    }

    const whatsappService = getWhatsAppService();

    let result;

    switch (type) {
      case 'text':
        if (!message) {
          return NextResponse.json(
            { error: 'Message content is required for text messages' },
            { status: 400 }
          );
        }
        result = await whatsappService.sendTextMessage(to, message);
        break;

      case 'template':
        if (!templateName) {
          return NextResponse.json(
            { error: 'Template name is required for template messages' },
            { status: 400 }
          );
        }
        result = await whatsappService.sendTemplateMessage(
          to,
          templateName,
          'id',
          templateParams || []
        );
        break;

      case 'payment_reminder':
        if (!templateParams) {
          return NextResponse.json(
            { error: 'Template parameters are required' },
            { status: 400 }
          );
        }
        const paymentMessage = WhatsAppMessageBuilder.paymentReminder(templateParams);
        result = await whatsappService.sendTextMessage(to, paymentMessage);
        break;

      case 'grade_update':
        if (!templateParams) {
          return NextResponse.json(
            { error: 'Template parameters are required' },
            { status: 400 }
          );
        }
        const gradeMessage = WhatsAppMessageBuilder.gradeUpdate(templateParams);
        result = await whatsappService.sendTextMessage(to, gradeMessage);
        break;

      case 'attendance_alert':
        if (!templateParams) {
          return NextResponse.json(
            { error: 'Template parameters are required' },
            { status: 400 }
          );
        }
        const attendanceMessage = WhatsAppMessageBuilder.attendanceAlert(templateParams);
        result = await whatsappService.sendTextMessage(to, attendanceMessage);
        break;

      case 'hafalan_progress':
        if (!templateParams) {
          return NextResponse.json(
            { error: 'Template parameters are required' },
            { status: 400 }
          );
        }
        const hafalanMessage = WhatsAppMessageBuilder.hafalan_progress(templateParams);
        result = await whatsappService.sendTextMessage(to, hafalanMessage);
        break;

      case 'achievement':
        if (!templateParams) {
          return NextResponse.json(
            { error: 'Template parameters are required' },
            { status: 400 }
          );
        }
        const achievementMessage = WhatsAppMessageBuilder.achievementNotification(templateParams);
        result = await whatsappService.sendTextMessage(to, achievementMessage);
        break;

      case 'announcement':
        if (!templateParams) {
          return NextResponse.json(
            { error: 'Template parameters are required' },
            { status: 400 }
          );
        }
        const announcementMessage = WhatsAppMessageBuilder.generalAnnouncement(templateParams);
        result = await whatsappService.sendTextMessage(to, announcementMessage);
        break;

      case 'image':
        if (!body.imageUrl) {
          return NextResponse.json(
            { error: 'Image URL is required for image messages' },
            { status: 400 }
          );
        }
        result = await whatsappService.sendImageMessage(to, body.imageUrl, body.caption);
        break;

      case 'document':
        if (!body.documentUrl || !body.filename) {
          return NextResponse.json(
            { error: 'Document URL and filename are required for document messages' },
            { status: 400 }
          );
        }
        result = await whatsappService.sendDocumentMessage(
          to,
          body.documentUrl,
          body.filename,
          body.caption
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid message type' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}