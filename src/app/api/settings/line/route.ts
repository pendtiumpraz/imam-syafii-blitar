import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET: Fetch LINE settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create settings
    let settings = await prisma.line_settings.findFirst()
    
    if (!settings) {
      settings = await prisma.line_settings.create({
        data: {
          enabled: false,
          welcomeMessage: 'Selamat datang di LINE Official Account Pondok Imam Syafii! 🎓\n\nSilakan ketik "menu" untuk melihat menu utama.',
          unknownMessage: 'Maaf, pesan tidak dikenali. Silakan ketik "menu" untuk bantuan.',
          errorMessage: 'Maaf, terjadi kesalahan. Silakan coba lagi nanti.'
        }
      })
    }

    // Don't send sensitive data to frontend
    const { channelSecret, channelAccessToken, ...safeSettings } = settings

    return NextResponse.json({
      ...safeSettings,
      hasChannelSecret: !!channelSecret,
      hasChannelAccessToken: !!channelAccessToken
    })
  } catch (error) {
    console.error('Failed to fetch LINE settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Save LINE settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    // Get existing settings
    let settings = await prisma.line_settings.findFirst()
    
    // Prepare update data
    const updateData: any = {
      enabled: data.enabled,
      channelId: data.channelId,
      webhookUrl: data.webhookUrl,
      liffId: data.liffId,
      richMenuId: data.richMenuId,
      
      // Features
      richMenuEnabled: data.features?.richMenu,
      flexMessagesEnabled: data.features?.flexMessages,
      quickReplyEnabled: data.features?.quickReply,
      broadcastEnabled: data.features?.broadcast,
      liffEnabled: data.features?.liff,
      multicastEnabled: data.features?.multicast,
      pushMessagesEnabled: data.features?.pushMessages,
      
      // Rate limits
      messagesPerMinute: data.rateLimits?.messagesPerMinute,
      broadcastDelay: data.rateLimits?.broadcastDelay,
      
      // Messages
      welcomeMessage: data.messages?.welcome,
      unknownMessage: data.messages?.unknown,
      errorMessage: data.messages?.error
    }
    
    // Only update secrets if provided
    if (data.channelSecret && !data.channelSecret.includes('***')) {
      updateData.channelSecret = data.channelSecret
    }
    if (data.channelAccessToken && !data.channelAccessToken.includes('***')) {
      updateData.channelAccessToken = data.channelAccessToken
    }
    
    if (settings) {
      // Update existing
      settings = await prisma.line_settings.update({
        where: { id: settings.id },
        data: updateData
      })
    } else {
      // Create new
      settings = await prisma.line_settings.create({
        data: updateData
      })
    }
    
    // Store in environment for immediate use
    if (updateData.channelSecret) {
      process.env.LINE_CHANNEL_SECRET = updateData.channelSecret
    }
    if (updateData.channelAccessToken) {
      process.env.LINE_CHANNEL_ACCESS_TOKEN = updateData.channelAccessToken
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'LINE settings saved successfully'
    })
  } catch (error) {
    console.error('Failed to save LINE settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Test LINE connection
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()
    
    const settings = await prisma.line_settings.findFirst()
    if (!settings || !settings.channelAccessToken) {
      return NextResponse.json({ error: 'LINE not configured' }, { status: 400 })
    }

    switch (action) {
      case 'test':
        // Test bot connection
        const response = await fetch('https://api.line.me/v2/bot/info', {
          headers: {
            'Authorization': `Bearer ${settings.channelAccessToken}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          return NextResponse.json({
            success: true,
            botInfo: data
          })
        } else {
          return NextResponse.json({
            success: false,
            error: 'Invalid access token'
          }, { status: 400 })
        }
        
      case 'webhook-status':
        // Check webhook status
        const webhookResponse = await fetch('https://api.line.me/v2/bot/channel/webhook/endpoint', {
          headers: {
            'Authorization': `Bearer ${settings.channelAccessToken}`
          }
        })
        
        if (webhookResponse.ok) {
          const data = await webhookResponse.json()
          return NextResponse.json({
            success: true,
            webhook: data
          })
        } else {
          return NextResponse.json({
            success: false,
            error: 'Failed to get webhook status'
          }, { status: 400 })
        }
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Failed to test LINE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}